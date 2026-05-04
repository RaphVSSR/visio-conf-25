declare module "connect-mongodb-session" {

	import type { Store } from "express-session"

	type Connect = { Store: typeof Store }

	type Options = {
		uri: string
		collection?: string
		databaseName?: string
		expires?: number
		idField?: string
		connectionOptions?: Record<string, unknown>
	}

	type StoreConstructor = new (options: Options) => Store

	function MongoDBStoreFactory(connect: Connect): StoreConstructor

	export default MongoDBStoreFactory
}
