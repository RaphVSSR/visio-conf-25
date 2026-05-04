import { useState, useRef, useEffect, type FC } from "react"
import { motion } from "framer-motion"
import "./PostItem.scss"
import { MessageCircle, Send } from "lucide-react"
import PostResponseItem from "../PostResponseItem/PostResponseItem"
import formatRelativeDate from "utils/formatRelativeDate"

interface PostItemProps {
	post: any
	currentUserId: string
	onAddResponse: (content: string) => void
	isAdmin: boolean
}

const PostItem: FC<PostItemProps> = ({
	post,
	currentUserId,
	onAddResponse,
	isAdmin,
}) => {
	const [showReplyForm, setShowReplyForm] = useState(false)
	const [replyContent, setReplyContent] = useState("")
	const replyInputRef = useRef<HTMLTextAreaElement>(null)

	const [responses, setResponses] = useState<any[]>(post.responses || [])

	useEffect(() => {
		setResponses(post.responses || [])
	}, [post.responses])

	useEffect(() => {
		if (showReplyForm && replyInputRef.current) {
			replyInputRef.current.focus()
		}
	}, [showReplyForm])

	const handleSubmitReply = () => {
		if (!replyContent.trim()) return
		onAddResponse(replyContent)
		setReplyContent("")
		setShowReplyForm(false)
	}

	const handleReplyClick = () => {
		setShowReplyForm(!showReplyForm)
	}

	const isAuthor = post.authorId === currentUserId

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="post-item"
		>
			<div className="post-item__header">
				<div className="post-item__user-info">
					<div className="post-item__avatar">
						{post.authorPicture ? (
							<img
								src={post.authorPicture}
								alt={`${post.authorFirstname} ${post.authorLastname}`}
							/>
						) : (
							<>
								{post.authorFirstname?.charAt(0) || ""}
								{post.authorLastname?.charAt(0) || ""}
							</>
						)}
					</div>
					<div>
						<span className="post-item__user-name">
							{post.authorFirstname} {post.authorLastname}
							{isAuthor && (
								<span className="post-item__author-badge">Vous</span>
							)}
						</span>
						<span className="post-item__timestamp">
							{formatRelativeDate(post.createdAt)}
						</span>
					</div>
				</div>
			</div>

			<p className="post-item__text">{post.content}</p>

			<div className="post-item__footer">
				{!isAdmin && (
					<button
						className="post-item__reply-button"
						onClick={handleReplyClick}
					>
						<MessageCircle size={16} />
						<span>Repondre</span>
					</button>
				)}

				{responses.length > 0 && (
					<span className="post-item__responses-count">
						<MessageCircle size={14} />
						{responses.length} reponse{responses.length > 1 ? "s" : ""}
					</span>
				)}
			</div>

			{showReplyForm && (
				<div className="post-item__reply-form">
					<textarea
						ref={replyInputRef}
						className="post-item__reply-input"
						placeholder="Ecrivez votre reponse..."
						value={replyContent}
						onChange={(e) => setReplyContent(e.target.value)}
						rows={2}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSubmitReply()
							}
						}}
					/>
					<button
						className="post-item__reply-submit"
						onClick={handleSubmitReply}
						disabled={!replyContent.trim()}
						aria-label="Envoyer la reponse"
					>
						<Send size={16} />
					</button>
				</div>
			)}

			{responses.length > 0 && (
				<div className="post-item__responses-container">
					{responses.map((response: any) => (
						<PostResponseItem
							key={
								response.id ||
								response._id ||
								`response-${response.authorId}-${Date.parse(response.createdAt)}`
							}
							response={response}
							currentUserId={currentUserId}
							id={`response-${response.id || response._id}`}
						/>
					))}
				</div>
			)}
		</motion.div>
	)
}

export default PostItem
