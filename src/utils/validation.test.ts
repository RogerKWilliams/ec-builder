import { describe, it, expect } from 'vitest';
import { validateCloud, calculateCompleteness } from './validation.ts';
import type { ECCloud } from '../types/ec.ts';

function makeCloud(overrides: Partial<ECCloud> = {}): ECCloud {
  return {
    schemaVersion: 1,
    id: 'test-id',
    title: 'Test Cloud',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
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

function makeCompleteCloud(): ECCloud {
  const arrowIds = ['A-B', 'A-C', 'B-D', 'C-Dp', 'D-Dp'] as const;
  const assumptions = arrowIds.map((arrowId, i) => ({
    id: `a-${i}`,
    arrowId,
    text: `Assumption for ${arrowId}`,
    challenged: true,
    valid: true as boolean | null,
    challengeNotes: 'Checked',
  }));

  return makeCloud({
    objective: 'Objective A',
    requirementB: 'Requirement B',
    requirementC: 'Requirement C',
    prerequisiteD: 'Prerequisite D',
    prerequisiteDPrime: "Prerequisite D'",
    conflict: { description: 'They conflict because...' },
    assumptions,
    injections: [],
  });
}

describe('validateCloud', () => {
  it('flags everything on an empty cloud', () => {
    const flags = validateCloud(makeCloud());
    const categories = new Set(flags.map((f) => f.category));

    expect(categories.has('Incomplete entities')).toBe(true);
    expect(categories.has('Missing conflict')).toBe(true);
    expect(categories.has('Arrows without assumptions')).toBe(true);

    // 5 entities + 1 conflict + 5 arrows = 11 flags minimum
    expect(flags.length).toBeGreaterThanOrEqual(11);
    // All should be warnings (no assumptions = no unchallenged/injection flags)
    expect(flags.every((f) => f.severity === 'warning')).toBe(true);
  });

  it('produces no flags on a complete cloud', () => {
    const flags = validateCloud(makeCompleteCloud());
    expect(flags).toHaveLength(0);
  });

  it('flags unchallenged assumptions', () => {
    const cloud = makeCompleteCloud();
    cloud.assumptions[0].challenged = false;
    cloud.assumptions[0].valid = null;

    const flags = validateCloud(cloud);
    const unchallenged = flags.filter((f) => f.category === 'Unchallenged assumptions');
    expect(unchallenged).toHaveLength(1);
    expect(unchallenged[0].severity).toBe('info');
    expect(unchallenged[0].arrowId).toBe('A-B');
  });

  it('flags injections without feasibility and sufficiency notes', () => {
    const cloud = makeCompleteCloud();
    // Make one assumption invalid with an injection
    cloud.assumptions[2].valid = false;
    cloud.injections = [{
      id: 'inj-1',
      targetAssumptionId: cloud.assumptions[2].id,
      text: 'An injection',
      feasibilityNotes: '',
      sufficiencyNotes: '',
    }];

    const flags = validateCloud(cloud);
    const injectionFlags = flags.filter((f) => f.category === 'Injections missing notes');
    expect(injectionFlags).toHaveLength(2); // one for feasibility, one for sufficiency
    expect(injectionFlags.every((f) => f.severity === 'info')).toBe(true);
  });

  it('flags only the specific missing elements in a partial cloud', () => {
    const cloud = makeCloud({
      objective: 'Objective A',
      requirementB: 'Requirement B',
      requirementC: '', // missing
      prerequisiteD: 'Prerequisite D',
      prerequisiteDPrime: '', // missing
      conflict: { description: 'They conflict' },
      assumptions: [
        { id: 'a1', arrowId: 'A-B', text: 'test', challenged: true, valid: true, challengeNotes: '' },
        // no assumptions for A-C, B-D, C-Dp, D-Dp
      ],
    });

    const flags = validateCloud(cloud);
    const entityFlags = flags.filter((f) => f.category === 'Incomplete entities');
    expect(entityFlags).toHaveLength(2);

    const conflictFlags = flags.filter((f) => f.category === 'Missing conflict');
    expect(conflictFlags).toHaveLength(0);

    const arrowFlags = flags.filter((f) => f.category === 'Arrows without assumptions');
    expect(arrowFlags).toHaveLength(4); // A-C, B-D, C-Dp, D-Dp
  });
});

describe('calculateCompleteness', () => {
  it('returns 15 for an empty cloud (injection weight is N/A)', () => {
    // No invalid assumptions → injection requirement is satisfied → 15% base
    expect(calculateCompleteness(makeCloud())).toBe(15);
  });

  it('returns 100 for a complete cloud', () => {
    expect(calculateCompleteness(makeCompleteCloud())).toBe(100);
  });

  it('returns a partial score for partially filled cloud', () => {
    const cloud = makeCloud({
      objective: 'A',
      requirementB: 'B',
      // 2/5 entities = 40% of 25 = 10
      // no conflict = 0 of 10
      // no assumptions = 0 of 25
      // no challenged = 0 of 25
      // no injections needed = 15
    });
    const score = calculateCompleteness(cloud);
    expect(score).toBe(25); // 10 + 0 + 0 + 0 + 15
  });

  it('accounts for injection notes in scoring', () => {
    const cloud = makeCompleteCloud();
    // Add an invalid assumption with an injection missing notes
    cloud.assumptions[0].valid = false;
    cloud.injections = [{
      id: 'inj-1',
      targetAssumptionId: cloud.assumptions[0].id,
      text: 'Fix it',
      feasibilityNotes: 'Can do',
      sufficiencyNotes: '', // missing
    }];

    const score = calculateCompleteness(cloud);
    // Injection has only 1 of 2 notes → 0% of injection weight (needs both)
    expect(score).toBe(85); // 25 + 10 + 25 + 25 + 0
  });
});
