"use client";

import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Users,
  MessageSquare,
  Phone,
  CircleDot,
  StopCircle,
  Smile,
  Activity,
  Hand,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StreamAnalyticsModal } from "@/components/stream-analytics-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { useEffect, useState } from "react";

interface StreamControlsProps {
  isHost?: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording?: boolean;
  canPublish?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording?: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  onSendReaction?: (emoji: string) => void;
  activeTab?: "chat" | "participants" | "assignments"| 'null';
  analytics?: any;
  roomName?: string;
  canRaiseHand?: boolean;
  isHandRaised?: boolean;
  onRaiseHand?: () => void;
}

export function StreamControls({
  isHost,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  canPublish = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onLeave,
  onSendReaction,
  activeTab,
  analytics,
  roomName,
  canRaiseHand = false,
  isHandRaised = false,
  onRaiseHand,
}: StreamControlsProps) {
  const {
    devices: microphoneDevices,
    activeDeviceId: activeMicrophoneId,
    setActiveMediaDevice: setActiveMicrophone,
  } = useMediaDeviceSelect({ kind: "audioinput" });

  const {
    devices: cameraDevices,
    activeDeviceId: activeCameraId,
    setActiveMediaDevice: setActiveCamera,
  } = useMediaDeviceSelect({ kind: "videoinput" });

  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setIsVisible(false), 5000);
    };
  
    const streamPlayer = document.getElementById('StreamPlayer');
    if (streamPlayer) {
      streamPlayer.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      const streamPlayer = document.getElementById('StreamPlayer');
      if (streamPlayer) {
        streamPlayer.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(hideTimeout);
    };
  }, []);

  
  return (
    <TooltipProvider>
      <div className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2",
        "flex items-center gap-2 p-3 rounded-full",
        "bg-background/95 backdrop-blur border border-border shadow-lg",
        "transition-opacity duration-300",
        !isVisible && "opacity-0 pointer-events-none"
      )}
        style = {{  
          background: "rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: "blur(5.5px)",
          WebkitBackdropFilter: "blur(5.5px)", 
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        }}
      >
        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-l-full w-10 h-10"
                onClick={onToggleAudio}
                disabled={!canPublish}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{!canPublish ? "No permission" : isMuted ? "Unmute" : "Mute"}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-r-full px-2 h-10"
                disabled={!canPublish}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              {microphoneDevices?.map((device) => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onClick={() => setActiveMicrophone(device.deviceId)}
                  className={cn(
                    "flex items-center gap-2",
                    device.deviceId === activeMicrophoneId && "bg-accent"
                  )}
                >
                  <Mic className="h-4 w-4" />
                  <span className="truncate">{device.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                className="rounded-l-full w-10 h-10"
                onClick={onToggleVideo}
                disabled={!canPublish}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!canPublish
                  ? "No permission"
                  : isVideoEnabled
                  ? "Stop video"
                  : "Start video"}
              </p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-r-full px-2 h-10"
                disabled={!canPublish}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              {cameraDevices?.map((device) => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onClick={() => setActiveCamera(device.deviceId)}
                  className={cn(
                    "flex items-center gap-2",
                    device.deviceId === activeCameraId && "bg-accent"
                  )}
                >
                  <Video className="h-4 w-4" />
                  <span className="truncate">{device.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-10 h-10"
              onClick={onToggleScreenShare}
              disabled={!canPublish}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{!canPublish ? "No permission" : isScreenSharing ? "Stop sharing" : "Present now"}</p>
          </TooltipContent>
        </Tooltip>

        {isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-10 h-10"
                onClick={onToggleRecording}
                disabled={!canPublish}
              >
                {isRecording ? (
                  <StopCircle className="h-5 w-5" />
                ) : (
                  <CircleDot className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{!canPublish ? "No permission" : isRecording ? "Stop recording" : "Start recording"}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-8 w-[1px] bg-border mx-2" />

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full w-10 h-10"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reactions</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-fit p-2">
            <div className="flex gap-2">
              {["🔥", "👏", "🤣", "❤️", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  className="hover:bg-accent p-2 rounded-lg"
                  onClick={() => onSendReaction?.(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "chat" ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-10 h-10"
              onClick={onToggleChat}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "participants" ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-10 h-10"
              onClick={onToggleParticipants}
            >
              <Users className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Participants</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-10 h-10"
              onClick={onLeave}
              disabled={!canPublish}
            >
              <Phone className="h-5 w-5 rotate-[135deg]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{!canPublish ? "No permission" : "Leave call"}</p>
          </TooltipContent>
        </Tooltip>

        {isHost && (
          <>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <Tooltip>
              <TooltipTrigger asChild>
                <StreamAnalyticsModal analytics={analytics} roomName={roomName as string}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full w-10 h-10"
                  >
                    <Activity className="h-5 w-5" />
                  </Button>
                </StreamAnalyticsModal>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stream Analytics</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {!isHost && canRaiseHand && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHandRaised ? "default" : "secondary"}
                size="lg"
                className="rounded-full w-10 h-10"
                onClick={onRaiseHand}
              >
                <Hand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHandRaised ? "Hand raised" : "Raise hand"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 