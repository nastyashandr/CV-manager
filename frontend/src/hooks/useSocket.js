import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

class SocketConnection {
  static instance = null;

  static get() {
    if (!SocketConnection.instance) {
      SocketConnection.instance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { autoConnect: true });
    }
    return SocketConnection.instance;
  }
}

export default function useSocket(positionId, onPost) {
  const handlerRef = useRef(onPost);
  handlerRef.current = onPost;

  useEffect(() => {
    if (!positionId) return;
    const socket = SocketConnection.get();
    socket.emit('joinPosition', positionId);
    const listener = (post) => handlerRef.current(post);
    socket.on('discussion:post', listener);
    return () => {
      socket.emit('leavePosition', positionId);
      socket.off('discussion:post', listener);
    };
  }, [positionId]);
}