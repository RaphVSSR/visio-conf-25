import { ControllerService } from "Controller/Controller.service"
import type { Controller, ControllerMessage } from "Controller/Controller.types"
import type { Team } from "pages/Teams/Teams.types"

export interface TeamsServiceCallbacks {
	onTeamsListReceived: (teams: Team[]) => void
	onTeamsListError: (error: string) => void
	onTeamCreated: (team: Team) => void
	onTeamCreateError: (error: string) => void
	onTeamUpdated: (team: Team) => void
	onTeamUpdateError: (error: string) => void
	onTeamDeleted: () => void
	onTeamDeleteError: (error: string) => void
	onTeamMembersReceived: (members: any[]) => void
	onTeamMembersError: (error: string) => void
	onTeamMemberAdded: (userId: string) => void
	onTeamMemberAddError: (error: string, userId?: string) => void
	onTeamMemberRemoved: (userId: string) => void
	onTeamMemberRemoveError: (error: string, userId?: string) => void
	onUsersListReceived: (users: any[]) => void
	onUsersListError: (error: string) => void
}

const MESSAGES_EMITTED = [
	"teams_list_request",
	"team_create_request",
	"team_update_request",
	"team_delete_request",
	"team_members_request",
	"team_add_member_request",
	"team_remove_member_request",
	"users_list_request",
]

const MESSAGES_RECEIVED = [
	"teams_list_response",
	"team_create_response",
	"team_update_response",
	"team_delete_response",
	"team_members_response",
	"team_add_member_response",
	"team_remove_member_response",
	"users_list_response",
]

export class TeamsService extends ControllerService {

	private callbacks: TeamsServiceCallbacks

	constructor(controleur: Controller, callbacks: TeamsServiceCallbacks) {
		super(controleur, "TeamsService", MESSAGES_EMITTED, MESSAGES_RECEIVED)
		this.callbacks = callbacks
	}

	traitementMessage(mesg: ControllerMessage): void {
		const action = Object.keys(mesg)[0]

		switch (action) {
			case "teams_list_response": {
				const payload = mesg[action] as { teams?: Team[]; error?: string }
				if (payload.error) this.callbacks.onTeamsListError(payload.error)
				else this.callbacks.onTeamsListReceived(payload.teams ?? [])
				break
			}

			case "team_create_response": {
				const payload = mesg[action] as { team?: Team; error?: string }
				if (payload.error) this.callbacks.onTeamCreateError(payload.error)
				else this.callbacks.onTeamCreated(payload.team!)
				break
			}

			case "team_update_response": {
				const payload = mesg[action] as { team?: Team; error?: string }
				if (payload.error) this.callbacks.onTeamUpdateError(payload.error)
				else this.callbacks.onTeamUpdated(payload.team!)
				break
			}

			case "team_delete_response": {
				const payload = mesg[action] as { error?: string }
				if (payload.error) this.callbacks.onTeamDeleteError(payload.error)
				else this.callbacks.onTeamDeleted()
				break
			}

			case "team_members_response": {
				const payload = mesg[action] as { members?: any[]; error?: string }
				if (payload.error) this.callbacks.onTeamMembersError(payload.error)
				else this.callbacks.onTeamMembersReceived(payload.members ?? [])
				break
			}

			case "team_add_member_response": {
				const payload = mesg[action] as { userId?: string; error?: string }
				if (payload.error) this.callbacks.onTeamMemberAddError(payload.error, payload.userId)
				else this.callbacks.onTeamMemberAdded(payload.userId!)
				break
			}

			case "team_remove_member_response": {
				const payload = mesg[action] as { userId?: string; error?: string }
				if (payload.error) this.callbacks.onTeamMemberRemoveError(payload.error, payload.userId)
				else this.callbacks.onTeamMemberRemoved(payload.userId!)
				break
			}

			case "users_list_response": {
				const payload = mesg[action] as { users?: any[]; error?: string }
				if (payload.error) this.callbacks.onUsersListError(payload.error)
				else this.callbacks.onUsersListReceived(payload.users ?? [])
				break
			}
		}
	}

	requestTeamsList(): void {
		this.sendMessage({ teams_list_request: {} })
	}

	createTeam(data: { name: string; description?: string; picture?: string }): void {
		this.sendMessage({ team_create_request: data })
	}

	updateTeam(data: { id: string; name?: string; description?: string; picture?: string }): void {
		this.sendMessage({ team_update_request: data })
	}

	deleteTeam(teamId: string): void {
		this.sendMessage({ team_delete_request: { teamId } })
	}

	requestTeamMembers(teamId: string): void {
		this.sendMessage({ team_members_request: { teamId } })
	}

	addTeamMember(teamId: string, userId: string): void {
		this.sendMessage({ team_add_member_request: { teamId, userId } })
	}

	removeTeamMember(teamId: string, userId: string): void {
		this.sendMessage({ team_remove_member_request: { teamId, userId } })
	}

	requestUsersList(): void {
		this.sendMessage({ users_list_request: {} })
	}
}
