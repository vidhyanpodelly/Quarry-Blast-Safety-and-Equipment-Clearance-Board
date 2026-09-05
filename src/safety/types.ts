export type Sector = 'A' | 'B' | 'C';

export type ClearanceStatus = 'CLEARED' | 'UNRESOLVED' | 'UNACCOUNTED' | 'RED_ZONE' | 'UNKNOWN';

export interface Asset {
  id: string;
  name: string;
  type: 'EXCAVATOR' | 'HAUL_TRUCK' | 'LOADER' | 'OPERATOR';
  sector: Sector | null;
  status: ClearanceStatus;
  x: number;
  y: number;
  lastVerifiedAt: number;
  operatorId?: string;
}

export interface Operator {
  id: string;
  name: string;
  sector: Sector | null;
  status: ClearanceStatus;
  x: number;
  y: number;
  lastVerifiedAt: number;
}

export type BlastState = 'LOCKED' | 'READY' | 'COUNTDOWN' | 'ABORTED';

export interface Signature {
  signedBy: string; // ID of the person
  role: 'PIT_SPOTTER' | 'MACHINE_OPERATOR';
  timestamp: number;
}

export interface SystemState {
  vehicles: Asset[];
  operators: Operator[];
  signatures: Signature[];
  blastState: BlastState;
  abortReason: string | null;
  activeAnomaly: boolean;
  isOffline: boolean;
}

export type ActionType = 
  | 'UPDATE_VEHICLE_STATUS' 
  | 'UPDATE_OPERATOR_STATUS' 
  | 'UPDATE_ASSET_POSITION'
  | 'MAKE_VERIFICATION_STALE'
  | 'ADD_SIGNATURE'
  | 'WITHDRAW_SIGNATURE' 
  | 'START_COUNTDOWN' 
  | 'ABORT_BLAST' 
  | 'CLEAR_ABORT';

export interface QueuedAction {
  id: string;
  type: ActionType;
  payload: any;
  timestamp: number;
  localVersion: number;
}
