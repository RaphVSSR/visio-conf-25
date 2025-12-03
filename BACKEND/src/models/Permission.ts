import mongoose, { Model, model, Schema } from "mongoose"
import Collection from "./Core/Collection.ts";
import TracedError from "./Core/TracedError.ts";

const { models } = mongoose;


export type PermsType = {

    uuid: string,
    label: string,
    default?: boolean,

}

export default class Permission extends Collection {

    protected static schema = new Schema<PermsType>({

        uuid: { 

            type: String,
            required: true
        },
        label: { 
            
            type: String,
            required: true 
        },
        default: {

            type: Boolean,
            default: false
        },
    });
    
    static model: Model<PermsType> = models.Permission || model<PermsType>("Permission", this.schema);

    modelInstance;

    constructor(dataToConstruct: PermsType){

        super();

        this.modelInstance = new Permission.model(dataToConstruct);

    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE === "true") console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        
        return this.model.deleteMany({});
    }

    static async inject(){

        if (process.env.VERBOSE === "true"){
            
            console.group("💉 Injecting Permissions..");
        }

        const permissions: PermsType[] = [
            {
                uuid: "naviguer_vers",
                label: "Naviguer vers",
                default: true,
            },
            {
                uuid: "admin_demande_liste_utilisateurs",
                label: "Lister les utilisateurs",
            },
            {
                uuid: "admin_ajouter_utilisateur",
                label: "Ajouter un utilisateur",
            },
            {
                uuid: "admin_desactiver_utilisateur",
                label: "Désactive un utilisateur",
            },
            {
                uuid: "admin_demande_utilisateur_details",
                label: "Détails de l'utilisateur",
            },
            {
                uuid: "admin_supprimer_utilisateur",
                label: "Supprimer un utilisateur",
            },
            {
                uuid: "admin_modifier_utilisateur",
                label: "Modifier un utilisateur",
            },
            {
                uuid: "admin_demande_liste_roles",
                label: "Lister les rôles",
            },
            {
                uuid: "admin_modifier_role",
                label: "Modifier un rôle",
            },
            {
                uuid: "admin_supprimer_role",
                label: "Supprimer un rôle",
            },
            {
                uuid: "admin_demande_liste_permissions",
                label: "Lister les permissions",
            },
            {
                uuid: "admin_ajouter_permission",
                label: "Créer les permissions",
            },
            {
                uuid: "admin_modifier_permission",
                label: "Modifier les permissions",
            },
            {
                uuid: "admin_demande_liste_equipes",
                label: "Lister les équipes",
            },
            {
                uuid: "admin_ajouter_equipe",
                label: "Créer les équipes",
            },
            {
                uuid: "admin_modifier_equipe",
                label: "Modifier les équipes",
            },
            {
                uuid: "admin_supprimer_equipe",
                label: "Supprimer les équipes",
            },
            {
                uuid: "admin_ajouter_role",
                label: "Ajouter un rôle",
            },
            {
                uuid: "admin_dupliquer_role",
                label: "Dupliquer un rôle",
            },
            {
                uuid: "admin_demande_role_details",
                label: "Détails du rôle",
            },
            {
                uuid: "demande_liste_utilisateurs",
                label: "Lister les utilisateurs",
            },
            { uuid: "demande_annuaire", label: "Annuaire" },
            {
                uuid: "demande_info_utilisateur",
                label: "Information sur un utilisateur",
            },
            {
                uuid: "envoie_message",
                label: "Envoyer un message",
            },
            {
                uuid: "demande_liste_discussions",
                label: "Lister les discussions",
            },
            {
                uuid: "demande_historique_discussion",
                label: "Historique des discussions",
            },
            {
                uuid: "demande_notifications",
                label: "Notifications",
            },
            {
                uuid: "demande_changement_status",
                label: "Changement de status",
            },
            {
                uuid: "update_notifications",
                label: "Mise à jour des notifications",
            },
            {
                uuid: "update_profil",
                label: "Mise à jour du profil",
            },
            {
                uuid: "update_picture",
                label: "Mise à jour de la photo de profil",
            },
            {
                uuid: "demande_creation_discussion",
                label: "Création d'une discussion",
            },
            {
                uuid: "demande_discussion_info",
                label: "Information sur une discussion",
            },
            {
                uuid: "new_call",
                label: "Nouvel appel",
                default: true,
            },
            {
                uuid: "send_ice_candidate",
                label: "Envoi de candidat ICE",
                default: true,
            },
            {
                uuid: "send_offer",
                label: "Envoi d'offre",
                default: true,
            },
            {
                uuid: "send_answer",
                label: "Envoi de réponse",
                default: true,
            },
            {
                uuid: "reject_offer",
                label: "Rejet d'offre",
                default: true,
            },
            {
                uuid: "hang_up",
                label: "Raccrocher",
                default: true,
            },
            {
                uuid: "receive_offer",
                label: "Réception d'offre",
                default: true,
            },
            {
                uuid: "receive_answer",
                label: "Réception de réponse",
                default: true,
            },
            {
                uuid: "receive_ice_candidate",
                label: "Réception de candidat ICE",
                default: true,
            },
            {
                uuid: "offer_rejected",
                label: "Offre rejetée",
                default: true,
            },
            {
                uuid: "call_created",
                label: "Appel créé",
                default: true,
            },
            {
                uuid: "hung_up",
                label: "Raccroché",
                default: true,
            },
            {
                uuid: "call_connected_users",
                label: "Utilisateurs connectés",
                default: true,
            },
        ];

        for (const perm of permissions) {

            if (!await this.model.findOne({uuid: perm.uuid})) {

                const newPerm = new Permission(perm);
                await newPerm.save();

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 New permission "${perm.label}" created`);


            }else {

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 Permission "${perm.label}" already exists`);
            }
        }

        if (process.env.VERBOSE === "true"){
                    
            console.log(`✅ ${await Permission.model.countDocuments({})} permissions created`);
            console.groupEnd();
            console.log("");
        }
    }
}