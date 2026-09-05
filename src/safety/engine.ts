import type { SystemState } from './types';

export const RED_ZONE = {
  x1: 150,
  y1: 100,
  x2: 350,
  y2: 200
};

export function isCoordinateInRedZone(x: number, y: number): boolean {
  return x >= RED_ZONE.x1 && x <= RED_ZONE.x2 && y >= RED_ZONE.y1 && y <= RED_ZONE.y2;
}

export const VERIFICATION_STALE_THRESHOLD_MS = 5 * 60 * 1000;

export const isVerificationStale = (lastVerifiedAt: number | undefined): boolean => {
  if (!lastVerifiedAt) return true;
  return Date.now() - lastVerifiedAt > VERIFICATION_STALE_THRESHOLD_MS;
};

export function canAuthorizeBlast(state: SystemState): {
  isSafe: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isSafe = true;

  // 1. Check active anomaly
  if (state.activeAnomaly) {
    isSafe = false;
    reasons.push('Active anomaly detected');
  }

  // 2. Check emergency abort
  if (state.abortReason || state.blastState === 'ABORTED') {
    isSafe = false;
    reasons.push(`Emergency Abort: ${state.abortReason || 'Unknown'}`);
  }

  // 3. Check vehicles and operators
  for (const v of state.vehicles) {
    if (isVerificationStale(v.lastVerifiedAt)) {
      isSafe = false;
      reasons.push(`Vehicle ${v.id} (${v.name}) verification is STALE (Device Unavailable)`);
    } else if (v.status !== 'CLEARED') {
      isSafe = false;
      reasons.push(`Vehicle ${v.id} (${v.name}) is ${v.status.replace('_', ' ')}`);
    } else if (isCoordinateInRedZone(v.x, v.y)) {
      isSafe = false;
      reasons.push(`Vehicle ${v.id} (${v.name}) is inside the RED ZONE`);
    }
  }

  for (const o of state.operators) {
    if (isVerificationStale(o.lastVerifiedAt)) {
      isSafe = false;
      reasons.push(`Operator ${o.id} (${o.name}) verification is STALE (Device Unavailable)`);
    } else if (o.status !== 'CLEARED') {
      isSafe = false;
      reasons.push(`Operator ${o.id} (${o.name}) is ${o.status.replace('_', ' ')}`);
    } else if (isCoordinateInRedZone(o.x, o.y)) {
      isSafe = false;
      reasons.push(`Operator ${o.id} (${o.name}) is inside the RED ZONE`);
    }
  }

  // 5. Check signatures (Requires BOTH Pit Spotter and Machine Operator)
  const hasPitSpotter = state.signatures.some(s => s.role === 'PIT_SPOTTER');
  const hasMachineOperator = state.signatures.some(s => s.role === 'MACHINE_OPERATOR');

  if (!hasPitSpotter || !hasMachineOperator) {
    isSafe = false;
    if (!hasPitSpotter) reasons.push('Missing PIT SPOTTER clearance');
    if (!hasMachineOperator) reasons.push('Missing MACHINE OPERATOR clearance');
  }

  // 6. Check for unknown/unresolved conditions (failsafe)
  // Even if everything above passes, if the state is considered 'offline' and 
  // there are queued actions that could affect safety, it might be unsafe, 
  // but we handle offline state mostly via the UI/Sync layer enforcing safter states locally.
  // We'll add a check that no state has 'UNKNOWN' status.
  const hasUnknownState = state.vehicles.some(v => v.status === 'UNKNOWN') || 
                          state.operators.some(o => o.status === 'UNKNOWN');
  
  if (hasUnknownState) {
    isSafe = false;
    if (!reasons.includes('Unknown state detected')) {
       reasons.push('Unknown safety state detected - Failsafe engaged');
    }
  }

  return { isSafe, reasons };
}
