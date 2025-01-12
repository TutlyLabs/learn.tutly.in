import { useEffect, useState } from 'react';
import { Participant, ConnectionQuality } from 'livekit-client';

interface ParticipantSession {
  joinedAt: string;
  leftAt: string | null;
}

interface ParticipantActivity {
  identity: string;
  joinTime: string;
  lastSeenAt: string;
  sessions: ParticipantSession[];
  audioEnabled: boolean;
  videoEnabled: boolean;
  hasScreenShared: boolean;
  connectionQuality?: ConnectionQuality;
  minutesWatched: number;
}

interface StreamAnalytics {
  participants: Record<string, ParticipantActivity>;
  peakConcurrentUsers: number;
  totalMessages: number;
  streamStartTime: string;
  userCountTimeline: Array<{
    timestamp: string;
    count: number;
  }>;
}

export function useStreamAnalytics(
  participants: Participant[],
  roomName: string
) {
  const [analytics, setAnalytics] = useState<Record<string, StreamAnalytics>>(() => {
    const stored = localStorage.getItem('stream-analytics');
    return stored ? JSON.parse(stored) : {};
  });

  // Update timeline every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics((prev) => {
        if (!roomName || !prev[roomName]) return prev;
        
        return {
          ...prev,
          [roomName]: {
            ...prev[roomName],
            userCountTimeline: [
              ...prev[roomName].userCountTimeline,
              {
                timestamp: new Date().toISOString(),
                count: participants.length,
              },
            ],
          },
        };
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [roomName, participants.length]);

  // Track participant activity
  useEffect(() => {
    if (!roomName) return;

    const now = new Date().toISOString();
    
    setAnalytics((prev) => {
      const currentStream = prev[roomName] || {
        participants: {},
        peakConcurrentUsers: 0,
        totalMessages: 0,
        streamStartTime: now,
        userCountTimeline: [{
          timestamp: now,
          count: participants.length,
        }],
      };

      const updatedParticipants = { ...currentStream.participants };

      participants.forEach((participant) => {
        const existing = updatedParticipants[participant.identity] || {
          identity: participant.identity,
          joinTime: now,
          lastSeenAt: now,
          sessions: [],
          audioEnabled: false,
          videoEnabled: false,
          hasScreenShared: false,
          minutesWatched: 0,
        };

        // Update session data
        if (!existing.sessions || existing.sessions.length === 0 || (existing.sessions[existing.sessions.length - 1]?.leftAt)) {
          existing.sessions.push({
            joinedAt: now,
            leftAt: null,
          });
        }

        // Calculate minutes watched
        existing.minutesWatched = existing.sessions.reduce((total, session) => {
          const end = session.leftAt ? new Date(session.leftAt) : new Date();
          const start = new Date(session.joinedAt);
          return total + (end.getTime() - start.getTime()) / (1000 * 60);
        }, 0);

        // Update media state
        
        existing.audioEnabled = participant.isMicrophoneEnabled;
        existing.videoEnabled = participant.isCameraEnabled;

        // Update connection quality
        existing.connectionQuality = participant.connectionQuality

        existing.lastSeenAt = now;
        updatedParticipants[participant.identity] = existing;
      });

      return {
        ...prev,
        [roomName]: {
          ...currentStream,
          participants: updatedParticipants,
          peakConcurrentUsers: Math.max(currentStream.peakConcurrentUsers, participants.length),
        },
      };
    });

    localStorage.setItem('stream-analytics', JSON.stringify(analytics));
  }, [roomName, participants]);

  return analytics[roomName] || null;
}
