import { FC, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { AuthenticatedLayout } from "components/AuthenticatedLayout/AuthenticatedLayout";
import { CallProvider, useCall } from "contexts/call/CallContext";
import { AudioCallOverlay, VideoCallOverlay, IncomingCallModal } from "components/call";
import "./CallEndedToast.scss";

const CallEndedToast: FC = () => {

	const { callEndedNotice, dismissCallEndedNotice } = useCall();

	useEffect(() => {
		if (!callEndedNotice) return;
		const timer = setTimeout(dismissCallEndedNotice, 4000);
		return () => clearTimeout(timer);
	}, [callEndedNotice, dismissCallEndedNotice]);

	return (
		<AnimatePresence>
			{callEndedNotice && (
				<motion.div
					className="callEndedToast"
					initial={{ opacity: 0, y: -30 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -30 }}
					onClick={dismissCallEndedNotice}
				>
					<PhoneOff size={18} className="callEndedIcon" />
					{callEndedNotice}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const UserAuth: FC = () => {

	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) return <h1>Chargement du bundle...</h1>;

	if (!isAuthenticated) return <Navigate to={"/login"} replace />;

	return (
		<CallProvider>
			<AuthenticatedLayout />
			<AudioCallOverlay />
			<VideoCallOverlay />
			<IncomingCallModal />
			<CallEndedToast />
		</CallProvider>
	);
}
