class MockRTCPeerConnection {
  constructor() {
    this.localDescription = null;
    this.remoteDescription = null;
    this.onicecandidate = null;
    this.oniceconnectionstatechange = null;
    this.ontrack = null;
    this.ondatachannel = null;
  }

  createOffer() {
    return Promise.resolve({ type: "offer", sdp: "mock-sdp" });
  }

  createAnswer() {
    return Promise.resolve({ type: "answer", sdp: "mock-sdp" });
  }

  setLocalDescription(desc) {
    this.localDescription = desc;
    return Promise.resolve();
  }

  setRemoteDescription(desc) {
    this.remoteDescription = desc;
    return Promise.resolve();
  }

  addIceCandidate() {
    return Promise.resolve();
  }

  // 데이터 채널 관련
  createDataChannel(label) {
    return {
      label,
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };
  }
}

class MockMediaDevices {
  getUserMedia() {
    return Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    });
  }
}

global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = jest.fn((description) => description);
global.RTCIceCandidate = jest.fn((candidate) => candidate);

if (!global.navigator) {
  global.navigator = {};
}
global.navigator.mediaDevices = new MockMediaDevices();
