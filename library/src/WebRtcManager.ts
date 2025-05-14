import SimplePeer from "simple-peer";
import { P2POptions, ConnectionEvents, Message } from "./types";

export class WebRtcManager extends EventTarget {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private options: P2POptions;

  constructor(options: P2POptions) {
    super();
    this.options = options;
  }

  private emit(eventName: string, detail?: any) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  async connect(peerId: string, initiator: boolean): Promise<void> {
    if (this.peers.has(peerId)) {
      throw new Error(`Connection to peer ${peerId} already exists`);
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: this.options.iceServers || [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (data) => {
      this.emit("signal", { peerId, data });
    });

    peer.on("connect", () => {
      this.emit(ConnectionEvents.PEER_CONNECTED, peerId);
    });

    peer.on("close", () => {
      this.peers.delete(peerId);
      this.emit(ConnectionEvents.PEER_DISCONNECTED, peerId);
    });

    peer.on("error", (err) => {
      this.emit(ConnectionEvents.CONNECTION_ERROR, { peerId, error: err });
    });

    peer.on("data", (data) => {
      try {
        const message: Message = JSON.parse(data.toString());
        this.emit(ConnectionEvents.MESSAGE_RECEIVED, message);
      } catch (error) {
        this.emit(ConnectionEvents.CONNECTION_ERROR, {
          peerId,
          error: new Error("Failed to parse received message"),
        });
      }
    });

    this.peers.set(peerId, peer);
  }

  async handleSignal(
    peerId: string,
    signal: SimplePeer.SignalData
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`No connection found for peer ${peerId}`);
    }

    peer.signal(signal);
  }

  async sendMessage(peerId: string, message: Message): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`No connection found for peer ${peerId}`);
    }

    if (!peer.connected) {
      throw new Error(`Not connected to peer ${peerId}`);
    }

    try {
      peer.send(JSON.stringify(message));
      this.emit(ConnectionEvents.MESSAGE_SENT, message);
    } catch (error) {
      this.emit(ConnectionEvents.CONNECTION_ERROR, {
        peerId,
        error: new Error("Failed to send message"),
      });
      throw error;
    }
  }

  disconnect(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.destroy();
      this.peers.delete(peerId);
    }
  }

  disconnectAll(): void {
    this.peers.forEach((peer) => peer.destroy());
    this.peers.clear();
  }

  isConnected(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    return peer?.connected || false;
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, peer]) => peer.connected)
      .map(([peerId]) => peerId);
  }
}
