import type { Server } from "socket.io";

export default class CanalSocketIO {
	controleur: any;
	nomDInstance: string;
	socket: Server;
	listeDesMessagesEmis: string[];
	listeDesMessagesRecus: string[];
	verbose: boolean;
	constructor(s: Server, c: any, nom: string);
	traitementMessage(mesg: any): void;
}
