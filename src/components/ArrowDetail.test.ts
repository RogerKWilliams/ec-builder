import { describe, it, expect } from 'vitest';
import { cloudReducer } from '../state/cloudStore.tsx';
import type { ECCloud } from '../types/ec.ts';

function createTestCloud(overrides?: Partial<ECCloud>): ECCloud {
  return {
    schemaVersion: 1,
    id: 'test-id',
    title: 'Test Cloud',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    objective: 'Maximize profit',
    requirementB: 'Cut costs',
    requirementC: 'Increase revenue',
    prerequisiteD: 'Lay off staff',
    prerequisiteDPrime: 'Hire more staff',
    conflict: { description: 'Cannot do both' },
    assumptions: [],
    injections: [],
    ...overrides,
  };
}

describe('ArrowDetail assumption interactions', () => {
  it('adds an assumption to a specific arrow and it appears only for that arrow', () => {
    let state = createTestCloud();

    // Add assumption to A-B arrow
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'A-B', text: 'Cost reduction drives profit' },
    })!;

    // Add assumption to A-C arrow
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'A-C', text: 'Revenue is primary driver' },
    })!;

    const abAssumptions = state.assumptions.filter(a => a.arrowId === 'A-B');
    const acAssumptions = state.assumptions.filter(a => a.arrowId === 'A-C');

    expect(abAssumptions).toHaveLength(1);
    expect(abAssumptions[0].text).toBe('Cost reduction drives profit');
    expect(acAssumptions).toHaveLength(1);
    expect(acAssumptions[0].text).toBe('Revenue is primary driver');
  });

  it('edits an existing assumption text via UPDATE_ASSUMPTION', () => {
    let state = createTestCloud();

    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'B-D', text: 'Original assumption' },
    })!;

    const id = state.assumptions[0].id;

    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id, updates: { text: 'Revised assumption' } },
    })!;

    expect(state.assumptions[0].text).toBe('Revised assumption');
    expect(state.assumptions[0].arrowId).toBe('B-D');
    // Other fields unchanged
    expect(state.assumptions[0].challenged).toBe(false);
    expect(state.assumptions[0].valid).toBeNull();
  });

  it('deletes an assumption and cascades to its injections', () => {
    let state = createTestCloud();

    // Add two assumptions to the conflict connection
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'D-Dp', text: 'They are mutually exclusive' },
    })!;
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'D-Dp', text: 'Resources are fixed' },
    })!;

    const firstId = state.assumptions[0].id;

    // Add an injection targeting the first assumption
    state = cloudReducer(state, {
      type: 'ADD_INJECTION',
      payload: { targetAssumptionId: firstId, text: 'Stagger timelines' },
    })!;

    expect(state.assumptions).toHaveLength(2);
    expect(state.injections).toHaveLength(1);

    // Delete the first assumption
    state = cloudReducer(state, {
      type: 'REMOVE_ASSUMPTION',
      payload: { id: firstId },
    })!;

    expect(state.assumptions).toHaveLength(1);
    expect(state.assumptions[0].text).toBe('Resources are fixed');
    // Injection should be cascade-deleted
    expect(state.injections).toHaveLength(0);
  });

  it('supports multiple assumptions on the same arrow', () => {
    let state = createTestCloud();

    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'C-Dp', text: 'First assumption' },
    })!;
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'C-Dp', text: 'Second assumption' },
    })!;
    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'C-Dp', text: 'Third assumption' },
    })!;

    const cDpAssumptions = state.assumptions.filter(a => a.arrowId === 'C-Dp');
    expect(cDpAssumptions).toHaveLength(3);
    expect(cDpAssumptions.map(a => a.text)).toEqual([
      'First assumption',
      'Second assumption',
      'Third assumption',
    ]);
  });

  it('assumption counts per arrow are correct after mixed operations', () => {
    let state = createTestCloud();

    // Add assumptions to various arrows
    state = cloudReducer(state, { type: 'ADD_ASSUMPTION', payload: { arrowId: 'A-B', text: 'a1' } })!;
    state = cloudReducer(state, { type: 'ADD_ASSUMPTION', payload: { arrowId: 'A-B', text: 'a2' } })!;
    state = cloudReducer(state, { type: 'ADD_ASSUMPTION', payload: { arrowId: 'A-C', text: 'a3' } })!;
    state = cloudReducer(state, { type: 'ADD_ASSUMPTION', payload: { arrowId: 'D-Dp', text: 'a4' } })!;

    // Remove one from A-B
    const a1Id = state.assumptions.find(a => a.text === 'a1')!.id;
    state = cloudReducer(state, { type: 'REMOVE_ASSUMPTION', payload: { id: a1Id } })!;

    const counts: Record<string, number> = {};
    for (const a of state.assumptions) {
      counts[a.arrowId] = (counts[a.arrowId] || 0) + 1;
    }

    expect(counts['A-B']).toBe(1);
    expect(counts['A-C']).toBe(1);
    expect(counts['D-Dp']).toBe(1);
    expect(counts['B-D']).toBeUndefined();
    expect(counts['C-Dp']).toBeUndefined();
  });
});

