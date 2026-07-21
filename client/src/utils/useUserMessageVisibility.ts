import { useEffect, useMemo, useState } from "react";

import type { UserMessageSurface } from "../../../shared/types/userSettings.types";
import type { UserMessage } from "./userMessages";
import {
  dismissUserMessage,
  filterVisibleUserMessages,
  markUserMessagesSeen,
  readUserMessageVisibilityState,
} from "./userMessageVisibility";

export const useUserMessageVisibility = ({
  limit,
  messages,
  surface,
}: {
  limit?: number;
  messages: UserMessage[];
  surface: UserMessageSurface;
}) => {
  const [messageVisibilityState, setMessageVisibilityState] = useState(() =>
    readUserMessageVisibilityState()
  );
  const visibleMessages = useMemo(() => {
    const filteredMessages = filterVisibleUserMessages({
      messages,
      state: messageVisibilityState,
      surface,
    });

    return limit ? filteredMessages.slice(0, limit) : filteredMessages;
  }, [limit, messageVisibilityState, messages, surface]);

  useEffect(() => {
    if (visibleMessages.length === 0) {
      return;
    }

    markUserMessagesSeen({
      messages: visibleMessages,
      state: messageVisibilityState,
      surface,
    });
  }, [messageVisibilityState, surface, visibleMessages]);

  const dismissMessage = (message: UserMessage) => {
    setMessageVisibilityState((currentState) =>
      dismissUserMessage({
        message,
        state: currentState,
        surface,
      })
    );
  };

  return {
    dismissMessage,
    visibleMessages,
  };
};
