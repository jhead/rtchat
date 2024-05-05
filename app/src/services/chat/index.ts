import EventBus from '../EventBus';
import Signaling, { PeerConnectedEvent, SignalingEvents } from './Signaling';
import WebRTCConnection from './WebRTCConnection';
import { v4 as uuid } from 'uuid';

export type ChatEvents = SignalingEvents | ChatMessageEvent;

export type ChatMessageProto = {
  peer: string;
  id: string;
  msg: string;
};

export class ChatMessageEvent extends CustomEvent<
  typeof ChatMessageEvent.type
> {
  static readonly type = 'chatMessage';
  constructor(
    readonly fromPeerId: string,
    readonly message: string,
  ) {
    super(ChatMessageEvent.type);
  }
}

export class ChatService extends EventBus<ChatEvents> {
  private readonly sig: Signaling;

  constructor(private readonly peerId: string) {
    super();

    this.sig = new Signaling(peerId);

    this.pipeFrom('peerDiscovered', this.sig);
    this.pipeFrom('peerConnected', this.sig);

    this.addEventListener('peerConnected', (e: PeerConnectedEvent) =>
      this.onPeerConnected(e),
    );

    setTimeout(() => this.sig.start(), Math.random() * 2500);
  }

  send(data: any) {
    console.log(this.peerId, 'going to send', data);

    this.relay({
      peer: this.peerId,
      id: uuid(),
      msg: `${data}`,
    });
  }

  relay(proto: ChatMessageProto) {
    const sessions = this.sig.getSessions();
    const targets = Math.max(0, Math.ceil(sessions.length / 3));

    const ids = new Set<WebRTCConnection>();
    while (ids.size < targets) {
      const idx = Math.floor(Math.random() * sessions.length);
      ids.add(sessions[idx]);
    }

    ids.forEach((rtc) => {
      rtc.send(JSON.stringify(proto));
    });
  }

  cleanup() {
    this.sig.stop();
  }

  private history: Set<string> = new Set();
  private onReceiveMessage(viaPeerId: string, data: string) {
    if (!this.history.has(data)) {
      this.dispatchEvent(new ChatMessageEvent(viaPeerId, `${data}`));
      this.relay(JSON.parse(data));
      this.history.add(data);
    }
  }

  private onPeerConnected({ peerId, connection }: PeerConnectedEvent) {
    console.log('peer connected, listening for data', peerId);

    connection.addEventListener('rtcReceiveData', ({ data }) => {
      this.onReceiveMessage(peerId, data);
    });
  }
}
