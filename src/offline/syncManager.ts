import type { SystemState, ClearanceStatus, QueuedAction } from '../safety/types';

const STATUS_SEVERITY: Record<ClearanceStatus, number> = {
  'RED_ZONE': 5,
  'UNKNOWN': 4,
  'UNACCOUNTED': 3,
  'UNRESOLVED': 2,
  'CLEARED': 1
};

// Returns the safer of two statuses
export function getSaferStatus(statusA: ClearanceStatus, statusB: ClearanceStatus): ClearanceStatus {
  return STATUS_SEVERITY[statusA] >= STATUS_SEVERITY[statusB] ? statusA : statusB;
}

export class SyncManager {
  private queue: QueuedAction[] = [];
  
  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('blast_safety_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load queue', e);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('blast_safety_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save queue', e);
    }
  }

  queueAction(action: QueuedAction) {
    this.queue.push(action);
    this.saveQueue();
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  removeAction(actionId: string) {
    this.queue = this.queue.filter(a => a.id !== actionId);
    this.saveQueue();
  }
}

export const applyActionToState = (state: SystemState, action: QueuedAction): SystemState => {
  const newState = { ...state, vehicles: [...state.vehicles], operators: [...state.operators], signatures: [...state.signatures] };
  
  switch(action.type) {
    case 'UPDATE_VEHICLE_STATUS':
      newState.vehicles = newState.vehicles.map(v => {
        if (v.id === action.payload.id) {
          return { ...v, status: action.payload.status, lastVerifiedAt: Date.now() };
        }
        return v;
      });
      break;
    case 'UPDATE_OPERATOR_STATUS':
      newState.operators = newState.operators.map(o => {
        if (o.id === action.payload.id) {
          return { ...o, status: action.payload.status, lastVerifiedAt: Date.now() };
        }
        return o;
      });
      break;
    case 'UPDATE_ASSET_POSITION':
      newState.vehicles = newState.vehicles.map(v => {
        if (v.id === action.payload.id) {
          return { ...v, x: action.payload.x, y: action.payload.y, lastVerifiedAt: Date.now() };
        }
        return v;
      });
      newState.operators = newState.operators.map(o => {
        if (o.id === action.payload.id) {
          return { ...o, x: action.payload.x, y: action.payload.y, lastVerifiedAt: Date.now() };
        }
        return o;
      });
      break;
    case 'MAKE_VERIFICATION_STALE':
      newState.vehicles = newState.vehicles.map(v => {
        if (v.id === action.payload.id) {
          return { ...v, lastVerifiedAt: 0 };
        }
        return v;
      });
      newState.operators = newState.operators.map(o => {
        if (o.id === action.payload.id) {
          return { ...o, lastVerifiedAt: 0 };
        }
        return o;
      });
      break;
    case 'ADD_SIGNATURE':
      // Only add if not already present by role to prevent duplicates (though multiple signatures of same role isn't explicitly forbidden, we want one of each)
      if (!newState.signatures.some(s => s.role === action.payload.role && s.signedBy === action.payload.signedBy)) {
        newState.signatures.push(action.payload);
      }
      break;
    case 'WITHDRAW_SIGNATURE':
      newState.signatures = newState.signatures.filter(s => s.role !== action.payload.role);
      break;
    case 'START_COUNTDOWN':
      newState.blastState = 'COUNTDOWN';
      break;
    case 'ABORT_BLAST':
      newState.blastState = 'ABORTED';
      newState.abortReason = action.payload.reason;
      break;
    case 'CLEAR_ABORT':
      newState.blastState = 'LOCKED';
      newState.abortReason = null;
      newState.signatures = []; // Reset signatures after an abort clear for safety
      break;
  }
  return newState;
}
