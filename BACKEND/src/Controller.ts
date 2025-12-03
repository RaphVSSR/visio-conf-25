

//export type eventType = {

import { Socket } from "socket.io";

//    name: string,
//    subscribers: string[]
//};

export default class Controller {
    
    static emittingSubscribersByMessages: { [key: string]: {}[] };
	static recievingSubscribersByMessages: { [key: string]: {}[] };

	static subscribe(subscriber: Socket, emittingMessage: string[], recievingMessage: string[]){

		emittingMessage.forEach(message => {

			this.emittingSubscribersByMessages[message]
				? this.emittingSubscribersByMessages[message].push(subscriber)
				: this.emittingSubscribersByMessages[message] = [subscriber];

		})

		recievingMessage.forEach(message => {

			this.recievingSubscribersByMessages[message]
				? this.recievingSubscribersByMessages[message].push(subscriber)
				: this.recievingSubscribersByMessages[message] = [subscriber];

		})
	}

	static unsubscribe(subscriber: Socket, emittingMessage: string[], recievingMessage: string[]){

		emittingMessage.forEach(message => {

			if (this.emittingSubscribersByMessages[message])
				
				this.emittingSubscribersByMessages[message] = this.emittingSubscribersByMessages[message].filter(socketStored => socketStored === subscriber);

		})

		recievingMessage.forEach(message => {

			if (this.recievingSubscribersByMessages[message])
				
				this.recievingSubscribersByMessages[message] = this.recievingSubscribersByMessages[message].filter(socketStored => socketStored === subscriber);

		})
	}

    static send(emitter: Socket, message: {}) {

        //if (process.env.VERBOSE == "true") console.log(`CONTROLLER: Reçu de ${emitter.name} : `, message);

        //const eventStored = this.activeEventsEmitted.has(Object.keys(message)[0]!) && this.activeEventsEmitted.get(Object.keys(message)[0]!);

        //eventStored

        //    ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)

        //        ? eventStored.subscribers.find(subscriber => subscriber == emitter.id)?.processEvent(message)
        //        : console.log(`CONTROLLER: L'utilisateur ${emitter.name} n'a pas été enregistré encore..`)

        //    : console.log(`CONTROLLER: Le message ${Object.keys(message)[0]} n'a pas été enregistré encore..`);

    }
}
