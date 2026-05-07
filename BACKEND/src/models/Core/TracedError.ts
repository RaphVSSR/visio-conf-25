
const ErrorsType = {

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
	restCorsDef: {
		id: "restCorsDef",
		message: "❌ Error during the REST CORS definition.\n",
	},
	restRoutesDef: {
		id: "restRoutesDef",
		message: "❌ Error during the REST routes definition.\n",
	},
	injectingCollection: {
		id: "injectingCollection",
		message: "❌ Error during a collection injection.\n",
	},
	roleNotFound: {
		id: "roleNotFound",
		message: "❌ Error a role didn't exists.\n",
	},
	adminCredentialsNotReferenced: {
		id: "adminCredentialsNotReferenced",
		message: "❌ Error admins credentials aren't referenced in a .env file.\n",
	},
	noTeamsFound: {
		id: "noTeamsFound",
		message: "❌ Error teams collection is empty.\n",
	},
	noChannelsFound: {
		id: "noChannelsFound",
		message: "❌ Error channels collection is empty.\n",
	},
	injectAdmin: {
		id: "injectAdmin",
		message: "❌ Error during admin user injection.\n",
	},

} as const;

type ErrorsType = typeof ErrorsType;

export default class TracedError extends Error {

	id: ErrorsType[keyof ErrorsType]["id"];
	reason?: string;

	constructor(type: keyof ErrorsType, reason?: string){

		super(ErrorsType[type].message);

		this.id = ErrorsType[type].id;
		if (reason) this.reason = reason;

		Object.setPrototypeOf(this, TracedError.prototype);

		if (Error.captureStackTrace) Error.captureStackTrace(this, TracedError);

	}

	static errorHandler(error: any){

		if (error instanceof TracedError){

			console.error(error.message, error.reason ? `Reason: ${error.reason}\n` : "\n", error.stack + "\n");

		}else {

			console.trace(`❌ Unknown error `, error.message + "\n", error.stack + "\n");

		}

	}

};
