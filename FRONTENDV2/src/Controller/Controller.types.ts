export type ControllerSubscriber = {
	nomDInstance: string,
	traitementMessage: (mesg: ControllerMessage) => void,
}

type LooseSubscriber = {
	nomDInstance: string,
	traitementMessage: Function,
}

export type Controller = {
	listeEmission: Record<string, Record<string, LooseSubscriber>>,
	listeAbonnement: Record<string, Record<string, LooseSubscriber>>,
	verbose: boolean,
	verboseall: boolean,
	inscription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
	desincription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
	envoie: (subscriber: ControllerSubscriber, message: Record<string, unknown>) => void,
}

export type ControllerMessage = { id: string } & Record<string, unknown>
