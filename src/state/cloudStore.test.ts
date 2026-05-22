import { describe, it, expect } from 'vitest';
import { cloudReducer } from './cloudStore.tsx';
import type { CloudAction } from './cloudStore.tsx';
import type { ECCloud } from '../types/ec.ts';

function createTestCloud(overrides?: Partial<ECCloud>): ECCloud {
  return {
    schemaVersion: 1,
    id: 'test-id',
    title: 'Test Cloud',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    objective: '',
    requirementB: '',
    requirementC: '',
    prerequisiteD: '',
    prerequisiteDPrime: '',
    conflict: { description: '' },
    assumptions: [],
    injections: [],
    ...overrides,
  };
}

describe('cloudReducer', () => {
  it('CREATE_CLOUD creates a new cloud with empty entities', () => {
    const action: CloudAction = { type: 'CREATE_CLOUD', payload: { title: 'My Cloud' } };
    const result = cloudReducer(null, action);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('My Cloud');
    expect(result!.objective).toBe('');
    expect(result!.assumptions).toEqual([]);
    expect(result!.injections).toEqual([]);
    expect(result!.id).toBeTruthy();
  });

  it('SET_CLOUD replaces the entire state', () => {
    const cloud = createTestCloud({ title: 'Replaced' });
    const result = cloudReducer(null, { type: 'SET_CLOUD', payload: { cloud } });
    expect(result).toBe(cloud);
  });

  it('UPDATE_ENTITY updates the objective', () => {
    const state = createTestCloud();
    const result = cloudReducer(state, {
      type: 'UPDATE_ENTITY',
      payload: { field: 'objective', value: 'Maximize throughput' },
    });
    expect(result!.objective).toBe('Maximize throughput');
    expect(result!.updatedAt).not.toBe(state.updatedAt);
  });

  it('UPDATE_ENTITY updates requirementB', () => {
    const state = createTestCloud();
    const result = cloudReducer(state, {
      type: 'UPDATE_ENTITY',
      payload: { field: 'requirementB', value: 'Cut costs' },
    });
    expect(result!.requirementB).toBe('Cut costs');
  });

  it('UPDATE_ENTITY updates conflict description', () => {
    const state = createTestCloud();
    const result = cloudReducer(state, {
      type: 'UPDATE_ENTITY',
      payload: { field: 'conflict', value: 'Cannot do both' },
    });
    expect(result!.conflict.description).toBe('Cannot do both');
  });

  it('UPDATE_ENTITY returns state unchanged when state is null', () => {
    const result = cloudReducer(null, {
      type: 'UPDATE_ENTITY',
      payload: { field: 'objective', value: 'test' },
    });
    expect(result).toBeNull();
  });

  it('ADD_ASSUMPTION adds an assumption to the correct arrow', () => {
    const state = createTestCloud();
    const result = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'A-B', text: 'Cost reduction is necessary' },
    });
    expect(result!.assumptions).toHaveLength(1);
    expect(result!.assumptions[0].arrowId).toBe('A-B');
    expect(result!.assumptions[0].text).toBe('Cost reduction is necessary');
    expect(result!.assumptions[0].challenged).toBe(false);
    expect(result!.assumptions[0].valid).toBeNull();
  });

  it('UPDATE_ASSUMPTION modifies an existing assumption', () => {
    const state = createTestCloud({
      assumptions: [{
        id: 'a1',
        arrowId: 'B-D',
        text: 'Original text',
        challenged: false,
        valid: null,
        challengeNotes: '',
      }],
    });
    const result = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id: 'a1', updates: { challenged: true, valid: false, challengeNotes: 'Disproven' } },
    });
    expect(result!.assumptions[0].challenged).toBe(true);
    expect(result!.assumptions[0].valid).toBe(false);
    expect(result!.assumptions[0].challengeNotes).toBe('Disproven');
    expect(result!.assumptions[0].text).toBe('Original text');
  });

  it('REMOVE_ASSUMPTION removes the assumption and its linked injections', () => {
    const state = createTestCloud({
      assumptions: [
        { id: 'a1', arrowId: 'A-B', text: 'Assumption 1', challenged: false, valid: null, challengeNotes: '' },
        { id: 'a2', arrowId: 'A-C', text: 'Assumption 2', challenged: false, valid: null, challengeNotes: '' },
      ],
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Injection for a1', feasibilityNotes: '', sufficiencyNotes: '' },
        { id: 'i2', targetAssumptionId: 'a2', text: 'Injection for a2', feasibilityNotes: '', sufficiencyNotes: '' },
      ],
    });
    const result = cloudReducer(state, { type: 'REMOVE_ASSUMPTION', payload: { id: 'a1' } });
    expect(result!.assumptions).toHaveLength(1);
    expect(result!.assumptions[0].id).toBe('a2');
    expect(result!.injections).toHaveLength(1);
    expect(result!.injections[0].id).toBe('i2');
  });

  it('ADD_INJECTION adds an injection linked to an assumption', () => {
    const state = createTestCloud({
      assumptions: [{ id: 'a1', arrowId: 'D-Dp', text: 'They conflict', challenged: true, valid: false, challengeNotes: '' }],
    });
    const result = cloudReducer(state, {
      type: 'ADD_INJECTION',
      payload: { targetAssumptionId: 'a1', text: 'Stagger the schedules' },
    });
    expect(result!.injections).toHaveLength(1);
    expect(result!.injections[0].targetAssumptionId).toBe('a1');
    expect(result!.injections[0].text).toBe('Stagger the schedules');
  });

  it('UPDATE_INJECTION modifies an existing injection', () => {
    const state = createTestCloud({
      injections: [{
        id: 'i1',
        targetAssumptionId: 'a1',
        text: 'Original',
        feasibilityNotes: '',
        sufficiencyNotes: '',
      }],
    });
    const result = cloudReducer(state, {
      type: 'UPDATE_INJECTION',
      payload: { id: 'i1', updates: { feasibilityNotes: 'Easy to implement', sufficiencyNotes: 'Fully resolves' } },
    });
    expect(result!.injections[0].feasibilityNotes).toBe('Easy to implement');
    expect(result!.injections[0].sufficiencyNotes).toBe('Fully resolves');
    expect(result!.injections[0].text).toBe('Original');
  });

  it('REMOVE_INJECTION removes only the specified injection', () => {
    const state = createTestCloud({
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Inj 1', feasibilityNotes: '', sufficiencyNotes: '' },
        { id: 'i2', targetAssumptionId: 'a1', text: 'Inj 2', feasibilityNotes: '', sufficiencyNotes: '' },
      ],
    });
    const result = cloudReducer(state, { type: 'REMOVE_INJECTION', payload: { id: 'i1' } });
    expect(result!.injections).toHaveLength(1);
    expect(result!.injections[0].id).toBe('i2');
  });
});
