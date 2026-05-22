import { describe, it, expect } from 'vitest';
import { exportCloudAsMarkdown } from './exportMarkdown.ts';
import type { ECCloud } from '../types/ec.ts';

function makeCloud(overrides: Partial<ECCloud> = {}): ECCloud {
  return {
    schemaVersion: 1,
    id: 'test-id',
    title: 'Test Cloud',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    objective: 'maximize profit',
    requirementB: 'cut costs',
    requirementC: 'increase revenue',
    prerequisiteD: 'reduce headcount',
    prerequisiteDPrime: 'hire more salespeople',
    conflict: { description: 'you cannot reduce and increase headcount simultaneously' },
    assumptions: [],
    injections: [],
    ...overrides,
  };
}

describe('exportCloudAsMarkdown', () => {
  it('includes title and all entities', () => {
    const md = exportCloudAsMarkdown(makeCloud());
    expect(md).toContain('# Test Cloud');
    expect(md).toContain('maximize profit');
    expect(md).toContain('cut costs');
    expect(md).toContain('increase revenue');
    expect(md).toContain('reduce headcount');
    expect(md).toContain('hire more salespeople');
    expect(md).toContain('you cannot reduce and increase headcount simultaneously');
  });

  it('shows assumptions with correct status', () => {
    const md = exportCloudAsMarkdown(makeCloud({
      assumptions: [
        { id: 'a1', arrowId: 'A-B', text: 'Cost is the main driver', challenged: false, valid: null, challengeNotes: '' },
        { id: 'a2', arrowId: 'A-B', text: 'No alternative cost savings', challenged: true, valid: true, challengeNotes: 'Confirmed by CFO' },
        { id: 'a3', arrowId: 'A-C', text: 'Revenue must grow', challenged: true, valid: false, challengeNotes: 'Market is saturated' },
      ],
    }));
    expect(md).toContain('Cost is the main driver — *Unchallenged*');
    expect(md).toContain('No alternative cost savings — **Valid**');
    expect(md).toContain('Confirmed by CFO');
    expect(md).toContain('Revenue must grow — **Invalid**');
    expect(md).toContain('Market is saturated');
  });

  it('shows injections under their parent assumptions', () => {
    const md = exportCloudAsMarkdown(makeCloud({
      assumptions: [
        { id: 'a1', arrowId: 'A-B', text: 'Cost is the main driver', challenged: true, valid: false, challengeNotes: '' },
      ],
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Automate processes', feasibilityNotes: 'Tools exist', sufficiencyNotes: 'Saves 30%' },
      ],
    }));
    expect(md).toContain('Injection: Automate processes');
    expect(md).toContain('Feasibility: Tools exist');
    expect(md).toContain('Sufficiency: Saves 30%');
  });

  it('handles empty cloud gracefully', () => {
    const md = exportCloudAsMarkdown(makeCloud({
      title: '',
      objective: '',
      requirementB: '',
      requirementC: '',
      prerequisiteD: '',
      prerequisiteDPrime: '',
      conflict: { description: '' },
      assumptions: [],
      injections: [],
    }));
    expect(md).toContain('# Evaporating Cloud');
    expect(md).toContain('*No assumptions surfaced yet.*');
    expect(md).toContain('*No injections proposed yet.*');
    expect(md).toContain('Entities defined: 0/5');
  });

  it('includes analysis status counts', () => {
    const md = exportCloudAsMarkdown(makeCloud({
      assumptions: [
        { id: 'a1', arrowId: 'A-B', text: 'A1', challenged: true, valid: false, challengeNotes: '' },
        { id: 'a2', arrowId: 'B-D', text: 'A2', challenged: true, valid: true, challengeNotes: '' },
        { id: 'a3', arrowId: 'A-C', text: 'A3', challenged: false, valid: null, challengeNotes: '' },
      ],
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Injection', feasibilityNotes: '', sufficiencyNotes: '' },
      ],
    }));
    expect(md).toContain('Entities defined: 5/5');
    expect(md).toContain('Assumptions surfaced: 3');
    expect(md).toContain('Assumptions challenged: 2/3');
    expect(md).toContain('Invalid assumptions found: 1');
    expect(md).toContain('Injections proposed: 1');
  });

  it('includes injections summary section', () => {
    const md = exportCloudAsMarkdown(makeCloud({
      assumptions: [
        { id: 'a1', arrowId: 'D-Dp', text: 'Cannot coexist', challenged: true, valid: false, challengeNotes: '' },
      ],
      injections: [
        { id: 'i1', targetAssumptionId: 'a1', text: 'Find a third way', feasibilityNotes: '', sufficiencyNotes: '' },
      ],
    }));
    expect(md).toContain('## Injections Summary');
    expect(md).toContain('**Find a third way**');
    expect(md).toContain('Cannot coexist');
  });
});
