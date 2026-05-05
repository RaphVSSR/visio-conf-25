type MessageDomain = { emitted: string[], received: string[] }

const MessageRegistry: Record<string, MessageDomain> = {

	socket: {
		emitted: ["socket_disconnect"],
		received: [],
	},

	auth: {
		emitted: [
			"login", "register", "authenticate",
		],
		received: [
			"login_response", "register_response", "authenticate_response",
		],
	},

	user: {
		emitted: ["user_get", "user_update"],
		received: ["user_get_response", "user_update_response"],
	},

	team: {
		emitted: ["team_get", "team_action", "team_member"],
		received: ["team_get_response", "team_action_response", "team_member_response"],
	},

	channel: {
		emitted: ["channel_get", "channel_action", "channel_member", "channel_post"],
		received: ["channel_get_response", "channel_action_response", "channel_member_response", "channel_post_response"],
	},

	call: {
		emitted: [
			"call:initiate", "call:accept", "call:reject", "call:hangup",
			"call:mute-toggle", "call:camera-toggle", "call:offer", "call:answer", "call:ice-candidate",
		],
		received: [
			"call:incoming", "call:user-joined", "call:user-left", "call:user-rejected",
			"call:participants-list", "call:offer", "call:answer", "call:ice-candidate",
			"call:mute-toggle", "call:camera-toggle", "call:ended", "call:error",
		],
	},

	contacts: {
		emitted: ["contacts:list"],
		received: ["contacts:list:response"],
	},
	chat: {
		emitted: ["chat_operation", "message_operation"],
		received: ["chat_operation_result", "message_operation_result"],
	},
	files: {
		emitted: [
			"get_files", "upload_file", "update_file", "delete_file",
			"create_space", "get_spaces", "delete_space", "rename_space",
			"resolve_path", "update_space_members"
		],
		received: [
			"files", "file_uploading_status", "file_updating_status", "file_deleting_status",
			"spaces", "space_creating_status", "space_deleting_status", "space_renaming_status",
			"resolved_path", "space_members_updating_status"
		],
	},
	directory: {
		emitted: ["get_directory"],
		received: ["directory"],
	},
	roles: {
		emitted: ["get_roles", "get_role", "create_role", "update_role", "delete_role"],
		received: ["roles", "role", "role_creating_status", "role_already_exists", "role_updating_status", "role_deleting_status"]
	},
}

export function getMessagesByDomain(domain: string): MessageDomain {
	return MessageRegistry[domain] ?? { emitted: [], received: [] }
}

export const ListeMessagesEmis = Object.values(MessageRegistry).flatMap(domain => domain.emitted)
export const ListeMessagesRecus = Object.values(MessageRegistry).flatMap(domain => domain.received)

export default MessageRegistry
