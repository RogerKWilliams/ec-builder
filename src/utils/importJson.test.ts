import { describe, it, expect } from 'vitest';
import { importCloudFromFile } from './importJson.ts';

const baseCloud = {
  id: 'cloud-1',
  title: 'Test',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  objective: 'A',
  requirementB: 'B',
  requirementC: 'C',
  prerequisiteD: 'D',
  prerequisiteDPrime: "D'",
  conflict: { description: 'conflict' },
  assumptions: [],
  injections: [],
};

function jsonFile(payload: unknown): File {
  return new File([JSON.stringify(payload)], 'cloud.json', { type: 'application/json' });
}

describe('importCloudFromFile schemaVersion handling', () => {
  it('accepts a file with no schemaVersion (back-compat)', async () => {
    const result = await importCloudFromFile(jsonFile(baseCloud));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cloud.schemaVersion).toBe(1);
    }
  });

  it('accepts a file with schemaVersion: 1', async () => {
    const result = await importCloudFromFile(jsonFile({ ...baseCloud, schemaVersion: 1 }));
    expect(result.ok).toBe(true);
  });

  it('rejects a file with schemaVersion: 2 with the descriptive error', async () => {
    const result = await importCloudFromFile(jsonFile({ ...baseCloud, schemaVersion: 2 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/newer version/i);
    }
  });

  it('rejects a file with non-numeric schemaVersion', async () => {
    const result = await importCloudFromFile(jsonFile({ ...baseCloud, schemaVersion: '1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/must be a number/i);
    }
  });

  it('rejects invalid JSON', async () => {
    const file = new File(['not json'], 'cloud.json', { type: 'application/json' });
    const result = await importCloudFromFile(file);
    expect(result.ok).toBe(false);
  });
});
