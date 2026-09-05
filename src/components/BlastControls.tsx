import React, { useEffect, useState, useRef } from 'react';
import { useSafety } from '../safety/SafetyContext';

export const BlastControls: React.FC = () => {
  const { state, authorization, dispatchAction } = useSafety();
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Monitor safety state during countdown
  useEffect(() => {
    if (state.blastState === 'COUNTDOWN') {
      if (!authorization.isSafe) {
        // Safety constraint violated during countdown!
        dispatchAction('ABORT_BLAST', { reason: authorization.reasons[0] });
      }
    }
  }, [authorization.isSafe, state.blastState, dispatchAction]);

  // Handle countdown timer
  useEffect(() => {
    if (state.blastState === 'COUNTDOWN') {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(10);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.blastState]);

  const handleStart = () => {
    if (authorization.isSafe) {
      dispatchAction('START_COUNTDOWN', null);
    }
  };

  const handleAbort = () => {
    dispatchAction('ABORT_BLAST', { reason: 'Manual Emergency Abort triggered' });
  };

  const handleClearAbort = () => {
    dispatchAction('CLEAR_ABORT', null);
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Authorization Status Panel */}
      <div className={`p-4 border-4 text-center font-bold ${
        state.blastState === 'ABORTED' ? 'border-red-600 bg-red-100 text-red-900' :
        !authorization.isSafe ? 'border-orange-500 bg-orange-100 text-orange-900' : 
        state.blastState === 'COUNTDOWN' ? 'border-red-600 bg-red-600 text-white animate-pulse' :
        'border-green-600 bg-green-100 text-green-900'
      }`}>
        <div className="text-2xl uppercase">
          {state.blastState === 'ABORTED' ? 'BLAST ABORTED' :
           state.blastState === 'COUNTDOWN' ? `COUNTDOWN: ${countdown}s` :
           !authorization.isSafe ? 'BLAST LOCKED' : 'READY TO CLEAR'}
        </div>
        
        {!authorization.isSafe && state.blastState !== 'ABORTED' && (
          <div className="mt-2 text-sm text-left">
            <div className="mb-1 uppercase">Safety Not Verified:</div>
            <ul className="list-disc pl-5">
              {authorization.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {state.blastState === 'ABORTED' && (
          <div className="mt-2 text-sm uppercase">
            Reason: {state.abortReason}
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        {state.blastState === 'ABORTED' ? (
          <button 
            onClick={handleClearAbort}
            className="col-span-2 py-4 bg-gray-800 text-white text-xl font-bold rounded uppercase active:bg-gray-900"
          >
            Acknowledge & Reset
          </button>
        ) : (
          <button 
            onClick={handleStart}
            disabled={!authorization.isSafe || state.blastState === 'COUNTDOWN'}
            className={`py-4 text-xl font-bold text-white rounded uppercase ${
              authorization.isSafe && state.blastState !== 'COUNTDOWN' ? 'bg-green-600 active:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Authorize
          </button>
        )}
        
        {state.blastState !== 'ABORTED' && (
          <button 
            onClick={handleAbort}
            className="py-4 bg-red-600 active:bg-red-800 text-white text-xl font-bold rounded uppercase"
          >
            Emergency Abort
          </button>
        )}
      </div>
    </div>
  );
};
