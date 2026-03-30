import { type FC } from "react"
import "./PostResponseItem.scss"
import formatRelativeDate from "utils/formatRelativeDate"

interface PostResponseItemProps {
	response: any
	currentUserId: string
	id?: string
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
