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
			"call:mute-toggle", "call:offer", "call:answer", "call:ice-candidate",
		],
		received: [
			"call:incoming", "call:user-joined", "call:user-left", "call:user-rejected",
			"call:participants-list", "call:offer", "call:answer", "call:ice-candidate",
			"call:mute-toggle", "call:ended", "call:error",
		],
	},

	contacts: {
		emitted: ["contacts:list"],
		received: ["contacts:list:response"],
	},
}

export function getMessagesByDomain(domain: string): MessageDomain {
	return MessageRegistry[domain] ?? { emitted: [], received: [] }
}

export const ListeMessagesEmis = Object.values(MessageRegistry).flatMap(domain => domain.emitted)
export const ListeMessagesRecus = Object.values(MessageRegistry).flatMap(domain => domain.received)

export default MessageRegistry
