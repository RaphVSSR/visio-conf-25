import dotenv from "dotenv"
import Database from "./models/services/Database.ts"
import TracedError from "./models/core/TracedError.ts";
import HTTPServer from "./models/core/HTTPServer.ts";
import SocketIO from "./models/services/SocketIO.ts";
//import jwt from "jsonwebtoken"
//import CanalSocketio from "./canalsocketio.js"
//import Controleur from "./controleur.js"
//import UsersService from "./services/Users.js"
//import MessagesService from "./services/Messages.js"
//import RolesService from "./services/Roles.js"
//import PermsService from "./services/Perms.js"
//import SocketIdentificationService from "./services/SocketIdentification.js"
//import DriveService from "./services/DriveService.js"
//import ChannelsService from "./services/ChannelsService.js"
//import TeamsService from "./services/TeamsService.js"

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
    HTTPServer.start();

    if (process.env.VERBOSE === "true") console.groupEnd();
    
} catch (err) {
    
    TracedError.errorHandler(err);
}


// Configuration CORS pour les credentials - Support des IPs et domaines

//const io = new Server(server, {
//    cors: corsOptions,
//})

//io.on("connection", (socket) => {
//    socket.on("authenticate", async (token) => {
//        try {
//            const decoded = jwt.verify(token, process.env.JWT_SECRET)
//            const userId = decoded.userId

//            // Charger les informations complètes de l'utilisateur depuis la DB
//            const userInfo = await User.findById(
//                userId,
//                "uuid firstname lastname email picture phone job desc roles disturb_status date_create last_connection"
//            )
//                .populate("roles", "role_label")
//                .lean()

//            if (!userInfo) {
//                console.error(`Utilisateur non trouvé pour ID: ${userId}`)
//                return
//            }

//            await SocketIdentificationService.updateUserSocket(
//                userId,
//                socket.id,
//                userInfo // Passer les informations complètes de l'utilisateur
//            )
//            console.log(
//                `Socket authentifié avec succès pour utilisateur ${userInfo.firstname} ${userInfo.lastname} (${userInfo.uuid}) avec socket id ${socket.id}`
//            )
//        } catch (err) {
//            console.error("Authentication failed:", err.message)
//        }
//    })

//    // Nettoyer automatiquement lors de la déconnexion
//    socket.on("disconnect", async () => {
//        try {
//            // Chercher l'utilisateur associé à ce socket
//            const userInfo =
//                await SocketIdentificationService.getUserInfoBySocketId(
//                    socket.id
//                )
//            if (userInfo && userInfo._id) {
//                SocketIdentificationService.userToSocket.delete(userInfo._id)
//                SocketIdentificationService.socketToUser.delete(socket.id)
//                console.log(
//                    `Socket association cleaned on disconnect for user ${userInfo._id}`
//                )
//            }
//        } catch (err) {
//            console.error("Disconnect cleanup failed:", err.message)
//        }
//    })
//})

//new UsersService(controleur, "UsersService")
//new MessagesService(controleur, "MessagesService")
//new RolesService(controleur, "RolesService")
//new PermsService(controleur, "PermsService")
//new CanalSocketio(io, controleur, "canalsocketio")
//new DriveService(controleur, "DriveService")
//new ChannelsService(controleur, "ChannelService")
//new TeamsService(controleur, "TeamsService")