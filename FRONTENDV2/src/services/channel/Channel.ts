import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type {
	ChannelState,
	CreateChannelInput,
	UpdateChannelInput,
	ChannelPost,
} from "./Channel.types"
import type { Channel as ChannelModel } from "pages/Teams/Teams.types"

type StateUpdater = (updater: (prev: ChannelState) => ChannelState) => void

export const initialChannelState: ChannelState = {
	channels: [],
	selectedChannel: null,
	channelFormMode: null,
	channelMembers: [],
	posts: [],
	isLoadingChannels: false,
	isLoadingMembers: false,
	isLoadingPosts: false,
	isSubmittingChannel: false,
	isDeletingChannel: false,
	channelError: "",
}

const sortByCreatedAtAsc = <T extends { createdAt: string }>(arr: T[]): T[] =>
	[...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

export class Channel {

	readonly nomDInstance = "Channel"

	private static readonly listMessageEmission = ["channel_get", "channel_action", "channel_member", "channel_post"]
	private static readonly listMessageReception = ["channel_get_response", "channel_action_response", "channel_member_response", "channel_post_response"]

	private controleur: Controleur
	private canal: CanalSocketio
	private setState: StateUpdater

	constructor(setState: StateUpdater) {
		this.setState = setState
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")
		this.controleur.inscription(this, Channel.listMessageEmission, Channel.listMessageReception)
	}

	destroy(): void {
		this.canal.socket.disconnect()
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "channel_get_response":    this.handleGetResponse(mesg[key]); break
				case "channel_action_response": this.handleActionResponse(mesg[key]); break
				case "channel_member_response": this.handleMemberResponse(mesg[key]); break
				case "channel_post_response":   this.handlePostResponse(mesg[key]); break
			}
		}
	}

	loadChannels = (teamId: string): void => {
		this.setState(prev => ({ ...prev, isLoadingChannels: true }))
		this.send("channel_get", { type: "list", teamId })
	}

	clearChannels = (): void => {
		this.setState(prev => ({
			...prev,
			channels: [],
			selectedChannel: null,
			channelFormMode: null,
			posts: [],
			channelMembers: [],
		}))
	}

	selectChannel = (channel: ChannelModel | null): void => {
		this.setState(prev => ({ ...prev, selectedChannel: channel, channelFormMode: null }))
		if (channel) {
			this.loadMembers(channel.id)
			this.loadPosts(channel.id)
		}
	}

	openCreateForm = (): void => {
		this.setState(prev => ({ ...prev, channelFormMode: "create", channelError: "" }))
	}

	openEditForm = (channel: ChannelModel): void => {
		this.setState(prev => ({ ...prev, selectedChannel: channel, channelFormMode: "edit", channelError: "" }))
	}

	closeForm = (): void => {
		this.setState(prev => ({ ...prev, channelFormMode: null, channelError: "" }))
	}

	loadMembers = (channelId: string): void => {
		this.setState(prev => ({ ...prev, isLoadingMembers: true }))
		this.send("channel_member", { type: "list", channelId })
	}

	loadPosts = (channelId: string): void => {
		this.setState(prev => ({ ...prev, isLoadingPosts: true }))
		this.send("channel_post", { type: "list", channelId })
	}

	createChannel = (data: CreateChannelInput): void => {
		this.setState(prev => ({ ...prev, isSubmittingChannel: true, channelError: "" }))
		this.send("channel_action", { type: "create", ...data })
	}

	updateChannel = (data: UpdateChannelInput): void => {
		this.setState(prev => ({ ...prev, isSubmittingChannel: true, channelError: "" }))
		this.send("channel_action", { type: "update", ...data })
	}

	deleteChannel = (channelId: string): void => {
		this.setState(prev => ({ ...prev, isDeletingChannel: true, channelError: "" }))
		this.send("channel_action", { type: "delete", channelId })
	}

	publishPost = (channelId: string, content: string): void => {
		this.send("channel_post", { type: "publish", channelId, content })
	}

	answerPost = (postId: string, content: string): void => {
		this.send("channel_post", { type: "answer", postId, content })
	}

	clearChannelError = (): void => {
		this.setState(prev => ({ ...prev, channelError: "" }))
	}

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}

	private handleGetResponse = (data: any) => {
		if (data?.type !== "list") return
		this.setState(prev => {
			const channels: ChannelModel[] = data.etat ? (data.channels || []) : prev.channels
			const selectedChannel = prev.selectedChannel
				? channels.find(c => c.id === prev.selectedChannel!.id) ?? null
				: prev.selectedChannel
			return { ...prev, channels, selectedChannel, isLoadingChannels: false }
		})
	}

	private handleActionResponse = (data: any) => {
		switch (data?.type) {
			case "create":
				this.setState(prev => ({
					...prev,
					isSubmittingChannel: false,
					channelError: data.etat ? "" : (data.error || "Erreur lors de la creation du canal"),
					channelFormMode: data.etat ? null : prev.channelFormMode,
					selectedChannel: data.etat ? data.channel : prev.selectedChannel,
				}))
				if (data.etat && data.channel?.teamId) this.loadChannels(data.channel.teamId)
				break
			case "update":
				this.setState(prev => ({
					...prev,
					isSubmittingChannel: false,
					channelError: data.etat ? "" : (data.error || "Erreur lors de la mise a jour du canal"),
					channelFormMode: data.etat ? null : prev.channelFormMode,
					selectedChannel: data.etat && prev.selectedChannel?.id === data.channel?.id
						? data.channel
						: prev.selectedChannel,
				}))
				if (data.etat && data.channel?.teamId) this.loadChannels(data.channel.teamId)
				break
			case "delete":
				this.setState(prev => ({
					...prev,
					isDeletingChannel: false,
					channelError: data.etat ? "" : (data.error || "Erreur lors de la suppression du canal"),
					channelFormMode: data.etat ? null : prev.channelFormMode,
					selectedChannel: data.etat ? null : prev.selectedChannel,
					channels: data.etat ? prev.channels.filter(c => c.id !== data.channelId) : prev.channels,
				}))
				break
		}
	}

	private handleMemberResponse = (data: any) => {
		if (data?.type !== "list") return
		this.setState(prev => ({
			...prev,
			channelMembers: data.etat ? (data.members || []) : prev.channelMembers,
			isLoadingMembers: false,
		}))
	}

	private handlePostResponse = (data: any) => {
		switch (data?.type) {
			case "list":
				this.setState(prev => ({
					...prev,
					posts: data.etat ? sortByCreatedAtAsc(data.posts || []) : prev.posts,
					isLoadingPosts: false,
				}))
				break
			case "publish":
				if (!data.etat || !data.post) return
				this.setState(prev => ({ ...prev, posts: sortByCreatedAtAsc([...prev.posts, data.post as ChannelPost]) }))
				break
			case "update":
				if (!data.etat) return
				this.setState(prev => ({
					...prev,
					posts: prev.posts.map(p =>
						p.id === data.postId
							? { ...p, content: data.content, updatedAt: data.updatedAt }
							: p
					),
				}))
				break
			case "delete":
				if (!data.etat) return
				this.setState(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== data.postId) }))
				break
			case "answer":
				if (!data.etat || !data.response) return
				this.setState(prev => ({
					...prev,
					posts: prev.posts.map(p =>
						p.id === data.postId
							? { ...p, responses: sortByCreatedAtAsc([...(p.responses || []), data.response]) }
							: p
					),
				}))
				break
		}
	}
}
