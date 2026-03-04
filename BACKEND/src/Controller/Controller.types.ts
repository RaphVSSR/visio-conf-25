export type Controller = {
	verboseall: boolean,
	inscription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
	desincription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
	envoie: (subscriber: ControllerSubscriber, message: Record<string, unknown>) => void,
}

export type ControllerSubscriber = {
	nomDInstance: string,
	traitementMessage: (mesg: ControllerMessage) => void,
}

export type ControllerMessage = { id: string } & Record<string, unknown>

