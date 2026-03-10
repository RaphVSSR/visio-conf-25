import { Server, Socket } from "socket.io";
import HTTPServer from "../Core/HTTPServer.ts";
import CallSignaling from "./CallSignaling.ts";
import User from "../User.ts";

/**
 * Initialise le serveur Socket.io et expose l'instance pour le canal.
 */
export default class SocketIO {

	static server: Server;

	/**
	 * Crée le serveur Socket.io attaché au serveur HTTP.
	 * L'instance est accessible via SocketIO.server pour être passée au CanalSocketio.
	 */
	static init() {

		this.server = new Server(HTTPServer.server, {

			cors: {
				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		if (process.env.VERBOSE === "true") console.log("✅ Socket.io server initialized");

		CallSignaling.init(this.server);
		this.defListeners();
	}

	private static defListeners() {

		this.server.on("connection", (socket: Socket) => {

			console.log("New connection:", socket.id);

			socket.on("authenticate:session", (userId: string) => {
				if (typeof userId === "string" && userId.length > 0) {
					socket.data.userId = userId;
					console.log(`Socket ${socket.id} authenticated (session) for user ${userId}`);
				}
			});

			socket.on("contacts:list", async (payload?: { excludeEmail?: string }) => {
				try {
					const filter: any = {};
					if (payload?.excludeEmail) {
						filter.email = { $ne: payload.excludeEmail };
					}

					const allUsers = await User.model
						.find(filter)
						.select("_id firstname lastname picture email")
						.lean();

					const onlineUserIds = new Set<string>();
					for (const [, s] of this.server.sockets.sockets) {
						if (s.data.userId) onlineUserIds.add(s.data.userId);
					}

					const contacts = allUsers.map((u) => {
						const id = (u._id as any).toString();
						return {
							id,
							firstname: u.firstname || "",
							lastname: u.lastname || "",
							picture: u.picture || "",
							is_online: onlineUserIds.has(id),
						};
					});

					socket.emit("contacts:list:response", contacts);
				} catch (err) {
					console.error("[contacts:list] error:", err);
					socket.emit("contacts:list:response", []);
				}
			});

			CallSignaling.registerSocketHandlers(socket);

			socket.emit("connected", "You are connected !");
		});
	}

	static getServer(): Server {
		return this.server;
	}
}
