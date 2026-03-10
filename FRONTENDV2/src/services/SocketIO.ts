import CanalSocketio from "Controller/canalsocketio.js"
import type { Controller } from "Controller/Controller.types"

type ReadyCallback = () => void

export class SocketIO {

	private static instance: InstanceType<typeof CanalSocketio> | null = null
	private static readyCallbacks: ReadyCallback[] = []
	private static readyPoll: ReturnType<typeof setInterval> | null = null
	private static isReady = false

	static init(controleur: Controller): void {
		if (SocketIO.instance) return

		SocketIO.instance = new CanalSocketio(controleur as Controller, "canalsocketio")

		SocketIO.readyPoll = setInterval(() => {
			if (SocketIO.instance!.listeDesMessagesEmis) {
				clearInterval(SocketIO.readyPoll!)
				SocketIO.readyPoll = null
				SocketIO.isReady = true
				SocketIO.readyCallbacks.forEach(cb => cb())
				SocketIO.readyCallbacks = []
			}
		}, 50)
	}

	static onReady(callback: ReadyCallback): void {
		if (SocketIO.isReady) {
			callback()
		} else {
			SocketIO.readyCallbacks.push(callback)
		}
	}

	static get canal(): InstanceType<typeof CanalSocketio> {
		if (!SocketIO.instance) throw new Error("SocketIO not initialized")
		return SocketIO.instance
	}

	static disconnect(): void {
		if (SocketIO.readyPoll) {
			clearInterval(SocketIO.readyPoll)
			SocketIO.readyPoll = null
		}
		if (SocketIO.instance) {
			SocketIO.instance.socket.disconnect()
			SocketIO.instance = null
		}
		SocketIO.readyCallbacks = []
		SocketIO.isReady = false
	}
}