describe('CP3: Challenge and injection operations', () => {
  it('cycles assumption through unchallenged → valid → invalid → unchallenged', () => {
    let state = createTestCloud();

    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'A-B', text: 'Test assumption' },
    })!;

    const id = state.assumptions[0].id;

    // Start: unchallenged
    expect(state.assumptions[0].challenged).toBe(false);
    expect(state.assumptions[0].valid).toBeNull();

    // → valid
    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id, updates: { challenged: true, valid: true } },
    })!;
    expect(state.assumptions[0].challenged).toBe(true);
    expect(state.assumptions[0].valid).toBe(true);

    // → invalid
    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id, updates: { challenged: true, valid: false } },
    })!;
    expect(state.assumptions[0].challenged).toBe(true);
    expect(state.assumptions[0].valid).toBe(false);

    // → unchallenged (reset)
    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id, updates: { challenged: false, valid: null, challengeNotes: '' } },
    })!;
    expect(state.assumptions[0].challenged).toBe(false);
    expect(state.assumptions[0].valid).toBeNull();
    expect(state.assumptions[0].challengeNotes).toBe('');
  });

  it('saves challenge notes on an assumption', () => {
    let state = createTestCloud();

    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'D-Dp', text: 'Conflict assumption' },
    })!;

    const id = state.assumptions[0].id;

    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id, updates: { challenged: true, valid: false, challengeNotes: 'Market conditions changed' } },
    })!;

    expect(state.assumptions[0].challengeNotes).toBe('Market conditions changed');
    expect(state.assumptions[0].valid).toBe(false);
  });

  it('adds an injection to an invalid assumption', () => {
    let state = createTestCloud();

    state = cloudReducer(state, {
      type: 'ADD_ASSUMPTION',
      payload: { arrowId: 'B-D', text: 'Staffing is the only option' },
    })!;

    const aId = state.assumptions[0].id;

    // Mark invalid
    state = cloudReducer(state, {
      type: 'UPDATE_ASSUMPTION',
      payload: { id: aId, updates: { challenged: true, valid: false } },
    })!;

    // Add injection
    state = cloudReducer(state, {
      type: 'ADD_INJECTION',
      payload: { targetAssumptionId: aId, text: 'Outsource the work instead' },
    })!;

    expect(state.injections).toHaveLength(1);
    expect(state.injections[0].targetAssumptionId).toBe(aId);
    expect(state.injections[0].text).toBe('Outsource the work instead');
    expect(state.injections[0].feasibilityNotes).toBe('');
    expect(state.injections[0].sufficiencyNotes).toBe('');
  });

  it('updates injection feasibility and sufficiency notes', () => {
    let state = createTestCloud({
      assumptions: [{ id: 'a1', arrowId: 'C-Dp', text: 'Hiring is required', challenged: true, valid: false, challengeNotes: '' }],
      injections: [{ id: 'i1', targetAssumptionId: 'a1', text: 'Use contractors', feasibilityNotes: '', sufficiencyNotes: '' }],
    });

    state = cloudReducer(state, {
      type: 'UPDATE_INJECTION',
      payload: { id: 'i1', updates: { feasibilityNotes: 'Budget allows it', sufficiencyNotes: 'Partially resolves' } },
    })!;

    expect(state.injections[0].feasibilityNotes).toBe('Budget allows it');
    expect(state.injections[0].sufficiencyNotes).toBe('Partially resolves');
    expect(state.injections[0].text).toBe('Use contractors');
  });

  it('removes an injection without affecting the parent assumption', () => {
    let state = createTestCloud({
      assumptions: [{ id: 'a1', arrowId: 'A-C', text: 'Revenue drives growth', challenged: true, valid: false, challengeNotes: 'Not always' }],
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Injection 1', feasibilityNotes: '', sufficiencyNotes: '' },
        { id: 'i2', targetAssumptionId: 'a1', text: 'Injection 2', feasibilityNotes: '', sufficiencyNotes: '' },
      ],
    });

    state = cloudReducer(state, { type: 'REMOVE_INJECTION', payload: { id: 'i1' } })!;

    expect(state.injections).toHaveLength(1);
    expect(state.injections[0].id).toBe('i2');
    // Parent assumption unchanged
    expect(state.assumptions).toHaveLength(1);
    expect(state.assumptions[0].challenged).toBe(true);
  });
});
