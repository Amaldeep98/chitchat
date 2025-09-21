// Simplified WebRTC utility for local network calling

// WebRTC configuration optimized for local network
export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional STUN servers for better connectivity
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.counterpath.com' },
    { urls: 'stun:stun.1und1.de' },
    { urls: 'stun:stun.gmx.net' },
    { urls: 'stun:stun.callwithus.com' },
    { urls: 'stun:stun.internetcalls.com' },
    { urls: 'stun:stun.sipgate.net' },
    { urls: 'stun:stun.sipgate.net:10000' },
    { urls: 'stun:stun.softjoys.com' },
    { urls: 'stun:stun.voxgratia.org' },
    { urls: 'stun:stun.xten.com' },
  ],
  iceCandidatePoolSize: 10
};

// Utility functions for WebRTC
export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection(rtcConfiguration);
};

export const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  try {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.startsWith('192.168.');
    
    if (!isSecureContext) {
      console.warn('⚠️ Not in secure context. WebRTC may not work properly.');
      console.log('Current hostname:', window.location.hostname);
    }
    
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not supported');
    }
    
    console.log('🎥 Requesting media with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Media stream obtained successfully');
    
    return stream;
  } catch (error) {
    console.error('❌ Error accessing media devices:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera/microphone found. Please connect a device and try again.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Camera/microphone not supported in this browser.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera/microphone is being used by another application.');
      } else {
        throw new Error(`Failed to access camera/microphone: ${error.message}`);
      }
    } else {
      throw new Error('Failed to access camera/microphone: Unknown error occurred');
    }
  }
};

export const formatCallDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
