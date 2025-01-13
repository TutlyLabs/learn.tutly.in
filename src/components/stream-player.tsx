import { useCopyToClipboard } from "@/lib/clipboard";
import { ParticipantMetadata } from "@/lib/controller";
import {
  AudioTrack,
  VideoTrack,
  useDataChannel,
  useLocalParticipant,
  useMediaDeviceSelect,
  useParticipants,
  useRoomContext,
  useTracks,
  useIsRecording,
  TrackReference,
} from "@livekit/components-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LocalVideoTrack,
  Track,
  createLocalTracks,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { useAuthToken } from "./token-context";
import { useStreamAnalytics } from "@/hooks/use-stream-analytics";
import { StreamLayout } from "./layouts/stream-layout";
import { StreamControls } from "./stream-controls";
import { cn } from "@/lib/utils";
import { useChat } from "@livekit/components-react";
import { LayoutGrid, Maximize2, MonitorPlay, Share2, Maximize, Minimize } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { actions } from "astro:actions";

function ConfettiCanvas() {
  const [decoder] = useState(() => new TextDecoder());
  const canvasEl = useRef<HTMLCanvasElement>(null);
  useDataChannel("reactions", (data) => {
    const options: { emojis?: string[]; confettiNumber?: number } = {};

    if (decoder.decode(data.payload) !== "🎉") {
      options.emojis = [decoder.decode(data.payload)];
      options.confettiNumber = 12;
    }

  });

  return <canvas ref={canvasEl} className="absolute h-full w-full" />;
}

type LayoutType = "grid" | "spotlight" | "screenShare";

