export interface ServerCallParticipant {
    userId: string;
    socketId: string;
    firstname: string;
    lastname: string;
    picture: string;
    joinedAt: number;
}

export interface ServerActiveCall {
    callId: string;
    callType: "audio" | "video";
    initiatorId: string;
    isGroupCall: boolean;
    participants: Map<string, ServerCallParticipant>;
    invitedUserIds: string[];
    createdAt: number;
}

export default class ActiveCallStore {

    private static calls: Map<string, ServerActiveCall> = new Map();
    private static userToCall: Map<string, string> = new Map();

    static createCall(callId: string, initiatorId: string, targetUserIds: string[], isGroupCall: boolean, callType: "audio" | "video" = "audio"): ServerActiveCall {

        const call: ServerActiveCall = {
            callId,
            callType,
            initiatorId,
            isGroupCall,
            participants: new Map(),
            invitedUserIds: targetUserIds,
            createdAt: Date.now(),
        };

        this.calls.set(callId, call);
        return call;
    }

    static addParticipant(callId: string, participant: ServerCallParticipant): boolean {

        const call = this.calls.get(callId);
        if (!call) return false;

        call.participants.set(participant.userId, participant);
        this.userToCall.set(participant.userId, callId);
        return true;
    }

    static removeParticipant(callId: string, userId: string): ServerActiveCall | null {

        const call = this.calls.get(callId);
        if (!call) return null;

        call.participants.delete(userId);
        this.userToCall.delete(userId);
        return call;
    }

    static getCall(callId: string): ServerActiveCall | undefined {

        return this.calls.get(callId);
    }

    static getCallByUserId(userId: string): ServerActiveCall | undefined {

        const callId = this.userToCall.get(userId);
        if (!callId) return undefined;
        return this.calls.get(callId);
    }

    static deleteCall(callId: string): void {

        const call = this.calls.get(callId);
        if (call) {
            for (const userId of call.participants.keys()) {
                this.userToCall.delete(userId);
            }
            this.calls.delete(callId);
        }
    }

    static isUserInCall(userId: string): boolean {

        return this.userToCall.has(userId);
    }
}
