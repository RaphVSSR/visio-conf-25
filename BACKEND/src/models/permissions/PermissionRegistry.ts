export type PermissionDefinition = {
	uuid: string
	label: string
	default: boolean
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
	{ uuid: "admin_modifier_utilisateur", label: "Modifier un utilisateur", default: false },
	{ uuid: "admin_demande_liste_roles", label: "Lister les roles", default: false },
	{ uuid: "admin_modifier_role", label: "Modifier un role", default: false },
	{ uuid: "admin_supprimer_role", label: "Supprimer un role", default: false },
	{ uuid: "admin_ajouter_role", label: "Ajouter un role", default: false },
	{ uuid: "admin_demande_role_details", label: "Details du role", default: false },
	{ uuid: "demande_liste_utilisateurs", label: "Lister les utilisateurs", default: false },
	{ uuid: "demande_annuaire", label: "Annuaire", default: false },
	{ uuid: "demande_info_utilisateur", label: "Information sur un utilisateur", default: false },
	{ uuid: "envoie_message", label: "Envoyer un message", default: false },
	{ uuid: "demande_liste_discussions", label: "Lister les discussions", default: false },
	{ uuid: "demande_historique_discussion", label: "Historique des discussions", default: false },
	{ uuid: "update_profil", label: "Mise a jour du profil", default: false },
	{ uuid: "demande_creation_discussion", label: "Creation d'une discussion", default: false },
	{ uuid: "demande_discussion_info", label: "Information sur une discussion", default: false },
	{ uuid: "new_call", label: "Nouvel appel", default: true },
	{ uuid: "send_ice_candidate", label: "Envoi de candidat ICE", default: true },
	{ uuid: "send_offer", label: "Envoi d'offre", default: true },
	{ uuid: "send_answer", label: "Envoi de reponse", default: true },
	{ uuid: "reject_offer", label: "Rejet d'offre", default: true },
	{ uuid: "hang_up", label: "Raccrocher", default: true },
	{ uuid: "receive_offer", label: "Reception d'offre", default: true },
]

export const DEPRECATED_PERMISSION_UUIDS = [
	"admin_demande_liste_permissions",
	"admin_ajouter_permission",
	"admin_modifier_permission",
	"admin_supprimer_permission",
	"admin_demande_liste_utilisateurs",
	"naviguer_vers",
	"admin_ajouter_utilisateur",
	"admin_desactiver_utilisateur",
	"admin_demande_utilisateur_details",
	"admin_supprimer_utilisateur",
	"admin_demande_liste_equipes",
	"admin_ajouter_equipe",
	"admin_modifier_equipe",
	"admin_supprimer_equipe",
	"admin_dupliquer_role",
	"demande_notifications",
	"demande_changement_status",
	"update_notifications",
	"update_picture",
	"receive_answer",
	"receive_ice_candidate",
	"offer_rejected",
	"call_created",
	"hung_up",
	"call_connected_users",
]

export const CONTROLLER_MESSAGE_PERMISSIONS: Record<string, string | ((payload: any) => string | undefined)> = {
	"contacts:list": "demande_annuaire",
	user_get: payload => {
		if (payload?.type === "list") return "demande_liste_utilisateurs"
		if (payload?.type === "info" || payload?.type === "search") return "demande_info_utilisateur"
		return undefined
	},
	user_update: payload => {
		if (payload?.type === "profile") return "update_profil"
		if (payload?.type === "status") return "admin_modifier_utilisateur"
		if (payload?.type === "roles") return "admin_modifier_utilisateur"
		return undefined
	},
	get_roles: "admin_demande_liste_roles",
	get_role: "admin_demande_role_details",
	get_permissions: "admin_demande_liste_roles",
	create_role: "admin_ajouter_role",
	update_role: "admin_modifier_role",
	delete_role: "admin_supprimer_role",
	channel_get: payload => {
		if (payload?.type === "list") return "demande_liste_discussions"
		if (payload?.type === "single") return "demande_discussion_info"
		return undefined
	},
	channel_action: payload => {
		if (payload?.type === "create") return "demande_creation_discussion"
		return undefined
	},
	channel_post: payload => {
		if (payload?.type === "list" || payload?.type === "user") return "demande_historique_discussion"
		if (["publish", "answer", "update", "delete"].includes(payload?.type)) return "envoie_message"
		return undefined
	},
	"call:initiate": "new_call",
	"call:accept": "receive_offer",
	"call:reject": "reject_offer",
	"call:offer": "send_offer",
	"call:answer": "send_answer",
	"call:ice-candidate": "send_ice_candidate",
	"call:hangup": "hang_up",
}
