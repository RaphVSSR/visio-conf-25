"use client"

import { useState, useEffect, useCallback } from "react"
import styles from "./page.module.css"
import TeamsList from "./components/teams/TeamsList"
import ChannelView from "./components/channels/ChannelView"
import ChannelForm from "./components/channels/ChannelForm"
import TeamForm from "./components/teams/TeamForm"
import ChannelTabs from "./components/channels/ChannelTabs"
import { useChannelManager } from "./hooks/useChannelManager"
import { useTeamManager } from "./hooks/useTeamManager"
import type { Team } from "@/types/Team"
import { useAppContext } from "@/context/AppContext"

export default function EquipesPage() {
    const { controleur, canal, currentUser } = useAppContext()
    const [isLoadingTeams, setIsLoadingTeams] = useState(true)
    const [isLoadingChannels, setIsLoadingChannels] = useState(false)

    // Use the team manager hook
    const teamManager = useTeamManager({
        initialTeams: [],
        onTeamsChange: (newTeams) => {
            console.log("Teams updated:", newTeams.length)
        },
        onTeamSelected: (team) => {
            console.log("Team selected:", team?.name || "none")
            // Reset channels when team changes
            if (team) {
                loadTeamChannels(team.id)
            } else {
                channelManager.updateChannelsFromResponse([])
            }
        },
        onTeamDeleted: () => {
            // Close any open forms when a team is deleted
            channelManager.handleCancelChannelForm()
        },
    })

    // Use the channel manager hook
    const channelManager = useChannelManager({
        initialChannels: [],
        onChannelsChange: (newChannels) => {
            console.log("Channels updated:", newChannels.length)
        },
    })

    const nomDInstance = "EquipesPage"
    const verbose = false

    const listeMessageEmis = [
        "teams_list_request",
        "channels_list_request",
        "channel_members_request",
    ]
    const listeMessageRecus = [
        "teams_list_response",
        "channels_list_response",
        "channel_members_response",
    ]

    // WebSocket message handler
    const handleWebSocketMessage = useCallback(
        (msg: any) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.teams_list_response) {
                if (msg.teams_list_response.etat) {
                    const teamsFromResponse =
                        msg.teams_list_response.teams || []
                    teamManager.updateTeamsFromResponse(teamsFromResponse)
                    setIsLoadingTeams(false)
                } else {
                    console.error(
                        "Erreur lors de la récupération des équipes:",
                        msg.teams_list_response.error
                    )
                    setIsLoadingTeams(false)
                }
            }

            if (msg.channels_list_response) {
                if (msg.channels_list_response.etat) {
                    const channelsFromResponse =
                        msg.channels_list_response.channels || []
                    channelManager.updateChannelsFromResponse(
                        channelsFromResponse
                    )
                    setIsLoadingChannels(false)
                } else {
                    console.error(
                        "Erreur lors de la récupération des canaux:",
                        msg.channels_list_response.error
                    )
                    setIsLoadingChannels(false)
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
        if (controleur && canal && currentUser) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            // Récupérer la liste des équipes
            const teamsRequest = { teams_list_request: {} }
            controleur.envoie(handler, teamsRequest)
        }

        return () => {
            if (controleur) {
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur, canal, currentUser])

    const loadTeamChannels = useCallback(
        (teamId: string) => {
            if (controleur && canal) {
                setIsLoadingChannels(true)
                const channelsRequest = { channels_list_request: { teamId } }
                controleur.envoie(handler, channelsRequest)
            }
        },
        [controleur, canal]
    )

    // Reload teams when a team is created/updated/deleted
    const reloadTeams = useCallback(() => {
        if (controleur && canal) {
            const teamsRequest = { teams_list_request: {} }
            controleur.envoie(handler, teamsRequest)
        }
    }, [controleur, canal])

    const handleTeamCreatedWrapper = useCallback(
        (team: any) => {
            // D'abord utiliser le gestionnaire d'équipes
            teamManager.handleTeamCreated(team)

            // Puis recharger les équipes avec un délai pour éviter les conflits
            setTimeout(() => {
                reloadTeams()
            }, 100)
        },
        [teamManager, reloadTeams]
    )

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <TeamsList
                    teams={teamManager.teams}
                    selectedTeam={teamManager.selectedTeam}
                    onSelectTeam={teamManager.handleTeamSelect}
                    onCreateTeam={teamManager.handleCreateTeam}
                    onEditTeam={teamManager.handleEditTeam}
                    onManageMembers={teamManager.handleManageMembers}
                    isLoading={isLoadingTeams}
                />
            </div>

            <div className={styles.content}>
                {teamManager.showTeamForm ? (
                    <div className={styles.formOverlay}>
                        <TeamForm
                            onTeamCreated={handleTeamCreatedWrapper}
                            onCancel={teamManager.handleCancelTeamForm}
                            teamToEdit={teamManager.teamToEdit}
                        />
                    </div>
                ) : channelManager.showChannelForm &&
                  teamManager.selectedTeam ? (
                    <div className={styles.formOverlay}>
                        <ChannelForm
                            onChannelCreated={
                                channelManager.handleChannelCreated
                            }
                            onCancel={channelManager.handleCancelChannelForm}
                            channelToEdit={channelManager.channelToEdit}
                            team={teamManager.selectedTeam}
                        />
                    </div>
                ) : teamManager.selectedTeam ? (
                    <div className={styles.teamContent}>
                        <ChannelTabs
                            channels={channelManager.channels}
                            selectedChannel={channelManager.selectedChannel}
                            onSelectChannel={channelManager.handleChannelSelect}
                            onCreateChannel={channelManager.handleCreateChannel}
                            onChannelDeleted={
                                channelManager.handleChannelDeleted
                            }
                        />{" "}
                        {channelManager.selectedChannel ? (
                            <ChannelView
                                channel={channelManager.selectedChannel}
                                userId={currentUser?._id || ""}
                                onEditChannel={() =>
                                    channelManager.handleEditChannel()
                                }
                                onChannelDeleted={() =>
                                    channelManager.selectedChannel?.id &&
                                    channelManager.handleChannelDeleted(
                                        channelManager.selectedChannel.id
                                    )
                                }
                            />
                        ) : (
                            <div className={styles.emptyChannelState}>
                                <h3>Sélectionnez un canal</h3>
                                <p>
                                    Choisissez un canal dans la liste ci-dessus
                                    ou créez-en un nouveau
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h2>Bienvenue dans les équipes</h2>
                        <p>
                            Sélectionnez une équipe ou créez-en une nouvelle
                            pour commencer
                        </p>
                        <button
                            className={styles.createTeamButton}
                            onClick={teamManager.handleCreateTeam}
                        >
                            Créer une équipe
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
