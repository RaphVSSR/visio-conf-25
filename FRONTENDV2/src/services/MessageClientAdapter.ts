import Controleur from "controller/controleur.js"
import CanalSocketio from "controller/canalsocketio.js"

type MessageHandler = (payload: any) => void

export default class MessageClientAdapter {

	readonly nomDInstance = "ReactBridge"

	private controleur: Controleur
	private canal: CanalSocketio
	private handlers = new Map<string, Set<MessageHandler>>()
	private inscribedEmission = new Set<string>()
	private inscribedAbonnement = new Set<string>()
	private readyCallbacks: (() => void)[] = []
	private ready = false
	private reconnectCallbacks: (() => void)[] = []

	constructor(_url: string) {
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")

		const originalInscription = this.controleur.inscription.bind(this.controleur)
		this.controleur.inscription = (emetteur: any, liste_emission: string[], liste_abonnement: string[]) => {
			originalInscription(emetteur, liste_emission, liste_abonnement)
			if (emetteur === this.canal && !this.ready) {
				originalInscription(this, liste_abonnement, liste_emission)
				for (const name of liste_abonnement) this.inscribedEmission.add(name)
				for (const name of liste_emission) this.inscribedAbonnement.add(name)
				this.ready = true
				this.readyCallbacks.forEach(cb => cb())
				this.readyCallbacks = []
			}
		}

		this.canal.socket.io.on("reconnect", () => {
			this.reconnectCallbacks.forEach(cb => cb())
		})
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const action of Object.keys(mesg)) {
			if (action === "id") continue
			const handlers = this.handlers.get(action)
			if (!handlers) continue
			for (const handler of handlers) handler(mesg[action])
		}
	}

	onReady(callback: () => void): void {
		if (this.ready) callback()
		else this.readyCallbacks.push(callback)
	}

	on(messageName: string, handler: MessageHandler): void {
		if (!this.handlers.has(messageName)) this.handlers.set(messageName, new Set())
		this.handlers.get(messageName)!.add(handler)

		if (!this.inscribedAbonnement.has(messageName)) {
			this.controleur.inscription(this, [], [messageName])
			this.inscribedAbonnement.add(messageName)
		}
	}

	off(messageName: string, handler: MessageHandler): void {
		this.handlers.get(messageName)?.delete(handler)
	}

	send(messageName: string, payload: unknown = {}): void {
		if (!this.inscribedEmission.has(messageName)) {
			this.controleur.inscription(this, [messageName], [])
			this.inscribedEmission.add(messageName)
		}
		this.controleur.envoie(this, { [messageName]: payload })
	}

	onReconnect(callback: () => void): void {
		this.reconnectCallbacks.push(callback)
	}

	disconnect(): void {
		this.canal.socket?.disconnect()
		this.reconnectCallbacks = []
	}
}
