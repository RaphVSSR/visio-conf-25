import { FC, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import {
  AudioCallProvider,
  useAudioCall,
} from "contexts/call/AudioCallContext";
import { AudioCallOverlay, IncomingCallModal } from "components/call";
import { PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./CallEndedToast.scss";
import { Sidebar } from "components/Navigation/Sidebar";
import "./UserAuth.scss";

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

/**
 * Garde de route pour les pages protégées.
 * Redirige vers /login si l'utilisateur n'est pas authentifié.
 * Affiche un écran de chargement pendant la vérification.
 */
export const UserAuth: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <h1>Chargement du bundle...</h1>;

  if (!isAuthenticated) return <Navigate to={"/login"} replace />;

  return (
    <AudioCallProvider>
      <div id="authenticatedLayout">
        <Sidebar />
        <main id="mainContent">
          <Outlet />
        </main>
      </div>
      <AudioCallOverlay />
      <IncomingCallModal />
      <CallEndedToast />
    </AudioCallProvider>
  );
};
