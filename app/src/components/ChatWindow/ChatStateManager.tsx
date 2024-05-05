import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { EventsContext } from '../../ctx/Events';
import { ChatEvents, ChatService } from '../../services/chat';

export type ChatContext = {
  chatService?: ChatService;
};

export const ChatContext = React.createContext<ChatContext>({});

export const ChatStateManager: React.FC<
  PropsWithChildren<{
    peerId: string;
  }>
> = ({ peerId, children }) => {
  const { events } = useContext(EventsContext);
  const [ctx, setContext] = useState<ChatContext>({});

  useEffect(() => {
    console.log('peer id changed', peerId);
    const chatService = new ChatService(peerId);

    setContext({ chatService });
    return () => {
      chatService.cleanup();
    };
  }, [peerId]);

  useEffect(() => {
    if (ctx.chatService) {
      events?.pipeFrom('chatMessage', ctx.chatService);
      events?.pipeFrom('peerDiscovered', ctx.chatService);
      events?.pipeFrom('peerConnected', ctx.chatService);
    }
  }, [peerId, events]);

  return <ChatContext.Provider value={ctx}>{children}</ChatContext.Provider>;
};
