import express from "express"
import cors from "cors"
import path from "path"
import { createServer } from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import jwt from "jsonwebtoken"
import CanalSocketio from "./canalsocketio.js"
import Controleur from "./controleur.js"
import UsersService from "./services/Users.js"
import MessagesService from "./services/Messages.js"
import RolesService from "./services/Roles.js"
import PermsService from "./services/Perms.js"
import SocketIdentificationService from "./services/SocketIdentification.js"
import DriveService from "./services/DriveService.js"
import ChannelsService from "./services/ChannelsService.js"
import TeamsService from "./services/TeamsService.js"
import fileRoutes from "./routes/files.js"
import User from "./models/user.js"

dotenv.config()

// Pour __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3220
const server = createServer(app)

// Configuration CORS pour les credentials - Support des IPs et domaines
const corsOptions = {
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (applications mobiles, Postman, etc.)
        if (!origin) return callback(null, true) // Liste des origines autorisées
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

        // Permettre toute adresse IP locale sur le port 3000
        const ipPattern =
            /^http:\/\/((192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|127\.0\.0\.1)\d{1,3}\.\d{1,3}|localhost):3000$/

        if (allowedOrigins.includes(origin) || ipPattern.test(origin)) {
            callback(null, true)
        } else {
            console.log(`CORS: Origin ${origin} not allowed`)
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))

const io = new Server(server, {
    cors: corsOptions,
})

io.on("connection", (socket) => {
    socket.on("authenticate", async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const userId = decoded.userId

            // Charger les informations complètes de l'utilisateur depuis la DB
            const userInfo = await User.findById(
                userId,
                "uuid firstname lastname email picture phone job desc roles disturb_status date_create last_connection"
            )
                .populate("roles", "role_label")
                .lean()

            if (!userInfo) {
                console.error(`Utilisateur non trouvé pour ID: ${userId}`)
                return
            }

            await SocketIdentificationService.updateUserSocket(
                userId,
                socket.id,
                userInfo // Passer les informations complètes de l'utilisateur
            )
            console.log(
                `Socket authentifié avec succès pour utilisateur ${userInfo.firstname} ${userInfo.lastname} (${userInfo.uuid}) avec socket id ${socket.id}`
            )
        } catch (err) {
            console.error("Authentication failed:", err.message)
        }
    })

    // Nettoyer automatiquement lors de la déconnexion
    socket.on("disconnect", async () => {
        try {
            // Chercher l'utilisateur associé à ce socket
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socket.id
                )
            if (userInfo && userInfo._id) {
                SocketIdentificationService.userToSocket.delete(userInfo._id)
                SocketIdentificationService.socketToUser.delete(socket.id)
                console.log(
                    `Socket association cleaned on disconnect for user ${userInfo._id}`
                )
            }
        } catch (err) {
            console.error("Disconnect cleanup failed:", err.message)
        }
    })
})

server.listen(port, () => {
    console.log(`Visioconf app listening on port ${port}`)
})
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

// File upload routes
app.use("/api/files", fileRoutes)

var verbose = process.env.VERBOSE === "true"
var controleur = new Controleur()
controleur.verboseall = verbose

// Instanciation des services pour les initialiser et déclencher leur enregistrement auprès du contrôleur
new UsersService(controleur, "UsersService")
new MessagesService(controleur, "MessagesService")
new RolesService(controleur, "RolesService")
new PermsService(controleur, "PermsService")
new CanalSocketio(io, controleur, "canalsocketio")
new DriveService(controleur, "DriveService")
new ChannelsService(controleur, "ChannelService")
new TeamsService(controleur, "TeamsService")

main().catch((err) => console.error("Error during startup:", err))

async function main() {
    try {
        // Connexion MongoDB simplifiée
        const mongoOptions = {}

        // Si des credentials sont fournis, les utiliser
        if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
            mongoOptions.user = process.env.MONGO_USER
            mongoOptions.pass = process.env.MONGO_PASSWORD
        }

        await mongoose.connect(process.env.MONGO_URI, mongoOptions)
        console.log("✅ Connexion MongoDB établie avec succès")
    } catch (error) {
        console.error("❌ Erreur de connexion MongoDB:", error.message)
        console.error(
            "💡 Assurez-vous que MongoDB est démarré et que l'URI est correcte dans votre fichier .env"
        )
        process.exit(1)
    }
}
