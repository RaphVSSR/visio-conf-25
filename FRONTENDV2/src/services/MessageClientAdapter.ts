import socketClient, { type Socket } from "socket.io-client"

type MessageHandler = (payload: any) => void

export default class MessageClientAdapter {

	private socket: Socket
	private handlers = new Map<string, Set<MessageHandler>>()
	private readyCallbacks: (() => void)[] = []
	private ready = false

	constructor(url: string) {

		this.socket = socketClient(url, { autoConnect: true, reconnection: true, withCredentials: true })

		this.socket.on("message", (raw: string) => {
			const parsed = JSON.parse(raw)
			const action = Object.keys(parsed)[0]
			if (!action) return

			const handlers = this.handlers.get(action)
			if (!handlers) return

			for (const handler of handlers) {
				handler(parsed[action])
			}
		})

		this.socket.on("donne_liste", () => {
			this.ready = true
			this.readyCallbacks.forEach(callback => callback())
			this.readyCallbacks = []
		})

		this.socket.emit("demande_liste", {})
	}

	onReady(callback: () => void): void {
		if (this.ready) callback()
		else this.readyCallbacks.push(callback)
	}

	on(messageName: string, handler: MessageHandler): void {
		if (!this.handlers.has(messageName)) {
			this.handlers.set(messageName, new Set())
		}
		this.handlers.get(messageName)!.add(handler)
	}

	off(messageName: string, handler: MessageHandler): void {
		this.handlers.get(messageName)?.delete(handler)
	}

	send(messageName: string, payload: unknown = {}): void {
		this.socket.emit("message", JSON.stringify({ [messageName]: payload }))
	}

	onReconnect(callback: () => void): void {
		this.socket.io.on("reconnect", callback)
	}

	disconnect(): void {
		this.socket.disconnect()
	}
}
