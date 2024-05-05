import { DbPeer, DbPeerSession } from './types';

export default class PeerService {
  constructor(
    private readonly peerId: string,
    private readonly baseUrl: string = import.meta.env.VITE_SIGNAL_URL,
  ) {}

  async registerPeer(): Promise<void> {
    await fetch(`${this.baseUrl}/peers/${this.peerId}`, {
      method: 'put',
    });
    console.log('registered peer', this.peerId);
  }

  async keepalive(): Promise<void> {
    this.registerPeer();
  }

  async getPeers(): Promise<DbPeer[]> {
    const peers: DbPeer[] = await fetch(`${this.baseUrl}/peers`).then((res) =>
      res.json(),
    );

    return peers.filter((p) => p.PeerId !== this.peerId);
  }

  async initSession(
    targetPeerId: string,
    sessionId: string,
    offer: RTCSessionDescriptionInit,
  ) {
    const session: DbPeerSession = {
      SessionId: sessionId,
      SourcePeerId: this.peerId,
      TargetPeerId: targetPeerId,
      Offer: JSON.stringify(offer),
    };

    await fetch(`${this.baseUrl}/sessions`, {
      method: 'put',
      body: JSON.stringify(session),
    });
  }

  async sendAnswer(sessionId: string, answer: RTCSessionDescriptionInit) {
    await fetch(`${this.baseUrl}/sessions/${sessionId}/answer`, {
      method: 'put',
      body: JSON.stringify(answer),
    });
  }

  async getSessions(): Promise<DbPeerSession[]> {
    return await fetch(`${this.baseUrl}/peers/${this.peerId}/sessions`).then(
      (res) => res.json(),
    );
  }

  async completeSession(id: string) {
    return await fetch(`${this.baseUrl}/sessions/${id}/complete`, {
      method: 'put',
    });
  }
}
