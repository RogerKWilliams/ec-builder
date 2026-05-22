import { useRef } from 'react';
import type { ECCloud } from '../types/ec.ts';
import { exportCloudAsJson } from '../utils/exportJson.ts';
import { importCloudFromFile } from '../utils/importJson.ts';
import { downloadMarkdown } from '../utils/exportMarkdown.ts';

interface FileControlsProps {
  cloud: ECCloud;
  lastSaved: string | null;
  onImport: (cloud: ECCloud) => void;
  onNew: () => void;
  onSaveNow: () => void;
}

function hasContent(cloud: ECCloud): boolean {
  return !!(
    cloud.title ||
    cloud.objective ||
    cloud.requirementB ||
    cloud.requirementC ||
    cloud.prerequisiteD ||
    cloud.prerequisiteDPrime ||
    cloud.conflict.description ||
    cloud.assumptions.length > 0 ||
    cloud.injections.length > 0
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function FileControls({ cloud, lastSaved, onImport, onNew, onSaveNow }: FileControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    if (hasContent(cloud)) {
      if (!window.confirm('Start a new cloud? Current work will be cleared.')) return;
    }
    onNew();
  };

  const handleExportJson = () => {
    exportCloudAsJson(cloud);
  };

  const handleExportMd = () => {
    downloadMarkdown(cloud);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be loaded again
    e.target.value = '';

    if (hasContent(cloud)) {
      if (!window.confirm('Load a cloud from file? Current work will be replaced.')) return;
    }

    const result = await importCloudFromFile(file);
    if (result.ok) {
      onImport(result.cloud);
    } else {
      window.alert(result.error);
    }
  };

  return (
    <div className="file-controls">
      <button className="file-btn" onClick={handleNew} title="New cloud">New</button>
      <button className="file-btn" onClick={onSaveNow} title="Save now (Ctrl+S)">Save</button>
      <button className="file-btn" onClick={handleLoadClick} title="Load from JSON file">Load</button>
      <button className="file-btn" onClick={handleExportJson} title="Export as JSON">Export JSON</button>
      <button className="file-btn" onClick={handleExportMd} title="Export as Markdown">Export MD</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {lastSaved && (
        <span className="last-saved" title={lastSaved}>
          Saved {formatTimestamp(lastSaved)}
        </span>
      )}
    </div>
  );
}
