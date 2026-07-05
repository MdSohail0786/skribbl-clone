import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { connectSocket, getSocket } from '../socket/socketClient.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    connectSocket();
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
