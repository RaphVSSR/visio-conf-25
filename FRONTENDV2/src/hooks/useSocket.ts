import { useEffect, useState } from "react";
import { SocketIO } from "services/SocketIO";

export const useSocket = () => {
  const [isReady, setIsReady] = useState(false);
  const [controleur, setControleur] = useState<any>(null);

  useEffect(() => {
    const checkReady = () => {
      try {
        const canal = SocketIO.canal;
        if (canal && canal.controleur) {
          setControleur(canal.controleur);
          setIsReady(true);
        }
      } catch (e) {
        // Not ready yet
      }
    };

    SocketIO.onReady(checkReady);
    checkReady(); // Check immediately
  }, []);

  return { controleur, isReady };
};
