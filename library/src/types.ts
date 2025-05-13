export interface EncryptionOptions {
  enabled: boolean;
}

export interface P2POptions {
  signalingServer: string;
  iceServers?: RTCIceServer[];
  encryption?: EncryptionOptions;
}

export interface Message {
  id: string;
  type: "text" | "file" | "control";
  content: string;
  sender: string;
  receiver: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface EncryptedMessage {
  id: string;
  content: string; // Base64 인코딩된 암호화 메시지
  sender: string;
  receiver: string;
  timestamp: number;
  type: "text" | "file" | "control";
  metadata?: Record<string, any>;
}

export enum ConnectionEvents {
  PEER_CONNECTED = "peer-connected",
  PEER_DISCONNECTED = "peer-disconnected",
  MESSAGE_RECEIVED = "message-received",
  MESSAGE_SENT = "message-sent",
  CONNECTION_ERROR = "connection-error",
  ENCRYPTION_ERROR = "encryption-error",
  PUBLIC_KEY_UPDATED = "public-key-updated",
}
