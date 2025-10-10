import io from "socket.io-client"
import Controleur from "@/controllers/controleur"

class CanalSocketio {
    controleur
    nomDInstance
    socket

    listeDesMessagesEmis
    listeDesMessagesRecus
    verbose = false

    constructor(c, nom) {
        this.controleur = c
        this.nomDInstance = nom

        this.socket = io(
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3220",
            {
                autoConnect: true,
                reconnection: true,
            }
        )

        this.socket.on("message", (msg) => {
            if (this.controleur.verboseall || this.verbose)
                console.log(
                    "INFO (" + this.nomDInstance + "): reçoit ce message:" + msg
                )
            this.controleur.envoie(this, JSON.parse(msg))
        })
        this.socket.on("donne_liste", (msg) => {
            var listes = JSON.parse(msg)
            this.listeDesMessagesEmis = listes.emission
            this.listeDesMessagesRecus = listes.abonnement
            if (this.controleur.verboseall || this.verbose)
                console.log(
                    "INFO (" +
                        this.nomDInstance +
                        "): inscription des messages de CanalSocketio"
                )

            this.controleur.inscription(
                this,
                listes.emission,
                listes.abonnement
            )
        })

        this.socket.emit("demande_liste", {})
    }

    traitementMessage(mesg) {
        this.socket.emit("message", JSON.stringify(mesg))
    }
}

export default CanalSocketio
