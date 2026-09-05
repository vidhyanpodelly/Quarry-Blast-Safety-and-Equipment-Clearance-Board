import React from 'react';
import { useSafety } from '../safety/SafetyContext';

export const PrintView: React.FC = () => {
  const { state } = useSafety();

  return (
    <div className="p-8 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold uppercase border-b-2 border-black pb-2 mb-4">Quarry Blast Safety - Daily Shift Summary</h1>
      
      <div className="mb-4">
        <p><strong>Date/Time:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> {state.blastState}</p>
        {state.abortReason && <p><strong>Abort Reason:</strong> {state.abortReason}</p>}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase border-b border-gray-400 mb-2">Clearance Sign-offs</h2>
        <ul>
          {state.signatures.length === 0 ? <li>No signatures</li> : 
            state.signatures.map((s, i) => (
              <li key={i}>{s.role}: {s.signedBy} at {new Date(s.timestamp).toLocaleTimeString()}</li>
            ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase border-b border-gray-400 mb-2">Vehicles</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th>ID</th>
              <th>Name</th>
              <th>Sector</th>
              <th>Status</th>
              <th>Red Zone</th>
            </tr>
          </thead>
          <tbody>
            {state.vehicles.map(v => (
              <tr key={v.id} className="border-b border-gray-200">
                <td>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.sector}</td>
                <td className="font-bold">{v.status}</td>
                <td className="font-bold text-red-600">{v.isInsideRedZone ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase border-b border-gray-400 mb-2">Operators</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th>ID</th>
              <th>Name</th>
              <th>Sector</th>
              <th>Status</th>
              <th>Red Zone</th>
            </tr>
          </thead>
          <tbody>
            {state.operators.map(o => (
              <tr key={o.id} className="border-b border-gray-200">
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.sector}</td>
                <td className="font-bold">{o.status}</td>
                <td className="font-bold text-red-600">{o.isInsideRedZone ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-500">
        End of Report
      </div>
    </div>
  );
};
