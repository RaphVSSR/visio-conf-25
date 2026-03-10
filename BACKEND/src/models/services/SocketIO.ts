import { Server } from "socket.io"
import HTTPServer from "../Core/HTTPServer.ts";

/**
 * Initialise le serveur Socket.io et expose l'instance pour le canal.
 */
export default class SocketIO {

	static server: Server;

	/**
	 * Crée le serveur Socket.io attaché au serveur HTTP.
	 * L'instance est accessible via SocketIO.server pour être passée au CanalSocketio.
	 */
	static init(){

		this.server = new Server(HTTPServer.server, {

			cors: {

				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		if (process.env.VERBOSE === "true") console.log("✅ Socket.io server initialized");
	}
}
