import { describe, it, expect } from 'vitest';
import { canAuthorizeBlast } from './engine';
import { initialMockState } from '../mock/store';
import type { SystemState } from './types';

describe('Safety Engine - canAuthorizeBlast', () => {
  it('returns false if active anomaly is present', () => {
    const state = { ...initialMockState, activeAnomaly: true };
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain('Active anomaly detected');
  });

  it('returns false if signatures are missing', () => {
    const state = { ...initialMockState, signatures: [] };
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain('Missing PIT SPOTTER clearance');
    expect(result.reasons).toContain('Missing MACHINE OPERATOR clearance');
  });

  it('returns true if everything is clear and both signatures exist', () => {
    const state: SystemState = {
      ...initialMockState,
      vehicles: initialMockState.vehicles.map(v => ({ ...v, status: 'CLEARED' })),
      operators: initialMockState.operators.map(o => ({ ...o, status: 'CLEARED' })),
      signatures: [
        { role: 'PIT_SPOTTER', signedBy: 'A', timestamp: 1 },
        { role: 'MACHINE_OPERATOR', signedBy: 'B', timestamp: 1 }
      ]
    };
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(true);
  });

  it('returns false if one vehicle is unresolved', () => {
    const state: SystemState = {
      ...initialMockState,
      vehicles: initialMockState.vehicles.map(v => ({ ...v, status: 'CLEARED' })),
      operators: initialMockState.operators.map(o => ({ ...o, status: 'CLEARED' })),
      signatures: [
        { role: 'PIT_SPOTTER', signedBy: 'A', timestamp: 1 },
        { role: 'MACHINE_OPERATOR', signedBy: 'B', timestamp: 1 }
      ]
    };
    state.vehicles[0].status = 'UNRESOLVED';
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(false);
    expect(result.reasons[0]).toContain('is UNRESOLVED');
  });
  
  it('returns false if asset enters red zone', () => {
    const state: SystemState = {
      ...initialMockState,
      vehicles: initialMockState.vehicles.map(v => ({ ...v, status: 'CLEARED' })),
      operators: initialMockState.operators.map(o => ({ ...o, status: 'CLEARED' })),
      signatures: [
        { role: 'PIT_SPOTTER', signedBy: 'A', timestamp: 1 },
        { role: 'MACHINE_OPERATOR', signedBy: 'B', timestamp: 1 }
      ]
    };
    state.vehicles[0].x = 250;
    state.vehicles[0].y = 150;
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(false);
    expect(result.reasons[0]).toContain('is inside the RED ZONE');
  });

  it('returns false if state has UNKNOWN failsafe condition', () => {
    const state: SystemState = {
      ...initialMockState,
      vehicles: initialMockState.vehicles.map(v => ({ ...v, status: 'CLEARED' })),
      operators: initialMockState.operators.map(o => ({ ...o, status: 'CLEARED' })),
      signatures: [
        { role: 'PIT_SPOTTER', signedBy: 'A', timestamp: 1 },
        { role: 'MACHINE_OPERATOR', signedBy: 'B', timestamp: 1 }
      ]
    };
    state.vehicles[0].status = 'UNKNOWN';
    const result = canAuthorizeBlast(state);
    expect(result.isSafe).toBe(false);
  });
});
