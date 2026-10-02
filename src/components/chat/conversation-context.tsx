"use client";

import type { UIMessage } from "ai";
import { createContext, useContext, useMemo } from "react";
import { buildConversationIndex } from "./conversation-index";
import type { ConversationIndex } from "./types";

const EMPTY_INDEX = buildConversationIndex([]);
const ConversationContext = createContext<ConversationIndex>(EMPTY_INDEX);

// messages が変わったときだけ索引を作り直す
export function ConversationProvider({
  messages,
  children,
}: {
  messages: UIMessage[];
  children: React.ReactNode;
}) {
  const index = useMemo(() => buildConversationIndex(messages), [messages]);
  return <ConversationContext.Provider value={index}>{children}</ConversationContext.Provider>;
}

export function useConversationIndex(): ConversationIndex {
  return useContext(ConversationContext);
}
