"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { ApprovalCard } from "./approval-card";
import { AssistantAvatar, UserAvatar } from "./avatars";
import { jstTime } from "./format";
import { ToolStep } from "./tool-step";
import { isApprovalRequested, isToolPart } from "./types";

export function MessageItem({
  message,
  timestamp,
  onPickSlot,
  onApprovalResponse,
}: {
  message: UIMessage;
  timestamp: number | undefined;
  onPickSlot: (label: string) => void;
  onApprovalResponse: (response: { id: string; approved: boolean }) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex max-w-[85%] animate-fade-in-up gap-2 ${
        isUser ? "flex-row-reverse self-end" : "w-full self-start"
      }`}
    >
      {isUser ? <UserAvatar /> : <AssistantAvatar />}
      <div className={`flex min-w-0 flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-lg p-3 text-sm ${
            isUser ? "bg-brand-teal/10" : "w-full bg-gray-100"
          }`}
        >
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <div key={index} className="markdown-body">
                  <ReactMarkdown>{part.text}</ReactMarkdown>
                </div>
              );
            }
            if (isToolPart(part)) {
              if (isApprovalRequested(part)) {
                return (
                  <ApprovalCard
                    key={index}
                    part={part}
                    onRespond={(approved) => onApprovalResponse({ id: part.approval.id, approved })}
                  />
                );
              }
              return <ToolStep key={index} part={part} onPickSlot={onPickSlot} />;
            }
            // step-start等の内部イベントは表示しない
            return null;
          })}
        </div>
        <span className="text-[11px] text-gray-400">
          {timestamp ? jstTime.format(new Date(timestamp)) : ""}
        </span>
      </div>
    </div>
  );
}
