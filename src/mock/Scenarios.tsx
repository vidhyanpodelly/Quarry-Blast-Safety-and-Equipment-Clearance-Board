import React from 'react';
import { useSafety } from '../safety/SafetyContext';
import type { ClearanceStatus } from '../safety/types';

export const Scenarios: React.FC = () => {
  const { state, dispatchAction } = useSafety();

  const handleStatusChange = (type: 'VEHICLE' | 'OPERATOR', id: string, newStatus: string) => {
    if (type === 'VEHICLE') {
      dispatchAction('UPDATE_VEHICLE_STATUS', { id, status: newStatus as ClearanceStatus });
    } else {
      dispatchAction('UPDATE_OPERATOR_STATUS', { id, status: newStatus as ClearanceStatus });
    }
  };

  const simulateOffline = () => window.dispatchEvent(new Event('offline'));
  const simulateOnline = () => window.dispatchEvent(new Event('online'));
  const clearStorageAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="bg-gray-200 p-4 rounded mt-4 border border-gray-400">
      <h4 className="font-bold mb-4 uppercase text-sm border-b border-gray-400 pb-2">Manual State Controls</h4>
      
      <div className="flex flex-col gap-4 text-sm">
        
        {/* Vehicles */}
        <div>
          <h5 className="font-bold mb-1">Vehicles</h5>
          {state.vehicles.map(v => (
            <div key={v.id} className="flex justify-between items-center bg-white p-1 mb-1 shadow-sm text-xs">
              <span className="w-12 font-bold">{v.id}</span>
              <select 
                value={v.status} 
                onChange={(e) => handleStatusChange('VEHICLE', v.id, e.target.value)}
                className="border p-1 mx-1 flex-1"
                data-testid={`vehicle-status-${v.id}`}
              >
                <option value="CLEARED">CLEARED</option>
                <option value="UNRESOLVED">UNRESOLVED</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
              <button 
                onClick={() => dispatchAction('MAKE_VERIFICATION_STALE', { id: v.id })}
                className="border p-1 bg-gray-300 text-[10px] uppercase font-bold"
                data-testid={`make-stale-${v.id}`}
              >
                Stale
              </button>
            </div>
          ))}
        </div>

        {/* Operators */}
        <div>
          <h5 className="font-bold mb-1">Operators</h5>
          {state.operators.map(o => (
            <div key={o.id} className="flex justify-between items-center bg-white p-1 mb-1 shadow-sm text-xs">
              <span className="w-12 font-bold">{o.id}</span>
              <select 
                value={o.status} 
                onChange={(e) => handleStatusChange('OPERATOR', o.id, e.target.value)}
                className="border p-1 mx-1 flex-1"
                data-testid={`operator-status-${o.id}`}
              >
                <option value="CLEARED">CLEARED</option>
                <option value="UNACCOUNTED">UNACCOUNTED</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
              <button 
                onClick={() => dispatchAction('MAKE_VERIFICATION_STALE', { id: o.id })}
                className="border p-1 bg-gray-300 text-[10px] uppercase font-bold"
                data-testid={`make-stale-${o.id}`}
              >
                Stale
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={simulateOffline} className="flex-1 bg-white px-2 py-2 text-sm border shadow-sm text-center font-bold">Drop Net</button>
          <button onClick={simulateOnline} className="flex-1 bg-white px-2 py-2 text-sm border shadow-sm text-center font-bold">Restore Net</button>
        </div>
        <button onClick={clearStorageAndReload} className="bg-red-200 px-2 py-2 text-sm border shadow-sm text-center mt-2 text-red-900 font-bold">RESET LOCAL STORAGE</button>
      </div>
    </div>
  );
};
