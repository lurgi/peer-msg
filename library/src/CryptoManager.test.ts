import { CryptoManager } from "./CryptoManager";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = jest.fn();
});
afterEach(() => {
  console.log = originalConsoleLog;
});

describe("CryptoManager", () => {
  let cryptoManager: CryptoManager;
  let peerCryptoManager: CryptoManager;

  beforeEach(() => {
    cryptoManager = new CryptoManager();
    peerCryptoManager = new CryptoManager();
  });

  test("should initialize with a key pair on construction", () => {
    expect(console.log).toHaveBeenCalledWith(
      "Encryption system successfully initialized."
    );
  });

  test("should return a base64 encoded public key", () => {
    const publicKey = cryptoManager.getPublicKey();

    expect(publicKey).toBeDefined();
    expect(typeof publicKey).toBe("string");

    // 유효한 base64 문자열인지 확인
    expect(() => {
      util.decodeBase64(publicKey);
    }).not.toThrow();

    // 올바른 길이의 키인지 확인
    expect(util.decodeBase64(publicKey).length).toBe(nacl.box.publicKeyLength);
  });

  test("should register a peer public key", () => {
    const peerPublicKey = peerCryptoManager.getPublicKey();
    const result = cryptoManager.registerPeerPublicKey("peer1", peerPublicKey);

    expect(result).toBe(true);
    expect(console.log).toHaveBeenCalledWith(
      "Public key for peer peer1 registered successfully"
    );
    expect(cryptoManager.hasPeerPublicKey("peer1")).toBe(true);
  });

  test("should throw error when registering invalid base64 public key", () => {
    expect(() => {
      cryptoManager.registerPeerPublicKey("peer1", "invalid-base64!@#");
    }).toThrow();
  });

  test("should throw error when encrypting message for unregistered peer", () => {
    expect(() => {
      cryptoManager.encryptMessage("unknownPeer", "Hello, world!");
    }).toThrow(
      /Cannot encrypt message: public key for peer unknownPeer not found/
    );
  });

  test("should throw error when decrypting message from unregistered peer", () => {
    expect(() => {
      cryptoManager.decryptMessage("unknownPeer", "someEncryptedString");
    }).toThrow(
      /Cannot decrypt message: public key for peer unknownPeer not found/
    );
  });

  test("should throw error when decrypting invalid message format", () => {
    const peerPublicKey = peerCryptoManager.getPublicKey();
    cryptoManager.registerPeerPublicKey("peer1", peerPublicKey);

    // 너무 짧은 메시지 (nonce 길이보다 짧음)
    const shortMessage = util.encodeBase64(new Uint8Array(5));

    expect(() => {
      cryptoManager.decryptMessage("peer1", shortMessage);
    }).toThrow(/Invalid encrypted message format/);
  });

  test("should throw error when decrypting with wrong keys", () => {
    // 두 개의 다른 CryptoManager 인스턴스로 테스트
    const alice = new CryptoManager();
    const bob = new CryptoManager();
    const eve = new CryptoManager();

    // Alice와 Bob이 서로의 키를 등록
    alice.registerPeerPublicKey("bob", bob.getPublicKey());
    bob.registerPeerPublicKey("alice", alice.getPublicKey());

    // Eve가 Alice의 키를 등록 (Bob으로부터 메시지를 가로챘다고 가정)
    eve.registerPeerPublicKey("alice", alice.getPublicKey());

    // Alice가 Bob에게 메시지를 암호화
    const message = "Secret message for Bob";
    const encryptedMessage = alice.encryptMessage("bob", message);

    // Eve가 암호화된 메시지를 복호화하려고 시도 (실패해야 함)
    expect(() => {
      eve.decryptMessage("alice", encryptedMessage);
    }).toThrow(/Failed to decrypt message/);
  });

  test("should successfully encrypt and decrypt a message", () => {
    // 테스트 설정
    const alice = new CryptoManager();
    const bob = new CryptoManager();

    alice.registerPeerPublicKey("bob", bob.getPublicKey());
    bob.registerPeerPublicKey("alice", alice.getPublicKey());

    // 메시지 테스트
    const originalMessage = "Hello, Bob! This is a secret message from Alice.";
    const encryptedMessage = alice.encryptMessage("bob", originalMessage);

    // 암호화된 메시지가 base64 인코딩 문자열인지 확인
    expect(typeof encryptedMessage).toBe("string");
    expect(() => {
      util.decodeBase64(encryptedMessage);
    }).not.toThrow();

    // 암호화된 메시지가 원본과 다른지 확인
    expect(encryptedMessage).not.toBe(originalMessage);

    // Bob이 메시지를 올바르게 복호화하는지 확인
    const decryptedMessage = bob.decryptMessage("alice", encryptedMessage);
    expect(decryptedMessage).toBe(originalMessage);
  });

  test("should encrypt different messages to different ciphertexts", () => {
    // 동일한 메시지를 두 번 암호화해도 다른 암호문이 생성되는지 확인 (논스 사용 검증)
    const peer = new CryptoManager();
    cryptoManager.registerPeerPublicKey("peer", peer.getPublicKey());

    const message = "Same message";
    const encrypted1 = cryptoManager.encryptMessage("peer", message);
    const encrypted2 = cryptoManager.encryptMessage("peer", message);

    expect(encrypted1).not.toBe(encrypted2);
  });

  test("should handle empty messages correctly", () => {
    const peer = new CryptoManager();
    cryptoManager.registerPeerPublicKey("peer", peer.getPublicKey());
    peer.registerPeerPublicKey("main", cryptoManager.getPublicKey());

    const emptyMessage = "";
    const encrypted = cryptoManager.encryptMessage("peer", emptyMessage);
    const decrypted = peer.decryptMessage("main", encrypted);

    expect(decrypted).toBe(emptyMessage);
  });

  test("should handle unicode characters correctly", () => {
    const peer = new CryptoManager();
    cryptoManager.registerPeerPublicKey("peer", peer.getPublicKey());
    peer.registerPeerPublicKey("main", cryptoManager.getPublicKey());

    const unicodeMessage = "안녕하세요! こんにちは! 你好! 🚀🔐🌍";
    const encrypted = cryptoManager.encryptMessage("peer", unicodeMessage);
    const decrypted = peer.decryptMessage("main", encrypted);

    expect(decrypted).toBe(unicodeMessage);
  });
});
