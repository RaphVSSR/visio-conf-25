/**
 * Contrôleur central de messages (pattern pub/sub).
 * Gère l'inscription, la désinscription et le routage des messages
 * entre les composants React et le canal Socket.io.
 */
export class Controleur {
    /** @type {Object.<string, Object.<string, {nomDInstance: string, traitementMessage: function}>>} */
    listeEmission = new Object()
    /** @type {Object.<string, Object.<string, {nomDInstance: string, traitementMessage: function}>>} */
    listeAbonnement = new Object()
    verbose = false
    verboseall = true
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    /**
     * Inscrit un émetteur/abonné pour une liste de messages en émission et en abonnement.
     * @param {{nomDInstance: string, traitementMessage: function}} emetteur - L'instance qui s'inscrit
     * @param {string[]} liste_emission - Messages que l'instance peut émettre
     * @param {string[]} liste_abonnement - Messages auxquels l'instance s'abonne
     */
    inscription(emetteur, liste_emission, liste_abonnement) {
        for (var key in liste_emission) {
            if (typeof this.listeEmission[liste_emission[key]] == "undefined") {
                this.listeEmission[liste_emission[key]] = new Object()
            } else {
                if (this.verboseall || this.verbose) {
                    console.log(
                        "INFO(controleur: liste des instances qui ont déjà enregistré ce message en émission:"
                    )
                    console.log(this.listeEmission[liste_emission[key]])
                }
            }
            if (
                typeof this.listeEmission[liste_emission[key]][
                    emetteur.nomDInstance
                ] != "undefined"
            ) {
                console.log(
                    "ERREUR(controleur: " +
                        emetteur.nomDInstance +
                        " essaie de s'enregistrer une nouvelle fois pour le message en émission: " +
                        liste_emission[key] +
                        ")"
                )
            } else {
                this.listeEmission[liste_emission[key]][emetteur.nomDInstance] =
                    emetteur
            }
        }
        for (var key in liste_abonnement) {
            if (
                typeof this.listeAbonnement[liste_abonnement[key]] ==
                "undefined"
            ) {
                this.listeAbonnement[liste_abonnement[key]] = new Object()
            } else {
                if (this.verboseall || this.verbose) {
                    console.log(
                        "INFO(controleur: liste des instances qui ont déjà enregistré ce message en abonnement:"
                    )
                    console.log(this.listeAbonnement[liste_abonnement[key]])
                }
            }
            if (
                typeof this.listeAbonnement[liste_abonnement[key]][
                    emetteur.nomDInstance
                ] != "undefined"
            ) {
                console.log(
                    "ERREUR(controleur: " +
                        emetteur.nomDInstance +
                        " essaie de s'enregistrer une nouvelle fois pour le message en abonnement: " +
                        liste_abonnement[key] +
                        ")"
                )
            } else {
                this.listeAbonnement[liste_abonnement[key]][
                    emetteur.nomDInstance
                ] = emetteur
            }
        }
    }

    /**
     * Désinscrit un émetteur/abonné de ses messages.
     * @param {{nomDInstance: string}} emetteur - L'instance qui se désinscrit
     * @param {string[]} liste_emission - Messages en émission à retirer
     * @param {string[]} liste_abonnement - Messages en abonnement à retirer
     */
    desincription(emetteur, liste_emission, liste_abonnement) {
        for (var key in liste_emission) {
            if (typeof this.listeEmission[liste_emission[key]] == "undefined") {
                console.log(
                    "ERREUR(controleur: le message en émission n'existe plus, on ne peut pas l'enlever: " +
                        liste_emission[key]
                )
            } else {
                if (
                    typeof this.listeEmission[liste_emission[key]][
                        emetteur.nomDInstance
                    ] == "undefined"
                ) {
                    console.log(
                        "ERREUR(controleur: le message en émission  " +
                            liste_emission[key] +
                            " n'était pas enregistré par " +
                            emetteur.nomDInstance
                    )
                } else {
                    delete this.listeEmission[liste_emission[key]][
                        emetteur.nomDInstance
                    ]
                    if (this.verboseall || this.verbose) {
                        console.log(
                            "INFO(controleur: le message en émission " +
                                liste_emission[key] +
                                " a été enlevé de la liste pour " +
                                emetteur.nomDInstance
                        )
                    }
                }
            }
        }

        for (var key in liste_abonnement) {
            if (
                typeof this.listeAbonnement[liste_abonnement[key]] ==
                "undefined"
            ) {
                console.log(
                    "ERREUR(controleur: le message en émission n'existe plus, on ne peut pas l'enlever: " +
                        liste_abonnement[key]
                )
            } else {
                if (
                    typeof this.listeAbonnement[liste_abonnement[key]][
                        emetteur.nomDInstance
                    ] == "undefined"
                ) {
                    console.log(
                        "ERREUR(controleur: le message en émission  " +
                            liste_abonnement[key] +
                            " n'était pas enregistré par " +
                            emetteur.nomDInstance
                    )
                } else {
                    delete this.listeAbonnement[liste_abonnement[key]][
                        emetteur.nomDInstance
                    ]
                    if (this.verboseall || this.verbose) {
                        console.log(
                            "INFO(controleur: le message en abonnement " +
                                liste_abonnement[key] +
                                " a été enlevé de la liste pour " +
                                emetteur.nomDInstance
                        )
                    }
                }
            }
        }
    }

    /**
     * Route un message de l'émetteur vers tous les abonnés enregistrés.
     * @param {{nomDInstance: string}} emetteur - L'instance qui envoie le message
     * @param {Object} t - L'objet message (clé = nom du message, valeur = payload)
     */
    envoie(emetteur, t) {
        if (this.verboseall || this.verbose) {
            console.log(
                "INFO (controleur):le controleur a reçu de " +
                    emetteur.nomDInstance +
                    " :"
            )
            console.log(t)
        }
        for (var item in t) {
            if (item != "id") {
                if (typeof this.listeEmission[item] == "undefined") {
                    console.log(
                        "ERREUR (controleur): Le message " +
                            item +
                            " envoyé par " +
                            emetteur.nomDInstance +
                            " n'est pas enregistré par le contrôleur"
                    )
                    return
                }
                if (
                    typeof this.listeEmission[item][emetteur.nomDInstance] ==
                    "undefined"
                ) {
                    console.log(
                        "ERREUR (controleur): Le message " +
                            item +
                            " envoyé par " +
                            emetteur.nomDInstance +
                            " n'a pas déjà enregistré par "
                    )
                    return
                }
                for (var recepteurkey in this.listeAbonnement[item]) {
                    let T = new Object()
                    T[item] = t[item]
                    if (typeof t.id != "undefined") T.id = t.id
                    if (this.verboseall || this.verbose) {
                        console.log(
                            "INFO (controleur): on envoie " +
                                item +
                                " à " +
                                recepteurkey
                        )
                    }
                    this.listeAbonnement[item][recepteurkey].traitementMessage(
                        T
                    )
                }
            }
        }
    }
}

export default Controleur
