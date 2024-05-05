import EventBus, { CustomEvent } from '../EventBus';

const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
};

export default class WebRTCConnection extends EventBus<RtcEvents> {
  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;

  constructor(configuration: RTCConfiguration = rtcConfig) {
    super();
    this.peerConnection = new RTCPeerConnection(configuration);
  }

  close() {
    this.peerConnection.close();
  }

  async createOffer() {
    this.dataChannel = this.peerConnection.createDataChannel('chat');

    this.dataChannel.addEventListener('message', (event) => {
      this.handleReceiveMessage(event);
    });

    const offer = await this.peerConnection.createOffer({});
    await this.peerConnection.setLocalDescription(offer);

    await this.waitForCandidateGathering();
    return this.peerConnection.localDescription as RTCSessionDescription;
  }

  async waitForCandidateGathering() {
    await new Promise((resolve) => {
      this.peerConnection.addEventListener('icegatheringstatechange', () => {
        if (this.peerConnection.iceGatheringState === 'complete') {
          resolve(null);
        }
      });
    });
  }

  async handleReceiveOffer(
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    this.peerConnection.ondatachannel = (event) => {
      console.log('data channel ready');
      this.dataChannel = event.channel;

      this.dataChannel.addEventListener('message', (event) => {
        this.handleReceiveMessage(event);
      });
    };

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer),
    );
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await this.waitForCandidateGathering();

    return this.peerConnection.localDescription as RTCSessionDescriptionInit;
  }

  handleReceiveAnswer(answer: RTCSessionDescriptionInit) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  handleNewICECandidate(candidate: RTCIceCandidate) {
    this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  handleReceiveMessage(event: MessageEvent) {
    console.log('Received message:', event);
    this.dispatchEvent(new RtcReceiveDataEvent(event.data));
  }

  send(data: any) {
    try {
      this.dataChannel?.send(data);
    } catch (err) {
      // console.log('failed to send message', err);
    }
  }
}

type RtcEvents = RtcReceiveDataEvent;

class RtcReceiveDataEvent extends CustomEvent<typeof RtcReceiveDataEvent.type> {
  static readonly type = 'rtcReceiveData';
  constructor(readonly data: any) {
    super(RtcReceiveDataEvent.type);
  }
}
