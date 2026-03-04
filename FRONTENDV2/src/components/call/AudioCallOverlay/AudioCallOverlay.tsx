import { FC, useState, useEffect } from "react"
import { Mic, MicOff, PhoneOff, Users, Minimize2, Maximize2, Phone } from "lucide-react"
import { motion } from "framer-motion"
import { useAudioCall } from "contexts/call/AudioCallContext"
import { ParticipantBubble } from "../ParticipantBubble/ParticipantBubble"
import "./AudioCallOverlay.scss"

export const AudioCallOverlay: FC = () => {
    const { callState, hangUp, toggleMute } = useAudioCall()
    const [minimized, setMinimized] = useState(false)
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!callState?.startTime) {
            setElapsed(0)
            return
        }
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - callState.startTime!) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [callState?.startTime])

    if (!callState || callState.status === "idle") return null

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0")
        const s = (seconds % 60).toString().padStart(2, "0")
        return `${m}:${s}`
    }

    if (minimized) {
        return (
            <motion.div
                className="callOverlayMinimized"
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="miniInfo">
                    <Phone size={16} />
                    <span>{callState.status === "active" ? formatTime(elapsed) : "..."}</span>
                    <span className="participantCount">
                        <Users size={14} /> {callState.participants.length}
                    </span>
                </div>
                <button onClick={() => setMinimized(false)} className="expandBtn">
                    <Maximize2 size={16} />
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="callOverlay"
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="callOverlayHeader">
                <span className="callStatus">
                    {callState.status === "outgoing"
                        ? "Appel en cours..."
                        : callState.status === "active"
                            ? formatTime(elapsed)
                            : ""}
                </span>
                <button onClick={() => setMinimized(true)} className="minimizeBtn">
                    <Minimize2 size={16} />
                </button>
            </div>

            <div className="callParticipants">
                {callState.participants.map(p => (
                    <ParticipantBubble key={p.userId} participant={p} />
                ))}
            </div>

            <div className="callControls">
                <button
                    onClick={toggleMute}
                    className={`controlBtn ${callState.isMuted ? "muted" : ""}`}
                >
                    {callState.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={hangUp} className="hangupBtn">
                    <PhoneOff size={20} />
                </button>
            </div>
        </motion.div>
    )
}
