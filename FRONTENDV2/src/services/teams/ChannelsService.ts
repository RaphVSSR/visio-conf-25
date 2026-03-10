import { ControllerService } from "Controller/Controller.service"
import type { Controller, ControllerMessage } from "Controller/Controller.types"
import type { Channel, ChannelMember, ChannelPost, ChannelPostResponse } from "pages/Teams/Teams.types"

export interface ChannelsServiceCallbacks {
	onChannelsListReceived: (channels: Channel[]) => void
	onChannelsListError: (error: string) => void
	onChannelCreated: (channel: Channel) => void
	onChannelCreateError: (error: string) => void
	onChannelUpdated: (channel: Channel) => void
	onChannelUpdateError: (error: string) => void
	onChannelDeleted: () => void
	onChannelDeleteError: (error: string) => void
	onChannelMembersReceived: (members: ChannelMember[]) => void
	onChannelMembersError: (error: string) => void
	onPostsReceived: (posts: ChannelPost[]) => void
	onPostsError: (error: string) => void
	onPostCreated: (post: ChannelPost) => void
	onPostCreateError: (error: string) => void
	onPostResponseCreated: (postId: string, response: ChannelPostResponse) => void
	onPostResponseCreateError: (error: string) => void
}

const MESSAGES_EMITTED = [
	"get_channels",
	"create_channel",
	"update_channel",
	"delete_channel",
	"get_channel_members",
	"get_posts",
	"publish_post",
	"answer_post",
]

const MESSAGES_RECEIVED = [
	"channels",
	"channel_creating_status",
	"channel_updating_status",
	"channel_deleting_status",
	"channel_members",
	"posts",
	"post_publishing_status",
	"post_answering_status",
]

export class ChannelsService extends ControllerService {

	private callbacks: ChannelsServiceCallbacks

	constructor(controleur: Controller, callbacks: ChannelsServiceCallbacks) {
		super(controleur, "ChannelsService", MESSAGES_EMITTED, MESSAGES_RECEIVED)
		this.callbacks = callbacks
	}

	traitementMessage(mesg: ControllerMessage): void {
		const action = Object.keys(mesg)[0]

		switch (action) {
			case "channels": {
				const payload = mesg[action] as { channels?: Channel[]; error?: string }
				if (payload.error) this.callbacks.onChannelsListError(payload.error)
				else this.callbacks.onChannelsListReceived(payload.channels ?? [])
				break
			}

			case "channel_creating_status": {
				const payload = mesg[action] as { channel?: Channel; error?: string }
				if (payload.error) this.callbacks.onChannelCreateError(payload.error)
				else this.callbacks.onChannelCreated(payload.channel!)
				break
			}

			case "channel_updating_status": {
				const payload = mesg[action] as { channel?: Channel; error?: string }
				if (payload.error) this.callbacks.onChannelUpdateError(payload.error)
				else this.callbacks.onChannelUpdated(payload.channel!)
				break
			}

			case "channel_deleting_status": {
				const payload = mesg[action] as { error?: string }
				if (payload.error) this.callbacks.onChannelDeleteError(payload.error)
				else this.callbacks.onChannelDeleted()
				break
			}

			case "channel_members": {
				const payload = mesg[action] as { members?: ChannelMember[]; error?: string }
				if (payload.error) this.callbacks.onChannelMembersError(payload.error)
				else this.callbacks.onChannelMembersReceived(payload.members ?? [])
				break
			}

			case "posts": {
				const payload = mesg[action] as { posts?: ChannelPost[]; error?: string }
				if (payload.error) this.callbacks.onPostsError(payload.error)
				else this.callbacks.onPostsReceived(payload.posts ?? [])
				break
			}

			case "post_publishing_status": {
				const payload = mesg[action] as { post?: ChannelPost; error?: string }
				if (payload.error) this.callbacks.onPostCreateError(payload.error)
				else this.callbacks.onPostCreated(payload.post!)
				break
			}

			case "post_answering_status": {
				const payload = mesg[action] as { postId?: string; response?: ChannelPostResponse; error?: string }
				if (payload.error) this.callbacks.onPostResponseCreateError(payload.error)
				else this.callbacks.onPostResponseCreated(payload.postId!, payload.response!)
				break
			}
		}
	}

	requestChannelsList(teamId: string): void {
		this.sendMessage({ get_channels: { teamId } })
	}

	createChannel(data: { name: string; teamId: string; isPublic: boolean }): void {
		this.sendMessage({ create_channel: data })
	}

	updateChannel(data: { id: string; name?: string; isPublic?: boolean }): void {
		this.sendMessage({ update_channel: data })
	}

	deleteChannel(channelId: string): void {
		this.sendMessage({ delete_channel: { channelId } })
	}

	requestChannelMembers(channelId: string): void {
		this.sendMessage({ get_channel_members: { channelId } })
	}

	requestPosts(channelId: string): void {
		this.sendMessage({ get_posts: { channelId } })
	}

	createPost(channelId: string, content: string): void {
		this.sendMessage({ publish_post: { channelId, content } })
	}

	createPostResponse(postId: string, content: string): void {
		this.sendMessage({ answer_post: { postId, content } })
	}
}
