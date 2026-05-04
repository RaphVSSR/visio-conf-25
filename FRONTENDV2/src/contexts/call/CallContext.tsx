import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { useCallBase } from "hooks/call/useCallBase";
import type { ActiveCallState, CallType, IncomingCallInfo, TargetUser } from "types/Call";

interface CallContextType {
    callState: ActiveCallState | null;
    incomingCall: IncomingCallInfo | null;
    callEndedNotice: string | null;
    remoteStreams: Map<string, MediaStream>;
    localMediaStream: React.MutableRefObject<MediaStream | null>;
    initiateCall: (targetUsers: TargetUser[], callType: CallType) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    hangUp: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    dismissCallEndedNotice: () => void;
}

export const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const remoteAudioElementsByUserId = useRef<Map<string, HTMLAudioElement>>(new Map());
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const handleRemoteTrackReceived = useCallback((remoteUserId: string, stream: MediaStream) => {
        // Audio playback (works for both audio-only and video calls)
        let audio = remoteAudioElementsByUserId.current.get(remoteUserId);
        if (!audio) {
            audio = new Audio();
            audio.autoplay = true;
            remoteAudioElementsByUserId.current.set(remoteUserId, audio);
        }
        audio.srcObject = stream;

        // Video stream tracking (for video call UI)
        setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(remoteUserId, stream);
            return next;
        });
    }, []);

    const handleRemoteTrackRemoved = useCallback((remoteUserId: string) => {
        const audio = remoteAudioElementsByUserId.current.get(remoteUserId);
        if (audio) {
            audio.srcObject = null;
            remoteAudioElementsByUserId.current.delete(remoteUserId);
        }
        setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(remoteUserId);
            return next;
        });
    }, []);

    const handleCleanupRemoteMedia = useCallback(() => {
        remoteAudioElementsByUserId.current.forEach((audio) => {
            audio.srcObject = null;
        });
        remoteAudioElementsByUserId.current.clear();
        setRemoteStreams(new Map());
    }, []);

    const {
        callState,
        incomingCall,
        callEndedNotice,
        localMediaStream,
        initiateCall,
        acceptCall,
        rejectCall,
        hangUp,
        toggleMute,
        toggleCamera,
        dismissCallEndedNotice,
    } = useCallBase({
        onRemoteTrackReceived: handleRemoteTrackReceived,
        onRemoteTrackRemoved: handleRemoteTrackRemoved,
        onCleanupRemoteMedia: handleCleanupRemoteMedia,
    });

    return (
        <CallContext.Provider
            value={{
                callState,
                incomingCall,
                callEndedNotice,
                remoteStreams,
                localMediaStream,
                initiateCall,
                acceptCall,
                rejectCall,
                hangUp,
                toggleMute,
                toggleCamera,
                dismissCallEndedNotice,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context)
        throw new Error("useCall must be used within CallProvider");
    return context;
};

/** @deprecated Use useCall instead */
export const useAudioCall = useCall;
