import dotenv from "dotenv"
import Database from "./models/services/Database.ts"
import TracedError from "./models/Core/TracedError.ts";
import HTTPServer from "./models/Core/HTTPServer.ts";
import SocketIO from "./models/services/SocketIO.ts";
import { init as initController } from "./Controller/Controller.abstracts.ts";

dotenv.config();

try {

    if (process.env.VERBOSE === "true") console.log(`Lancement de l'app : [${new Date().toISOString()}]\n`);

    await Database.init();

    if (process.env.VERBOSE === "true"){

    	console.log("");
    	console.group("⚙️ Processing App Server..");
    }

    await HTTPServer.init();
    SocketIO.init();
    
    initController();

    HTTPServer.start();

    if (process.env.VERBOSE === "true") console.groupEnd();

} catch (err) {

    TracedError.errorHandler(err);
}
