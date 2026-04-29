import io from "socket.io-client"

/**
 * Canal Socket.io côté client.
 * Fait le pont entre le client Socket.io et le contrôleur.
 * Envoie les messages du contrôleur vers le serveur via Socket.io.
 * Reçoit les messages du serveur et les route vers le contrôleur.
 */
class CanalSocketio {
    /** @type {import('./controleur.js').Controleur} */
    controleur
    /** @type {string} */
    nomDInstance
    /** @type {import('socket.io-client').Socket} */
    socket

    listeDesMessagesEmis
    listeDesMessagesRecus
    verbose = false

    /**
     * Crée le canal Socket.io côté client et attend la liste des messages du serveur.
     * @param {import('./controleur.js').Controleur} c - Le contrôleur central
     * @param {string} nom - Le nom d'instance pour le contrôleur
     */
    constructor(c, nom) {
        this.controleur = c
        this.nomDInstance = nom

        this.socket = io(
            process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220",
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

    /**
     * Envoie un message vers le serveur via Socket.io.
     * Appelé par le contrôleur quand un composant émet un message.
     * @param {Object} mesg - Le message à envoyer (clé = nom du message, valeur = payload)
     */
    traitementMessage(mesg) {
        this.socket.emit("message", JSON.stringify(mesg))
    }
}

export default CanalSocketio
