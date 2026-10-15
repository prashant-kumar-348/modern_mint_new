import React, { useEffect, useRef, useState } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VoiceChatManager({ roomName, username, isTalking, socket, onMicError }) {
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { [peerSocketId]: RTCPeerConnection }
  const [remoteStreams, setRemoteStreams] = useState({}); // { [peerSocketId]: MediaStream }

  // 1. Manage local microphone stream based on isTalking toggle
  useEffect(() => {
    let isCancelled = false;

    async function setupMicrophone() {
      if (!isTalking) {
        // Disabling / Muting
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
          });
          localStreamRef.current = null;
        }

        // Remove local tracks from existing peer connections
        Object.values(peersRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track) {
              try {
                pc.removeTrack(sender);
              } catch (_) {}
            }
          });
        });

        if (socket && roomName) {
          socket.emit('voice_state', { roomId: roomName, username, isTalking: false });
        }
        return;
      }

      // Enabling / Unmuting
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Microphone mediaDevices API not supported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((t) => {
          t.enabled = true;
        });

        if (socket && roomName) {
          socket.emit('voice_state', { roomId: roomName, username, isTalking: true });
          // Signal peers in room that this user unmuted
          socket.emit('voice_signal', {
            roomId: roomName,
            signal: { type: 'peer_ready', fromUsername: username },
            from: username,
          });
        }

        // Add stream tracks to all active peer connections
        Object.entries(peersRef.current).forEach(([peerId, pc]) => {
          stream.getAudioTracks().forEach((track) => {
            try {
              pc.addTrack(track, stream);
            } catch (_) {}
          });
          // Re-negotiate offer
          createAndSendOffer(peerId, pc);
        });
      } catch (err) {
        console.warn('[VoiceChat] Microphone access denied or error:', err);
        if (onMicError) {
          onMicError(err);
        }
      }
    }

    setupMicrophone();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
        localStreamRef.current = null;
      }
    };
  }, [isTalking, roomName, username, socket]);

  // Helper to create and send offer to a peer
  const createAndSendOffer = async (peerId, pc) => {
    if (!socket || !roomName) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice_signal', {
        roomId: roomName,
        to: peerId,
        signal: { type: 'offer', sdp: pc.localDescription },
        from: username,
      });
    } catch (e) {
      console.warn('[VoiceChat] Failed to create offer:', e);
    }
  };

  // Helper to get or create RTCPeerConnection for a peer
  const getOrCreatePeerConnection = (peerId) => {
    if (peersRef.current[peerId]) {
      return peersRef.current[peerId];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomName) {
        socket.emit('voice_signal', {
          roomId: roomName,
          to: peerId,
          signal: { type: 'candidate', candidate: event.candidate },
          from: username,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: remoteStream,
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        pc.close();
        delete peersRef.current[peerId];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    };

    // If we have an active local microphone stream, attach tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (_) {}
      });
    }

    peersRef.current[peerId] = pc;
    return pc;
  };

  // 2. Listen for WebRTC signals from socket
  useEffect(() => {
    if (!socket) return;

    const handleVoiceSignal = async ({ signal, from: fromSocketId }) => {
      if (!signal || !fromSocketId || fromSocketId === socket.id) return;

      try {
        if (signal.type === 'peer_ready') {
          // Another peer is ready / unmuted. If we are also unmuted, connect and send offer
          const pc = getOrCreatePeerConnection(fromSocketId);
          if (localStreamRef.current) {
            await createAndSendOffer(fromSocketId, pc);
          }
        } else if (signal.type === 'offer') {
          const pc = getOrCreatePeerConnection(fromSocketId);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice_signal', {
            roomId: roomName,
            to: fromSocketId,
            signal: { type: 'answer', sdp: pc.localDescription },
            from: username,
          });
        } else if (signal.type === 'answer') {
          const pc = peersRef.current[fromSocketId];
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === 'candidate') {
          const pc = peersRef.current[fromSocketId];
          if (pc && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.warn('[VoiceChat] Signaling error:', err);
      }
    };

    socket.on('voice_signal', handleVoiceSignal);

    return () => {
      socket.off('voice_signal', handleVoiceSignal);
    };
  }, [socket, roomName, username]);

  // 3. Clean up all peer connections on unmount
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (_) {}
      });
      peersRef.current = {};
    };
  }, []);

  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <AudioStreamPlayer key={peerId} stream={stream} />
      ))}
    </div>
  );
}

// Sub-component to safely play remote streams
function AudioStreamPlayer({ stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((err) => {
        console.warn('[VoiceChat] Remote audio autoplay blocked:', err);
      });
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
