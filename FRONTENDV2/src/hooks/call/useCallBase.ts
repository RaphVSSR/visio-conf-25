import { useState, useCallback, useEffect, useContext } from "react";
import { SessionContext } from "contexts/SessionContext";
import Controller from "core/Controller";
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

export interface CallBaseHookOptions {
    callType: CallType;
    mediaConstraints: MediaConstraints;
    onRemoteTrackReceived: (remoteUserId: string, stream: MediaStream) => void;
    onRemoteTrackRemoved: (remoteUserId: string) => void;
    onCleanupRemoteMedia: () => void;
}

export interface CallBaseHookReturn {
    callState: ActiveCallState | null;
    incomingCall: IncomingCallInfo | null;
    callEndedNotice: string | null;
    localMediaStream: React.MutableRefObject<MediaStream | null>;
    initiateCall: (targetUsers: TargetUser[]) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    hangUp: () => void;
    toggleMute: () => void;
    dismissCallEndedNotice: () => void;
    setCallState: React.Dispatch<React.SetStateAction<ActiveCallState | null>>;
}

export function useCallBase(options: CallBaseHookOptions): CallBaseHookReturn {
    const session = useContext(SessionContext);
    const currentUser = session?.currentUser?.data?.user;

    const [callState, setCallState] = useState<ActiveCallState | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [callEndedNotice, setCallEndedNotice] = useState<string | null>(null);

    const getSocket = useCallback(() => Controller.getSocket(), []);

    useEffect(() => {
        if (currentUser?.id) {
            Controller.socketInit(currentUser.id);
        }
    }, [currentUser?.id]);

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
        acquireMediaStream,
        sendOfferToRemoteUser,
        handleReceivedOffer,
        handleReceivedAnswer,
        handleReceivedIceCandidate,
        closePeerConnectionForUser,
        closeAllPeerConnections,
    } = usePeerConnections({
        currentUserId: currentUser?.id,
        getSocket,
        mediaConstraints: options.mediaConstraints,
        onRemoteTrackReceived: options.onRemoteTrackReceived,
        onParticipantConnectionChanged,
    });

    // --- Cleanup ---

    const cleanupCall = useCallback(() => {
        closeAllPeerConnections();
        options.onCleanupRemoteMedia();
        setCallState(null);
        setIncomingCall(null);
    }, [closeAllPeerConnections, options]);

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
                              isCameraOn: false,
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
                            isCameraOn: false,
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
            closePeerConnectionForUser(payload.userId);
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
        [closePeerConnectionForUser, options],
    );

    const onUserRejected = useCallback(
        (payload: { callId: string; userId: string }) => {
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
        [],
    );

    const onCallEnded = useCallback(() => {
        if (callState) {
            setCallEndedNotice("L'autre participant a mis fin a l'appel");
        }
        cleanupCall();
    }, [callState, cleanupCall]);

    const onCallError = useCallback(
        (message: string) => {
            console.error("Call error:", message);
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

    useCallSocketListeners({
        getSocket,
        callState,
        sendOfferToRemoteUser,
        handleReceivedOffer,
        handleReceivedAnswer,
        handleReceivedIceCandidate,
        onIncomingCall,
        onParticipantsList,
        onUserJoined,
        onUserLeft,
        onUserRejected,
        onCallEnded,
        onCallError,
        onMuteToggle,
    });

    // --- Public actions ---

    const initiateCall = useCallback(
        async (targetUsers: TargetUser[]) => {
            if (!currentUser) return;

            const callId = uuidv4();
            const isGroupCall = targetUsers.length > 1;

            await acquireMediaStream();

            setCallState({
                callId,
                callType: options.callType,
                status: "outgoing",
                isGroupCall,
                participants: targetUsers.map((u) => ({
                    userId: u.userId,
                    socketId: "",
                    firstname: u.firstname,
                    lastname: u.lastname,
                    picture: u.picture,
                    isMuted: false,
                    isCameraOn: options.callType === "video",
                    isConnected: false,
                })),
                initiatorId: currentUser.id,
                startTime: null,
                isMuted: false,
                isCameraOn: options.callType === "video",
            });

            getSocket().emit("call:initiate", {
                callId,
                callType: options.callType,
                targetUserIds: targetUsers.map((u) => u.userId),
                callerName: `${currentUser.name}`,
                callerPicture: currentUser.image || "",
                isGroupCall,
            });
        },
        [currentUser, acquireMediaStream, getSocket, options.callType],
    );

    const acceptCall = useCallback(async () => {
        if (!incomingCall || !currentUser) return;

        await acquireMediaStream();

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

        getSocket().emit("call:accept", {
            callId: incomingCall.callId,
            userName: `${currentUser.name}`,
            userPicture: currentUser.image || "",
        });

        setIncomingCall(null);
    }, [incomingCall, currentUser, acquireMediaStream, getSocket]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        getSocket().emit("call:reject", { callId: incomingCall.callId });
        setIncomingCall(null);
    }, [incomingCall, getSocket]);

    const hangUp = useCallback(() => {
        if (!callState) return;
        getSocket().emit("call:hangup", { callId: callState.callId });
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
                getSocket().emit("call:mute-toggle", {
                    callId: callState.callId,
                    isMuted: !audioTrack.enabled,
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
        dismissCallEndedNotice,
        setCallState,
    };
}
