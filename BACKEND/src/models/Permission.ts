import mongoose, { Model, Schema, Types } from "mongoose";
import TracedError from "./core/TracedError.ts";
import { model } from "mongoose";
import Collection from "./core/Collection.ts";

const { models } = mongoose;

export type PermType = {

    _id?: Types.ObjectId,
    uuid: string,
    label: string,
    desc?: string,
    default: boolean,

}

export default class Permission extends Collection {

    protected static schema = new Schema<PermType>({

        uuid: {
            type: String,
            required: true,
            description: "Message identifier",
        },
        label: {
            type: String,
            required: true,
            description: "Name of the permission",
        },
        desc: {
            type: String,
            description: "Permission's description",
        },
        default: {
            type: Boolean,
            required: true,
            description: "Does this permission needs to be by default affected ?",
        },

    });
    
    static model: Model<PermType> = models.Permission || model<PermType>("Permission", this.schema);

    modelInstance;

    constructor(dataToConstruct: PermType){

        super();
        this.modelInstance = new Permission.model(dataToConstruct);

    }

    static async inject(){

        [
            {
                uuid: "naviguer_vers",
                label: "Naviguer vers",
                default: true,
            },
            {
                uuid: "admin_demande_liste_utilisateurs",
                label: "Lister les utilisateurs",
                default: false,
            },
            {
                uuid: "admin_ajouter_utilisateur",
                label: "Ajouter un utilisateur",
                default: false,
            },
            {
                uuid: "admin_desactiver_utilisateur",
                label: "Désactive un utilisateur",
                default: false,
            },
            {
                uuid: "admin_demande_utilisateur_details",
                label: "Détails de l'utilisateur",
                default: false,
            },
            {
                uuid: "admin_supprimer_utilisateur",
                label: "Supprimer un utilisateur",
                default: false,
            },
            {
                uuid: "admin_modifier_utilisateur",
                label: "Modifier un utilisateur",
                default: false,
            },
            {
                uuid: "admin_demande_liste_roles",
                label: "Lister les rôles",
                default: false,
            },
            {
                uuid: "admin_modifier_role",
                label: "Modifier un rôle",
                default: false,
            },
            {
                uuid: "admin_supprimer_role",
                label: "Supprimer un rôle",
                default: false,
            },
            {
                uuid: "admin_demande_liste_permissions",
                label: "Lister les permissions",
                default: false,
            },
            {
                uuid: "admin_ajouter_permission",
                label: "Créer les permissions",
                default: false,
            },
            {
                uuid: "admin_modifier_permission",
                label: "Modifier les permissions",
                default: false,
            },
            {
                uuid: "admin_demande_liste_equipes",
                label: "Lister les équipes",
                default: false,
            },
            {
                uuid: "admin_ajouter_equipe",
                label: "Créer les équipes",
                default: false,
            },
            {
                uuid: "admin_modifier_equipe",
                label: "Modifier les équipes",
                default: false,
            },
            {
                uuid: "admin_supprimer_equipe",
                label: "Supprimer les équipes",
                default: false,
            },
            {
                uuid: "admin_ajouter_role",
                label: "Ajouter un rôle",
                default: false,
            },
            {
                uuid: "admin_dupliquer_role",
                label: "Dupliquer un rôle",
                default: false,
            },
            {
                uuid: "admin_demande_role_details",
                label: "Détails du rôle",
                default: false,
            },
            {
                uuid: "demande_liste_utilisateurs",
                label: "Lister les utilisateurs",
                default: false,
            },
            { 
                uuid: "demande_annuaire", 
                label: "Annuaire",
                default: false,
             },
            {
                uuid: "demande_info_utilisateur",
                label: "Information sur un utilisateur",
                default: false,
            },
            {
                uuid: "envoie_message",
                label: "Envoyer un message",
                default: false,
            },
            {
                uuid: "demande_liste_discussions",
                label: "Lister les discussions",
                default: false,
            },
            {
                uuid: "demande_historique_discussion",
                label: "Historique des discussions",
                default: false,
            },
            {
                uuid: "demande_notifications",
                label: "Notifications",
                default: false,
            },
            {
                uuid: "demande_changement_status",
                label: "Changement de status",
                default: false,
            },
            {
                uuid: "update_notifications",
                label: "Mise à jour des notifications",
                default: false,
            },
            {
                uuid: "update_profil",
                label: "Mise à jour du profil",
                default: false,
            },
            {
                uuid: "update_picture",
                label: "Mise à jour de la photo de profil",
                default: false,
            },
            {
                uuid: "demande_creation_discussion",
                label: "Création d'une discussion",
                default: false,
            },
            {
                uuid: "demande_discussion_info",
                label: "Information sur une discussion",
                default: false,
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

        ].forEach(perm => {

            const newPerm = new Permission(perm);
            newPerm.save();
        })
    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async getPerm(label: string) {

        return this.model.findOne({label: label});
    }

    static async getPerms(labels: string[]) {

        return this.model.find({ label: {$in: labels}});
    }

    static async updatePerm(label: string, newData: Partial<PermType>) {

        return this.model.updateOne({email: label}, { $set: newData });
    }

    static async updatePerms(labels: string[], newData: Partial<PermType>) {

        return this.model.updateMany({ email: {$in: labels}}, { $set: newData });
    }

    static async deletePerm(label: string) {

        return this.model.deleteOne({label: label});
    }

    static async deletePerms(labels: string[]) {

        return this.model.deleteMany({ label: {$in: labels}});
    }

    static async flushAll() {
        
        return this.model.deleteMany({});
    }
}