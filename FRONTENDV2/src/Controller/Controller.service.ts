import type { Controller, ControllerMessage } from "./Controller.types"

export abstract class ControllerService {

	readonly nomDInstance: string
	protected readonly controleur: Controller
	readonly messagesEmitted: string[]
	readonly messagesReceived: string[]

	abstract traitementMessage(mesg: ControllerMessage): void

	constructor(controleur: Controller, nom: string, messagesEmitted: string[], messagesReceived: string[]) {
		this.controleur = controleur
		this.nomDInstance = nom
		this.messagesEmitted = messagesEmitted
		this.messagesReceived = messagesReceived
		controleur.inscription(this, this.messagesEmitted, this.messagesReceived)
	}

	protected sendMessage(message: Record<string, unknown>): void {
		this.controleur.envoie(this, message)
	}

	destroy(): void {
		this.controleur.desincription(this, this.messagesEmitted, this.messagesReceived)
	}
}
