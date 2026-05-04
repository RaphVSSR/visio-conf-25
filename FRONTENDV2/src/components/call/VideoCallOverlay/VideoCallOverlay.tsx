import { FC, useState, useEffect, useRef } from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2 } from "lucide-react"
import { motion } from "framer-motion"
import { useCall } from "contexts/call/CallContext"
import "./VideoCallOverlay.scss"

const LocalVideoPreview: FC = () => {
    const { localMediaStream, callState } = useCall()
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && localMediaStream.current) {
            videoRef.current.srcObject = localMediaStream.current
        }
    }, [localMediaStream])

    const cameraOn = callState?.isCameraOn ?? false

    return (
        <div className={`localPreview ${!cameraOn ? "localPreviewOff" : ""}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cameraOn ? "" : "hidden"}
            />
            {!cameraOn && <VideoOff size={20} />}
        </div>
    )
}

const RemoteVideoTile: FC<{
    stream: MediaStream | null
    name: string
    isMuted: boolean
    isCameraOn: boolean
}> = ({ stream, name, isMuted, isCameraOn }) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    return (
        <div className="videoTile">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={isCameraOn ? "" : "hidden"}
            />
            {!isCameraOn && (
                <div className="videoTilePlaceholder">
                    <div className="avatarCircle">
                        {name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
            <div className="videoTileInfo">
                <span className="participantName">{name}</span>
                {isMuted && <MicOff size={14} className="mutedIcon" />}
            </div>
        </div>
    )
}

export const VideoCallOverlay: FC = () => {
    const {
        callState,
        remoteStreams,
        hangUp,
        toggleMute,
        toggleCamera,
    } = useCall()
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

    if (!callState || callState.callType !== "video") return null
    if (callState.status === "idle") return null

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0")
        const s = (seconds % 60).toString().padStart(2, "0")
        return `${m}:${s}`
    }

    if (minimized) {
        return (
            <motion.div
                className="videoCallMinimized"
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="miniInfo">
                    <Video size={16} />
                    <span>{callState.status === "active" ? formatTime(elapsed) : "..."}</span>
                </div>
                <button onClick={() => setMinimized(false)} className="expandBtn">
                    <Maximize2 size={16} />
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="videoCallOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="videoCallHeader">
                <span className="callStatus">
                    {callState.status === "outgoing"
                        ? "Appel vidéo en cours..."
                        : callState.status === "active"
                            ? formatTime(elapsed)
                            : ""}
                </span>
                <button onClick={() => setMinimized(true)} className="minimizeBtn">
                    <Minimize2 size={16} />
                </button>
            </div>

            <div className={`videoGrid videoGrid${Math.min(callState.participants.length, 4)}`}>
                {callState.participants.map((p) => {
                    const stream = remoteStreams.get(p.userId)
                    const hasStream = !!stream
                    return (
                        <RemoteVideoTile
                            key={p.userId}
                            stream={stream ?? null}
                            name={`${p.firstname} ${p.lastname}`.trim()}
                            isMuted={p.isMuted}
                            isCameraOn={p.isCameraOn && hasStream}
                        />
                    )
                })}
            </div>

            <LocalVideoPreview />

            <div className="videoCallControls">
                <button
                    onClick={toggleMute}
                    className={`controlBtn ${callState.isMuted ? "active" : ""}`}
                >
                    {callState.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                    onClick={toggleCamera}
                    className={`controlBtn ${!callState.isCameraOn ? "active" : ""}`}
                >
                    {callState.isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button onClick={hangUp} className="hangupBtn">
                    <PhoneOff size={20} />
                </button>
            </div>
        </motion.div>
    )
}
