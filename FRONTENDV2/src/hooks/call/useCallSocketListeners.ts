import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import type {
    ActiveCallState,
    IncomingCallInfo,
    SdpPayload,
    IceCandidatePayload,
} from "types/Call";

interface CallSocketListenersOptions {
    getSocket: () => Socket;
    callState: ActiveCallState | null;

    sendOfferToRemoteUser: (remoteUserId: string, callId: string) => Promise<void>;
    processOffer: (payload: SdpPayload) => Promise<void>;
    processAnswer: (payload: SdpPayload) => Promise<void>;
    processIceCandidate: (payload: IceCandidatePayload) => Promise<void>;

    onIncomingCall: (payload: IncomingCallInfo & { participants: any[] }) => void;
    onParticipantsList: (payload: { callId: string; participants: any[] }) => void;
    onUserJoined: (payload: { callId: string; userId: string; userName: string; userPicture: string }) => void;
    onUserLeft: (payload: { callId: string; userId: string }) => void;
    onUserRejected: (payload: { callId: string; userId: string }) => void;
    onCallEnded: () => void;
    onCallError: (message: string) => void;
    onMuteToggle: (payload: { callId: string; userId: string; isMuted: boolean }) => void;
}

export function useCallSocketListeners({
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
}: CallSocketListenersOptions): void {
    useEffect(() => {
        const socket = getSocket();

        const handleParticipantsList = (payload: { callId: string; participants: any[] }) => {
            for (const participant of payload.participants) {
                sendOfferToRemoteUser(participant.userId, payload.callId);
            }
            onParticipantsList(payload);
        };

        const handleError = (payload: { message: string }) => {
            onCallError(payload.message);
        };

        socket.on("call:incoming", onIncomingCall);
        socket.on("call:participants-list", handleParticipantsList);
        socket.on("call:user-joined", onUserJoined);
        socket.on("call:offer", processOffer);
        socket.on("call:answer", processAnswer);
        socket.on("call:ice-candidate", processIceCandidate);
        socket.on("call:user-left", onUserLeft);
        socket.on("call:user-rejected", onUserRejected);
        socket.on("call:ended", onCallEnded);
        socket.on("call:error", handleError);
        socket.on("call:mute-toggle", onMuteToggle);

        return () => {
            socket.off("call:incoming", onIncomingCall);
            socket.off("call:participants-list", handleParticipantsList);
            socket.off("call:user-joined", onUserJoined);
            socket.off("call:offer", processOffer);
            socket.off("call:answer", processAnswer);
            socket.off("call:ice-candidate", processIceCandidate);
            socket.off("call:user-left", onUserLeft);
            socket.off("call:user-rejected", onUserRejected);
            socket.off("call:ended", onCallEnded);
            socket.off("call:error", handleError);
            socket.off("call:mute-toggle", onMuteToggle);
        };
    }, [
        callState,
        getSocket,
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
    ]);
}
