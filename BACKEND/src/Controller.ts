

//export type eventType = {

//    name: string,
//    subscribers: string[]
//};

export default class Controller {
    
    static activeEventsEmitted = new Map<string, {subscribers: string[]}>();
    static activeEventsSubscribed = new Map<string, {subscribers: string[]}>();

    static signUpEvent(emitter: any, eventsEmitted: string[], eventsToSubscribe: string[]) {

        eventsEmitted.forEach((event) => {

            const eventStored = this.activeEventsEmitted.has(event) && this.activeEventsEmitted.get(event);

            eventStored

                ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)
                    ? null
                    : eventStored.subscribers.push(emitter.id)

                : this.activeEventsEmitted.set(event, {subscribers: [emitter.id]});

            if (process.env.VERBOSE == "true") console.log("CONTROLLER: Liste des abonnés enregistrés sur ce message en émission : ", this.activeEventsEmitted);

        });

        eventsToSubscribe.forEach((event) => {

            const eventStored = this.activeEventsSubscribed.has(event) && this.activeEventsSubscribed.get(event);

            eventStored

                ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)
                    ? null
                    : eventStored.subscribers.push(emitter.id)

                : this.activeEventsSubscribed.set(event, {subscribers: [emitter.id]});

            if (process.env.VERBOSE == "true") console.log("CONTROLLER: Liste des abonnés enregistrés sur ce message en réception : ", this.activeEventsSubscribed);

        });
    }

    static unsubscribeEvent(emitter: any, eventsEmitted: string[], eventsToSubscribe: string[]) {

        eventsEmitted.forEach((event) => {

            const eventStored = this.activeEventsEmitted.has(event) && this.activeEventsEmitted.get(event);

            eventStored

                ? eventStored.subscribers.find(subscriber => subscriber == emitter.id) 
                    ? eventStored.subscribers.filter(subscriber => subscriber !== emitter.id) 
                    : null

                : null;

        });

        eventsToSubscribe.forEach((event) => {

            const eventStored = this.activeEventsSubscribed.has(event) && this.activeEventsSubscribed.get(event);

            eventStored

                ? eventStored.subscribers.find(subscriber => subscriber == emitter.id) 
                    ? eventStored.subscribers.filter(subscriber => subscriber !== emitter.id) 
                    : null

                : null;

        });
    }

    static envoie(emitter: any, message: any) {

        if (process.env.VERBOSE == "true") console.log(`CONTROLLER: Reçu de ${emitter.name} : `, message);

        const eventStored = this.activeEventsEmitted.has(Object.keys(message)[0]!) && this.activeEventsEmitted.get(Object.keys(message)[0]!);

        eventStored

            ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)

                ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)?.processEvent(message)
                : console.log(`CONTROLLER: L'utilisateur ${emitter.name} n'a pas été enregistré encore..`)

            : console.log(`CONTROLLER: Le message ${Object.keys(message)[0]} n'a pas été enregistré encore..`);

    }
}
