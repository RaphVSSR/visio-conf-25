
import { createServer } from "node:http";
import { Server } from "http";
import RestService from "../services/RestService.ts";

export default class HTTPServer {

	static server: Server;
	private static port: number = process.env.PORT ? Number(process.env.PORT) : 3220;

	static async init(){

		this.server = createServer(await RestService.implement());
	}

	static start(){

		this.server.listen(this.port, () => console.log(`Visioconf app listening on port ${this.port}`) );
	}
}