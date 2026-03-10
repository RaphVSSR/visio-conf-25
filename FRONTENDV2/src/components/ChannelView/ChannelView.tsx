import { useState, useEffect, useRef, type FC } from "react"
import "./ChannelView.scss"
import {
	Users,
	Send,
	HashIcon,
	Lock,
	MessageSquare,
	Settings,
} from "lucide-react"
import PostItem from "../PostItem/PostItem"
import { useAuth } from "hooks/useAuth"
import type { Channel } from "pages/Teams/Teams.types"

interface ChannelViewProps {
	channel: Channel
	userId: string
	onEditChannel: () => void
	onChannelDeleted?: () => void
}

function sortByCreatedAtAsc<T extends { createdAt: string | Date }>(arr: T[]): T[] {
	return [...arr].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	)
}

const ChannelView: FC<ChannelViewProps> = ({
	channel,
	userId,
	onEditChannel,
	onChannelDeleted,
}) => {
	const { controleur } = useAuth()
	const [posts, setPosts] = useState<any[]>([])
	const [members, setMembers] = useState<any[]>([])
	const [newPostContent, setNewPostContent] = useState("")
	const [isLoading, setIsLoading] = useState(true)
	const [showMembers, setShowMembers] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const channelId = channel.id

	const nomDInstance = "ChannelView"
	const verbose = false

	const listeMessageEmis = [
		"get_posts",
		"get_channel_members",
		"publish_post",
		"answer_post",
		"delete_channel",
	]
	const listeMessageRecus = [
		"posts",
		"channel_members",
		"post_publishing_status",
		"post_answering_status",
		"channel_deleting_status",
	]

	const handler = {
		nomDInstance,
		traitementMessage: (msg: any) => {
			if (verbose || controleur?.verboseall)
				console.log(`INFO: (${nomDInstance}) - traitementMessage - `, msg)

			if (msg.posts) {
				if (msg.posts.etat) {
					setPosts(sortByCreatedAtAsc(msg.posts.posts || []))
				} else {
					console.error(
						"Erreur lors de la recuperation des posts:",
						msg.posts.error
					)
				}
				setIsLoading(false)
			}

			if (msg.channel_members) {
				if (msg.channel_members.etat) {
					setMembers(msg.channel_members.members || [])
				} else {
					console.error(
						"Erreur lors de la recuperation des membres:",
						msg.channel_members.error
					)
				}
			}

			if (msg.post_publishing_status) {
				if (msg.post_publishing_status.etat) {
					const { post } = msg.post_publishing_status
					setPosts((prevPosts) => sortByCreatedAtAsc([post, ...prevPosts]))
					setNewPostContent("")
					if (messagesEndRef.current) {
						messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
					}
				}
			}

			if (msg.post_answering_status) {
				if (msg.post_answering_status.etat) {
					const { postId, response } = msg.post_answering_status
					setPosts((prevPosts) =>
						prevPosts.map((post) => {
							if (post.id === postId) {
								return {
									...post,
									responses: sortByCreatedAtAsc([
										...(post.responses || []),
										response,
									]),
								}
							}
							return post
						})
					)
				}
			}

			if (msg.channel_deleting_status) {
				if (msg.channel_deleting_status.etat) {
					if (onChannelDeleted) {
						onChannelDeleted()
					}
				} else {
					console.error(
						"Erreur lors de la suppression du canal:",
						msg.channel_deleting_status.error
					)
				}
			}
		},
	}

	useEffect(() => {
		if (controleur && channelId) {
			controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

			const membersRequest = { get_channel_members: { channelId } }
			controleur.envoie(handler, membersRequest)

			const postsRequest = { get_posts: { channelId } }
			controleur.envoie(handler, postsRequest)
		}

		return () => {
			if (controleur) {
				controleur.desincription(handler, listeMessageEmis, listeMessageRecus)
			}
		}
	}, [channelId, controleur, onChannelDeleted])

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [])

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [posts])

	const handleSubmitPost = () => {
		if (!newPostContent.trim() || !userId) return

		const postRequest = {
			publish_post: {
				channelId,
				content: newPostContent,
			},
		}
		controleur?.envoie(handler, postRequest)
	}

	const handleAddResponse = (postId: string, content: string) => {
		if (!content.trim() || !userId) return

		const responseRequest = {
			answer_post: {
				postId,
				content,
			},
		}
		controleur?.envoie(handler, responseRequest)
	}

	const isChannelCreator = channel.createdBy === userId
	const canPostMessage = isChannelCreator

	return (
		<div className="channel-view">
			<div className="channel-view__header">
				<div className="channel-view__channel-info">
					<div className="channel-view__channel-icon">
						{channel.isPublic ? (
							<HashIcon size={20} />
						) : (
							<Lock size={20} />
						)}
					</div>
					<h2 className="channel-view__channel-name">{channel.name}</h2>
					<div className="channel-view__channel-status">
						<span
							className={
								channel.isPublic
									? "channel-view__badge--public"
									: "channel-view__badge--private"
							}
						>
							{channel.isPublic ? "Public" : "Prive"}
						</span>
					</div>
					<button
						className="channel-view__members-button"
						onClick={() => setShowMembers(!showMembers)}
					>
						<Users size={18} />
						<span>
							{members.length} membre
							{members.length !== 1 ? "s" : ""}
						</span>
					</button>
				</div>

				<div>
					{isChannelCreator && onEditChannel && (
						<button
							className="channel-view__settings-button"
							onClick={onEditChannel}
						>
							<Settings size={14} />
						</button>
					)}
				</div>
			</div>

			{showMembers && (
				<div className="channel-view__members-panel">
					<h3 className="channel-view__members-panel-title">
						Membres du canal
					</h3>
					<div className="channel-view__members-list">
						{members.map((member) => (
							<div
								key={member.id || `member-${member.userId}`}
								className="channel-view__member-item"
							>
								<div className="channel-view__member-avatar">
									{member.picture ? (
										<img
											src={member.picture}
											alt={`${member.firstname} ${member.lastname}`}
										/>
									) : (
										<>
											{member.firstname?.charAt(0) || "?"}
											{member.lastname?.charAt(0) || "?"}
										</>
									)}
								</div>
								<div className="channel-view__member-info">
									<span className="channel-view__member-name">
										{member.firstname} {member.lastname}
										{member.userId === userId && (
											<span className="channel-view__you-badge">
												Vous
											</span>
										)}
									</span>
									<span className="channel-view__member-role">
										{member.role === "admin"
											? "Administrateur"
											: "Membre"}
									</span>
								</div>
							</div>
						))}

						{members.length === 0 && (
							<div className="channel-view__no-results">
								Aucun membre trouve
							</div>
						)}
					</div>
				</div>
			)}

			<div className="channel-view__posts-container">
				{isLoading ? (
					<div className="channel-view__loading">
						<div className="channel-view__spinner"></div>
						<p>Chargement des messages...</p>
					</div>
				) : posts.length === 0 ? (
					<div className="channel-view__empty-state">
						<MessageSquare size={48} />
						<p>Aucun message dans ce canal</p>
						{canPostMessage && (
							<p>Soyez le premier a ecrire quelque chose !</p>
						)}
					</div>
				) : (
					<>
						{posts.map((post) => (
							<div key={post.id} className="channel-view__post-wrapper">
								<PostItem
									post={post}
									currentUserId={userId || ""}
									onAddResponse={(content) =>
										handleAddResponse(post.id, content)
									}
									isAdmin={isChannelCreator}
								/>
							</div>
						))}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{canPostMessage && (
				<div className="channel-view__input-container">
					<input
						ref={inputRef}
						type="text"
						className="channel-view__message-input"
						placeholder="Ecrivez un message..."
						value={newPostContent}
						onChange={(e) => setNewPostContent(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSubmitPost()
							}
						}}
					/>
					<button
						className="channel-view__send-button"
						onClick={handleSubmitPost}
						disabled={!newPostContent.trim()}
						aria-label="Envoyer le message"
					>
						<Send size={18} />
					</button>
				</div>
			)}
		</div>
	)
}

export default ChannelView