export function StreamPlayer({ isHost = false }) {
  const [_, copy] = useCopyToClipboard();

  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack>();
  const localVideoEl = useRef<HTMLVideoElement>(null);

  const roomContext = useRoomContext();
  const {  name: roomName } = roomContext;
  // const roomMetadata = (metadata && JSON.parse(metadata)) as RoomMetadata;
  const { localParticipant } = useLocalParticipant();
  const localMetadata = (localParticipant.metadata &&
    JSON.parse(localParticipant.metadata)) as ParticipantMetadata;
  const canHost =
    isHost || (localMetadata?.invited_to_stage && localMetadata?.hand_raised);
  const participants = useParticipants();

  const analytics = useStreamAnalytics(participants, roomName);

  const showNotification = isHost
    ? participants.some((p) => {
      const metadata = (p.metadata &&
        JSON.parse(p.metadata)) as ParticipantMetadata;
      return metadata?.hand_raised && !metadata?.invited_to_stage;
    })
    : localMetadata?.invited_to_stage && !localMetadata?.hand_raised;

  useEffect(() => {
    if (canHost) {
      const createTracks = async () => {
        const tracks = await createLocalTracks({ audio: true, video: true });
        const camTrack = tracks.find((t) => t.kind === Track.Kind.Video);
        if (camTrack && localVideoEl?.current) {
          camTrack.attach(localVideoEl.current);
        }
        setLocalVideoTrack(camTrack as LocalVideoTrack);
      };
      void createTracks();
    }
  }, [canHost]);

  const { activeDeviceId: activeCameraDeviceId } = useMediaDeviceSelect({
    kind: "videoinput",
  });

  useEffect(() => {
    if (localVideoTrack) {
      void localVideoTrack.setDeviceId(activeCameraDeviceId);
    }
  }, [localVideoTrack, activeCameraDeviceId]);

  const remoteVideoTracks = useTracks([Track.Source.Camera]).filter(
    (t) => t.participant.identity !== localParticipant.identity
  );

  const remoteAudioTracks = useTracks([Track.Source.Microphone]).filter(
    (t) => t.participant.identity !== localParticipant.identity
  );

  const authToken = useAuthToken();
  const onLeaveStage = async () => {
    await fetch("/api/remove_from_stage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({
        identity: localParticipant.identity,
      }),
    });
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  useEffect(() => {
    setIsScreenSharing(screenShareTracks.length > 0);
  }, [screenShareTracks]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [encoder] = useState(() => new TextEncoder());
  const { send: sendReaction } = useDataChannel("reactions");
  const { send: sendChat } = useChat();

  const onSendReaction = (emoji: string) => {
    if (sendReaction) {
      sendReaction(encoder.encode(emoji), {});
    }
    if (sendChat) {
      sendChat(emoji);
    }
  };

  const onToggleChat = () => {
    setActiveTab("chat");
    setSidebarOpen(true);
  };

  const onToggleParticipants = () => {
    setActiveTab("participants");
    setSidebarOpen(true);
  };

  const isRecording = useIsRecording();

  const toggleRoomRecording = async () => {
    try {
      if (isRecording) {
        await actions.stream_stopRecording({
          roomName: roomContext.name,
          // headers: {
          //   Authorization: `Token ${authToken}`
          // }
        });
      } else {
        await actions.stream_startRecording({
          roomName: roomContext.name,
        })
      }
    } catch (error) {
      console.error("Failed to toggle recording:", error);
    }
  };

  const onToggleScreenShare = async () => {
    if (isScreenSharing) {
      await localParticipant.setScreenShareEnabled(false);
    } else {
      await localParticipant.setScreenShareEnabled(true);
    }
  };

  const canPublish =
    isHost || (localMetadata?.invited_to_stage && localMetadata?.hand_raised);

  const [layout, setLayout] = useState<LayoutType>("grid");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const getLayoutClass = () => {
    const totalParticipants = [localParticipant, ...uniqueParticipants].length;
    const baseClass = "grid gap-2 p-4";

    switch (layout) {
      case "grid":
        return cn(baseClass, {
          // Single participant - centered with 16:9 aspect ratio
          "grid-cols-1 items-center justify-center h-full": totalParticipants === 1,

          // Two participants - side by side with 16:9
          "grid-cols-2 items-center": totalParticipants === 2,

          // Three participants - 2 on top, 1 centered below
          "grid-cols-2 grid-rows-1 items-center": totalParticipants === 3,

          // Four participants - 2x2 grid
          "grid-cols-2 grid-rows-2 items-center": totalParticipants === 4,

          // More than 4 - 3x3 grid
          "grid-cols-3 items-center": totalParticipants > 4,
        });

      case "spotlight":
        return cn(baseClass, {
          "grid-cols-1 md:grid-cols-[1fr_300px]": isScreenSharing,
          "grid-cols-1 md:grid-cols-[1fr_300px] auto-rows-[1fr_300px]": !isScreenSharing,
        });

      case "screenShare":
        return cn(baseClass, "grid-cols-1");

      default:
        return baseClass;
    }
  };

  // Add custom styles for the third participant in a 3-participant layout
  const getParticipantStyles = (index: number, totalParticipants: number) => {
    if (totalParticipants === 3 && index === 2) {
      return "col-span-2"; // Make the third participant span both columns
    }
    return "";
  };

  const renderLayoutSwitcher = () => (
    <div className="absolute top-4 right-4 flex gap-2 z-[102]">
      <div className="bg-background/90 rounded-full p-2 backdrop-blur border border-border">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={layout === "grid" ? "default" : "ghost"}
            onClick={() => setLayout("grid")}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={layout === "spotlight" ? "default" : "ghost"}
            onClick={() => setLayout("spotlight")}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {isScreenSharing && (
            <Button
              size="sm"
              variant={layout === "screenShare" ? "default" : "ghost"}
              onClick={() => setLayout("screenShare")}
              className="h-8 w-8 p-0"
            >
              <MonitorPlay className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={toggleFullscreen}
        className="h-8 w-8 p-0 bg-background/90 backdrop-blur"
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const renderParticipantVideo = (participant: any, videoTrack?: any) => (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-accent">
      <div className="absolute inset-0 flex items-center justify-center">
        <Avatar className="h-24 w-24">
          <AvatarFallback>{participant.identity[0] ?? "?"}</AvatarFallback>
        </Avatar>
      </div>
      {videoTrack && (
        <VideoTrack
          trackRef={videoTrack}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-2 left-2">
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          {participant.identity} {participant === localParticipant && "(you)"}
        </Badge>
      </div>
    </div>
  );

  const onRaiseHand = async () => {
    try {
      await fetch("/api/raise_hand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
        body: JSON.stringify({
          identity: localParticipant.identity,
        }),
      });
    } catch (error) {
      console.error("Failed to raise hand:", error);
    }
  };

  const canRaiseHand = !isHost && !localMetadata?.invited_to_stage;
  const isHandRaised = localMetadata?.hand_raised;

  const uniqueParticipants = participants.filter(p =>
    p.identity !== localParticipant.identity
  );

  useEffect(() => {
    if (canPublish) {
      const createTracks = async () => {
        try {
          const tracks = await createLocalTracks({
            audio: true,
            video: true
          });

          const videoTrack = tracks.find(t => t.kind === Track.Kind.Video) as LocalVideoTrack;
          if (videoTrack && localVideoEl?.current) {
            videoTrack.attach(localVideoEl.current);
            setLocalVideoTrack(videoTrack);
          }

          if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(true);
            await localParticipant.setCameraEnabled(true);
          }
        } catch (error) {
          console.error("Error creating local tracks:", error);
        }
      };
      void createTracks();

      return () => {
        if (localVideoTrack) {
          localVideoTrack.detach();
        }
      };
    }

    return;
  }, [canPublish, localParticipant]);

  useEffect(() => {
    if (localVideoEl.current) {
      localVideoEl.current.style.display = localParticipant.isCameraEnabled ? 'block' : 'none';
    }
  }, [localParticipant.isCameraEnabled]);

  return (
    <StreamLayout
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative h-full w-full bg-background transition-all",
          isFullscreen && "fixed inset-0 z-50"
        )}
      >
        <ConfettiCanvas />
        {renderLayoutSwitcher()}

        <div className={getLayoutClass()}>
          {/* Screen share */}
          {isScreenSharing && screenShareTracks.length > 0 && layout !== "grid" ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <VideoTrack
                trackRef={screenShareTracks[0] as TrackReference }
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                  Screen Share
                </Badge>
              </div>
            </div>
          ) : null}

          {/* Participant videos */}
          {layout !== "screenShare" && (
            <div
              className={cn(
                "grid gap-2",
                layout === "spotlight" && isScreenSharing
                  ? "grid-rows-[repeat(auto-fit,minmax(150px,1fr))]"
                  : getLayoutClass()
              )}
            >
              {[localParticipant, ...uniqueParticipants].map((participant, index) => {
                const videoTrack = participant === localParticipant
                  ? undefined
                  : remoteVideoTracks.find(t => t.participant.identity === participant.identity);
                const totalParticipants = [localParticipant, ...uniqueParticipants].length;

                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "relative rounded-lg overflow-hidden bg-accent",
                      "aspect-video w-full",
                      totalParticipants === 1 ? "max-w-4xl mx-auto" : "",
                      getParticipantStyles(index, totalParticipants)
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback>{participant.identity[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                    {participant === localParticipant ? (
                      <video
                        ref={localVideoEl}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                    ) : (
                      videoTrack && (
                        <VideoTrack
                          trackRef={videoTrack}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )
                    )}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                        {participant.identity} {participant.identity === localParticipant.identity && "(You)"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <StreamControls
          isHost={isHost}
          isMuted={!localParticipant.isMicrophoneEnabled}
          isVideoEnabled={localParticipant.isCameraEnabled}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          canPublish={canPublish}
          activeTab={activeTab}
          onToggleAudio={() =>
            canPublish &&
            localParticipant.setMicrophoneEnabled(
              !localParticipant.isMicrophoneEnabled
            )
          }
          onToggleVideo={() =>
            canPublish &&
            localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)
          }
          onToggleScreenShare={onToggleScreenShare}
          onToggleRecording={isHost ? () => { void toggleRoomRecording(); } : () => {}}
          onToggleChat={onToggleChat}
          onToggleParticipants={onToggleParticipants}
          onSendReaction={onSendReaction}
          onLeave={onLeaveStage}
          analytics={analytics}
          roomName={roomName}
          canRaiseHand={canRaiseHand}
          isHandRaised={isHandRaised}
          onRaiseHand={onRaiseHand}
        />

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="absolute bottom-8 right-8 rounded-full"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share meeting</DialogTitle>
              <DialogDescription>
                Anyone with this link can join the meeting
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground break-all">
                {window.location.href}
              </p>
              <Button
                onClick={() => copy(window.location.href)}
                className="w-full"
              >
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add audio tracks for remote participants */}
        {remoteAudioTracks.map(track => (
          <AudioTrack 
            key={track.publication.trackSid} 
            trackRef={track} 
          />
        ))}
      </div>
    </StreamLayout>
  );
}
