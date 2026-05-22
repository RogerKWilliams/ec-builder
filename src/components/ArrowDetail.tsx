import { useState, useRef, useEffect } from 'react';
import { useCloudStore } from '../state/cloudStore.tsx';
import { InjectionCard } from './InjectionCard.tsx';
import type { ArrowId, ECCloud, ECAssumption, ECInjection } from '../types/ec.ts';

interface ArrowDetailProps {
  arrowId: ArrowId;
  cloud: ECCloud;
  onClose: () => void;
}

const ARROW_CONFIG: Record<ArrowId, { fromKey: string; toKey: string; label: string }> = {
  'A-B': { fromKey: 'B', toKey: 'A', label: 'A \u2190 B' },
  'A-C': { fromKey: 'C', toKey: 'A', label: 'A \u2190 C' },
  'B-D': { fromKey: 'D', toKey: 'B', label: 'B \u2190 D' },
  'C-Dp': { fromKey: 'Dp', toKey: 'C', label: 'C \u2190 D\u2019' },
  'D-Dp': { fromKey: 'D', toKey: 'Dp', label: 'D \u2194 D\u2019' },
};

function getEntityText(cloud: ECCloud, key: string): string {
  switch (key) {
    case 'A': return cloud.objective || '[A]';
    case 'B': return cloud.requirementB || '[B]';
    case 'C': return cloud.requirementC || '[C]';
    case 'D': return cloud.prerequisiteD || '[D]';
    case 'Dp': return cloud.prerequisiteDPrime || "[D']";
    default: return '';
  }
}

function getPrompt(cloud: ECCloud, arrowId: ArrowId): string {
  const config = ARROW_CONFIG[arrowId];
  const from = getEntityText(cloud, config.fromKey);
  const to = getEntityText(cloud, config.toKey);

  if (arrowId === 'D-Dp') {
    return `Why do we believe "${from}" and "${to}" cannot coexist?`;
  }
  if (arrowId === 'A-B' || arrowId === 'A-C') {
    return `Why do we believe "${from}" is necessary for "${to}"?`;
  }
  // B-D, C-Dp
  return `Why do we believe "${from}" is the way to achieve "${to}"?`;
}

// Challenge status: derives a label from the data model fields
type ChallengeStatus = 'unchallenged' | 'valid' | 'invalid';

function getChallengeStatus(a: ECAssumption): ChallengeStatus {
  if (!a.challenged) return 'unchallenged';
  return a.valid ? 'valid' : 'invalid';
}

interface AssumptionItemProps {
  assumption: ECAssumption;
  injections: ECInjection[];
  onUpdate: (id: string, updates: Partial<Pick<ECAssumption, 'text' | 'challenged' | 'valid' | 'challengeNotes'>>) => void;
  onRemove: (id: string) => void;
  onAddInjection: (assumptionId: string, text: string) => void;
  onUpdateInjection: (id: string, updates: Partial<Pick<ECInjection, 'text' | 'feasibilityNotes' | 'sufficiencyNotes'>>) => void;
  onRemoveInjection: (id: string) => void;
}

