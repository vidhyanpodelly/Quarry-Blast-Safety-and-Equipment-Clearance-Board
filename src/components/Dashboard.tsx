import React, { useState } from 'react';
import { PitGrid } from './PitGrid';
import { ClearancePanel } from './ClearancePanel';
import { BlastControls } from './BlastControls';
import { OfflineIndicator } from './OfflineIndicator';
import { Scenarios } from '../mock/Scenarios';
import { PrintView } from '../report/PrintView';

export const Dashboard: React.FC = () => {
  const [showScenarios, setShowScenarios] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  if (isPrinting) {
    return <PrintView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 max-w-md md:max-w-2xl lg:max-w-3xl mx-auto sm:border-x sm:border-gray-300 relative">
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold uppercase tracking-wide">Quarry Safety</h1>
        <button 
          onClick={handlePrint}
          className="text-xs bg-gray-700 px-2 py-1 rounded"
        >
          REPORT
        </button>
      </header>

      <OfflineIndicator />

      <main className="flex-1 p-4 flex flex-col gap-4">
        <BlastControls />
        <ClearancePanel />
        <PitGrid />
        
        <div className="mt-8 pt-4 border-t border-gray-300">
          <button 
            onClick={() => setShowScenarios(!showScenarios)}
            className="w-full text-xs text-gray-500 underline text-center"
          >
            {showScenarios ? 'Hide Scenarios' : 'Developer: Show Scenarios'}
          </button>
          {showScenarios && <Scenarios />}
        </div>
      </main>
    </div>
  );
};
