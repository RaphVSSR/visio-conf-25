
const ErrorsType = {

	//Database
	dbConnect: {

		id: "dbConnect",
		message: "❌ Error during the MongoDB connection process.\n",
	},
	dbClose: {

		id: "dbClose",
		message: "❌ Error during the MongoDB closing process.\n",
	},
	dbFlushing: {

		id: "dbFlushing",
		message: "❌ Error during the MongoDB flush.\n",
	},
	uploadsIntegrity: {

		id: "uploadsIntegrity",
		message: "💥 Uploads's environnement integrity compromised.\n",
	},
	collectionIntegrity: {

		id: "collectionIntegrity",
		message: "💥 Collection's environnement integrity compromised.\n",
	},
	collectionSaving: {

		id: "collectionSaving",
		message: "❌ Collection saving didn't succeed : ",
	},

	testFilesCopying: {

		id: "testFilesCopying",
		message: "❌ Error during the copying of a test file.\n",
	},

	getFileSize: {

		id: "getFileSize",
		message: "❌ Error during getting the file size.",
	},

	//REST Server
	restCorsDef: {

		id: "restCorsDef",
		message: "❌ Error during the REST CORS definition.\n",
	},
	restRoutesDef: {

		id: "restRoutesDef",
		message: "❌ Error during the REST routes definition.\n",
	},

	//Tests
	injectingCollection: {

		id: "injectingCollection",
		message: "❌ Error during a collection injection.\n",
	},
	
	//Roles
	roleNotFound: {

		id: "roleNotFound",
		message: "❌ Error a role didn't exists.\n",
	},
	
	//Users
	adminCredentialsNotReferenced: {

		id: "adminCredentialsNotReferenced",
		message: "❌ Error admins credentials aren't referenced in a .env file.\n",		
	},

	//Teams
	noTeamsFound: {

		id: "noTeamsFound",
		message: "❌ Error teams collection is empty.\n",
	},

	//Channels
	noChannelsFound: {

		id: "noChannelsFound",
		message: "❌ Error channels collection is empty.\n",
	},

} as const;

type ErrorsType = typeof ErrorsType;

export default class TracedError extends Error {

	id: ErrorsType[keyof ErrorsType]["id"];
	reason?: string;

	/**
	 * Gère et affiche les erreurs de l'application en fonction de leur identifications.
	 *
	 * @param type - Sélectionne le type de l'erreur à propager.
	 * @param reason OPTIONEL - Passe le message par défaut retourné de la fonction en erreur pour avoir plus d'informations sur le problème.
	 * 
	 * Cette fonction peut traiter tous types d'erreur mais l'information sera beaucoup plus claire et précise avec une "Erreur tracée".
	 */
	constructor(type: keyof ErrorsType, reason?: string){

		super(ErrorsType[type].message);
		
		this.id = ErrorsType[type].id;
		if (reason) this.reason = reason;

		//Pour être sur que l'héritage d'Error soit propre parce qu'il peut arriver qu'il y ai des problèmes
		Object.setPrototypeOf(this, TracedError.prototype);

		//Permet d'ignorer l'instanciation de notre classe d'erreur personnalisé et de pointer plus précisément l'endroit de l'erreur jettée
		if (Error.captureStackTrace) Error.captureStackTrace(this, TracedError);

	}

	static errorHandler(err: any){

		if (err instanceof TracedError){

			console.error(err.message, err.reason ? `Reason: ${err.reason}\n` : "\n", err.stack + "\n");

		}else {
	
			console.trace(`❌ Unknown error `, err.message + "\n", err.stack + "\n");
	
		}
		
	}

};