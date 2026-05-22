import type { ECCloud } from '../types/ec.ts';

/**
 * Exports an ECCloud as a downloadable JSON file.
 */
export function exportCloudAsJson(cloud: ECCloud): void {
  const versioned: ECCloud = { ...cloud, schemaVersion: 1 };
  const json = JSON.stringify(versioned, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeName = cloud.title
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const filename = `${safeName || 'ec-cloud'}-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
