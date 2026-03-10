import { Server, Socket } from "socket.io";
import ActiveCallStore from "../ActiveCall.ts";

export default class CallSignaling {

    private static io: Server;

    static init(io: Server) {
        this.io = io;
    }

    static registerSocketHandlers(socket: Socket) {

        socket.on("call:initiate", (payload) => this.handleInitiate(socket, payload));
        socket.on("call:accept", (payload) => this.handleAccept(socket, payload));
        socket.on("call:reject", (payload) => this.handleReject(socket, payload));
        socket.on("call:offer", (payload) => this.handleOffer(socket, payload));
        socket.on("call:answer", (payload) => this.handleAnswer(socket, payload));
        socket.on("call:ice-candidate", (payload) => this.handleIceCandidate(socket, payload));
        socket.on("call:hangup", (payload) => this.handleHangup(socket, payload));
        socket.on("call:mute-toggle", (payload) => this.handleMuteToggle(socket, payload));
        socket.on("disconnect", () => this.handleDisconnect(socket));
    }

    private static handleInitiate(socket: Socket, payload: {
        callId: string;
        callType?: "audio" | "video";
        targetUserIds: string[];
        callerName: string;
        callerPicture: string;
        isGroupCall: boolean;
    }) {
        const callerId = socket.data.userId;
        if (!callerId) return;

        if (ActiveCallStore.isUserInCall(callerId)) {
            socket.emit("call:error", { message: "You are already in a call" });
            return;
        }

        const callType = payload.callType || "audio";
        const call = ActiveCallStore.createCall(
            payload.callId, callerId, payload.targetUserIds, payload.isGroupCall, callType
        );

        ActiveCallStore.addParticipant(payload.callId, {
            userId: callerId,
            socketId: socket.id,
            firstname: payload.callerName.split(" ")[0],
            lastname: payload.callerName.split(" ").slice(1).join(" "),
            picture: payload.callerPicture,
            joinedAt: Date.now()
        });

        socket.join(`call:${payload.callId}`);

        for (const targetUserId of payload.targetUserIds) {
            const targetSocketId = this.findSocketIdForUser(targetUserId);
            if (targetSocketId) {
                this.io.to(targetSocketId).emit("call:incoming", {
                    callId: payload.callId,
                    callType,
                    callerId,
                    callerName: payload.callerName,
                    callerPicture: payload.callerPicture,
                    isGroupCall: payload.isGroupCall,
                    participants: Array.from(call.participants.values())
                });
            }
        }
    }

    private static handleAccept(socket: Socket, payload: {
        callId: string;
        userName: string;
        userPicture: string;
    }) {
        const userId = socket.data.userId;
        const call = ActiveCallStore.getCall(payload.callId);
        if (!call || !userId) return;

        ActiveCallStore.addParticipant(payload.callId, {
            userId,
            socketId: socket.id,
            firstname: payload.userName.split(" ")[0],
            lastname: payload.userName.split(" ").slice(1).join(" "),
            picture: payload.userPicture,
            joinedAt: Date.now()
        });

        socket.join(`call:${payload.callId}`);

        socket.to(`call:${payload.callId}`).emit("call:user-joined", {
            callId: payload.callId,
            userId,
            userName: payload.userName,
            userPicture: payload.userPicture,
            socketId: socket.id
        });

        const existingParticipants = Array.from(call.participants.values())
            .filter(p => p.userId !== userId);

        socket.emit("call:participants-list", {
            callId: payload.callId,
            participants: existingParticipants
        });
    }

    private static handleOffer(socket: Socket, payload: {
        callId: string;
        fromUserId: string;
        toUserId: string;
        sdp: RTCSessionDescriptionInit;
    }) {
        const targetSocketId = this.findSocketIdForUser(payload.toUserId);
        if (targetSocketId) {
            this.io.to(targetSocketId).emit("call:offer", {
                callId: payload.callId,
                fromUserId: payload.fromUserId,
                sdp: payload.sdp
            });
        }
    }

    private static handleAnswer(socket: Socket, payload: {
        callId: string;
        fromUserId: string;
        toUserId: string;
        sdp: RTCSessionDescriptionInit;
    }) {
        const targetSocketId = this.findSocketIdForUser(payload.toUserId);
        if (targetSocketId) {
            this.io.to(targetSocketId).emit("call:answer", {
                callId: payload.callId,
                fromUserId: payload.fromUserId,
                sdp: payload.sdp
            });
        }
    }

    private static handleIceCandidate(socket: Socket, payload: {
        callId: string;
        fromUserId: string;
        toUserId: string;
        candidate: RTCIceCandidateInit;
    }) {
        const targetSocketId = this.findSocketIdForUser(payload.toUserId);
        if (targetSocketId) {
            this.io.to(targetSocketId).emit("call:ice-candidate", {
                callId: payload.callId,
                fromUserId: payload.fromUserId,
                candidate: payload.candidate
            });
        }
    }

    private static handleHangup(socket: Socket, payload: { callId: string }) {
        const userId = socket.data.userId;
        if (!userId) return;
        this.removeUserFromCall(payload.callId, userId, socket);
    }

    private static handleReject(socket: Socket, payload: { callId: string }) {
        const userId = socket.data.userId;
        if (!userId) return;
        const call = ActiveCallStore.getCall(payload.callId);
        if (!call) return;

        socket.to(`call:${payload.callId}`).emit("call:user-rejected", {
            callId: payload.callId,
            userId
        });

        if (!call.isGroupCall && call.participants.size <= 1) {
            this.endCall(payload.callId);
        }
    }

    private static handleMuteToggle(socket: Socket, payload: {
        callId: string;
        isMuted: boolean;
    }) {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.to(`call:${payload.callId}`).emit("call:mute-toggle", {
            callId: payload.callId,
            userId,
            isMuted: payload.isMuted
        });
    }

    private static handleDisconnect(socket: Socket) {
        const userId = socket.data.userId;
        if (!userId) return;
        const call = ActiveCallStore.getCallByUserId(userId);
        if (call) {
            this.removeUserFromCall(call.callId, userId, socket);
        }
    }

    private static removeUserFromCall(callId: string, userId: string, socket: Socket) {
        const call = ActiveCallStore.removeParticipant(callId, userId);
        socket.leave(`call:${callId}`);

        if (!call || call.participants.size === 0) {
            this.endCall(callId);
        } else if (call.participants.size === 1 && !call.isGroupCall) {
            this.endCall(callId);
        } else {
            this.io.to(`call:${callId}`).emit("call:user-left", {
                callId, userId
            });
        }
    }

    private static endCall(callId: string) {
        this.io.to(`call:${callId}`).emit("call:ended", { callId });
        this.io.in(`call:${callId}`).socketsLeave(`call:${callId}`);
        ActiveCallStore.deleteCall(callId);
    }

    private static findSocketIdForUser(userId: string): string | null {
        for (const [socketId, socket] of this.io.sockets.sockets) {
            if (socket.data.userId === userId) return socketId;
        }
        return null;
    }
}
