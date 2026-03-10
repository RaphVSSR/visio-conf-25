import { useState, useCallback } from "react"
import type { Channel } from "pages/Teams/Teams.types"

type ChannelFormMode = "create" | "edit" | null

interface UseChannelManagerProps {
	initialChannels: Channel[]
	onChannelsChange?: (channels: Channel[]) => void
	onChannelSelected?: (channel: Channel | null) => void
	onChannelDeleted?: () => void
}

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

export function useChannelManager({
	initialChannels,
	onChannelsChange,
	onChannelSelected,
	onChannelDeleted,
}: UseChannelManagerProps): UseChannelManagerReturn {

	const [channels, setChannels] = useState<Channel[]>(initialChannels)
	const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
	const [channelFormMode, setChannelFormMode] = useState<ChannelFormMode>(null)

	const handleChannelSelect = useCallback((channel: Channel) => {
		setSelectedChannel(channel)
		setChannelFormMode(null)
		onChannelSelected?.(channel)
	}, [onChannelSelected])

	const handleCreateChannel = useCallback(() => {
		setChannelFormMode("create")
	}, [])

	const handleEditChannel = useCallback((channel: Channel) => {
		setSelectedChannel(channel)
		setChannelFormMode("edit")
	}, [])

	const handleChannelCreated = useCallback((channel: Channel) => {
		setChannels(previous => {
			const updated = [...previous, channel]
			onChannelsChange?.(updated)
			return updated
		})
		setSelectedChannel(channel)
		setChannelFormMode(null)
		onChannelSelected?.(channel)
	}, [onChannelsChange, onChannelSelected])

	const handleChannelUpdated = useCallback((channel: Channel) => {
		setChannels(previous => {
			const updated = previous.map(existing =>
				existing.id === channel.id ? channel : existing
			)
			onChannelsChange?.(updated)
			return updated
		})
		setSelectedChannel(current =>
			current?.id === channel.id ? channel : current
		)
		setChannelFormMode(null)
	}, [onChannelsChange])

	const handleChannelDeleted = useCallback((channelId: string) => {
		setChannels(previous => {
			const updated = previous.filter(channel => channel.id !== channelId)
			onChannelsChange?.(updated)
			return updated
		})
		setSelectedChannel(current => {
			if (current?.id === channelId) {
				onChannelSelected?.(null)
				return null
			}
			return current
		})
		setChannelFormMode(null)
		onChannelDeleted?.()
	}, [onChannelsChange, onChannelSelected, onChannelDeleted])

	const handleCancelChannelForm = useCallback(() => {
		setChannelFormMode(null)
	}, [])

	const updateChannelsFromResponse = useCallback((receivedChannels: Channel[]) => {
		setChannels(receivedChannels)
		onChannelsChange?.(receivedChannels)

		setSelectedChannel(current => {
			if (!current) return null
			const stillExists = receivedChannels.find(channel => channel.id === current.id)
			if (!stillExists) {
				onChannelSelected?.(null)
				return null
			}
			return stillExists
		})
	}, [onChannelsChange, onChannelSelected])

	const selectFirstAvailableChannel = useCallback(() => {
		setChannels(current => {
			const firstChannel: Channel | null = current.length > 0 ? current[0]! : null
			setSelectedChannel(firstChannel)
			onChannelSelected?.(firstChannel)
			return current
		})
	}, [onChannelSelected])

	const clearChannels = useCallback(() => {
		setChannels([])
		setSelectedChannel(null)
		setChannelFormMode(null)
		onChannelsChange?.([])
		onChannelSelected?.(null)
	}, [onChannelsChange, onChannelSelected])

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
