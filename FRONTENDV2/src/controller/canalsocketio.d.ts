import type { Socket } from "socket.io-client"
import type Controleur from "./controleur"

export default class CanalSocketio {
	controleur: Controleur
	nomDInstance: string
	socket: Socket
	listeDesMessagesEmis: string[]
	listeDesMessagesRecus: string[]
	verbose: boolean
	constructor(c: Controleur, nom: string)
	traitementMessage(mesg: Record<string, unknown>): void
}
