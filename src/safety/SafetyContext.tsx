import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { SystemState, QueuedAction, ActionType } from './types';
import { initialMockState } from '../mock/store';
import { SyncManager, applyActionToState } from '../offline/syncManager';
import { canAuthorizeBlast } from './engine';

interface SafetyContextType {
  state: SystemState;
  dispatchAction: (type: ActionType, payload: any) => void;
  syncQueueCount: number;
  isOnline: boolean;
  authorization: { isSafe: boolean; reasons: string[] };
}

const SafetyContext = createContext<SafetyContextType | null>(null);

const syncManager = new SyncManager();

export const SafetyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SystemState>(() => {
    // In a real app, we would load the last known state from IndexedDB here.
    const storedState = localStorage.getItem('blast_safety_state');
    if (storedState) {
      try {
        return JSON.parse(storedState);
      } catch (e) {
        console.error("Corrupted state", e);
      }
    }
    return initialMockState;
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueCount, setSyncQueueCount] = useState(syncManager.getQueue().length);
  const [authorization, setAuthorization] = useState(() => canAuthorizeBlast(state));

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('blast_safety_state', JSON.stringify(state));
    setAuthorization(canAuthorizeBlast(state));
  }, [state]);

  // Active safety ticker for time-based verifications
  useEffect(() => {
    const interval = setInterval(() => {
      setAuthorization(canAuthorizeBlast(state));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process Sync Queue when coming online
  useEffect(() => {
    if (isOnline && syncQueueCount > 0) {
      // Simulate sync to server and apply locally
      syncManager.getQueue();
      // In a real app, we'd send these to the server. Here we simulate network delay.
      const timer = setTimeout(() => {
        syncManager.clearQueue();
        setSyncQueueCount(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncQueueCount]);

  const dispatchAction = useCallback((type: ActionType, payload: any) => {
    const action: QueuedAction = {
      id: Math.random().toString(36).substring(7),
      type,
      payload,
      timestamp: Date.now(),
      localVersion: 1
    };

    if (!isOnline) {
      syncManager.queueAction(action);
      setSyncQueueCount(syncManager.getQueue().length);
    } else {
      // Direct pass, simulate server success
    }

    setState(prevState => applyActionToState(prevState, action));
  }, [isOnline]);

  return (
    <SafetyContext.Provider value={{ state, dispatchAction, syncQueueCount, isOnline, authorization }}>
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) throw new Error('useSafety must be used within a SafetyProvider');
  return context;
};
