import { useEffect, useRef, useState } from "react"
import { useAuth } from "hooks/useAuth"
import { Team, initialTeamState } from "services/team/Team"
import { Channel, initialChannelState } from "services/channel/Channel"
import type { TeamState } from "services/team/Team.types"
import type { ChannelState } from "services/channel/Channel.types"
import {
	TeamsSidebar,
	ChannelTabs,
	ChannelView,
	ChannelForm,
	TeamForm,
} from "components"
import "./TeamsPage.scss"

export const TeamsPage = () => {

	const { user } = useAuth()
	const [teamState, setTeamState] = useState<TeamState>(initialTeamState)
	const [channelState, setChannelState] = useState<ChannelState>(initialChannelState)
	const teamRef = useRef<Team | null>(null)
	const channelRef = useRef<Channel | null>(null)

	useEffect(() => {
		const team = new Team(setTeamState)
		const channel = new Channel(setChannelState)
		teamRef.current = team
		channelRef.current = channel
		return () => {
			team.destroy()
			channel.destroy()
			teamRef.current = null
			channelRef.current = null
		}
	}, [])

	useEffect(() => {
		const channel = channelRef.current
		if (!channel) return
		if (teamState.selectedTeam) channel.loadChannels(teamState.selectedTeam.id)
		else channel.clearChannels()
	}, [teamState.selectedTeam?.id])

	const showTeamForm = teamState.teamFormMode !== null
	const showChannelForm = channelState.channelFormMode !== null
	const editingTeam = teamState.teamFormMode === "edit" ? teamState.selectedTeam : null

	return (
		<div className="teams-page">
			<div className="teams-page__sidebar">
				<TeamsSidebar
					teams={teamState.teams}
					selectedTeam={teamState.selectedTeam}
					onSelectTeam={(team) => teamRef.current?.selectTeam(team)}
					onCreateTeam={() => teamRef.current?.openCreateForm()}
					onEditTeam={(team) => teamRef.current?.openEditForm(team)}
					isLoading={teamState.isLoadingTeams}
				/>
			</div>

			<div className="teams-page__content">
				{showTeamForm ? (
					<div className="teams-page__form-overlay">
						<TeamForm
							user={user}
							state={teamState}
							teamToEdit={editingTeam}
							onLoadUsers={() => teamRef.current?.loadUsers()}
							onLoadMembers={(teamId) => teamRef.current?.loadMembers(teamId)}
							onCreate={(data) => teamRef.current?.createTeam(data)}
							onUpdate={(data) => teamRef.current?.updateTeam(data)}
							onDelete={(teamId) => teamRef.current?.deleteTeam(teamId)}
							onAddMember={(teamId, userId) => teamRef.current?.addMember(teamId, userId)}
							onRemoveMember={(teamId, userId) => teamRef.current?.removeMember(teamId, userId)}
							onClose={() => teamRef.current?.closeForm()}
						/>
					</div>
				) : showChannelForm && teamState.selectedTeam ? (
					<div className="teams-page__form-overlay">
						<ChannelForm
							user={user}
							teamState={teamState}
							channelState={channelState}
							targetTeam={teamState.selectedTeam}
							channelToEdit={channelState.channelFormMode === "edit" ? channelState.selectedChannel : null}
							onLoadTeamMembers={(teamId) => teamRef.current?.loadMembers(teamId)}
							onLoadChannelMembers={(channelId) => channelRef.current?.loadMembers(channelId)}
							onCreate={(data) => channelRef.current?.createChannel(data)}
							onUpdate={(data) => channelRef.current?.updateChannel(data)}
							onDelete={(channelId) => channelRef.current?.deleteChannel(channelId)}
							onClose={() => channelRef.current?.closeForm()}
						/>
					</div>
				) : teamState.selectedTeam ? (
					<div className="teams-page__team-content">
						<ChannelTabs
							channels={channelState.channels}
							selectedChannel={channelState.selectedChannel}
							onSelectChannel={(channel) => channelRef.current?.selectChannel(channel)}
							onCreateChannel={() => channelRef.current?.openCreateForm()}
						/>
						{channelState.selectedChannel ? (
							<ChannelView
								state={channelState}
								selected={channelState.selectedChannel}
								userId={user?._id || ""}
								onOpenEdit={(channel) => channelRef.current?.openEditForm(channel)}
								onPublishPost={(channelId, content) => channelRef.current?.publishPost(channelId, content)}
								onAnswerPost={(postId, content) => channelRef.current?.answerPost(postId, content)}
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
						<button className="teams-page__create-button" onClick={() => teamRef.current?.openCreateForm()}>
							Créer une équipe
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
