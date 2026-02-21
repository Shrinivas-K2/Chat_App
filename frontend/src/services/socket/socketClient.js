import { io } from "socket.io-client";

class SocketClient {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) return this.socket;

    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    this.socket = io(url, {
      autoConnect: true,
      transports: ["websocket"],
      auth: { token },
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  on(event, handler) {
    this.socket?.on(event, handler);
  }

  off(event, handler) {
    this.socket?.off(event, handler);
  }

  emit(event, payload) {
    this.socket?.emit(event, payload);
  }

  get instance() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
