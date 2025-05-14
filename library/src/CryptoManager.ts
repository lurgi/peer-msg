import nacl from "tweetnacl";
import util from "tweetnacl-util";

export class CryptoManager {
  private keyPair: nacl.BoxKeyPair;
  private peerPublicKeys: Map<string, Uint8Array> = new Map();

  constructor() {
    this.keyPair = nacl.box.keyPair();
    console.log("Encryption system successfully initialized.");
  }

  getPublicKey(): string {
    return util.encodeBase64(this.keyPair.publicKey);
  }

  registerPeerPublicKey(peerId: string, publicKeyBase64: string): boolean {
    const publicKey = util.decodeBase64(publicKeyBase64);
    this.peerPublicKeys.set(peerId, publicKey);
    console.log(`Public key for peer ${peerId} registered successfully`);
    return true;
  }

  hasPeerPublicKey(peerId: string): boolean {
    return this.peerPublicKeys.has(peerId);
  }

  encryptMessage(peerId: string, message: string): string {
    if (!this.hasPeerPublicKey(peerId)) {
      throw new Error(
        `Cannot encrypt message: public key for peer ${peerId} not found. Register the peer's public key first using registerPeerPublicKey() method.`
      );
    }

    const messageUint8 = util.decodeUTF8(message);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encryptedMessage = nacl.box(
      messageUint8,
      nonce,
      this.peerPublicKeys.get(peerId)!,
      this.keyPair.secretKey
    );

    const fullMessage = new Uint8Array(nonce.length + encryptedMessage.length);
    fullMessage.set(nonce);
    fullMessage.set(encryptedMessage, nonce.length);

    return util.encodeBase64(fullMessage);
  }

  decryptMessage(peerId: string, encryptedBase64: string): string {
    if (!this.hasPeerPublicKey(peerId)) {
      throw new Error(
        `Cannot decrypt message: public key for peer ${peerId} not found. Register the peer's public key first using registerPeerPublicKey() method.`
      );
    }

    const fullMessage = util.decodeBase64(encryptedBase64);

    if (fullMessage.length <= nacl.box.nonceLength) {
      throw new Error(
        "Invalid encrypted message format. Provide a properly encrypted message."
      );
    }

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const encryptedMessage = fullMessage.slice(nacl.box.nonceLength);

    const decrypted = nacl.box.open(
      encryptedMessage,
      nonce,
      this.peerPublicKeys.get(peerId)!,
      this.keyPair.secretKey
    );

    if (!decrypted) {
      throw new Error(
        "Failed to decrypt message: incorrect keys or tampered message. Verify the peer ID and encrypted message."
      );
    }

    return util.encodeUTF8(decrypted);
  }
}
