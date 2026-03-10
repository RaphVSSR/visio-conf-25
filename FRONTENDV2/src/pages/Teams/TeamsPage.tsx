
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "hooks/useAuth"
import { useTeamManager } from "hooks/useTeamManager"
import { useChannelManager } from "hooks/useChannelManager"
import { TeamsSidebar } from "components/TeamsSidebar/TeamsSidebar"
import { ChannelTabs } from "components/ChannelTabs/ChannelTabs"
import ChannelView from "components/ChannelView/ChannelView"
import ChannelForm from "components/ChannelForm/ChannelForm"
import TeamForm from "components/TeamForm/TeamForm"
import "./TeamsPage.scss"

export const TeamsPage = () => {
	const { user, controleur } = useAuth()
	const [isLoadingTeams, setIsLoadingTeams] = useState(true)
	const [isLoadingChannels, setIsLoadingChannels] = useState(false)

	const teamManager = useTeamManager({
		initialTeams: [],
		onTeamSelected: (team) => {
			if (team) {
				loadTeamChannels(team.id)
			} else {
				channelManager.clearChannels()
			}
		},
		onTeamDeleted: () => {
			channelManager.handleCancelChannelForm()
		},
	})

	const channelManager = useChannelManager({
		initialChannels: [],
	})

	const nomDInstance = "TeamsPage"

	const listeMessageEmis = [
		"teams_list_request",
		"get_channels",
	]
	const listeMessageRecus = [
		"teams_list_response",
		"channels",
		"channel_creating_status",
		"channel_updating_status",
		"channel_deleting_status",
	]

	const handleWebSocketMessage = useCallback(
		(msg: any) => {
			if (msg.teams_list_response) {
				if (msg.teams_list_response.etat) {
					teamManager.updateTeamsFromResponse(msg.teams_list_response.teams || [])
				}
				setIsLoadingTeams(false)
			}

			if (msg.channels) {
				if (msg.channels.etat) {
					channelManager.updateChannelsFromResponse(msg.channels.channels || [])
				}
				setIsLoadingChannels(false)
			}

			if (msg.channel_creating_status || msg.channel_updating_status || msg.channel_deleting_status) {
				if (teamManager.selectedTeam && controleur) {
					controleur.envoie(handler, { get_channels: { teamId: teamManager.selectedTeam.id } })
				}
			}
		},
		[teamManager, channelManager]
	)

	const handler = {
		nomDInstance,
		traitementMessage: handleWebSocketMessage,
	}

	useEffect(() => {
		if (controleur && user) {
			controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
			controleur.envoie(handler, { teams_list_request: {} })
		}

		return () => {
			if (controleur) {
				controleur.desincription(handler, listeMessageEmis, listeMessageRecus)
			}
		}
	}, [controleur, user])

	const loadTeamChannels = useCallback(
		(teamId: string) => {
			if (controleur) {
				setIsLoadingChannels(true)
				controleur.envoie(handler, { get_channels: { teamId } })
			}
		},
		[controleur]
	)

	const reloadTeams = useCallback(() => {
		if (controleur) {
			controleur.envoie(handler, { teams_list_request: {} })
		}
	}, [controleur])

	const handleTeamCreatedWrapper = useCallback(
		(team: any) => {
			teamManager.handleTeamCreated(team)
			setTimeout(() => reloadTeams(), 100)
		},
		[teamManager, reloadTeams]
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
