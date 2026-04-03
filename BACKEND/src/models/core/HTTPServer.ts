
import { createServer, type Server } from "node:http"
import { createServer as createHttpsServer } from "node:https"
import { readFileSync, existsSync } from "node:fs"
import type { Express } from "express"

export default class HTTPServer {

	static server: Server
	static port: number = process.env.PORT ? Number(process.env.PORT) : 3220
	static isHttps: boolean = false

	static createFromExpress(appInstance: Express) {
		const cert = process.env.SSL_CRT_FILE
		const privkey = process.env.SSL_KEY_FILE

		if (cert && privkey && existsSync(cert) && existsSync(privkey)) {
			this.server = createHttpsServer({ cert: readFileSync(cert), key: readFileSync(privkey) }, appInstance)
			this.isHttps = true
		} else {
			this.server = createServer(appInstance)
		}
	}

	static listen() {
		const proto = this.isHttps ? "https" : "http"
		this.server.listen(this.port, "0.0.0.0", () => console.log(`Visioconf app listening on ${proto}://localhost:${this.port}`))
	}
}
