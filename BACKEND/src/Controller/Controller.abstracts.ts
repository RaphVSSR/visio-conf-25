
export type ControllerMessage = { id: string } & Record<string, unknown>

export type Controller = {
	verboseall: boolean,
	inscription: (binder: ControllerBinder, emitted: string[], received: string[]) => void,
	desincription: (binder: ControllerBinder, emitted: string[], received: string[]) => void,
	envoie: (binder: ControllerBinder, message: Record<string, unknown>) => void,
}

export abstract class ControllerBinder {

	readonly nomDInstance: string
	protected readonly controleur: Controller
	readonly messagesEmitted: string[]
	readonly messagesReceived: string[]

	abstract traitementMessage(mesg: ControllerMessage): void

	constructor(nomDInstance: string, controleur: Controller, messagesEmitted: string[], messagesReceived: string[]) {
		this.nomDInstance = nomDInstance
		this.controleur = controleur
		this.messagesEmitted = messagesEmitted
		this.messagesReceived = messagesReceived
		controleur.inscription(this, this.messagesEmitted, this.messagesReceived)
	}
}

export class ControllerManager {

	private static instance: Controller | null = null

	static async createController() {

		if (this.instance) return

		if (process.env.VERBOSE === "true") console.group("⚙️ Processing Controller..")

		const { default: ControllerMessageBus } = await import("./controleur.js")
		const { default: CanalSocketio } = await import("../canalsocketio.js")
		const { default: SocketIO } = await import("../models/services/SocketIO.ts")

		const controleur = new ControllerMessageBus()
		controleur.verboseall = process.env.VERBOSE === "true" && Number(process.env.VERBOSE_LVL) >= 3

		new CanalSocketio(SocketIO.server, controleur, "canalsocketio")

		this.instance = controleur

		if (process.env.VERBOSE === "true") console.log("✅ Controller created")
	}

	static async registerServices() {

		const { default: AuthService } = await import("../models/services/authentication/AuthService.ts")
		const { default: ChannelService } = await import("../models/services/ChannelService.ts")
		const { default: TeamService } = await import("../models/services/TeamService.ts")
		const { default: UserService } = await import("../models/services/UserService.ts")

		const controller = this.getController();

		new AuthService("AuthService", controller,
			["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
				"registration_success", "registration_failure", "user_disconnect_success",
				"session_refreshed", "session_expired",
				"session_pending", "session_pending_accepted", "session_pending_rejected"],
			["authenticate", "login", "register", "user_disconnect", "session_refresh",
				"session_pending_choice", "client_deconnexion"]
		)

		new ChannelService("ChannelService", controller,
			["channels", "channel", "channel_creating_status", "channel_updating_status", "channel_deleting_status",
				"channel_members", "channel_member_adding_status", "channel_member_removing_status", "channel_leaving_status",
				"posts", "user_post", "post_publishing_status", "post_updating_status", "post_deleting_status", "post_answering_status"],
			["get_channels", "get_channel", "create_channel", "update_channel", "delete_channel",
				"get_channel_members", "add_channel_member", "remove_channel_member", "leave_channel",
				"get_posts", "get_user_post", "publish_post", "update_post", "delete_post", "answer_post"]
		)

		new UserService("UserService", controller,
			["users_list_response", "user_info_response", "users_search_response",
				"update_user_response", "update_user_status_response", "update_user_roles_response"],
			["users_list_request", "user_info_request", "users_search_request",
				"update_user_request", "update_user_status_request", "update_user_roles_request"]
		)

		new TeamService("TeamService", controller,
			["teams_list_response", "all_teams_response",
				"team_create_response", "team_update_response", "team_delete_response", "team_leave_response",
				"team_members_response", "team_add_member_response", "team_remove_member_response"],
			["teams_list_request", "all_teams_request",
				"team_create_request", "team_update_request", "team_delete_request", "team_leave_request",
				"team_members_request", "team_add_member_request", "team_remove_member_request"]
		)

		if (process.env.VERBOSE === "true") {
			console.log("✅ Services registered")
			console.groupEnd()
		}
	}

	static getController(): Controller {

		if (!this.instance) throw new Error("Controller not created yet — call ControllerManager.createController() first")
		return this.instance
	}
}
