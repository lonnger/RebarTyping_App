import { useState } from 'react';

export const useGlobalConnect = () => {
  const [isConnected, setIsConnected] = useState(false);

  return { isConnected, setIsConnected };
};
