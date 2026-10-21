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
  const candidateQueueRef = useRef({}); // { [peerSocketId]: RTCIceCandidateInit[] }
  const [remoteStreams, setRemoteStreams] = useState({}); // { [peerSocketId]: MediaStream }

  // Helper to flush queued ICE candidates once remote description is set
  const flushCandidateQueue = async (peerId, pc) => {
    const queue = candidateQueueRef.current[peerId];
    if (queue && queue.length > 0) {
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[VoiceChat] Failed to add queued ICE candidate:', e);
        }
      }
      candidateQueueRef.current[peerId] = [];
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
        try {
          pc.close();
        } catch (_) {}
        delete peersRef.current[peerId];
        delete candidateQueueRef.current[peerId];
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

  // Helper to create and send offer to a peer
  const createAndSendOffer = async (peerId, pc) => {
    if (!socket || !roomName) return;
    try {
      // Ensure audio transceiver exists (in recvonly mode if local mic is muted)
      const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
      const hasAudio = transceivers.some(
        (t) => t.receiver && t.receiver.track && t.receiver.track.kind === 'audio'
      );
      if (!hasAudio && !localStreamRef.current && pc.addTransceiver) {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
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

        // Disable outgoing audio tracks on existing peer connections
        Object.values(peersRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && sender.track.kind === 'audio') {
              try {
                sender.replaceTrack(null);
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
          // Broadcast to room that this user unmuted and is speaking
          socket.emit('voice_signal', {
            roomId: roomName,
            signal: { type: 'peer_ready', fromUsername: username },
            from: username,
          });
        }

        // Attach new live audio track to existing peer connections and renegotiate
        for (const [peerId, pc] of Object.entries(peersRef.current)) {
          const senders = pc.getSenders();
          const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
          const track = stream.getAudioTracks()[0];
          if (audioSender && track) {
            await audioSender.replaceTrack(track);
          } else if (track) {
            try {
              pc.addTrack(track, stream);
              await createAndSendOffer(peerId, pc);
            } catch (_) {}
          }
        }
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

  // 2. Listen for WebRTC signals from socket
  useEffect(() => {
    if (!socket) return;

    const handleVoiceSignal = async ({ signal, from: fromSocketId }) => {
      if (!signal || !fromSocketId || fromSocketId === socket.id) return;

      try {
        if (signal.type === 'peer_ready') {
          // Another peer is unmuted and speaking! Connect and send an offer to receive their audio
          const pc = getOrCreatePeerConnection(fromSocketId);
          await createAndSendOffer(fromSocketId, pc);
        } else if (signal.type === 'offer') {
          const pc = getOrCreatePeerConnection(fromSocketId);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await flushCandidateQueue(fromSocketId, pc);

          // If we have an active local microphone stream, attach track before answering
          if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
              const audioSender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
              if (!audioSender) {
                try {
                  pc.addTrack(track, localStreamRef.current);
                } catch (_) {}
              }
            }
          }

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
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await flushCandidateQueue(fromSocketId, pc);
          }
        } else if (signal.type === 'candidate') {
          const pc = peersRef.current[fromSocketId];
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (candErr) {
              console.warn('[VoiceChat] Failed to add ICE candidate:', candErr);
            }
          } else {
            if (!candidateQueueRef.current[fromSocketId]) {
              candidateQueueRef.current[fromSocketId] = [];
            }
            candidateQueueRef.current[fromSocketId].push(signal.candidate);
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
      candidateQueueRef.current = {};
    };
  }, []);

  return (
    <div className="sr-only pointer-events-none fixed -top-96 -left-96 w-1 h-1 overflow-hidden" aria-hidden="true">
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
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[VoiceChat] Remote audio autoplay blocked:', err);
        });
      }

      // If autoplay was blocked pending user gesture, resume on next interaction
      const handleUserInteraction = () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      };
      window.addEventListener('click', handleUserInteraction, { once: true });
      return () => window.removeEventListener('click', handleUserInteraction);
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
