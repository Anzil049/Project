import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Simulated WebSocket behavior for development
    console.log(`Connecting to simulated WebSocket: ${url}`);
    
    const connect = () => {
      setIsConnected(true);
      
      // Simulating incoming messages at random intervals
      const interval = setInterval(() => {
        if (options.onMessage) {
          const mockData = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...options.mockPayload
          };
          setData(mockData);
          options.onMessage(mockData);
        }
      }, options.interval || 10000);

      return interval;
    };

    const intervalId = connect();

    return () => {
      console.log(`Disconnecting from simulated WebSocket: ${url}`);
      clearInterval(intervalId);
      setIsConnected(false);
    };
  }, [url, JSON.stringify(options)]);

  const send = (payload) => {
    console.log(`Sending data via WebSocket:`, payload);
  };

  return { data, isConnected, error, send };
};

export default useWebSocket;
