import { Server, Socket } from "socket.io"
import HTTPServer from "../core/HTTPServer.ts";
import CallSignaling from "./CallSignaling.ts";
import jwt from "jsonwebtoken";
import Auth from "./Auth.ts";

export default class SocketIO {

	private static server: Server;

	static init(){

		this.server = new Server(HTTPServer.server, {

			cors: {

				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		CallSignaling.init(this.server);
		this.defListeners();
	}

	private static defListeners(){

		this.server.on("connection", (socket: Socket) => {

			console.log("New connection:", socket.id);

			socket.on("authenticate", (token: string) => {
				try {
					const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
					socket.data.userId = decoded.userId;
					console.log(`Socket ${socket.id} authenticated for user ${decoded.userId}`);
				} catch (err: any) {
					console.error("Socket auth failed:", err.message);
				}
			});

			socket.on("authenticate:session", (userId: string) => {
				if (typeof userId === "string" && userId.length > 0) {
					socket.data.userId = userId;
					console.log(`Socket ${socket.id} authenticated (session) for user ${userId}`);
				}
			});

			socket.on("contacts:list", async (payload?: { excludeEmail?: string }) => {
				try {
					const db = Auth.mongoClient.db("visioconf");
					const filter: any = {};
					if (payload?.excludeEmail) {
						filter.email = { $ne: payload.excludeEmail };
					}

					const allUsers = await db.collection("users").find(
						filter,
						{ projection: { _id: 1, id: 1, firstname: 1, name: 1, lastname: 1, image: 1, email: 1 } }
					).toArray();

					console.log(`[contacts:list] Found ${allUsers.length} users in DB`);

					const onlineUserIds = new Set<string>();
					for (const [, s] of this.server.sockets.sockets) {
						if (s.data.userId) onlineUserIds.add(s.data.userId);
					}

					const contacts = allUsers.map(u => {
						const odId = (u._id as any).toString();
						const id = u.id ? u.id.toString() : odId;
						return {
							id,
							firstname: u.firstname || u.name || "",
							lastname: u.lastname || "",
							picture: u.image || "",
							is_online: onlineUserIds.has(id)
						};
					});

					console.log(`[contacts:list] Returning ${contacts.length} contacts`);
					socket.emit("contacts:list:response", contacts);
				} catch (err) {
					console.error("[contacts:list] error:", err);
					socket.emit("contacts:list:response", []);
				}
			});

			CallSignaling.registerSocketHandlers(socket);

			socket.emit("connected", "You are connected !");
		})
	}

	static getServer(): Server {
		return this.server;
	}
}

//import { ListeMessagesEmis, ListeMessagesRecus } from "./ListeMessages.js"
//import SocketIdentificationService from "./services/SocketIdentification.js"
//import User from "./models/user.js"

//class CanalSocketio {
//    controleur
//    nomDInstance
//    socket
//    listeDesMessagesEmis = ListeMessagesEmis
//    listeDesMessagesRecus = ListeMessagesRecus
//    verbose = false

//    constructor(s, c, nom) {
//        this.controleur = c
//        this.socket = s
//        this.nomDInstance = nom
//        if (this.controleur.verboseall || this.verbose)
//            console.log(
//                "INFO (" +
//                    this.nomDInstance +
//                    "): " +
//                    this.nomDInstance +
//                    " s'enrgistre aupres du controleur"
//            )
//        this.controleur.inscription(
//            this,
//            this.listeDesMessagesEmis,
//            this.listeDesMessagesRecus
//        )

//        this.socket.on("connection", (socket) => {
//            socket.on("message", (msg) => {
//                let message = JSON.parse(msg)
//                message.id = socket.id
//                if (this.controleur.verboseall || this.verbose)
//                    console.log(
//                        "INFO (" +
//                            this.nomDInstance +
//                            "): conalsocketio reçoit: " +
//                            msg +
//                            " de la paet de " +
//                            socket.id
//                    )
//                this.controleur.envoie(this, message)
//            })

//            socket.on("demande_liste", (msg) => {
//                var T = new Object()
//                T.abonnement = this.listeDesMessagesEmis
//                T.emission = this.listeDesMessagesRecus
//                if (this.controleur.verboseall || this.verbose)
//                    console.log(
//                        "INFO (" +
//                            this.nomDInstance +
//                            "): on donne les listes émission et abonnement"
//                    )
//                socket.emit("donne_liste", JSON.stringify(T))
//            })

//            socket.on("disconnect", async () => {
//                try {
//                  const socketId = socket.id;
//                  const userInfo = await SocketIdentificationService.getUserInfoBySocketId(socketId);
              
//                  if (!userInfo) {
//                    console.warn(`Aucun utilisateur trouvé pour le socket.id ${socketId}`);
//                  } else {
//                    // Mise à jour via findOneAndUpdate (comme dans updateUser)
//                    const user = await User.findOneAndUpdate(
//                      { _id: userInfo._id },
//                      { disturb_status: "offline" },
//                      { new: true }
//                    );
              
//                    if (user) {
//                      console.log(`👋 Utilisateur ${user.firstname} ${user.lastname} mis en offline à la déconnexion.`);
//                    } else {
//                      console.warn(`Utilisateur avec l'ID ${userInfo._id} non trouvé en base.`);
//                    }
//                  }
//                } catch (err) {
//                  console.error("Erreur lors du passage en offline à la déconnexion :", err);
//                } finally {
//                  let message = { client_deconnexion: socket.id };
//                  this.controleur.envoie(this, message);
//                }
//              });
              
//        })
//    }

//    traitementMessage(mesg) {
//        if (this.controleur.verboseall || this.verbose)
//            console.log(
//                "INFO (" +
//                    this.nomDInstance +
//                    "): canalsocketio va emettre sur la/les socket " +
//                    JSON.stringify(mesg)
//            )
//        if (typeof mesg.id == "undefined")
//            this.socket.emit("message", JSON.stringify(mesg))
//        else {
//            let message = JSON.parse(JSON.stringify(mesg))
//            delete message.id
//            message = JSON.stringify(message)
//            for (var i = 0; i < mesg.id.length; i++) {
//                if (this.controleur.verboseall || this.verbose)
//                    console.log(
//                        "INFO (" +
//                            this.nomDInstance +
//                            "):emission sur la socket: " +
//                            mesg.id[i]
//                    )
//                this.socket.to(mesg.id[i]).emit("message", message)
//            }
//        }
//    }
//}
//export default CanalSocketio
