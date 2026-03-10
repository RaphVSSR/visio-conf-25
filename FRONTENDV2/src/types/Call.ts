export type CallStatus = "idle" | "outgoing" | "incoming" | "active";

export type CallType = "audio" | "video";

export interface MediaConstraints {
    audio: boolean;
    video: boolean;
}

export interface CallParticipant {
    userId: string;
    socketId: string;
    firstname: string;
    lastname: string;
    picture: string;
    isMuted: boolean;
    isCameraOn: boolean;
    isConnected: boolean;
}

export interface ActiveCallState {
    callId: string;
    callType: CallType;
    status: CallStatus;
    isGroupCall: boolean;
    participants: CallParticipant[];
    initiatorId: string;
    startTime: number | null;
    isMuted: boolean;
    isCameraOn: boolean;
}

export interface IncomingCallInfo {
    callId: string;
    callType: CallType;
    callerId: string;
    callerName: string;
    callerPicture: string;
    isGroupCall: boolean;
}

export interface TargetUser {
    userId: string;
    firstname: string;
    lastname: string;
    picture: string;
}

export interface SdpPayload {
    callId: string;
    fromUserId: string;
    sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
    fromUserId: string;
    candidate: RTCIceCandidateInit;
}
