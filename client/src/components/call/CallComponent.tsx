import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import {
  CallEnd,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  Phone,
  PhoneDisabled,
} from '@mui/icons-material';

interface CallComponentProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  isIncoming: boolean;
  remoteUser: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  onCallStart: (type: 'voice' | 'video') => void;
  onCallAnswer: () => void;
  onCallEnd: () => void;
  onCallReject: () => void;
}

interface CallState {
  isActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const CallComponent: React.FC<CallComponentProps> = ({
  isOpen,
  onClose,
  callType,
  isIncoming,
  remoteUser,
  onCallStart,
  onCallAnswer,
  onCallEnd,
  onCallReject,
}) => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isMuted: false,
    isVideoOff: callType === 'voice',
    duration: 0,
    localStream: null,
    remoteStream: null,
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC configuration optimized for local network
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.ekiga.net' },
      { urls: 'stun:stun.ideasip.com' },
      { urls: 'stun:stun.schlund.de' },
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize media stream
  const initializeMedia = async (): Promise<MediaStream> => {
    try {
      console.log('🎥 Requesting media access...');
      
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained:', stream);
      
      // Set local video if video call
      if (callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('❌ Error accessing media:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  };

  // Create peer connection
  const createPeerConnection = (): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📡 ICE candidate:', event.candidate);
        // In a real implementation, you'd send this to the remote peer via signaling
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📺 Remote stream received:', event.streams[0]);
      setCallState(prev => ({ ...prev, remoteStream: event.streams[0] }));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, isActive: true }));
        startDurationTimer();
      }
    };

    return peerConnection;
  };

  // Start duration timer
  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  // Stop duration timer
  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Handle call start
  const handleStartCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('📞 Starting call...');
      
      // Initialize media
      const localStream = await initializeMedia();
      
      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      setCallState(prev => ({ ...prev, localStream }));
      
      // Notify parent component
      onCallStart(callType);
      
      setIsConnecting(false);
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setError(error instanceof Error ? error.message : 'Failed to start call');
      setIsConnecting(false);
    }
  };

  // Handle call answer
  const handleAnswerCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('📞 Answering call...');
      
      // Initialize media
      const localStream = await initializeMedia();
      
      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      setCallState(prev => ({ ...prev, localStream }));
      
      // Notify parent component
      onCallAnswer();
      
      setIsConnecting(false);
    } catch (error) {
      console.error('❌ Error answering call:', error);
      setError(error instanceof Error ? error.message : 'Failed to answer call');
      setIsConnecting(false);
    }
  };

  // Handle call end
  const handleEndCall = () => {
    console.log('📞 Ending call...');
    
    // Stop media tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop duration timer
    stopDurationTimer();
    
    // Reset state
    setCallState({
      isActive: false,
      isMuted: false,
      isVideoOff: callType === 'voice',
      duration: 0,
      localStream: null,
      remoteStream: null,
    });
    
    // Notify parent component
    onCallEnd();
    onClose();
  };

  // Handle call reject
  const handleRejectCall = () => {
    console.log('📞 Rejecting call...');
    onCallReject();
    onClose();
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={handleEndCall}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: callType === 'video' ? 500 : 300,
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Video Container */}
        {callType === 'video' && (
          <Box sx={{ position: 'relative', height: 300, bgcolor: 'black' }}>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Local Video */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 120,
                height: 90,
                borderRadius: 1,
                overflow: 'hidden',
                border: '2px solid white'
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Box>
        )}

        {/* Call Info */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            src={remoteUser.avatar}
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            {remoteUser.firstName} {remoteUser.lastName}
          </Typography>
          
          {callState.isActive && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formatDuration(callState.duration)}
            </Typography>
          )}
          
          {isConnecting && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                {isIncoming ? 'Answering...' : 'Connecting...'}
              </Typography>
            </Box>
          )}
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>

        {/* Call Controls */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 2, 
          p: 3,
          bgcolor: 'grey.50'
        }}>
          {isIncoming ? (
            <>
              <IconButton
                onClick={handleRejectCall}
                sx={{ 
                  bgcolor: 'error.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <PhoneDisabled />
              </IconButton>
              <IconButton
                onClick={handleAnswerCall}
                sx={{ 
                  bgcolor: 'success.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'success.dark' }
                }}
              >
                <Phone />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                onClick={handleToggleMute}
                sx={{ 
                  bgcolor: callState.isMuted ? 'error.main' : 'grey.300',
                  color: 'white',
                  '&:hover': { bgcolor: callState.isMuted ? 'error.dark' : 'grey.400' }
                }}
              >
                {callState.isMuted ? <MicOff /> : <Mic />}
              </IconButton>
              
              {callType === 'video' && (
                <IconButton
                  onClick={handleToggleVideo}
                  sx={{ 
                    bgcolor: callState.isVideoOff ? 'error.main' : 'grey.300',
                    color: 'white',
                    '&:hover': { bgcolor: callState.isVideoOff ? 'error.dark' : 'grey.400' }
                  }}
                >
                  {callState.isVideoOff ? <VideocamOff /> : <Videocam />}
                </IconButton>
              )}
              
              <IconButton
                onClick={handleEndCall}
                sx={{ 
                  bgcolor: 'error.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <CallEnd />
              </IconButton>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CallComponent;

