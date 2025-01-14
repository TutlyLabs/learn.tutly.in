"use client";

import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { useRoomContext } from "@livekit/components-react";
import { actions } from "astro:actions";
import {
  Hand,
  MessageSquare,
  Mic,
  MicOff,
  UserMinus,
  UserPlus,
  Video,
  VideoOff,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ParticipantMetadata, RoomMetadata } from "@/lib/controller";
import { cn } from "@/lib/utils";

import { useAuthToken } from "./token-context";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const parseMetadata = (metadata: string | undefined): ParticipantMetadata | null => {
  try {
    return metadata ? JSON.parse(metadata) : null;
  } catch {
    return null;
  }
};

export function ParticipantsList() {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const authToken = useAuthToken();
  const room = useRoomContext();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const localMetadata = parseMetadata(localParticipant.metadata);

  const isHost = useMemo(() => {
    if (localMetadata?.role === "host") return true;

    if (room.metadata) {
      const roomMetadata = JSON.parse(room.metadata) as RoomMetadata;
      return roomMetadata.creator_identity === localParticipant.identity;
    }

    return false;
  }, [localMetadata, localParticipant.identity, room.metadata]);

  const hosts = useMemo(() => {
    const otherParticipants = isHost ? participants : [localParticipant, ...participants];

    return otherParticipants.filter((p) => {
      const metadata = parseMetadata(p.metadata);
      if (metadata?.role === "host") return true;

      if (room.metadata) {
        const roomMetadata = JSON.parse(room.metadata) as RoomMetadata;
        return roomMetadata.creator_identity === p.identity;
      }

      return false;
    });
  }, [localParticipant, participants, room.metadata, isHost]);

  const viewers = useMemo(() => {
    const otherParticipants = isHost ? participants : [localParticipant, ...participants];

    return otherParticipants.filter((p) => {
      if (hosts.some((h) => h.identity === p.identity)) return false;

      const metadata = parseMetadata(p.metadata);
      if (metadata?.role === "host") return false;

      if (room.metadata) {
        const roomMetadata = JSON.parse(room.metadata) as RoomMetadata;
        return roomMetadata.creator_identity !== p.identity;
      }

      return true;
    });
  }, [localParticipant, participants, room.metadata, hosts, isHost]);

  const onRaiseHand = async () => {
    if (!localParticipant) return;

    try {
      await actions.stream_raiseHand({
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
    } catch (error) {
      console.error("Failed to raise hand:", error);
    }
  };

  const onInviteToStage = async (identity: string) => {
    await actions.stream_inviteToStage({
      identity,
    });
  };

  const onRemoveFromStage = async (identity: string) => {
    await actions.stream_removeFromStage({
      identity,
    });
  };

  const onLowerHand = async (identity: string) => {
    await actions.stream_lowerHand({
      identity,
    });
  };

  const onRaiseHandForSelf = async () => {
    if (!localParticipant) return;

    try {
      await actions.stream_raiseHand({});
    } catch (error) {
      console.error("Failed to raise hand:", error);
    }
  };

  const onAcceptInvitation = async () => {
    if (!localParticipant) return;

    try {
      await actions.stream_raiseHand({
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    }
  };

  const onDeclineInvitation = async () => {
    if (!localParticipant) return;

    try {
      await actions.stream_removeFromStage({
        identity: localParticipant.identity,
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Host Stats */}
      {isHost && (
        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <Hand className="h-4 w-4" />
            {
              participants.filter((p) => {
                const metadata = parseMetadata(p.metadata);
                return metadata?.hand_raised && !metadata?.invited_to_stage;
              }).length
            }{" "}
            raised hand(s)
          </p>
        </div>
      )}

      {/* Stage Invitation for Current User */}
      {!isHost && localMetadata?.invited_to_stage && !localMetadata?.hand_raised && (
        <div className="bg-primary/5 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">You've been invited to the stage!</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Would you like to share your audio and video?
          </p>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={onAcceptInvitation}>
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={onDeclineInvitation}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Raise Hand Button for Viewers */}
      {!isHost && !localMetadata?.invited_to_stage && !localMetadata?.hand_raised && (
        <div className="mb-4">
          <Button variant="secondary" size="sm" className="w-full" onClick={onRaiseHandForSelf}>
            <Hand className="h-4 w-4 mr-2" />
            Raise Hand
          </Button>
        </div>
      )}

      {/* Cancel Hand Raise */}
      {!isHost && localMetadata?.hand_raised && !localMetadata?.invited_to_stage && (
        <div className="mb-4">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onLowerHand(localParticipant.identity)}
          >
            <Hand className="h-4 w-4 mr-2 fill-primary" />
            Cancel Request
          </Button>
        </div>
      )}

      {/* Leave Stage Button */}
      {!isHost && localMetadata?.invited_to_stage && localMetadata?.hand_raised && (
        <div className="mb-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onRemoveFromStage(localParticipant.identity)}
          >
            Leave Stage
          </Button>
        </div>
      )}

      {/* Hosts Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Hosts</h3>
        <div className="space-y-2">
          {hosts.map((participant) => (
            <ParticipantItem
              key={participant.identity}
              participant={participant}
              isLocal={participant.identity === localParticipant.identity}
              isHost={isHost}
              onInvite={() => {
                setSelectedParticipant(participant.identity);
                setDialogOpen(true);
              }}
              onRemove={() => onRemoveFromStage(participant.identity)}
              onLowerHand={() => onLowerHand(participant.identity)}
            />
          ))}
        </div>
      </div>

      {/* Viewers Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Viewers</h3>
        <div className="space-y-2">
          {viewers.map((participant) => (
            <ParticipantItem
              key={participant.identity}
              participant={participant}
              isLocal={participant.identity === localParticipant.identity}
              isHost={isHost}
              onInvite={() => {
                setSelectedParticipant(participant.identity);
                setDialogOpen(true);
              }}
              onRemove={() => onRemoveFromStage(participant.identity)}
              onLowerHand={() => onLowerHand(participant.identity)}
            />
          ))}
        </div>
      </div>

      {/* Invite to Stage Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to stage</DialogTitle>
            <DialogDescription>
              This will allow the participant to share their audio and video.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedParticipant && onInviteToStage(selectedParticipant)}>
              Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ParticipantItemProps {
  participant: any;
  isLocal: boolean;
  isHost: boolean;
  onInvite: () => void;
  onRemove: () => void;
  onLowerHand: () => void;
}

function ParticipantItem({
  participant,
  isLocal,
  isHost,
  onInvite,
  onRemove,
  onLowerHand,
}: ParticipantItemProps) {
  const metadata = parseMetadata(participant.metadata);

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        metadata?.hand_raised ? "bg-primary/5" : "hover:bg-accent"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{participant.identity[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {participant.identity}
              {isLocal && " (You)"}
            </p>
            {metadata?.hand_raised && (
              <Tooltip>
                <TooltipTrigger>
                  <Hand
                    className={cn(
                      "h-3 w-3",
                      isLocal ? "text-primary fill-primary" : "text-primary"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>Hand Raised</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{metadata?.role || "Viewer"}</p>
            {metadata?.invited_to_stage && (
              <Badge variant="secondary" className="text-xs">
                On Stage
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Media Status */}
        {metadata?.invited_to_stage && (
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger>
                {participant.isMicrophoneEnabled ? (
                  <Mic className="h-4 w-4 text-foreground" />
                ) : (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {participant.isMicrophoneEnabled ? "Mic On" : "Mic Off"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                {participant.isCameraEnabled ? (
                  <Video className="h-4 w-4 text-foreground" />
                ) : (
                  <VideoOff className="h-4 w-4 text-muted-foreground" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {participant.isCameraEnabled ? "Camera On" : "Camera Off"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Host Controls */}
        {isHost && !isLocal && (
          <div className="flex items-center gap-2">
            {metadata?.hand_raised && !metadata?.invited_to_stage && (
              <Button variant="default" size="sm" onClick={onInvite}>
                <UserPlus className="h-4 w-4 mr-2" />
                Accept Request
              </Button>
            )}

            {metadata?.hand_raised && (
              <Button variant="ghost" size="sm" onClick={onLowerHand}>
                <Hand className="h-4 w-4" />
                Lower Hand
              </Button>
            )}

            {metadata?.invited_to_stage && (
              <Button variant="destructive" size="sm" onClick={onRemove}>
                <UserMinus className="h-4 w-4 mr-2" />
                Remove from Stage
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
