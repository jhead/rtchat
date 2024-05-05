export type DbPeer = {
  PeerId: string;
  Timestamp: string;
};

export type DbPeerSession = {
  SessionId: string;
  SourcePeerId: string;
  TargetPeerId: string;
  Offer: string;
  Answer?: string;
  Timestamp?: string;
  IsComplete?: boolean;
};
