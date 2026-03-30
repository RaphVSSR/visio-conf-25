import { useState, useCallback } from "react"
import type { Channel } from "pages/Teams/Teams.types"

type ChannelFormMode = "create" | "edit" | null

interface UseChannelManagerReturn {
	channels: Channel[]
	selectedChannel: Channel | null
	channelFormMode: ChannelFormMode
	handleChannelSelect: (channel: Channel) => void
	handleCreateChannel: () => void
	handleEditChannel: (channel: Channel) => void
	handleChannelCreated: (channel: Channel) => void
	handleChannelUpdated: (channel: Channel) => void
	handleChannelDeleted: (channelId: string) => void
	handleCancelChannelForm: () => void
	updateChannelsFromResponse: (channels: Channel[]) => void
	selectFirstAvailableChannel: () => void
	clearChannels: () => void
}

export function useChannelManager(): UseChannelManagerReturn {

	const [channels, setChannels] = useState<Channel[]>([])
	const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
	const [channelFormMode, setChannelFormMode] = useState<ChannelFormMode>(null)

	const handleChannelSelect = useCallback((channel: Channel) => {
		setSelectedChannel(channel)
		setChannelFormMode(null)
	}, [])

	const handleCreateChannel = useCallback(() => {
		setChannelFormMode("create")
	}, [])

	const handleEditChannel = useCallback((channel: Channel) => {
		setSelectedChannel(channel)
		setChannelFormMode("edit")
	}, [])

	const handleChannelCreated = useCallback((channel: Channel) => {
		setChannels(previous => [...previous, channel])
		setSelectedChannel(channel)
		setChannelFormMode(null)
	}, [])

	const handleChannelUpdated = useCallback((channel: Channel) => {
		setChannels(previous =>
			previous.map(existing =>
				existing.id === channel.id ? channel : existing
			)
		)
		setSelectedChannel(current =>
			current?.id === channel.id ? channel : current
		)
		setChannelFormMode(null)
	}, [])

	const handleChannelDeleted = useCallback((channelId: string) => {
		setChannels(previous => previous.filter(channel => channel.id !== channelId))
		setSelectedChannel(current => {
			if (current?.id === channelId) return null
			return current
		})
		setChannelFormMode(null)
	}, [])

	const handleCancelChannelForm = useCallback(() => {
		setChannelFormMode(null)
	}, [])

	const updateChannelsFromResponse = useCallback((receivedChannels: Channel[]) => {
		setChannels(receivedChannels)
		setSelectedChannel(current => {
			if (!current) return null
			return receivedChannels.find(channel => channel.id === current.id) ?? null
		})
	}, [])

	const selectFirstAvailableChannel = useCallback(() => {
		setChannels(current => {
			setSelectedChannel(current.length > 0 ? current[0]! : null)
			return current
		})
	}, [])

	const clearChannels = useCallback(() => {
		setChannels([])
		setSelectedChannel(null)
		setChannelFormMode(null)
	}, [])

	return {
		channels,
		selectedChannel,
		channelFormMode,
		handleChannelSelect,
		handleCreateChannel,
		handleEditChannel,
		handleChannelCreated,
		handleChannelUpdated,
		handleChannelDeleted,
		handleCancelChannelForm,
		updateChannelsFromResponse,
		selectFirstAvailableChannel,
		clearChannels,
	}
}
