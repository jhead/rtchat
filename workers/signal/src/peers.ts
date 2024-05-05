type PeerState = 'OFFERED' | 'ANSWERED' | 'COMPLETE';

type DbPeer = {
  PeerId: string;
  Timestamp: string;
};

type DbPeerSession = {
  SessionId: string;
  SourcePeerId: string;
  TargetPeerId: string;
  Offer: string;
  Answer?: string;
  IsComplete?: boolean;
  Timestamp?: string;
};

class PeerService {
  constructor(private readonly db: D1Database) {}

  async getPeers(): Promise<DbPeer[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM Peers WHERE Timestamp > datetime("now", "-15 seconds")'
      )
      .all();

    console.log(`returned ${results.length} peers`);
    return results as any;
  }

  async registerPeer(id: string): Promise<any> {
    await this.db
      .prepare('INSERT OR IGNORE INTO Peers (PeerId) VALUES (?)')
      .bind(id)
      .run();

    await this.db
      .prepare(
        'UPDATE Peers SET Timestamp = datetime("now") WHERE PeerId = ? LIMIT 1'
      )
      .bind(id)
      .run();

    console.log('registered peer', id);
    return {};
  }

  async getSession(id: string): Promise<DbPeerSession> {
    const { results } = await this.db
      .prepare('SELECT * FROM PeerSessions WHERE SessionId = ? LIMIT 1')
      .bind(id)
      .all();

    if (results.length === 0) {
      throw new Error('session not found');
    }

    console.log('returned session', id);
    return results[0] as any;
  }

  async createSession(session: DbPeerSession) {
    const res = await this.db
      .prepare(
        'INSERT INTO PeerSessions (SessionId, SourcePeerId, TargetPeerId, Offer) VALUES (?, ?, ?, ?)'
      )
      .bind(
        session.SessionId,
        session.SourcePeerId,
        session.TargetPeerId,
        session.Offer
      )
      .run();

    console.log('created session', session.SessionId);
  }

  async answerSession(id: string, answer: any) {
    await this.db
      .prepare(
        'UPDATE PeerSessions Set Answer = ? WHERE SessionId = ? AND IsComplete = 0 LIMIT 1'
      )
      .bind(JSON.stringify(answer), id)
      .run();

    console.log('answered session', id);
  }

  async getSessions(sourcePeerId: string): Promise<DbPeerSession[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM PeerSessions WHERE (SourcePeerId = ? OR TargetPeerId = ?) AND IsComplete = 0'
      )
      .bind(sourcePeerId, sourcePeerId)
      .all();

    console.log('returned sessions', results.length);
    return results as any;
  }

  async completeSession(id: string) {
    await this.db
      .prepare(
        'UPDATE PeerSessions Set IsComplete = 1 WHERE SessionId = ? AND IsComplete = 0 LIMIT 1'
      )
      .bind(id)
      .run();

    console.log('completed session', id);
  }

  async debug(): Promise<any> {
    const peersDump = await this.db.prepare('SELECT * FROM Peers').all();
    const sessionsDump = await this.db
      .prepare('SELECT * FROM PeerSessions')
      .all();

    return {
      peers: peersDump.results,
      sessions: sessionsDump.results,
    };
  }

  async nuke() {
    await this.db.exec('DELETE FROM Peers');
    await this.db.exec('DELETE FROM PeerSessions');
  }
}

export default PeerService;
