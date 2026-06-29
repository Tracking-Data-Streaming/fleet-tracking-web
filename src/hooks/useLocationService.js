import { useState, useEffect } from 'react';
import {
  ListDevicePositionsCommand,
  GetDevicePositionHistoryCommand,
  BatchDeleteDevicePositionHistoryCommand,
} from "@aws-sdk/client-location";
import { TRACKER, DEVICE_POSITION_HISTORY_OFFSET } from "../configuration";

export const useLocationService = (readOnlyClient, writeOnlyClient) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all device positions
  const fetchDevicePositions = async () => {
    if (!readOnlyClient) {
      console.log('readOnlyClient not initialized yet');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching device positions...');
      const command = new ListDevicePositionsCommand({
        TrackerName: TRACKER,
      });
      const response = await readOnlyClient.send(command);
      
      console.log('Device positions response:', response);
      
      // Sort by most recent first
      const sorted = response.Entries.sort((a, b) => {
        return new Date(b.SampleTime) - new Date(a.SampleTime);
      });
      
      setDevices(sorted);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch device positions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch device position history
  const fetchDeviceHistory = async (deviceId) => {
    if (!readOnlyClient) return [];

    try {
      const currentTime = new Date();
      const command = new GetDevicePositionHistoryCommand({
        TrackerName: TRACKER,
        DeviceId: deviceId,
        StartTimeInclusive: new Date(
          currentTime.getTime() - DEVICE_POSITION_HISTORY_OFFSET * 1000
        ),
      });
      
      const response = await readOnlyClient.send(command);
      return response.DevicePositions || [];
    } catch (err) {
      console.error('Failed to fetch device history:', err);
      return [];
    }
  };

  // Delete device permanently
  const deleteDevice = async (deviceId) => {
    if (!writeOnlyClient) {
      throw new Error('Write client not initialized');
    }

    try {
      console.log('Deleting device:', deviceId);
      const command = new BatchDeleteDevicePositionHistoryCommand({
        TrackerName: TRACKER,
        DeviceIds: [deviceId],
      });
      
      await writeOnlyClient.send(command);
      
      // Remove from local state
      setDevices(prev => prev.filter(d => 
        (d.DeviceId || d.deviceId) !== deviceId
      ));
      
      console.log('Device deleted successfully');
      return true;
    } catch (err) {
      console.error('Failed to delete device:', err);
      throw err;
    }
  };

  return {
    devices,
    loading,
    error,
    fetchDevicePositions,
    fetchDeviceHistory,
    deleteDevice,
  };
};
