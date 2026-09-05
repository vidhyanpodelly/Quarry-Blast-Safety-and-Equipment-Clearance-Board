import React from 'react';
import { useSafety } from '../safety/SafetyContext';

export const ClearancePanel: React.FC = () => {
  const { state, dispatchAction } = useSafety();

  const hasPitSpotter = state.signatures.some(s => s.role === 'PIT_SPOTTER');
  const hasMachineOperator = state.signatures.some(s => s.role === 'MACHINE_OPERATOR');

  const sign = (role: 'PIT_SPOTTER' | 'MACHINE_OPERATOR') => {
    dispatchAction('ADD_SIGNATURE', {
      signedBy: role === 'PIT_SPOTTER' ? 'User-Spotter-01' : 'User-Operator-01',
      role,
      timestamp: Date.now()
    });
  };

  const withdraw = (role: 'PIT_SPOTTER' | 'MACHINE_OPERATOR') => {
    dispatchAction('WITHDRAW_SIGNATURE', { role });
  };

  return (
    <div className="mt-4 border-2 border-gray-300 p-4 bg-white">
      <h3 className="text-lg font-bold mb-4 uppercase">Clearance Sign-off</h3>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gray-100 p-3 rounded">
          <div>
            <div className="font-bold">Pit Spotter</div>
            <div className="text-sm text-gray-600">
              {hasPitSpotter ? 'Signed' : 'Pending'}
            </div>
          </div>
          {hasPitSpotter ? (
            <button 
              onClick={() => withdraw('PIT_SPOTTER')}
              disabled={state.blastState === 'ABORTED'}
              className="px-4 py-2 font-bold text-white rounded bg-red-500 hover:bg-red-600 active:bg-red-700"
            >
              WITHDRAW SIGN-OFF
            </button>
          ) : (
            <button 
              onClick={() => sign('PIT_SPOTTER')}
              disabled={state.blastState !== 'LOCKED'}
              className="px-4 py-2 font-bold text-white rounded bg-blue-600 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SIGN
            </button>
          )}
        </div>

        <div className="flex justify-between items-center bg-gray-100 p-3 rounded">
          <div>
            <div className="font-bold">Machine Operator</div>
            <div className="text-sm text-gray-600">
              {hasMachineOperator ? 'Signed' : 'Pending'}
            </div>
          </div>
          {hasMachineOperator ? (
            <button 
              onClick={() => withdraw('MACHINE_OPERATOR')}
              disabled={state.blastState === 'ABORTED'}
              className="px-4 py-2 font-bold text-white rounded bg-red-500 hover:bg-red-600 active:bg-red-700"
            >
              WITHDRAW SIGN-OFF
            </button>
          ) : (
            <button 
              onClick={() => sign('MACHINE_OPERATOR')}
              disabled={state.blastState !== 'LOCKED'}
              className="px-4 py-2 font-bold text-white rounded bg-blue-600 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SIGN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
