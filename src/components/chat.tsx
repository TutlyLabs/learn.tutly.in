"use client";

import {
  ReceivedChatMessage,
  useChat,
  useLocalParticipant,
  useRoomInfo,
} from "@livekit/components-react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useMemo, useState } from "react";

import { RoomMetadata } from "@/lib/controller";
import { cn } from "@/lib/utils";

function ChatMessage({ message }: { message: ReceivedChatMessage }) {
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="break-words w-[220px] flex items-center justify-start my-3 ">
      <div className="w-8 h-8 mr-2 font-bold bg-gray-800 rounded-full flex items-center justify-center ring-2 ring-gray-800">
        {message.from?.identity[0]}
      </div>
      <div className="flex flex-col items-center">
        <p
          className={cn(
            localParticipant.identity === message.from?.identity
              ? "text-blue-500"
              : "text-gray-500",
            "font-bold text-medium overflow-auto "
          )}
        >
          {message.from?.identity ?? "Unknown"}
        </p>
        <Text size="1" className="ms-2 ">
          {message.message}
        </Text>
      </div>
    </div>
  );
}

export function Chat() {
  const [draft, setDraft] = useState("");
  const { chatMessages, send } = useChat();
  const { metadata } = useRoomInfo();

  const { enable_chat: chatEnabled } = (metadata ? JSON.parse(metadata) : {}) as RoomMetadata;

  // HACK: why do we get duplicate messages?
  const messages = useMemo(() => {
    const timestamps = chatMessages.map((msg) => msg.timestamp);
    const filtered = chatMessages.filter((msg, i) => !timestamps.includes(msg.timestamp, i + 1));

    return filtered;
  }, [chatMessages]);

  const onSend = async () => {
    if (draft.trim().length && send) {
      setDraft("");
      await send(draft);
    }
  };

  return (
    <div className=" flex-1 flex flex-col h-full ">
      <div className="text-center p-2 border-b border-accent-5">
        <Text size="2" className="font-mono text-accent-11">
          Live Chat
        </Text>
      </div>
      <div className=" flex-col justify-end items-center gap-2 px-2 overflow-y-auto h-3/4" >
        {messages.map((msg) => (
          <ChatMessage message={msg} key={msg.timestamp} />
        ))}
      </div>
      <div>
        <div className="border-t border-slate-500 py-4 px-2 mt-4 flex items-center gap-2">
          <div className="flex-1">
            <TextField.Input
              className="w-full text-gray-950"
              disabled={!chatEnabled}
              placeholder={chatEnabled ? "Say something..." : "Chat is disabled"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
          </div>
          <IconButton onClick={onSend} disabled={!draft.trim().length}>
            <PaperPlaneIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
