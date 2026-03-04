import { useRef, useCallback } from "react";
import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import type { MediaConstraints, SdpPayload, IceCandidatePayload } from "types/Call";

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export interface PeerConnectionsOptions {
    currentUserId: string | undefined;
    getSocket: () => Socket;
    mediaConstraints: MediaConstraints;
    onRemoteTrackReceived: (remoteUserId: string, stream: MediaStream) => void;
    onParticipantConnectionChanged: (remoteUserId: string, connected: boolean) => void;
}

export interface PeerConnectionsReturn {
    localMediaStream: MutableRefObject<MediaStream | null>;
    peerConnectionsByUserId: MutableRefObject<Map<string, RTCPeerConnection>>;
    acquireMediaStream: () => Promise<MediaStream>;
    createPeerConnectionForRemoteUser: (remoteUserId: string, callId: string) => RTCPeerConnection;
    sendOfferToRemoteUser: (remoteUserId: string, callId: string) => Promise<void>;
    handleReceivedOffer: (payload: SdpPayload) => Promise<void>;
    handleReceivedAnswer: (payload: SdpPayload) => Promise<void>;
    handleReceivedIceCandidate: (payload: IceCandidatePayload) => Promise<void>;
    closePeerConnectionForUser: (userId: string) => void;
    closeAllPeerConnections: () => void;
}

export function usePeerConnections(options: PeerConnectionsOptions): PeerConnectionsReturn {
    const peerConnectionsByUserId = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localMediaStream = useRef<MediaStream | null>(null);
    const pendingIceCandidatesByUserId = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const acquireMediaStream = useCallback(async (): Promise<MediaStream> => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: options.mediaConstraints.audio,
            video: options.mediaConstraints.video,
        });
        localMediaStream.current = stream;
        return stream;
    }, [options.mediaConstraints.audio, options.mediaConstraints.video]);

    const createPeerConnectionForRemoteUser = useCallback(
        (remoteUserId: string, callId: string): RTCPeerConnection => {
            const existing = peerConnectionsByUserId.current.get(remoteUserId);
            if (existing) return existing;

            const peerConnection = new RTCPeerConnection(ICE_SERVERS);
            const socket = options.getSocket();

            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, localMediaStream.current!);
                });
            }

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:ice-candidate", {
                        callId,
                        fromUserId: options.currentUserId,
                        toUserId: remoteUserId,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                const stream = event.streams[0];
                if (stream) {
                    options.onRemoteTrackReceived(remoteUserId, stream);
                }
            };

            peerConnection.onconnectionstatechange = () => {
                if (peerConnection.connectionState === "connected") {
                    options.onParticipantConnectionChanged(remoteUserId, true);
                }
                if (
                    peerConnection.connectionState === "disconnected" ||
                    peerConnection.connectionState === "failed"
                ) {
                    options.onParticipantConnectionChanged(remoteUserId, false);
                }
            };

            peerConnectionsByUserId.current.set(remoteUserId, peerConnection);
            return peerConnection;
        },
        [options],
    );

    const sendOfferToRemoteUser = useCallback(
        async (remoteUserId: string, callId: string) => {
            const peerConnection = createPeerConnectionForRemoteUser(remoteUserId, callId);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            options.getSocket().emit("call:offer", {
                callId,
                fromUserId: options.currentUserId,
                toUserId: remoteUserId,
                sdp: offer,
            });
        },
        [createPeerConnectionForRemoteUser, options],
    );

    const handleReceivedOffer = useCallback(
        async (payload: SdpPayload) => {
            const peerConnection = createPeerConnectionForRemoteUser(payload.fromUserId, payload.callId);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

            const buffered = pendingIceCandidatesByUserId.current.get(payload.fromUserId);
            if (buffered) {
                for (const candidate of buffered) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingIceCandidatesByUserId.current.delete(payload.fromUserId);
            }

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            options.getSocket().emit("call:answer", {
                callId: payload.callId,
                fromUserId: options.currentUserId,
                toUserId: payload.fromUserId,
                sdp: answer,
            });
        },
        [createPeerConnectionForRemoteUser, options],
    );

    const handleReceivedAnswer = useCallback(
        async (payload: SdpPayload) => {
            const peerConnection = peerConnectionsByUserId.current.get(payload.fromUserId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

                const buffered = pendingIceCandidatesByUserId.current.get(payload.fromUserId);
                if (buffered) {
                    for (const candidate of buffered) {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    pendingIceCandidatesByUserId.current.delete(payload.fromUserId);
                }
            }
        },
        [],
    );

    const handleReceivedIceCandidate = useCallback(
        async (payload: IceCandidatePayload) => {
            const peerConnection = peerConnectionsByUserId.current.get(payload.fromUserId);
            if (peerConnection && peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } else {
                if (!pendingIceCandidatesByUserId.current.has(payload.fromUserId)) {
                    pendingIceCandidatesByUserId.current.set(payload.fromUserId, []);
                }
                pendingIceCandidatesByUserId.current
                    .get(payload.fromUserId)!
                    .push(payload.candidate);
            }
        },
        [],
    );

    const closePeerConnectionForUser = useCallback((userId: string) => {
        const peerConnection = peerConnectionsByUserId.current.get(userId);
        if (peerConnection) {
            peerConnection.close();
            peerConnectionsByUserId.current.delete(userId);
        }
    }, []);

    const closeAllPeerConnections = useCallback(() => {
        peerConnectionsByUserId.current.forEach((pc) => pc.close());
        peerConnectionsByUserId.current.clear();

        localMediaStream.current?.getTracks().forEach((track) => track.stop());
        localMediaStream.current = null;

        pendingIceCandidatesByUserId.current.clear();
    }, []);

    return {
        localMediaStream,
        peerConnectionsByUserId,
        acquireMediaStream,
        createPeerConnectionForRemoteUser,
        sendOfferToRemoteUser,
        handleReceivedOffer,
        handleReceivedAnswer,
        handleReceivedIceCandidate,
        closePeerConnectionForUser,
        closeAllPeerConnections,
    };
}
