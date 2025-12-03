import { io, Socket } from "socket.io-client";

export default class Controller {

	private static socket: Socket = io("http://localhost:3220");

	static emittingSubscribersByMessages: { [key: string]: object[] } = {};
	static recievingSubscribersByMessages: { [key: string]: object[] } = {};

	static subscribe(subscriber: object, emittingMessage: string[], recievingMessage: string[]){

		emittingMessage.forEach(message => {

			this.emittingSubscribersByMessages[message]!
				? this.emittingSubscribersByMessages[message]!.push(subscriber)
				: this.emittingSubscribersByMessages[message] = [subscriber];

		})

		recievingMessage.forEach(message => {

			this.recievingSubscribersByMessages[message]!
				? this.recievingSubscribersByMessages[message]!.push(subscriber)
				: this.recievingSubscribersByMessages[message] = [subscriber];

		})
	}

	static unsubscribe(subscriber: object, emittingMessage: string[], recievingMessage: string[]){

		emittingMessage.forEach(message => {

			if (this.emittingSubscribersByMessages[message]!)
				
				this.emittingSubscribersByMessages[message] = this.emittingSubscribersByMessages[message]!.filter(socketStored => socketStored === subscriber);

		})

		recievingMessage.forEach(message => {

			if (this.recievingSubscribersByMessages[message]!)
				
				this.recievingSubscribersByMessages[message] = this.recievingSubscribersByMessages[message]!.filter(socketStored => socketStored === subscriber);

		})
	}

	static socketInit(){

		//this.socket.on("connected", (mess) => {

		//	console.log("Retour connexion : ", mess);
			
		//})
	}
}