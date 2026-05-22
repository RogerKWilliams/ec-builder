import { describe, it, expect } from 'vitest';
import { checkSchemaVersion, validateECCloud } from './persistence.ts';

function makeValidCloud(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    id: 'test-id',
    title: 'Test Cloud',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    objective: 'Objective A',
    requirementB: 'Requirement B',
    requirementC: 'Requirement C',
    prerequisiteD: 'Prerequisite D',
    prerequisiteDPrime: "Prerequisite D'",
    conflict: { description: 'They conflict' },
    assumptions: [
      { id: 'a1', arrowId: 'A-B', text: 'Assumption 1', challenged: false, valid: null, challengeNotes: '' },
    ],
    injections: [
      { id: 'i1', targetAssumptionId: 'a1', text: 'Injection 1', feasibilityNotes: '', sufficiencyNotes: '' },
    ],
    ...overrides,
  };
}

describe('validateECCloud', () => {
  it('accepts a valid cloud', () => {
    expect(validateECCloud(makeValidCloud())).toBe(true);
  });

  it('accepts a cloud with empty strings (no content required)', () => {
    expect(validateECCloud(makeValidCloud({
      objective: '',
      requirementB: '',
      requirementC: '',
      prerequisiteD: '',
      prerequisiteDPrime: '',
      conflict: { description: '' },
      assumptions: [],
      injections: [],
    }))).toBe(true);
  });

  it('rejects null input', () => {
    expect(validateECCloud(null)).toBe(false);
  });

  it('rejects string input', () => {
    expect(validateECCloud('not a cloud')).toBe(false);
  });

  it('rejects missing required fields', () => {
    const cloud = makeValidCloud();
    delete (cloud as Record<string, unknown>).objective;
    expect(validateECCloud(cloud)).toBe(false);
  });

  it('rejects missing conflict object', () => {
    expect(validateECCloud(makeValidCloud({ conflict: null }))).toBe(false);
  });

  it('rejects assumption with invalid arrowId', () => {
    expect(validateECCloud(makeValidCloud({
      assumptions: [{ id: 'a1', arrowId: 'INVALID', text: 'test', challenged: false, valid: null, challengeNotes: '' }],
    }))).toBe(false);
  });

  it('rejects assumption missing id', () => {
    expect(validateECCloud(makeValidCloud({
      assumptions: [{ arrowId: 'A-B', text: 'test' }],
    }))).toBe(false);
  });

  it('rejects injection missing targetAssumptionId', () => {
    expect(validateECCloud(makeValidCloud({
      injections: [{ id: 'i1', text: 'test' }],
    }))).toBe(false);
  });

  it('rejects non-array assumptions', () => {
    expect(validateECCloud(makeValidCloud({ assumptions: 'not array' }))).toBe(false);
  });

  it('accepts a cloud with no schemaVersion (back-compat for pre-versioning data)', () => {
    const cloud = makeValidCloud();
    delete (cloud as Record<string, unknown>).schemaVersion;
    expect(validateECCloud(cloud)).toBe(true);
  });

  it('rejects a cloud with a future schemaVersion', () => {
    expect(validateECCloud(makeValidCloud({ schemaVersion: 2 }))).toBe(false);
  });

  it('rejects a cloud with non-numeric schemaVersion', () => {
    expect(validateECCloud(makeValidCloud({ schemaVersion: '1' }))).toBe(false);
  });
});

describe('checkSchemaVersion', () => {
  it('accepts missing schemaVersion as v1 (back-compat)', () => {
    const result = checkSchemaVersion({ id: 'x' });
    expect(result.ok).toBe(true);
  });

  it('accepts schemaVersion: 1', () => {
    const result = checkSchemaVersion({ schemaVersion: 1 });
    expect(result.ok).toBe(true);
  });

  it('rejects schemaVersion: 2 with the descriptive error', () => {
    const result = checkSchemaVersion({ schemaVersion: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/newer version/i);
    }
  });

  it('rejects non-numeric schemaVersion', () => {
    const result = checkSchemaVersion({ schemaVersion: '1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/must be a number/i);
    }
  });
});
