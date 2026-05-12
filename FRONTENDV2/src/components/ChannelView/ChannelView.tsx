import { useEffect, useRef, useState, type FC } from "react"
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
import type { Channel as ChannelModel } from "pages/Teams/Teams.types"
import type { ChannelState } from "services/channel/Channel.types"

interface ChannelViewProps {
	state: ChannelState
	selected: ChannelModel
	userId: string
	onOpenEdit: (channel: ChannelModel) => void
	onPublishPost: (channelId: string, content: string) => void
	onAnswerPost: (postId: string, content: string) => void
}

const ChannelView: FC<ChannelViewProps> = ({
	state, selected, userId, onOpenEdit, onPublishPost, onAnswerPost,
}) => {

	const [newPostContent, setNewPostContent] = useState("")
	const [showMembers, setShowMembers] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const posts = state.posts.filter(post => post.channelId === selected.id)
	const members = state.channelMembers
	const isLoading = state.isLoadingPosts
	const isCreator = selected.createdBy === userId

	useEffect(() => { inputRef.current?.focus() }, [])
	useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [posts.length])

	const handleSubmitPost = () => {
		if (!newPostContent.trim() || !userId) return
		onPublishPost(selected.id, newPostContent)
		setNewPostContent("")
	}

	const handleAddResponse = (postId: string, content: string) => {
		if (!content.trim() || !userId) return
		onAnswerPost(postId, content)
	}

	return (
		<div className="channel-view">
			<div className="channel-view__header">
				<div className="channel-view__channel-info">
					<div className="channel-view__channel-icon">
						{selected.isPublic ? <HashIcon size={20} /> : <Lock size={20} />}
					</div>
					<h2 className="channel-view__channel-name">{selected.name}</h2>
					<div className="channel-view__channel-status">
						<span className={selected.isPublic ? "channel-view__badge--public" : "channel-view__badge--private"}>
							{selected.isPublic ? "Public" : "Prive"}
						</span>
					</div>
					<button className="channel-view__members-button" onClick={() => setShowMembers(!showMembers)}>
						<Users size={18} />
						<span>{members.length} membre{members.length !== 1 ? "s" : ""}</span>
					</button>
				</div>

				<div>
					{isCreator && (
						<button className="channel-view__settings-button" onClick={() => onOpenEdit(selected)}>
							<Settings size={14} />
						</button>
					)}
				</div>
			</div>

			{showMembers && (
				<div className="channel-view__members-panel">
					<h3 className="channel-view__members-panel-title">Membres du canal</h3>
					<div className="channel-view__members-list">
						{members.map((member) => (
							<div key={member.id || `member-${member.userId}`} className="channel-view__member-item">
								<div className="channel-view__member-avatar">
									{member.picture ? (
										<img src={member.picture} alt={`${member.firstname} ${member.lastname}`} />
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
											<span className="channel-view__you-badge">Vous</span>
										)}
									</span>
									<span className="channel-view__member-role">
										{member.role === "admin" ? "Administrateur" : "Membre"}
									</span>
								</div>
							</div>
						))}
						{members.length === 0 && (
							<div className="channel-view__no-results">Aucun membre trouve</div>
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
						{isCreator && <p>Soyez le premier a ecrire quelque chose !</p>}
					</div>
				) : (
					<>
						{posts.map((post) => (
							<div key={post.id} className="channel-view__post-wrapper">
								<PostItem
									post={post}
									currentUserId={userId || ""}
									onAddResponse={(content) => handleAddResponse(post.id, content)}
									isAdmin={isCreator}
								/>
							</div>
						))}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{isCreator && (
				<div className="channel-view__input-container">
					<input
						ref={inputRef}
						type="text"
						className="channel-view__message-input"
						placeholder="Ecrivez un message..."
						value={newPostContent}
						onChange={(event) => setNewPostContent(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault()
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
