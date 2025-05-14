import { WebRtcManager } from "./WebRtcManager";

describe("WebRtcManager", () => {
  let webRtcManager: WebRtcManager;
  const testPeerId = "test-peer-123";
  const testMessage = {
    id: "1",
    type: "text",
    content: "Hello, World!",
    sender: "user1",
    receiver: "user2",
    timestamp: Date.now(),
  } as const;

  beforeEach(() => {
    webRtcManager = new WebRtcManager({
      signalingServer: "ws://localhost:1234",
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  });

  test("should initialize properly with provided options", () => {
    expect(webRtcManager).toBeDefined();
  });

  test("should have all required methods", () => {
    expect(typeof webRtcManager.connect).toBe("function");
    expect(typeof webRtcManager.handleSignal).toBe("function");
    expect(typeof webRtcManager.sendMessage).toBe("function");
    expect(typeof webRtcManager.disconnect).toBe("function");
    expect(typeof webRtcManager.disconnectAll).toBe("function");
    expect(typeof webRtcManager.isConnected).toBe("function");
    expect(typeof webRtcManager.getConnectedPeers).toBe("function");
  });

  test("should create a connection without errors", async () => {
    await expect(
      webRtcManager.connect(testPeerId, true)
    ).resolves.not.toThrow();
  });

  test("should throw error when connecting to an existing peer", async () => {
    await webRtcManager.connect(testPeerId, true);
    await expect(webRtcManager.connect(testPeerId, false)).rejects.toThrow();
  });

  test("should throw error when handling signal for non-existent peer", async () => {
    await expect(
      webRtcManager.handleSignal("non-existent", {} as any)
    ).rejects.toThrow();
  });

  test("should throw error when sending message to non-existent peer", async () => {
    await expect(
      webRtcManager.sendMessage("non-existent", testMessage)
    ).rejects.toThrow();
  });

  test("should disconnect peer without errors", async () => {
    await webRtcManager.connect(testPeerId, true);
    expect(() => webRtcManager.disconnect(testPeerId)).not.toThrow();
  });

  test("should disconnect all peers without errors", async () => {
    await webRtcManager.connect(testPeerId, true);
    await webRtcManager.connect("another-peer", false);
    expect(() => webRtcManager.disconnectAll()).not.toThrow();
  });

  test("should return false for non-existent peer connection status", () => {
    expect(webRtcManager.isConnected("non-existent")).toBe(false);
  });

  test("should return empty array when no peers are connected", () => {
    expect(webRtcManager.getConnectedPeers()).toEqual([]);
  });

  test("should add and trigger event listeners", async () => {
    let eventTriggered = false;

    // 일반적인 이벤트 리스너 등록
    webRtcManager.addEventListener("testEvent", () => {
      eventTriggered = true;
    });

    // private emit 메서드를 호출하는 방법이 필요하여 우회 방법 사용
    // @ts-ignore: private 메서드 접근을 위한 타입 무시
    webRtcManager["emit"]("testEvent");

    expect(eventTriggered).toBe(true);
  });
});
