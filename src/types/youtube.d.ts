interface Window {
  YT: {
    Player: any;
    PlayerState: {
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      ENDED: number;
      CUED: number;
    };
  };
  onYouTubeIframeAPIReady: () => void;
}

interface DrivePlayerMessage {
  type:
    | "initialize"
    | "playPause"
    | "seek"
    | "volume"
    | "mute"
    | "playerStateChange"
    | "durationChange"
    | "timeUpdate";
  state?: string;
  duration?: number;
  currentTime?: number;
  volume?: number;
  muted?: boolean;
  time?: number;
}
