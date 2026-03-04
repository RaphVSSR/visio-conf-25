import React, { createContext, useContext, useRef, useCallback } from "react";
import { useCallBase } from "hooks/call/useCallBase";
import type { ActiveCallState, IncomingCallInfo, TargetUser } from "types/Call";

interface AudioCallContextType {
    callState: ActiveCallState | null;
    incomingCall: IncomingCallInfo | null;
    callEndedNotice: string | null;
    initiateCall: (targetUsers: TargetUser[]) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    hangUp: () => void;
    toggleMute: () => void;
    dismissCallEndedNotice: () => void;
}

export const AudioCallContext = createContext<AudioCallContextType | null>(null);

export const AudioCallProvider = ({ children }: { children: React.ReactNode }) => {
    const remoteAudioElementsByUserId = useRef<Map<string, HTMLAudioElement>>(new Map());

    const handleRemoteTrackReceived = useCallback((remoteUserId: string, stream: MediaStream) => {
        let audio = remoteAudioElementsByUserId.current.get(remoteUserId);
        if (!audio) {
            audio = new Audio();
            audio.autoplay = true;
            remoteAudioElementsByUserId.current.set(remoteUserId, audio);
        }
        audio.srcObject = stream;
    }, []);

    const handleRemoteTrackRemoved = useCallback((remoteUserId: string) => {
        const audio = remoteAudioElementsByUserId.current.get(remoteUserId);
        if (audio) {
            audio.srcObject = null;
            remoteAudioElementsByUserId.current.delete(remoteUserId);
        }
    }, []);

    const handleCleanupRemoteMedia = useCallback(() => {
        remoteAudioElementsByUserId.current.forEach((audio) => {
            audio.srcObject = null;
        });
        remoteAudioElementsByUserId.current.clear();
    }, []);

    const {
        callState,
        incomingCall,
        callEndedNotice,
        initiateCall,
        acceptCall,
        rejectCall,
        hangUp,
        toggleMute,
        dismissCallEndedNotice,
    } = useCallBase({
        callType: "audio",
        mediaConstraints: { audio: true, video: false },
        onRemoteTrackReceived: handleRemoteTrackReceived,
        onRemoteTrackRemoved: handleRemoteTrackRemoved,
        onCleanupRemoteMedia: handleCleanupRemoteMedia,
    });

    return (
        <AudioCallContext.Provider
            value={{
                callState,
                incomingCall,
                callEndedNotice,
                initiateCall,
                acceptCall,
                rejectCall,
                hangUp,
                toggleMute,
                dismissCallEndedNotice,
            }}
        >
            {children}
        </AudioCallContext.Provider>
    );
};

export const useAudioCall = () => {
    const context = useContext(AudioCallContext);
    if (!context)
        throw new Error("useAudioCall must be used within AudioCallProvider");
    return context;
};
