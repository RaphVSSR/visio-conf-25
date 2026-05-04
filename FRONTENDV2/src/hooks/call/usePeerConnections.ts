import { useRef, useCallback } from "react";
import type { MutableRefObject } from "react";
import type MessageClientAdapter from "services/MessageClientAdapter";
import type { MediaConstraints, SdpPayload, IceCandidatePayload } from "types/Call";

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

interface PeerConnectionsOptions {
    currentUserId: string | undefined;
    getSocket: () => MessageClientAdapter | null;
    mediaConstraints: MediaConstraints;
    onRemoteTrackReceived: (remoteUserId: string, stream: MediaStream) => void;
    onParticipantConnectionChanged: (remoteUserId: string, connected: boolean) => void;
}

interface PeerConnectionsReturn {
    localMediaStream: MutableRefObject<MediaStream | null>;
    peerConnectionsByUserId: MutableRefObject<Map<string, RTCPeerConnection>>;
    getLocalMediasStream: (overrideConstraints?: MediaConstraints) => Promise<MediaStream>;
    createMediasStreamRemoteConnection: (remoteUserId: string, callId: string) => RTCPeerConnection;
    sendOfferToRemoteUser: (remoteUserId: string, callId: string) => Promise<void>;
    processOffer: (payload: SdpPayload) => Promise<void>;
    processAnswer: (payload: SdpPayload) => Promise<void>;
    processIceCandidate: (payload: IceCandidatePayload) => Promise<void>;
    closeMediasStreamRemoteConnection: (userId: string) => void;
    closeAllRemoteConnections: () => void;
}

export function usePeerConnections(options: PeerConnectionsOptions): PeerConnectionsReturn {
    const peerConnectionsByUserId = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localMediaStream = useRef<MediaStream | null>(null);
    const pendingIceCandidatesByUserId = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const getLocalMediasStream = useCallback(async (
        overrideConstraints?: MediaConstraints,
    ): Promise<MediaStream> => {
        const constraints = overrideConstraints || options.mediaConstraints;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: constraints.audio,
            video: constraints.video,
        });
        localMediaStream.current = stream;
        return stream;
    }, [options.mediaConstraints.audio, options.mediaConstraints.video]);

    const createMediasStreamRemoteConnection = useCallback(
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
                    socket?.send("call:ice-candidate", {
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
            const peerConnection = createMediasStreamRemoteConnection(remoteUserId, callId);
            if (peerConnection.signalingState !== "stable") return;

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            options.getSocket()?.send("call:offer", {
                callId,
                fromUserId: options.currentUserId,
                toUserId: remoteUserId,
                sdp: offer,
            });
        },
        [createMediasStreamRemoteConnection, options],
    );

    const processOffer = useCallback(
        async (payload: SdpPayload) => {
            const peerConnection = createMediasStreamRemoteConnection(payload.fromUserId, payload.callId);
            if (peerConnection.signalingState !== "stable") return;
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

            options.getSocket()?.send("call:answer", {
                callId: payload.callId,
                fromUserId: options.currentUserId,
                toUserId: payload.fromUserId,
                sdp: answer,
            });
        },
        [createMediasStreamRemoteConnection, options],
    );

    const processAnswer = useCallback(
        async (payload: SdpPayload) => {
            const peerConnection = peerConnectionsByUserId.current.get(payload.fromUserId);
            if (!peerConnection) return;
            if (peerConnection.signalingState !== "have-local-offer") return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

            const buffered = pendingIceCandidatesByUserId.current.get(payload.fromUserId);
            if (buffered) {
                for (const candidate of buffered) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingIceCandidatesByUserId.current.delete(payload.fromUserId);
            }
        },
        [],
    );

    const processIceCandidate = useCallback(
        async (payload: IceCandidatePayload) => {
            const peerConnection = peerConnectionsByUserId.current.get(payload.fromUserId);
            if (peerConnection && peerConnection.remoteDescription) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch {
                    return;
                }
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

    const closeMediasStreamRemoteConnection = useCallback((userId: string) => {
        const peerConnection = peerConnectionsByUserId.current.get(userId);
        if (peerConnection) {
            peerConnection.close();
            peerConnectionsByUserId.current.delete(userId);
        }
    }, []);

    const closeAllRemoteConnections = useCallback(() => {
        peerConnectionsByUserId.current.forEach((pc) => pc.close());
        peerConnectionsByUserId.current.clear();

        localMediaStream.current?.getTracks().forEach((track) => track.stop());
        localMediaStream.current = null;

        pendingIceCandidatesByUserId.current.clear();
    }, []);

    return {
        localMediaStream,
        peerConnectionsByUserId,
        getLocalMediasStream,
        createMediasStreamRemoteConnection,
        sendOfferToRemoteUser,
        processOffer,
        processAnswer,
        processIceCandidate,
        closeMediasStreamRemoteConnection,
        closeAllRemoteConnections,
    };
}
