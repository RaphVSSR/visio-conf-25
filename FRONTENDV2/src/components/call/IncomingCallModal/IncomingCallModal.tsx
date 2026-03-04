import { FC } from "react"
import { Phone, PhoneOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAudioCall } from "contexts/call/AudioCallContext"
import "./IncomingCallModal.scss"

export const IncomingCallModal: FC = () => {
    const { incomingCall, acceptCall, rejectCall } = useAudioCall()

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
                        {incomingCall.isGroupCall ? "Appel de groupe" : "Appel audio"}
                    </p>
                    <div className="callActions">
                        <button className="rejectBtn" onClick={rejectCall}>
                            <PhoneOff size={24} />
                        </button>
                        <button className="acceptBtn" onClick={acceptCall}>
                            <Phone size={24} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
