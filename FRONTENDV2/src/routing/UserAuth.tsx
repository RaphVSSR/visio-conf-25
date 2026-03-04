import { FC, useContext, useEffect } from "react";
import { SessionContext } from "../contexts/SessionContext";
import { Navigate, Outlet } from "react-router-dom";
import { AudioCallProvider, useAudioCall } from "../contexts/call/AudioCallContext";
import { AudioCallOverlay, IncomingCallModal } from "../components/call";
import { PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CallEndedToast: FC = () => {
	const { callEndedNotice, dismissCallEndedNotice } = useAudioCall();

	useEffect(() => {
		if (!callEndedNotice) return;
		const timer = setTimeout(dismissCallEndedNotice, 4000);
		return () => clearTimeout(timer);
	}, [callEndedNotice, dismissCallEndedNotice]);

	return (
		<AnimatePresence>
			{callEndedNotice && (
				<motion.div
					initial={{ opacity: 0, y: -30 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -30 }}
					onClick={dismissCallEndedNotice}
					style={{
						position: "fixed",
						top: 24,
						left: "50%",
						transform: "translateX(-50%)",
						background: "#1e293b",
						color: "#f1f5f9",
						padding: "12px 24px",
						borderRadius: 12,
						display: "flex",
						alignItems: "center",
						gap: 10,
						boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
						zIndex: 3000,
						cursor: "pointer",
						fontSize: 14,
					}}
				>
					<PhoneOff size={18} color="#ef4444" />
					{callEndedNotice}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const UserAuth: FC = () => {

	const session = useContext(SessionContext);

	if (!session.isLoading){

		if (!session.currentUser.data){

			return <Navigate to={"/login"} replace/>;

		}else {

			return (
				<AudioCallProvider>
					<Outlet />
					<AudioCallOverlay />
					<IncomingCallModal />
					<CallEndedToast />
				</AudioCallProvider>
			);

		}

	}else {

		return <><h1>Chargement du bundle...</h1></>
	}
}