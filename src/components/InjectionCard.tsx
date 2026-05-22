import { useState } from 'react';
import type { ECInjection } from '../types/ec.ts';

interface InjectionCardProps {
  injection: ECInjection;
  onUpdate: (id: string, updates: Partial<Pick<ECInjection, 'text' | 'feasibilityNotes' | 'sufficiencyNotes'>>) => void;
  onRemove: (id: string) => void;
}

export function InjectionCard({ injection, onUpdate, onRemove }: InjectionCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(injection.text);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== injection.text) {
      onUpdate(injection.id, { text: trimmed });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(injection.text);
    setEditing(false);
  };

  return (
    <div className="injection-card">
      <div className="injection-card-header">
        <span className="injection-card-label">Injection</span>
        <div className="injection-card-actions">
          <button
            className="assumption-btn assumption-edit-btn"
            onClick={() => { setDraft(injection.text); setEditing(true); }}
            aria-label="Edit injection"
          >
            Edit
          </button>
          <button
            className="assumption-btn assumption-delete-btn"
            onClick={() => onRemove(injection.id)}
            aria-label="Delete injection"
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          className="assumption-edit-textarea"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
          }}
          rows={2}
        />
      ) : (
        <p className="injection-card-text">{injection.text}</p>
      )}

      <textarea
        className="injection-notes-textarea"
        value={injection.feasibilityNotes}
        onChange={(e) => onUpdate(injection.id, { feasibilityNotes: e.target.value })}
        placeholder="Feasibility: Can we actually do this?"
        rows={1}
      />
      <textarea
        className="injection-notes-textarea"
        value={injection.sufficiencyNotes}
        onChange={(e) => onUpdate(injection.id, { sufficiencyNotes: e.target.value })}
        placeholder="Sufficiency: Does this fully resolve the conflict?"
        rows={1}
      />
    </div>
  );
}
