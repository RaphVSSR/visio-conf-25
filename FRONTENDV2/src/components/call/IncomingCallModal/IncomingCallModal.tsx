import { FC, useEffect } from "react"
import { Phone, PhoneOff, Video } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCall } from "contexts/call/CallContext"
import "./IncomingCallModal.scss"

export const IncomingCallModal: FC = () => {
    const { incomingCall, acceptCall, rejectCall } = useCall()

    useEffect(() => {
        if (!incomingCall) return

        const audio = new Audio("/audio/ringtone.mp3")
        audio.loop = true
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        audio.play().catch(() => {})

        return () => {
            audio.pause()
            audio.currentTime = 0
        }
    }, [incomingCall])

    if (!incomingCall) return null

    return (
        <AnimatePresence>
            <motion.div
                className="incomingCallOverlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="incomingCallModal"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    <div className="callerAvatar">
                        <img
                            src={
                                incomingCall.callerPicture
                                    ? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${incomingCall.callerPicture}`
                                    : "/images/default_profile_picture.png"
                            }
                            alt="Caller"
                        />
                        <div className="pulseRing" />
                        <div className="pulseRing delay" />
                    </div>
                    <h3 className="callerName">{incomingCall.callerName}</h3>
                    <p className="callType">
                        {incomingCall.isGroupCall
                            ? "Appel de groupe"
                            : incomingCall.callType === "video"
                                ? "Appel vidéo"
                                : "Appel audio"}
                    </p>
                    <div className="callActions">
                        <button className="rejectBtn" onClick={rejectCall}>
                            <PhoneOff size={24} />
                        </button>
                        <button className="acceptBtn" onClick={acceptCall}>
                            {incomingCall.callType === "video"
                                ? <Video size={24} />
                                : <Phone size={24} />}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
