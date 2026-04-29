import { ListeMessagesEmis, ListeMessagesRecus } from "./ListeMessages.ts"
import Session from "./models/services/authentication/Session.ts"
import User from "./models/User.ts"

class CanalSocketio {
    controleur
    nomDInstance
    socket
    listeDesMessagesEmis = ListeMessagesEmis
    listeDesMessagesRecus = ListeMessagesRecus
    verbose = false

    constructor(s, c, nom) {
        this.controleur = c
        this.socket = s
        this.nomDInstance = nom
        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): " +
                    this.nomDInstance +
                    " s'enrgistre aupres du controleur"
            )
        this.controleur.inscription(
            this,
            this.listeDesMessagesEmis,
            this.listeDesMessagesRecus
        )

        this.socket.on("connection", (socket) => {
            socket.on("message", (msg) => {
                let message = JSON.parse(msg)
                message.id = socket.id
                if (this.controleur.verboseall || this.verbose)
                    console.log(
                        "INFO (" +
                            this.nomDInstance +
                            "): conalsocketio reçoit: " +
                            msg +
                            " de la paet de " +
                            socket.id
                    )
                this.controleur.envoie(this, message)
            })

            socket.on("demande_liste", (msg) => {
                var T = new Object()
                T.abonnement = this.listeDesMessagesEmis
                T.emission = this.listeDesMessagesRecus
                if (this.controleur.verboseall || this.verbose)
                    console.log(
                        "INFO (" +
                            this.nomDInstance +
                            "): on donne les listes émission et abonnement"
                    )
                socket.emit("donne_liste", JSON.stringify(T))
            })

            socket.on("disconnect", async () => {
                try {
                  const session = await Session.getSessionBySocket(socket.id);

                  if (!session) {
                    console.warn(`Aucun utilisateur trouvé pour le socket.id ${socket.id}`);
                  } else {
                    await User.model.updateOne(
                      { _id: session.userId },
                      { disturb_status: "offline" }
                    );
                    console.log(`👋 Utilisateur ${session.userId} mis en offline à la déconnexion.`);
                  }
                } catch (err) {
                  console.error("Erreur lors du passage en offline à la déconnexion :", err);
                } finally {
                  let message = { client_deconnexion: socket.id };
                  this.controleur.envoie(this, message);
                }
              });

        })
    }

    traitementMessage(mesg) {
        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): canalsocketio va emettre sur la/les socket " +
                    JSON.stringify(mesg)
            )
        if (typeof mesg.id == "undefined")
            this.socket.emit("message", JSON.stringify(mesg))
        else {
            let message = JSON.parse(JSON.stringify(mesg))
            delete message.id
            message = JSON.stringify(message)
            for (var i = 0; i < mesg.id.length; i++) {
                if (this.controleur.verboseall || this.verbose)
                    console.log(
                        "INFO (" +
                            this.nomDInstance +
                            "):emission sur la socket: " +
                            mesg.id[i]
                    )
                this.socket.to(mesg.id[i]).emit("message", message)
            }
        }
    }
}
export default CanalSocketio
