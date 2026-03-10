import { type FC } from "react"
import "./PostResponseItem.scss"

interface PostResponseItemProps {
	response: any
	currentUserId: string
	id?: string
}

function formatRelativeDate(dateString: string): string {
	try {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMins / 60)
		const diffDays = Math.floor(diffHours / 24)

		if (diffMins < 1) return "A l'instant"
		if (diffMins < 60)
			return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`
		if (diffHours < 24)
			return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
		if (diffDays < 7)
			return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`

		return date.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "short",
			year: "numeric",
		})
	} catch {
		return dateString
	}
}

const PostResponseItem: FC<PostResponseItemProps> = ({
	response,
	currentUserId,
	id,
}) => {
	const isAuthor = response.authorId === currentUserId

	return (
		<div
			id={id}
			className={`post-response-item ${isAuthor ? "post-response-item--author" : ""}`}
		>
			<div className="post-response-item__header">
				<div className="post-response-item__user-info">
					<div className="post-response-item__avatar">
						{response.authorPicture ? (
							<img
								src={response.authorPicture}
								alt={`${response.authorFirstname} ${response.authorLastname}`}
							/>
						) : (
							<>
								{response.authorFirstname?.charAt(0) || ""}
								{response.authorLastname?.charAt(0) || ""}
							</>
						)}
					</div>
					<div>
						<span className="post-response-item__user-name">
							{response.authorFirstname} {response.authorLastname}
							{isAuthor && (
								<span className="post-response-item__author-badge">Vous</span>
							)}
						</span>
						<span className="post-response-item__timestamp">
							{formatRelativeDate(response.createdAt)}
						</span>
					</div>
				</div>
			</div>
			<p className="post-response-item__text">{response.content}</p>
		</div>
	)
}

export default PostResponseItem
