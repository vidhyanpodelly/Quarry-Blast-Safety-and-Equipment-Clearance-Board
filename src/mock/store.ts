import type { SystemState } from '../safety/types';

export const initialMockState: SystemState = {
  vehicles: [
    { id: 'V-01', name: 'Excavator 1', type: 'EXCAVATOR', sector: 'A', status: 'UNRESOLVED', x: 50, y: 50, lastVerifiedAt: Date.now() },
    { id: 'V-02', name: 'Excavator 2', type: 'EXCAVATOR', sector: 'B', status: 'CLEARED', x: 250, y: 50, lastVerifiedAt: Date.now() },
    { id: 'V-03', name: 'Haul Truck 1', type: 'HAUL_TRUCK', sector: 'A', status: 'CLEARED', x: 100, y: 250, lastVerifiedAt: Date.now() },
    { id: 'V-04', name: 'Loader 1', type: 'LOADER', sector: 'C', status: 'CLEARED', x: 450, y: 150, lastVerifiedAt: Date.now() },
  ],
  operators: [
    { id: 'O-01', name: 'Alice', sector: 'A', status: 'CLEARED', x: 60, y: 60, lastVerifiedAt: Date.now() },
    { id: 'O-02', name: 'Bob', sector: 'B', status: 'CLEARED', x: 260, y: 60, lastVerifiedAt: Date.now() },
    { id: 'O-03', name: 'Charlie', sector: 'A', status: 'UNACCOUNTED', x: 80, y: 80, lastVerifiedAt: Date.now() },
    { id: 'O-04', name: 'Dave', sector: 'C', status: 'CLEARED', x: 430, y: 130, lastVerifiedAt: Date.now() },
    { id: 'O-05', name: 'Eve', sector: 'B', status: 'CLEARED', x: 230, y: 250, lastVerifiedAt: Date.now() },
  ],
  signatures: [],
  blastState: 'LOCKED',
  abortReason: null,
  activeAnomaly: false,
  isOffline: false
};
