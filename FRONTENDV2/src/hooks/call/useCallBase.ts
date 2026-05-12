import { useState, useCallback } from "react";
import { useAuth } from "hooks/useAuth";
import type {
    ActiveCallState,
    CallStatus,
    CallType,
    IncomingCallInfo,
    MediaConstraints,
    TargetUser,
} from "types/Call";
import { v4 as uuidv4 } from "uuid";
import { usePeerConnections } from "./usePeerConnections";
import { useCallSocketListeners } from "./useCallSocketListeners";

interface CallBaseHookOptions {
    onRemoteTrackReceived: (remoteUserId: string, stream: MediaStream) => void;
    onRemoteTrackRemoved: (remoteUserId: string) => void;
    onCleanupRemoteMedia: () => void;
}

interface CallBaseHookReturn {
    callState: ActiveCallState | null;
    incomingCall: IncomingCallInfo | null;
    callEndedNotice: string | null;
    localMediaStream: React.MutableRefObject<MediaStream | null>;
    initiateCall: (targetUsers: TargetUser[], callType: CallType) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    hangUp: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    dismissCallEndedNotice: () => void;
    setCallState: React.Dispatch<React.SetStateAction<ActiveCallState | null>>;
}

export function useCallBase(options: CallBaseHookOptions): CallBaseHookReturn {
    const { user } = useAuth();
    const socket: any = null;

    const [callState, setCallState] = useState<ActiveCallState | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [callEndedNotice, setCallEndedNotice] = useState<string | null>(null);

    const getSocket = useCallback((): any => socket, [socket]);

    // --- Peer connections ---

    const onParticipantConnectionChanged = useCallback(
        (remoteUserId: string, connected: boolean) => {
            setCallState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    participants: prev.participants.map((p) =>
                        p.userId === remoteUserId ? { ...p, isConnected: connected } : p,
                    ),
                };
            });
        },
        [],
    );

    const {
        localMediaStream,
        getLocalMediasStream,
        sendOfferToRemoteUser,
        processOffer,
        processAnswer,
        processIceCandidate,
        closeMediasStreamRemoteConnection,
        closeAllRemoteConnections,
    } = usePeerConnections({
        currentUserId: user?._id,
        getSocket,
        mediaConstraints: { audio: true, video: false },
        onRemoteTrackReceived: options.onRemoteTrackReceived,
        onParticipantConnectionChanged,
    });

    // --- Cleanup ---

    const cleanupCall = useCallback(() => {
        closeAllRemoteConnections();
        options.onCleanupRemoteMedia();
        setCallState(null);
        setIncomingCall(null);
    }, [closeAllRemoteConnections, options]);

    // --- Socket event callbacks ---

    const onIncomingCall = useCallback(
        (payload: IncomingCallInfo & { participants: any[] }) => {
            if (callState) return;
            setIncomingCall({
                callId: payload.callId,
                callType: payload.callType || "audio",
                callerId: payload.callerId,
                callerName: payload.callerName,
                callerPicture: payload.callerPicture,
                isGroupCall: payload.isGroupCall,
            });
        },
        [callState],
    );

    const onParticipantsList = useCallback(
        (payload: { callId: string; participants: any[] }) => {
            setCallState((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "active" as CallStatus,
                          startTime: prev.startTime || Date.now(),
                          participants: payload.participants.map((p: any) => ({
                              userId: p.userId,
                              socketId: p.socketId,
                              firstname: p.firstname,
                              lastname: p.lastname,
                              picture: p.picture,
                              isMuted: false,
                              isCameraOn: prev.callType === "video",
                              isConnected: false,
                          })),
                      }
                    : prev,
            );
        },
        [],
    );

    const onUserJoined = useCallback(
        (payload: { callId: string; userId: string; userName: string; userPicture: string }) => {
            setCallState((prev) => {
                if (!prev) return prev;
                const newStatus: CallStatus =
                    prev.status === "outgoing" ? "active" : prev.status;
                return {
                    ...prev,
                    status: newStatus,
                    startTime: prev.startTime || Date.now(),
                    participants: [
                        ...prev.participants.filter((p) => p.userId !== payload.userId),
                        {
                            userId: payload.userId,
                            socketId: "",
                            firstname: payload.userName.split(" ")[0] || "",
                            lastname: payload.userName.split(" ").slice(1).join(" "),
                            picture: payload.userPicture,
                            isMuted: false,
                            isCameraOn: prev.callType === "video",
                            isConnected: false,
                        },
                    ],
                };
            });
        },
        [],
    );

    const onUserLeft = useCallback(
        (payload: { callId: string; userId: string }) => {
            closeMediasStreamRemoteConnection(payload.userId);
            options.onRemoteTrackRemoved(payload.userId);
            setCallState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    participants: prev.participants.filter(
                        (p) => p.userId !== payload.userId,
                    ),
                };
            });
        },
        [closeMediasStreamRemoteConnection, options],
    );

    const onUserRejected = useCallback(
        (payload: { callId: string; userId: string }) => {
            setCallState((prev) => {
                if (!prev) return prev;
                const remaining = prev.participants.filter(p => p.userId !== payload.userId);
                if (!prev.isGroupCall) {
                    setCallEndedNotice("L'appel a été refusé");
                }
                return { ...prev, participants: remaining };
            });
        },
        [],
    );

    const onCallEnded = useCallback(() => {
        if (callState) {
            setCallEndedNotice(prev => prev ?? "L'autre participant a mis fin a l'appel");
        }
        cleanupCall();
    }, [callState, cleanupCall]);

    const onCallError = useCallback(
        (message: string) => {
            setCallEndedNotice(message);
            cleanupCall();
        },
        [cleanupCall],
    );

    const onMuteToggle = useCallback(
        (payload: { callId: string; userId: string; isMuted: boolean }) => {
            setCallState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    participants: prev.participants.map((p) =>
                        p.userId === payload.userId
                            ? { ...p, isMuted: payload.isMuted }
                            : p,
                    ),
                };
            });
        },
        [],
    );

    const onCameraToggle = useCallback(
        (payload: { callId: string; userId: string; isCameraOn: boolean }) => {
            setCallState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    participants: prev.participants.map((p) =>
                        p.userId === payload.userId
                            ? { ...p, isCameraOn: payload.isCameraOn }
                            : p,
                    ),
                };
            });
        },
        [],
    );

    useCallSocketListeners({
        getSocket,
        callState,
        sendOfferToRemoteUser,
        processOffer,
        processAnswer,
        processIceCandidate,
        onIncomingCall,
        onParticipantsList,
        onUserJoined,
        onUserLeft,
        onUserRejected,
        onCallEnded,
        onCallError,
        onMuteToggle,
        onCameraToggle,
    });

    // --- Public actions ---

    const initiateCall = useCallback(
        async (targetUsers: TargetUser[], callType: CallType = "audio") => {
            if (!user) return;

            const callId = uuidv4();
            const isGroupCall = targetUsers.length > 1;
            const constraints: MediaConstraints = {
                audio: true,
                video: callType === "video",
            };

            try {
                await getLocalMediasStream(constraints);
            } catch {
                setCallEndedNotice(
                    callType === "video"
                        ? "Accès à la caméra/micro refusé"
                        : "Accès au micro refusé",
                );
                return;
            }

            setCallState({
                callId,
                callType,
                status: "outgoing",
                isGroupCall,
                participants: targetUsers.map((u) => ({
                    userId: u.userId,
                    socketId: "",
                    firstname: u.firstname,
                    lastname: u.lastname,
                    picture: u.picture,
                    isMuted: false,
                    isCameraOn: callType === "video",
                    isConnected: false,
                })),
                initiatorId: user._id,
                startTime: null,
                isMuted: false,
                isCameraOn: callType === "video",
            });

            getSocket()?.send("call:initiate", {
                callId,
                callType,
                targetUserIds: targetUsers.map((u) => u.userId),
                callerName: `${user.firstname} ${user.lastname}`,
                callerPicture: user.picture || "",
                isGroupCall,
            });
        },
        [user, getLocalMediasStream, getSocket],
    );

    const acceptCall = useCallback(async () => {
        if (!incomingCall || !user) return;

        const constraints: MediaConstraints = {
            audio: true,
            video: incomingCall.callType === "video",
        };

        try {
            await getLocalMediasStream(constraints);
        } catch {
            setCallEndedNotice(
                incomingCall.callType === "video"
                    ? "Accès à la caméra/micro refusé"
                    : "Accès au micro refusé",
            );
            getSocket()?.send("call:reject", { callId: incomingCall.callId });
            setIncomingCall(null);
            return;
        }

        setCallState({
            callId: incomingCall.callId,
            callType: incomingCall.callType,
            status: "active",
            isGroupCall: incomingCall.isGroupCall,
            participants: [],
            initiatorId: incomingCall.callerId,
            startTime: Date.now(),
            isMuted: false,
            isCameraOn: incomingCall.callType === "video",
        });

        getSocket()?.send("call:accept", {
            callId: incomingCall.callId,
            userName: `${user.firstname} ${user.lastname}`,
            userPicture: user.picture || "",
        });

        setIncomingCall(null);
    }, [incomingCall, user, getLocalMediasStream, getSocket]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        getSocket()?.send("call:reject", { callId: incomingCall.callId });
        setIncomingCall(null);
    }, [incomingCall, getSocket]);

    const hangUp = useCallback(() => {
        if (!callState) return;
        getSocket()?.send("call:hangup", { callId: callState.callId });
        cleanupCall();
    }, [callState, cleanupCall, getSocket]);

    const dismissCallEndedNotice = useCallback(() => {
        setCallEndedNotice(null);
    }, []);

    const toggleMute = useCallback(() => {
        if (!localMediaStream.current) return;
        const audioTrack = localMediaStream.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setCallState((prev) =>
                prev ? { ...prev, isMuted: !audioTrack.enabled } : prev,
            );

            if (callState) {
                getSocket()?.send("call:mute-toggle", {
                    callId: callState.callId,
                    isMuted: !audioTrack.enabled,
                });
            }
        }
    }, [callState, getSocket]);

    const toggleCamera = useCallback(() => {
        if (!localMediaStream.current) return;
        const videoTrack = localMediaStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setCallState((prev) =>
                prev ? { ...prev, isCameraOn: videoTrack.enabled } : prev,
            );

            if (callState) {
                getSocket()?.send("call:camera-toggle", {
                    callId: callState.callId,
                    isCameraOn: videoTrack.enabled,
                });
            }
        }
    }, [callState, getSocket]);

    return {
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
        setCallState,
    };
}
