
import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "hooks/useAuth"
import { useTeamManager } from "hooks/useTeamManager"
import { useChannelManager } from "hooks/useChannelManager"
import { 
	TeamsSidebar, 
	ChannelTabs, 
	ChannelView, 
	ChannelForm, 
	TeamForm 
} from "components"
import "./TeamsPage.scss"

export const TeamsPage = () => {
	const { user, socket } = useAuth()
	const [isLoadingTeams, setIsLoadingTeams] = useState(true)
	const [isLoadingChannels, setIsLoadingChannels] = useState(false)
	const selectedTeamIdRef = useRef<string | null>(null)

	const teamManager = useTeamManager()
	const channelManager = useChannelManager()

	const { updateTeamsFromResponse } = teamManager
	const { updateChannelsFromResponse } = channelManager

	useEffect(() => {
		selectedTeamIdRef.current = teamManager.selectedTeam?.id ?? null
	}, [teamManager.selectedTeam?.id])

	const handleTeamQueryResponse = useCallback(
		(data: any) => {
			if (data.type !== "list") return
			if (data.etat) {
				updateTeamsFromResponse(data.teams || [])
			}
			setIsLoadingTeams(false)
		},
		[updateTeamsFromResponse]
	)

	const handleChannelQueryResponse = useCallback(
		(data: any) => {
			if (data.type !== "list") return
			if (data.etat) {
				updateChannelsFromResponse(data.channels || [])
			}
			setIsLoadingChannels(false)
		},
		[updateChannelsFromResponse]
	)

	const handleChannelActionResponse = useCallback(
		(data: any) => {
			if (data.type !== "create" && data.type !== "update" && data.type !== "delete") return
			if (selectedTeamIdRef.current && socket) {
				socket.send("channel_get", { type: "list", teamId: selectedTeamIdRef.current })
			}
		},
		[socket]
	)

	const handleTeamActionResponse = useCallback(
		(data: any) => {
			if (!data.etat) return
			if (data.type !== "create" && data.type !== "update" && data.type !== "delete" && data.type !== "leave") return
			socket?.send("team_get", { type: "list" })
		},
		[socket]
	)

	const handleTeamMemberBroadcast = useCallback(
		(data: any) => {
			if (!data.etat) return
			if (data.type !== "add" && data.type !== "remove") return
			socket?.send("team_get", { type: "list" })
		},
		[socket]
	)

	useEffect(() => {
		if (!socket) return
		if (teamManager.selectedTeam) {
			setIsLoadingChannels(true)
			socket.send("channel_get", { type: "list", teamId: teamManager.selectedTeam.id })
		} else {
			channelManager.clearChannels()
		}
	}, [socket, teamManager.selectedTeam, channelManager.clearChannels])

	useEffect(() => {
		if (!socket || !user) return

		socket.on("team_get_response", handleTeamQueryResponse)
		socket.on("channel_get_response", handleChannelQueryResponse)
		socket.on("channel_action_response", handleChannelActionResponse)
		socket.on("team_action_response", handleTeamActionResponse)
		socket.on("team_member_response", handleTeamMemberBroadcast)

		socket.send("team_get", { type: "list" })

		return () => {
			socket.off("team_get_response", handleTeamQueryResponse)
			socket.off("channel_get_response", handleChannelQueryResponse)
			socket.off("channel_action_response", handleChannelActionResponse)
			socket.off("team_action_response", handleTeamActionResponse)
			socket.off("team_member_response", handleTeamMemberBroadcast)
		}
	}, [socket, user, handleTeamQueryResponse, handleChannelQueryResponse, handleChannelActionResponse, handleTeamActionResponse, handleTeamMemberBroadcast])

	const { handleTeamCreated } = teamManager

	const handleTeamCreatedWrapper = useCallback(
		(team: any) => {
			handleTeamCreated(team)
			if (socket) {
				setTimeout(() => socket.send("team_get", { type: "list" }), 100)
			}
		},
		[handleTeamCreated, socket]
	)

	const showTeamForm = teamManager.teamFormMode !== null
	const showChannelForm = channelManager.channelFormMode !== null
	const editingTeam = teamManager.teamFormMode === "edit" ? teamManager.selectedTeam : null

	return (
		<div className="teams-page">
			<div className="teams-page__sidebar">
				<TeamsSidebar
					teams={teamManager.teams}
					selectedTeam={teamManager.selectedTeam}
					onSelectTeam={teamManager.handleTeamSelect}
					onCreateTeam={teamManager.handleCreateTeam}
					onEditTeam={teamManager.handleEditTeam}
					isLoading={isLoadingTeams}
				/>
			</div>

			<div className="teams-page__content">
				{showTeamForm ? (
					<div className="teams-page__form-overlay">
						<TeamForm
							onTeamCreated={handleTeamCreatedWrapper}
							onCancel={teamManager.handleCancelTeamForm}
							teamToEdit={editingTeam}
						/>
					</div>
				) : showChannelForm && teamManager.selectedTeam ? (
					<div className="teams-page__form-overlay">
						<ChannelForm
							onChannelCreated={channelManager.handleChannelCreated}
							onCancel={channelManager.handleCancelChannelForm}
							channelToEdit={channelManager.channelFormMode === "edit" ? channelManager.selectedChannel : null}
							team={teamManager.selectedTeam}
						/>
					</div>
				) : teamManager.selectedTeam ? (
					<div className="teams-page__team-content">
						<ChannelTabs
							channels={channelManager.channels}
							selectedChannel={channelManager.selectedChannel}
							onSelectChannel={channelManager.handleChannelSelect}
							onCreateChannel={channelManager.handleCreateChannel}
						/>
						{channelManager.selectedChannel ? (
							<ChannelView
								channel={channelManager.selectedChannel}
								userId={user?._id || ""}
								onEditChannel={() => channelManager.handleEditChannel(channelManager.selectedChannel!)}
								onChannelDeleted={() =>
									channelManager.selectedChannel?.id &&
									channelManager.handleChannelDeleted(channelManager.selectedChannel.id)
								}
							/>
						) : (
							<div className="teams-page__empty-channel">
								<h3>Sélectionnez un canal</h3>
								<p>Choisissez un canal dans la liste ci-dessus ou créez-en un nouveau</p>
							</div>
						)}
					</div>
				) : (
					<div className="teams-page__empty-state">
						<h2>Bienvenue dans les équipes</h2>
						<p>Sélectionnez une équipe ou créez-en une nouvelle pour commencer</p>
						<button className="teams-page__create-button" onClick={teamManager.handleCreateTeam}>
							Créer une équipe
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
