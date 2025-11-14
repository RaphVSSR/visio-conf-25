
import { io, Socket } from "socket.io-client";

export default class SocketIO {

	private static clientServer: Socket = io("http://localhost:3220"); 

	static init(){

		this.clientServer.on("connected", (mess) => {

			console.log("Retour connexion : ", mess);
			
		})
	}

	static emit(){

		this.clientServer.emit("connection");
	}
} 