function AssumptionItem({ assumption, injections, onUpdate, onRemove, onAddInjection, onUpdateInjection, onRemoveInjection }: AssumptionItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(assumption.text);
  const [newInjText, setNewInjText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== assumption.text) {
      onUpdate(assumption.id, { text: trimmed });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(assumption.text);
    setEditing(false);
  };

  const status = getChallengeStatus(assumption);

  const cycleStatus = () => {
    switch (status) {
      case 'unchallenged':
        onUpdate(assumption.id, { challenged: true, valid: true });
        break;
      case 'valid':
        onUpdate(assumption.id, { challenged: true, valid: false });
        break;
      case 'invalid':
        onUpdate(assumption.id, { challenged: false, valid: null, challengeNotes: '' });
        break;
    }
  };

  const statusLabel: Record<ChallengeStatus, string> = {
    unchallenged: 'Unchallenged',
    valid: 'Valid',
    invalid: 'Invalid',
  };

  const handleAddInjection = () => {
    const trimmed = newInjText.trim();
    if (!trimmed) return;
    onAddInjection(assumption.id, trimmed);
    setNewInjText('');
  };

  const itemClass = `assumption-item assumption-status-${status}`;

  if (editing) {
    return (
      <li className={`${itemClass} assumption-item-editing`}>
        <textarea
          ref={inputRef}
          className="assumption-edit-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
          }}
          rows={2}
        />
      </li>
    );
  }

  return (
    <li className={itemClass}>
      <div className="assumption-header">
        <span className="assumption-text">{assumption.text}</span>
        <div className="assumption-actions">
          <button
            className={`assumption-btn assumption-status-btn assumption-status-btn-${status}`}
            onClick={cycleStatus}
            aria-label={`Challenge status: ${statusLabel[status]}`}
            title={`Click to cycle: ${statusLabel[status]}`}
          >
            {status === 'valid' ? '\u2713' : status === 'invalid' ? '\u2717' : '\u2014'}
            {' '}{statusLabel[status]}
          </button>
          <button
            className="assumption-btn assumption-edit-btn"
            onClick={() => { setDraft(assumption.text); setEditing(true); }}
            aria-label="Edit assumption"
          >
            Edit
          </button>
          <button
            className="assumption-btn assumption-delete-btn"
            onClick={() => onRemove(assumption.id)}
            aria-label="Delete assumption"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Challenge notes — visible when challenged */}
      {assumption.challenged && (
        <textarea
          className="challenge-notes-textarea"
          value={assumption.challengeNotes}
          onChange={(e) => onUpdate(assumption.id, { challengeNotes: e.target.value })}
          placeholder={status === 'valid' ? 'Why is this assumption valid?' : 'Why is this assumption invalid?'}
          rows={2}
        />
      )}

      {/* Injections — only for invalid assumptions */}
      {status === 'invalid' && (
        <div className="injection-section">
          {injections.map((inj) => (
            <InjectionCard
              key={inj.id}
              injection={inj}
              onUpdate={onUpdateInjection}
              onRemove={onRemoveInjection}
            />
          ))}
          <div className="injection-add">
            <input
              className="injection-add-input"
              value={newInjText}
              onChange={(e) => setNewInjText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddInjection(); }
              }}
              placeholder="What would break this assumption?"
            />
            <button
              className="injection-add-btn"
              onClick={handleAddInjection}
              disabled={!newInjText.trim()}
            >
              Add Injection
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function ArrowDetail({ arrowId, cloud, onClose }: ArrowDetailProps) {
  const { dispatch } = useCloudStore();
  const [newText, setNewText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = ARROW_CONFIG[arrowId];
  const prompt = getPrompt(cloud, arrowId);
  const assumptions = cloud.assumptions.filter((a) => a.arrowId === arrowId);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [arrowId]);

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_ASSUMPTION', payload: { arrowId, text: trimmed } });
    setNewText('');
    textareaRef.current?.focus();
  };

  const handleUpdate = (id: string, updates: Partial<Pick<ECAssumption, 'text' | 'challenged' | 'valid' | 'challengeNotes'>>) => {
    dispatch({ type: 'UPDATE_ASSUMPTION', payload: { id, updates } });
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_ASSUMPTION', payload: { id } });
  };

  const handleAddInjection = (assumptionId: string, text: string) => {
    dispatch({ type: 'ADD_INJECTION', payload: { targetAssumptionId: assumptionId, text } });
  };

  const handleUpdateInjection = (id: string, updates: Partial<Pick<ECInjection, 'text' | 'feasibilityNotes' | 'sufficiencyNotes'>>) => {
    dispatch({ type: 'UPDATE_INJECTION', payload: { id, updates } });
  };

  const handleRemoveInjection = (id: string) => {
    dispatch({ type: 'REMOVE_INJECTION', payload: { id } });
  };

  // Summary stats for this arrow
  const total = assumptions.length;
  const challenged = assumptions.filter((a) => a.challenged).length;
  const valid = assumptions.filter((a) => a.challenged && a.valid).length;
  const invalid = assumptions.filter((a) => a.challenged && !a.valid).length;
  const injectionCount = cloud.injections.filter((inj) =>
    assumptions.some((a) => a.id === inj.targetAssumptionId)
  ).length;

  return (
    <div className="arrow-detail">
      <div className="arrow-detail-header">
        <span className="arrow-detail-label">{config.label}</span>
        <span className="arrow-detail-role">
          {arrowId === 'D-Dp' ? 'Conflict' : 'Connection'}
        </span>
        <button className="entity-editor-close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <p className="arrow-detail-prompt">{prompt}</p>

      <div className="arrow-detail-add">
        <textarea
          ref={textareaRef}
          className="arrow-detail-textarea"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Add an assumption..."
          rows={2}
        />
        <button
          className="arrow-detail-add-btn"
          onClick={handleAdd}
          disabled={!newText.trim()}
        >
          Add
        </button>
      </div>

      {assumptions.length > 0 ? (
        <ul className="assumption-list">
          {assumptions.map((a) => (
            <AssumptionItem
              key={a.id}
              assumption={a}
              injections={cloud.injections.filter((inj) => inj.targetAssumptionId === a.id)}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onAddInjection={handleAddInjection}
              onUpdateInjection={handleUpdateInjection}
              onRemoveInjection={handleRemoveInjection}
            />
          ))}
        </ul>
      ) : (
        <p className="arrow-detail-empty">
          No assumptions yet. What must be true for this connection to hold?
        </p>
      )}

      {/* Summary statistics */}
      {total > 0 && (
        <div className="arrow-detail-summary">
          <span>{total} assumption{total !== 1 ? 's' : ''}</span>
          <span className="summary-sep">&middot;</span>
          <span>{challenged} challenged</span>
          {challenged > 0 && (
            <>
              <span className="summary-sep">&middot;</span>
              <span className="summary-valid">{valid} valid</span>
              <span className="summary-sep">&middot;</span>
              <span className="summary-invalid">{invalid} invalid</span>
            </>
          )}
          {injectionCount > 0 && (
            <>
              <span className="summary-sep">&middot;</span>
              <span className="summary-injections">{injectionCount} injection{injectionCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
