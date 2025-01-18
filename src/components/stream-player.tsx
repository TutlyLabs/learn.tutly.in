import {
  AudioTrack,
  TrackReference,
  VideoTrack,
  useDataChannel,
  useIsRecording,
  useLocalParticipant,
  useMediaDeviceSelect,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { useChat } from "@livekit/components-react";
import { actions } from "astro:actions";
import { LocalVideoTrack, Track, createLocalTracks } from "livekit-client";
import { LayoutGrid, Maximize, Maximize2, Minimize, MonitorPlay, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStreamAnalytics } from "@/hooks/use-stream-analytics";
import { useCopyToClipboard } from "@/lib/clipboard";
import { ParticipantMetadata } from "@/lib/controller";
import { cn } from "@/lib/utils";

import { StreamLayout } from "./layouts/stream-layout";
import { StreamControls } from "./stream-controls";
import { useAuthToken } from "./token-context";

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
  const { name: roomName } = roomContext;
  // const roomMetadata = (metadata && JSON.parse(metadata)) as RoomMetadata;
  const { localParticipant } = useLocalParticipant();
  const localMetadata = (localParticipant.metadata &&
    JSON.parse(localParticipant.metadata)) as ParticipantMetadata;
  const canHost = isHost || (localMetadata?.invited_to_stage && localMetadata?.hand_raised);
  const participants = useParticipants();

  const analytics = useStreamAnalytics(participants, roomName);

  const showNotification = isHost
    ? participants.some((p) => {
        const metadata = (p.metadata && JSON.parse(p.metadata)) as ParticipantMetadata;
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
    const response = await fetch("/api/remove_from_stage/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({
        identity: localParticipant.identity,
      }),
    });

    console.log("Response at leave stage", response);
    window.location.reload();
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  useEffect(() => {
    setIsScreenSharing(screenShareTracks.length > 0);
  }, [screenShareTracks]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "null">("null");
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
    const currSideBarOpen = sidebarOpen;
    const currActiveTab = activeTab;

    if (currActiveTab == "participants") {
      setActiveTab("chat");
    } else {
      setSidebarOpen(!sidebarOpen);

      if (!currSideBarOpen) setActiveTab("chat");
      else setActiveTab("null");
    }
  };

  const onToggleParticipants = () => {
    const currSideBarOpen = sidebarOpen;
    const currActiveTab = activeTab;
    if (currActiveTab == "chat") {
      setActiveTab("participants");
    } else {
      setSidebarOpen(!sidebarOpen);
      if (!currSideBarOpen) setActiveTab("participants");
      else setActiveTab("null");
    }
  };

  const isRecording = useIsRecording();

  const toggleRoomRecording = async () => {
    try {
      if (isRecording) {
        const { data: response } = await actions.stream_stopRecording({
          roomName: roomContext.name,
          // headers: {
          //   Authorization: `Token ${authToken}`
          // }
        });
        console.log("Response at stop stream", response);
      } else {
        const { data: response } = await actions.stream_startRecording({
          roomName: roomContext.name,
        });

        console.log("Response at start stream", response);
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

  const canPublish = isHost || (localMetadata?.invited_to_stage && localMetadata?.hand_raised);

  const [layout, setLayout] = useState<LayoutType>("spotlight");

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


  const renderLayoutSwitcher = () => (
    <div className="flex items-center absolute top-4 right-4 gap-2 z-[102]">
      <div className="bg-background/90 rounded-full p-2 backdrop-blur border border-border">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={layout === "spotlight" ? "default" : "ghost"}
            onClick={() => setLayout("spotlight")}
            className="h-6 w-6 p-0"
          >
            <Maximize2 className="h-6 w-6" />
          </Button>
          <Button
            size="sm"
            variant={layout === "grid" ? "default" : "ghost"}
            onClick={() => setLayout("grid")}
            className="h-6 w-6 p-0"
          >
            <LayoutGrid className="h-6 w-6" />
          </Button>
          {isScreenSharing && (
            <Button
              size="sm"
              variant={layout === "screenShare" ? "default" : "ghost"}
              onClick={() => setLayout("screenShare")}
              className="h-6 w-6 p-0"
            >
              <MonitorPlay className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
      <div>
        <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-6 w-6 p-0 bg-background/90 backdrop-blur"
            >
              {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
        </Button>
      </div>
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
        <VideoTrack trackRef={videoTrack} className="absolute inset-0 w-full h-full object-cover" />
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
      await fetch("/api/raise_hand/route", {
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

  const uniqueParticipants = participants.filter((p) => p.identity !== localParticipant.identity);
  
  console.log("Participants : ",participants[0]?.permissions);

  useEffect(() => {
    if (canPublish) {
      const createTracks = async () => {
        try {
          const tracks = await createLocalTracks({
            audio: true,
            video: true,
          });

          const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrack;
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
      localVideoEl.current.style.display = localParticipant.isCameraEnabled ? "block" : "none";
    }
  }, [localParticipant.isCameraEnabled]);

  // For the host video overlay during screen sharing

  const PictureInPicture = ({ track }: { track: any }) => {
    return (
      <div className="absolute bottom-5 right-4 w-[180px] aspect-video rounded-lg overflow-hidden border border-blue-500 shadow-lg ">
        <video
          ref={track}
          className="inset-0 absolute w-full h-full object-cover"
          autoPlay
          playsInline
        />
      </div>
    );
  };

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
          "relative w-full h-full bg-black grid gap-2",
          isFullscreen && "fixed inset-0 z-50"
        )}
      >
        <ConfettiCanvas />
        {renderLayoutSwitcher()}

        <div className="grid p-4">
        {layout === "spotlight" && isScreenSharing && (
          <div className={cn("relative grid px-8 py-4")}>
            {[localParticipant, ...uniqueParticipants]
              .filter((participant) => participant?.permissions?.canPublish === true)
              .map((participant) => {
                const videoTrack =
                  participant === localParticipant
                    ? undefined
                    : remoteVideoTracks.find(
                        (t) => t.participant.identity === participant.identity
                      );

                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "relative rounded-lg overflow-hidden bg-accent",
                      "max-w-full w-full h-full"
                    )}
                  >
                    {/* Fallback Avatar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback>{participant.identity[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Video: Screen Share */}
                    {isScreenSharing && screenShareTracks.length > 0 ? (
                      <div
                        className={cn(
                          "absolute inset-0 w-full h-full rounded-lg overflow-hidden",
                          "bg-black"
                        )}
                      >
                        <VideoTrack
                          trackRef={screenShareTracks[0] as TrackReference}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-8 left-2">
                          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                            Screen Share
                          </Badge>
                        </div>
                      </div>
                    ) : null}

                    {/* Video: Participant */}
                    {participant === localParticipant ? (
                      <video
                        ref={localVideoEl}
                        className="absolute bottom-4 right-4 w-48 h-24 object-cover rounded-md"
                        autoPlay
                        playsInline
                      />
                    ) : (
                      videoTrack && (
                        <VideoTrack
                          trackRef={videoTrack}
                          className="absolute bottom-4 right-4 w-48 h-24 object-cover rounded-md"
                        />
                      )
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {layout === "spotlight" && !isScreenSharing && (
          <div
            className={cn(
              "grid px-8 py-4"
            )}
          >
            {[localParticipant, ...uniqueParticipants]
              .filter((participant) => participant?.permissions?.canPublish===true)
              .map((participant) => {
                const videoTrack =
                  participant === localParticipant
                    ? undefined
                    : remoteVideoTracks.find(
                        (t) => t.participant.identity === participant.identity
                      );

                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "relative rounded-lg overflow-hidden bg-accent",
                      "aspect-video w-full h-full scale-110",
                      "max-w-4xl mx-auto"
                    )}
                  >
                    {/* Fallback Avatar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback>{participant.identity[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Video Display */}
                    {participant === localParticipant ? (
                      <video
                        ref={localVideoEl}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        playsInline
                      />
                    ) : (
                      videoTrack && (
                        <VideoTrack
                          trackRef={videoTrack}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )
                    )}

                    {/* Badge with Participant Identity */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                        {participant.identity}{" "}
                        {participant.identity === localParticipant.identity && "(You)"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

          {layout === "grid" && (
            <div className="grid grid-cols-3 gap-4 overflow-auto">
              {[localParticipant, ...uniqueParticipants].map((participant) => {
                const videoTrack =
                  participant === localParticipant
                    ? undefined
                    : remoteVideoTracks.find(
                        (t) => t.participant.identity === participant.identity
                      );

                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "relative rounded-lg overflow-hidden bg-accent",
                      "aspect-video"
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
                        {participant.identity}{" "}
                        {participant.identity === localParticipant.identity && "(You)"}
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
            localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)
          }
          onToggleVideo={() =>
            canPublish && localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)
          }
          onToggleScreenShare={onToggleScreenShare}
          onToggleRecording={
            isHost
              ? () => {
                  void toggleRoomRecording();
                }
              : () => {}
          }
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
            <Button variant="secondary" className="absolute top-4 left-4 rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share meeting</DialogTitle>
              <DialogDescription>Anyone with this link can join the meeting</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground break-all">{window.location.href}</p>
              <Button onClick={() => copy(window.location.href)} className="w-full">
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add audio tracks for remote participants */}
        {remoteAudioTracks.map((track) => (
          <AudioTrack key={track.publication.trackSid} trackRef={track} />
        ))}
      </div>
    </StreamLayout>
  );
}
