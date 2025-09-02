// FieldBeam Meetings - WebRTC video conferencing for construction site collaboration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FieldBeamMeetings.css';

interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  duration: number; // minutes
  participants: Participant[];
  status: 'scheduled' | 'active' | 'ended';
  roomId: string;
  recording?: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant' | 'viewer';
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  avatar?: string;
}

interface MeetingControls {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
}

const FieldBeamMeetings: React.FC = () => {
  const [currentView, setCurrentView] = useState<'meetings' | 'join' | 'active'>('meetings');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [meetingControls, setMeetingControls] = useState<MeetingControls>({
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    isRecording: false
  });

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize component
  useEffect(() => {
    loadMeetings();
    return () => {
      // Cleanup WebRTC connections
      cleanup();
    };
  }, []);

  const loadMeetings = () => {
    // Mock meetings data - replace with actual API
    const mockMeetings: Meeting[] = [
      {
        id: 'meeting-1',
        title: 'Site Progress Review - Building A',
        description: 'Weekly progress review for the main construction building',
        scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        duration: 45,
        participants: [
          { id: 'user-1', name: 'John Smith', role: 'host', isConnected: false, isMuted: false, isVideoEnabled: true },
          { id: 'user-2', name: 'Sarah Johnson', role: 'participant', isConnected: false, isMuted: false, isVideoEnabled: true },
        ],
        status: 'scheduled',
        roomId: 'room-building-a-progress',
        recording: true
      },
      {
        id: 'meeting-2',
        title: 'Safety Briefing - Q3',
        description: 'Quarterly safety review and incident prevention',
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 30,
        participants: [
          { id: 'user-3', name: 'Mike Wilson', role: 'host', isConnected: false, isMuted: false, isVideoEnabled: true },
        ],
        status: 'scheduled',
        roomId: 'room-safety-q3',
        recording: false
      }
    ];
    setMeetings(mockMeetings);
  };

  const initializeWebRTC = async () => {
    try {
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = (participantId: string): RTCPeerConnection => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      addRemoteVideo(participantId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendICECandidate(participantId, event.candidate);
      }
    };

    peerConnectionsRef.current.set(participantId, peerConnection);
    return peerConnection;
  };

  const addRemoteVideo = (participantId: string, stream: MediaStream) => {
    if (!remoteVideosRef.current) return;

    const existingVideo = remoteVideosRef.current.querySelector(`[data-participant="${participantId}"]`);
    if (existingVideo) return;

    const videoElement = document.createElement('video');
    videoElement.setAttribute('data-participant', participantId);
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.className = 'remote-video';

    const videoContainer = document.createElement('div');
    videoContainer.className = 'remote-video-container';
    videoContainer.appendChild(videoElement);

    const nameLabel = document.createElement('div');
    nameLabel.className = 'participant-name';
    nameLabel.textContent = participantId; // Replace with actual participant name
    videoContainer.appendChild(nameLabel);

    remoteVideosRef.current.appendChild(videoContainer);
  };

  const sendICECandidate = (participantId: string, candidate: RTCIceCandidate) => {
    // Send ICE candidate through signaling server
    console.log('Sending ICE candidate to', participantId, candidate);
    // Implementation depends on signaling server
  };

  const joinMeeting = async (meeting: Meeting) => {
    try {
      await initializeWebRTC();
      setActiveMeeting(meeting);
      setCurrentView('active');
      
      // In a real implementation, connect to signaling server
      // and establish peer connections with other participants
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const joinMeetingByRoomId = async () => {
    if (!joinRoomId.trim() || !userName.trim()) {
      alert('Please enter both room ID and your name');
      return;
    }

    try {
      await initializeWebRTC();
      
      // Create a temporary meeting object
      const meeting: Meeting = {
        id: `temp-${Date.now()}`,
        title: `Room: ${joinRoomId}`,
        description: 'Joined by room ID',
        scheduledTime: new Date(),
        duration: 60,
        participants: [],
        status: 'active',
        roomId: joinRoomId
      };

      setActiveMeeting(meeting);
      setCurrentView('active');
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const leaveMeeting = () => {
    cleanup();
    setActiveMeeting(null);
    setCurrentView('meetings');
  };

  const cleanup = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Clear remote videos
    if (remoteVideosRef.current) {
      remoteVideosRef.current.innerHTML = '';
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMeetingControls(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setMeetingControls(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!meetingControls.isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          // Screen sharing stopped
          setMeetingControls(prev => ({ ...prev, isScreenSharing: false }));
          // Restore camera stream
          restoreCameraStream();
        };

        setMeetingControls(prev => ({ ...prev, isScreenSharing: true }));
      } else {
        // Stop screen sharing and restore camera
        restoreCameraStream();
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
    }
  };

  const restoreCameraStream = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      localStreamRef.current = cameraStream;
      setMeetingControls(prev => ({ ...prev, isScreenSharing: false }));
    } catch (error) {
      console.error('Error restoring camera:', error);
    }
  };

  const toggleRecording = () => {
    // Toggle recording state
    setMeetingControls(prev => ({ ...prev, isRecording: !prev.isRecording }));
    // In real implementation, start/stop server-side recording
    console.log('Recording:', !meetingControls.isRecording ? 'started' : 'stopped');
  };

  const renderMeetingsList = () => (
    <div className="meetings-list">
      <div className="meetings-header">
        <h2>FieldBeam Meetings</h2>
        <p>Secure video conferencing for construction teams</p>
      </div>

      <div className="quick-join-section">
        <h3>Quick Join</h3>
        <div className="quick-join-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="name-input"
          />
          <input
            type="text"
            placeholder="Enter room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            className="room-input"
          />
          <button onClick={joinMeetingByRoomId} className="join-button">
            Join Meeting
          </button>
        </div>
      </div>

      <div className="scheduled-meetings">
        <h3>Scheduled Meetings</h3>
        {meetings.length === 0 ? (
          <div className="no-meetings">
            <p>No scheduled meetings</p>
          </div>
        ) : (
          <div className="meetings-grid">
            {meetings.map(meeting => (
              <div key={meeting.id} className="meeting-card">
                <div className="meeting-header">
                  <h4>{meeting.title}</h4>
                  <span className={`status-badge status-${meeting.status}`}>
                    {meeting.status}
                  </span>
                </div>
                <p className="meeting-description">{meeting.description}</p>
                <div className="meeting-details">
                  <div className="meeting-time">
                    📅 {meeting.scheduledTime.toLocaleDateString()} at {meeting.scheduledTime.toLocaleTimeString()}
                  </div>
                  <div className="meeting-duration">
                    ⏱️ {meeting.duration} minutes
                  </div>
                  <div className="participants-count">
                    👥 {meeting.participants.length} participants
                  </div>
                  {meeting.recording && (
                    <div className="recording-indicator">🔴 Recording enabled</div>
                  )}
                </div>
                <div className="meeting-actions">
                  <button
                    onClick={() => joinMeeting(meeting)}
                    className="join-meeting-button"
                    disabled={meeting.status === 'ended'}
                  >
                    {meeting.status === 'active' ? 'Join Now' : 'Join Meeting'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveMeeting = () => (
    <div className="active-meeting">
      <div className="meeting-header">
        <h3>{activeMeeting?.title}</h3>
        <button onClick={leaveMeeting} className="leave-button">
          Leave Meeting
        </button>
      </div>

      <div className="video-grid">
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          <div className="video-label">You {meetingControls.isMuted && '(Muted)'}</div>
        </div>

        <div ref={remoteVideosRef} className="remote-videos">
          {/* Remote videos will be added dynamically */}
        </div>
      </div>

      <div className="meeting-controls">
        <button
          onClick={toggleMute}
          className={`control-button ${meetingControls.isMuted ? 'active' : ''}`}
          title={meetingControls.isMuted ? 'Unmute' : 'Mute'}
        >
          {meetingControls.isMuted ? '🔇' : '🎤'}
        </button>

        <button
          onClick={toggleVideo}
          className={`control-button ${!meetingControls.isVideoEnabled ? 'active' : ''}`}
          title={meetingControls.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {meetingControls.isVideoEnabled ? '📹' : '📹'}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`control-button ${meetingControls.isScreenSharing ? 'active' : ''}`}
          title={meetingControls.isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          🖥️
        </button>

        <button
          onClick={toggleRecording}
          className={`control-button ${meetingControls.isRecording ? 'recording' : ''}`}
          title={meetingControls.isRecording ? 'Stop recording' : 'Start recording'}
        >
          {meetingControls.isRecording ? '⏹️' : '🔴'}
        </button>
      </div>

      {meetingControls.isRecording && (
        <div className="recording-indicator-banner">
          🔴 This meeting is being recorded
        </div>
      )}
    </div>
  );

  return (
    <div className="fieldbeam-meetings">
      {currentView === 'meetings' && renderMeetingsList()}
      {currentView === 'active' && renderActiveMeeting()}
    </div>
  );
};

export default FieldBeamMeetings;