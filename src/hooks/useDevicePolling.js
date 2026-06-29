import { useEffect } from 'react';

const POLL_INTERVAL = 10000; // 10 seconds

export const useDevicePolling = (fetchDevicePositions, isActive = false) => {
  useEffect(() => {
    if (!isActive || !fetchDevicePositions) return;

    // Initial fetch
    fetchDevicePositions();

    // Start polling
    const interval = setInterval(() => {
      fetchDevicePositions();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isActive]); // Only depend on isActive, not fetchDevicePositions
};
