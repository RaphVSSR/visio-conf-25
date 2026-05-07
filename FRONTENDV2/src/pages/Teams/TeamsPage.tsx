
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

	const teamManager = useTeamManager()
	const channelManager = useChannelManager()

	const selectedTeamRef = useRef(teamManager.selectedTeam)
	const updateTeamsRef = useRef(teamManager.updateTeamsFromResponse)
	const updateChannelsRef = useRef(channelManager.updateChannelsFromResponse)
	const clearChannelsRef = useRef(channelManager.clearChannels)
	const socketRef = useRef(socket)

	useEffect(() => { selectedTeamRef.current = teamManager.selectedTeam }, [teamManager.selectedTeam])
	useEffect(() => { updateTeamsRef.current = teamManager.updateTeamsFromResponse }, [teamManager.updateTeamsFromResponse])
	useEffect(() => { updateChannelsRef.current = channelManager.updateChannelsFromResponse }, [channelManager.updateChannelsFromResponse])
	useEffect(() => { clearChannelsRef.current = channelManager.clearChannels }, [channelManager.clearChannels])
	useEffect(() => { socketRef.current = socket }, [socket])

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
			clearChannelsRef.current()
		}
	}, [socket, teamManager.selectedTeam?.id])

	useEffect(() => {
		if (!socket || !user) return

		const handleTeamQueryResponse = (data: any) => {
			if (data.type !== "list") return
			if (data.etat) updateTeamsRef.current(data.teams || [])
			setIsLoadingTeams(false)
		}

		const handleChannelQueryResponse = (data: any) => {
			if (data.type !== "list") return
			if (data.etat) updateChannelsRef.current(data.channels || [])
			setIsLoadingChannels(false)
		}

		const handleChannelActionResponse = (data: any) => {
			if (data.type !== "create" && data.type !== "update" && data.type !== "delete") return
			const team = selectedTeamRef.current
			const sock = socketRef.current
			if (team && sock) sock.send("channel_get", { type: "list", teamId: team.id })
		}

		const handleTeamActionResponse = (data: any) => {
			if (!data.etat) return
			if (data.type !== "create" && data.type !== "update" && data.type !== "delete" && data.type !== "leave") return
			socketRef.current?.send("team_get", { type: "list" })
		}

		const handleTeamMemberBroadcast = (data: any) => {
			if (!data.etat) return
			if (data.type !== "add" && data.type !== "remove") return
			socketRef.current?.send("team_get", { type: "list" })
		}

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
	}, [socket, user?._id])

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
