import styled from '@emotion/styled';
import React, { FormEventHandler, useContext, useState } from 'react';
import { WithEvents, useEventHandler } from '../../ctx/Events';
import { ChatMessageEvent, ChatMessageProto } from '../../services/chat';
import {
  PeerConnectedEvent,
  PeerDiscoveredEvent,
} from '../../services/chat/Signaling';
import { ChatContext, ChatStateManager } from './ChatStateManager';

export const ChatWindow: React.FC<{ peerId: string }> = ({ peerId }) => {
  return (
    <WithEvents>
      <ChatStateManager peerId={peerId}>
        <ChatContainer>
          <PeerId>Peer ID: {peerId}</PeerId>
          <ChatPanes>
            <ChatMessageWindow />
            <PeerList />
          </ChatPanes>
          <ChatMessageSender />
        </ChatContainer>
      </ChatStateManager>
    </WithEvents>
  );
};

const ChatPanes = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 125px;
`;

const ChatMessageSender: React.FC = () => {
  const { chatService } = useContext(ChatContext);

  const onSendMessage = (message: string) => {
    chatService?.send(message);
  };

  return <ChatControls onSendMessage={onSendMessage} />;
};

type ChatControlsProps = {
  onSendMessage: (msg: string) => void;
};

const ChatControls: React.FC<ChatControlsProps> = ({ onSendMessage }) => {
  const [messageText, setMessageText] = useState<string>('');

  const send = () => {
    if (messageText) onSendMessage(messageText);
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    send();
    setMessageText('');
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="msg"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <button onSubmit={send}>Send</button>
      </form>
    </>
  );
};

const ChatMessageWindow: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  const onReceiveMessage = ({ fromPeerId, message }: ChatMessageEvent) => {
    const proto = JSON.parse(message) as ChatMessageProto;
    setMessages((existing) => [
      ...existing,
      `${proto.peer}: ${proto.msg} (${fromPeerId})`,
    ]);
  };

  useEventHandler('chatMessage', onReceiveMessage);

  return (
    <>
      <ChatTextArea value={messages.join('\n')} readOnly={true} />
    </>
  );
};

const PeerList = () => {
  const [peers, setPeers] = useState<Map<string, boolean>>(new Map());

  useEventHandler('peerDiscovered', (event: PeerDiscoveredEvent) => {
    setPeers((peers) => {
      return new Map(peers.set(event.peerId, false));
    });
  });

  useEventHandler('peerConnected', (event: PeerConnectedEvent) => {
    setPeers((peers) => {
      return new Map(peers.set(event.peerId, true));
    });
  });

  return (
    <>
      <ul
        style={{
          overflowY: 'scroll',
          listStyle: 'none',
          border: '1px solid #aaa',
          margin: '0',
          padding: '0',
          flex: '1',
          fontSize: '11px',
        }}
      >
        {peers.size === 0 ? <li>No peers</li> : null}
        {Array.from(peers).map(([peerId, state]) => (
          <li key={peerId} style={{}}>
            {state ? '🟢' : '⚫'} {peerId}{' '}
          </li>
        ))}
      </ul>
    </>
  );
};

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  margin: 15px;
  border: 1px solid #aaa;
`;

const PeerId = styled.div`
  font-weight: bold;
`;

const ChatTextArea = styled.textarea`
  color: red;
`;
