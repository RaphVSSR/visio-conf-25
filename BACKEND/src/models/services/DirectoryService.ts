import { ControllerService } from "../../Controller/Controller.service.ts";
import { Controller, ControllerMessage } from "../../Controller/Controller.types.ts";
import User from "../User.ts";

/**
 * Service : DirectoryService
 * Description : Gère la récupération de la liste complète des membres depuis MongoDB.
 */
export default class DirectoryService extends ControllerService {
    io: any;

    constructor(controleur: Controller, io: any, nom?: string) {
        super(
            controleur, 
            nom || 'DirectoryService', 
            ['directory'], // messagesEmitted
            ['get_directory'] // messagesReceived
        );
        this.io = io;
        console.log(`[${this.nomDInstance}] Service enregistré`);
    }

    /**
     * Point d'entrée pour les messages reçus via Socket.io
     */
    async traitementMessage(mesg: ControllerMessage) {
        const socketId = mesg.id;

        if (mesg.get_directory) {
            await this.handleGetDirectory(socketId!);
        }
    }

    /**
     * Interroge la collection Users de MongoDB pour récupérer la liste complète des membres
     * (excluant les informations sensibles comme les mots de passe).
     */
    async handleGetDirectory(socketId: string) {
        try {
            // Sélection des champs nécessaires, exclusion du mot de passe
            const users = await User.model.find({}, 'firstname lastname email is_online disturb_status roles phone')
                .populate('roles');
            
            // Envoi de la réponse au client demandeur
            this.controleur.envoie(this, {
                directory: { 
                    success: true, 
                    users: users 
                },
                id: [socketId]
            });
        } catch (e) {
            console.error('Erreur Get Directory:', e);
            this.controleur.envoie(this, {
                directory: { 
                    success: false, 
                    error: 'Erreur lors de la récupération de l\'annuaire' 
                },
                id: [socketId]
            });
        }
    }
}
