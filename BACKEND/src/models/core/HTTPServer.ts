
import { createServer, type Server } from "node:http"
import type { Express } from "express"

export default class HTTPServer {

	static server: Server
	static port: number = process.env.PORT ? Number(process.env.PORT) : 3220

	static createFromExpress(app: Express) {
		this.server = createServer(app)
	}

	static listen() {
		this.server.listen(this.port, "0.0.0.0", () => console.log(`Visioconf app listening on port ${this.port}`))
	}
}
