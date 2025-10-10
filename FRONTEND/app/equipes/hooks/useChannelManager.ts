import { useState, useCallback } from "react"
import type { Channel } from "@/types/Channel"
import type { Team } from "@/types/Team"

interface UseChannelManagerProps {
    initialChannels: Channel[]
    onChannelsChange?: (channels: Channel[]) => void
}

interface UseChannelManagerReturn {
    channels: Channel[]
    selectedChannel: Channel | null
    showChannelForm: boolean
    channelToEdit: Channel | null

    // Channel management functions
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>
    setSelectedChannel: (channel: Channel | null) => void
    handleChannelSelect: (channel: Channel) => void
    handleCreateChannel: () => void
    handleEditChannel: (channel?: Channel) => void
    handleChannelCreated: (channel: any) => void
    handleChannelDeleted: (deletedChannelId: string) => void
    handleCancelChannelForm: () => void

    // Auto-selection functions
    selectFirstAvailableChannel: () => void
    updateChannelsFromResponse: (channelsFromResponse: Channel[]) => void
}

export const useChannelManager = ({
    initialChannels,
    onChannelsChange,
}: UseChannelManagerProps): UseChannelManagerReturn => {
    const [channels, setChannels] = useState<Channel[]>(initialChannels)
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(
        initialChannels.length > 0 ? initialChannels[0] : null
    )
    const [showChannelForm, setShowChannelForm] = useState(false)
    const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null)

    // Update channels and notify parent component
    const updateChannels = useCallback(
        (newChannels: Channel[]) => {
            setChannels(newChannels)
            onChannelsChange?.(newChannels)
        },
        [onChannelsChange]
    )

    // Handle channel selection
    const handleChannelSelect = useCallback((channel: Channel) => {
        setSelectedChannel(channel)
        setShowChannelForm(false)
    }, [])

    // Handle creating a new channel
    const handleCreateChannel = useCallback(() => {
        setChannelToEdit(null)
        setShowChannelForm(true)
    }, [])

    // Handle editing a channel
    const handleEditChannel = useCallback(
        (channel?: Channel) => {
            const channelToEditValue = channel || selectedChannel
            if (channelToEditValue) {
                setChannelToEdit(channelToEditValue)
                setShowChannelForm(true)
            }
        },
        [selectedChannel]
    )

    // Handle channel creation/update response
    const handleChannelCreated = useCallback(
        (channel: any) => {
            if (channel.deleted) {
                handleChannelDeleted(channel.id)
                return
            }

            setChannels((prevChannels) => {
                const existingIndex = prevChannels.findIndex(
                    (c) => c.id === channel.id
                )
                const newChannels =
                    existingIndex >= 0
                        ? prevChannels.map((c, i) =>
                              i === existingIndex ? channel : c
                          )
                        : [...prevChannels, channel]

                onChannelsChange?.(newChannels)
                return newChannels
            })

            // Toujours sélectionner le canal créé/modifié
            setSelectedChannel(channel)
            setShowChannelForm(false)
            setChannelToEdit(null)
        },
        [onChannelsChange]
    )

    // Handle channel deletion
    const handleChannelDeleted = useCallback(
        (deletedChannelId: string) => {
            setChannels((prevChannels) => {
                const updatedChannels = prevChannels.filter(
                    (c) => c.id !== deletedChannelId
                )

                // Auto-select another channel if deleted one was selected
                if (selectedChannel?.id === deletedChannelId) {
                    setSelectedChannel(
                        updatedChannels.length > 0 ? updatedChannels[0] : null
                    )
                }

                onChannelsChange?.(updatedChannels)
                return updatedChannels
            })

            // Toujours fermer le formulaire après suppression
            setShowChannelForm(false)
            setChannelToEdit(null)
        },
        [selectedChannel, onChannelsChange]
    )

    // Handle canceling channel form
    const handleCancelChannelForm = useCallback(() => {
        // Toujours fermer le formulaire lors de l'annulation
        setShowChannelForm(false)
        setChannelToEdit(null)
    }, [])

    // Select first available channel
    const selectFirstAvailableChannel = useCallback(() => {
        if (channels.length > 0 && !selectedChannel) {
            setSelectedChannel(channels[0])
        }
    }, [channels, selectedChannel])

    // Update channels from external response
    const updateChannelsFromResponse = useCallback(
        (channelsFromResponse: Channel[]) => {
            updateChannels(channelsFromResponse)

            // Auto-select first channel if none is selected
            if (!selectedChannel && channelsFromResponse.length > 0) {
                setSelectedChannel(channelsFromResponse[0])
            }
        },
        [selectedChannel, updateChannels]
    )

    return {
        channels,
        selectedChannel,
        showChannelForm,
        channelToEdit,

        // Functions
        setChannels,
        setSelectedChannel,
        handleChannelSelect,
        handleCreateChannel,
        handleEditChannel,
        handleChannelCreated,
        handleChannelDeleted,
        handleCancelChannelForm,
        selectFirstAvailableChannel,
        updateChannelsFromResponse,
    }
}

export default useChannelManager
