import type { ECCloud } from '../types/ec.ts';
import { checkSchemaVersion, validateECCloud } from './persistence.ts';

export type ImportResult =
  | { ok: true; cloud: ECCloud }
  | { ok: false; error: string };

/**
 * Reads a File object and parses/validates it as an ECCloud.
 */
export function importCloudFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const schema = checkSchemaVersion(parsed);
        if (!schema.ok) {
          resolve({ ok: false, error: schema.error });
          return;
        }
        if (!validateECCloud(parsed)) {
          resolve({
            ok: false,
            error: 'File does not contain a valid EC cloud. Expected fields: id, objective, requirementB, requirementC, prerequisiteD, prerequisiteDPrime, conflict, assumptions, injections.',
          });
          return;
        }
        resolve({ ok: true, cloud: { ...parsed, schemaVersion: 1 } as ECCloud });
      } catch {
        resolve({ ok: false, error: 'File is not valid JSON.' });
      }
    };
    reader.onerror = () => {
      resolve({ ok: false, error: 'Failed to read file.' });
    };
    reader.readAsText(file);
  });
}
