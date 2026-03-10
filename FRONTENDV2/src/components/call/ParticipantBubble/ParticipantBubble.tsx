import { FC } from "react"
import { MicOff } from "lucide-react"
import type { CallParticipant } from "types/Call"
import "./ParticipantBubble.scss"

interface ParticipantBubbleProps {
    participant: CallParticipant
}

export const ParticipantBubble: FC<ParticipantBubbleProps> = ({ participant }) => {
    return (
        <div className={`participantBubble ${participant.isConnected ? "connected" : "connecting"}`}>
            <img
                src={
                    participant.picture
                        ? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${participant.picture}`
                        : "/images/default_profile_picture.png"
                }
                alt={`${participant.firstname} ${participant.lastname}`}
                className="participantAvatar"
            />
            {participant.isMuted && (
                <div className="mutedBadge">
                    <MicOff size={10} />
                </div>
            )}
            <span className="participantName">{participant.firstname}</span>
        </div>
    )
}
