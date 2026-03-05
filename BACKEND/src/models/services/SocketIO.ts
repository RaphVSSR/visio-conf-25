import { Server, Socket } from "socket.io";
import HTTPServer from "../core/HTTPServer.ts";
import CallSignaling from "./CallSignaling.ts";

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
        methods: ["GET", "POST"],
      },
    });

    if (process.env.VERBOSE === "true")
      console.log("✅ Socket.io server initialized");

    CallSignaling.init(this.server);
    this.defListeners();
  }

  private static defListeners() {
    this.server.on("connection", (socket: Socket) => {
      console.log("New connection:", socket.id);

      socket.on("authenticate", (token: string) => {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
          ) as any;
          socket.data.userId = decoded.userId;
          console.log(
            `Socket ${socket.id} authenticated for user ${decoded.userId}`,
          );
        } catch (err: any) {
          console.error("Socket auth failed:", err.message);
        }
      });

		CallSignaling.init(this.server);
		this.defListeners();
	}

      socket.on("authenticate:session", (userId: string) => {
        if (typeof userId === "string" && userId.length > 0) {
          socket.data.userId = userId;
          console.log(
            `Socket ${socket.id} authenticated (session) for user ${userId}`,
          );
        }
      });

      socket.on(
        "contacts:list",
        async (payload?: { excludeEmail?: string }) => {
          try {
            const db = Auth.mongoClient.db("visioconf");
            const filter: any = {};
            if (payload?.excludeEmail) {
              filter.email = { $ne: payload.excludeEmail };
            }

            const allUsers = await db
              .collection("users")
              .find(filter, {
                projection: {
                  _id: 1,
                  id: 1,
                  firstname: 1,
                  name: 1,
                  lastname: 1,
                  image: 1,
                  email: 1,
                },
              })
              .toArray();

            console.log(`[contacts:list] Found ${allUsers.length} users in DB`);

            const onlineUserIds = new Set<string>();
            for (const [, s] of this.server.sockets.sockets) {
              if (s.data.userId) onlineUserIds.add(s.data.userId);
            }

            const contacts = allUsers.map((u) => {
              const odId = (u._id as any).toString();
              const id = u.id ? u.id.toString() : odId;
              return {
                id,
                firstname: u.firstname || u.name || "",
                lastname: u.lastname || "",
                picture: u.image || "",
                is_online: onlineUserIds.has(id),
              };
            });

            console.log(
              `[contacts:list] Returning ${contacts.length} contacts`,
            );
            socket.emit("contacts:list:response", contacts);
          } catch (err) {
            console.error("[contacts:list] error:", err);
            socket.emit("contacts:list:response", []);
          }
        },
      );

      CallSignaling.registerSocketHandlers(socket);

      socket.emit("connected", "You are connected !");
    });
  }

  static getServer(): Server {
    return this.server;
  }
}
