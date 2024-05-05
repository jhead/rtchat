import { v4 as uuid } from 'uuid';
import PeerService from './PeerService';
import WebRTCConnection from './WebRTCConnection';
import { DbPeer, DbPeerSession } from './types';
import EventBus, { CustomEvent } from '../EventBus';

export default class Signaling extends EventBus<SignalingEvents> {
  private readonly peerService;
  private readonly peerSet: Set<string> = new Set();
  private readonly intervals: number[] = [];
  private readonly sessions: Map<string, WebRTCConnection> = new Map();

  constructor(private readonly peerId: string) {
    super();
    this.peerService = new PeerService(this.peerId);
  }

  log(...args: any) {
    console.log(this.peerId, ...args);
  }

  async start() {
    await this.peerService.registerPeer();

    this.startDiscovery();
    this.completeSessions();
  }

  stop() {
    this.intervals.forEach((inter) => clearInterval(inter));

    Array.from(this.sessions.values()).forEach((session) => {
      session.close();
    });
  }

  private async startDiscovery() {
    const discover = async () => {
      const peers = await this.peerService.getPeers();
      peers.forEach((p) => this.onDiscoverPeer(p));
    };

    discover();

    const inter = setInterval(discover, 5000);
    this.intervals.push(inter);
  }

  private async completeSessions() {
    const answerAll = async () => {
      const sessions = await this.peerService.getSessions();

      if (sessions.length === 0) return;

      // Sessions initiated by other peers, awaiting our answer
      const unanswered = sessions.filter(
        (s) => !s.Answer && s.TargetPeerId === this.peerId,
      );
      unanswered.forEach((session) => this.onReceiveOffer(session));

      // Sessions initiated by us that have been answered, awaiting completion
      const incomplete = sessions.filter(
        (s) => !s.IsComplete && s.Answer && s.SourcePeerId === this.peerId,
      );
      incomplete.forEach((session) => this.onReceiveAnswer(session));
    };

    const inter = setInterval(answerAll, 2500);
    this.intervals.push(inter);
  }

  private async onDiscoverPeer(peer: DbPeer) {
    if (this.peerSet.has(peer.PeerId)) {
      return;
    }

    this.log('discovered peer', peer);
    this.createNewSession(peer);
  }

  private async onReceiveOffer(session: DbPeerSession) {
    this.log(
      `received offer from ${session.SourcePeerId} sending answer`,
      session.SessionId,
    );

    const rtc = new WebRTCConnection();
    this.sessions.set(session.SessionId, rtc);
    this.peerSet.add(session.SourcePeerId);

    const answer = await rtc.handleReceiveOffer(JSON.parse(session.Offer));

    this.peerService.sendAnswer(session.SessionId, answer);

    const event = new PeerConnectedEvent(session.SourcePeerId, rtc);
    this.dispatchEvent(event);
  }

  private async onReceiveAnswer(session: DbPeerSession) {
    this.log(`accepting answer`, session.SessionId);

    const rtc = this.sessions.get(session.SessionId);
    rtc?.handleReceiveAnswer(JSON.parse(session.Answer as string));

    if (rtc) {
      this.peerService.completeSession(session.SessionId);
      this.dispatchEvent(new PeerConnectedEvent(session.TargetPeerId, rtc));
    }
  }

  private async createNewSession(peer: DbPeer) {
    const sessionId = uuid().substring(26);
    console.log('creating new session', sessionId, 'target peer:', peer.PeerId);

    this.peerSet.add(peer.PeerId);
    this.dispatchEvent(new PeerDiscoveredEvent(peer.PeerId));

    const rtc = new WebRTCConnection();
    this.sessions.set(sessionId, rtc);

    const offer = await rtc.createOffer();
    this.peerService.initSession(peer.PeerId, sessionId, offer);
  }

  getSessions(): WebRTCConnection[] {
    return Array.from(this.sessions.values());
  }
}

export type SignalingEvents = PeerDiscoveredEvent | PeerConnectedEvent;

export class PeerDiscoveredEvent extends CustomEvent<
  typeof PeerDiscoveredEvent.type
> {
  static readonly type = 'peerDiscovered';
  constructor(readonly peerId: string) {
    super(PeerDiscoveredEvent.type);
  }
}

export class PeerConnectedEvent extends CustomEvent<
  typeof PeerConnectedEvent.type
> {
  static readonly type = 'peerConnected';
  constructor(
    readonly peerId: string,
    readonly connection: WebRTCConnection,
  ) {
    super(PeerConnectedEvent.type);
  }
}
