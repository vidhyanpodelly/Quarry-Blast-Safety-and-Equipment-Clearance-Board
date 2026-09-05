import React from 'react';
import { useSafety } from '../safety/SafetyContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, syncQueueCount } = useSafety();

  if (isOnline && syncQueueCount === 0) return null;

  return (
    <div className={`p-2 text-center text-sm font-bold text-white ${isOnline ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {!isOnline ? (
        <span>OFFLINE - Changes are queued locally ({syncQueueCount})</span>
      ) : (
        <span>ONLINE - Syncing {syncQueueCount} changes...</span>
      )}
    </div>
  );
};
