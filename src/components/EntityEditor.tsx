import { useState, useEffect, useRef } from 'react';
import type { EntityField } from '../state/cloudStore.tsx';
import type { ECCloud } from '../types/ec.ts';

interface EntityEditorProps {
  field: EntityField;
  cloud: ECCloud;
  onSave: (field: EntityField, value: string) => void;
  onClose: () => void;
}

const ENTITY_CONFIG: Record<EntityField, { label: string; role: string }> = {
  objective:          { label: 'A', role: 'Objective' },
  requirementB:       { label: 'B', role: 'Requirement' },
  requirementC:       { label: 'C', role: 'Requirement' },
  prerequisiteD:      { label: 'D', role: 'Prerequisite' },
  prerequisiteDPrime: { label: "D'", role: 'Prerequisite' },
  conflict:           { label: '⚡', role: 'Conflict' },
};

function getEntityValue(cloud: ECCloud, field: EntityField): string {
  if (field === 'conflict') return cloud.conflict.description;
  return cloud[field];
}

function getPrompt(cloud: ECCloud, field: EntityField): string {
  const a = cloud.objective || '[A]';
  const b = cloud.requirementB || '[B]';
  const c = cloud.requirementC || '[C]';
  const d = cloud.prerequisiteD || '[D]';
  const dp = cloud.prerequisiteDPrime || "[D']";

  switch (field) {
    case 'objective':
      return 'What is the common objective both sides share?';
    case 'requirementB':
      return `In order to achieve ${a}, we must...`;
    case 'requirementC':
      return `In order to achieve ${a}, we must...`;
    case 'prerequisiteD':
      return `In order to have ${b}, we must...`;
    case 'prerequisiteDPrime':
      return `In order to have ${c}, we must...`;
    case 'conflict':
      return `Why can't we have both ${d} and ${dp}?`;
  }
}

export function EntityEditor({ field, cloud, onSave, onClose }: EntityEditorProps) {
  const currentValue = getEntityValue(cloud, field);
  const [draft, setDraft] = useState(currentValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(getEntityValue(cloud, field));
  }, [field, cloud]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [field]);

  const save = () => {
    if (draft !== currentValue) {
      onSave(field, draft);
    }
  };

  const cancel = () => {
    setDraft(currentValue);
    onClose();
  };

  const config = ENTITY_CONFIG[field];
  const prompt = getPrompt(cloud, field);

  return (
    <div className="entity-editor">
      <div className="entity-editor-header">
        <span className="entity-editor-label">{config.label}</span>
        <span className="entity-editor-role">{config.role}</span>
        <button className="entity-editor-close" onClick={cancel} aria-label="Close editor">
          ✕
        </button>
      </div>
      <p className="entity-editor-prompt">{prompt}</p>
      <textarea
        ref={textareaRef}
        className="entity-editor-textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
        placeholder={prompt}
        rows={4}
      />
    </div>
  );
}
