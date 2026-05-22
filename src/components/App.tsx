import { useState, useEffect, useCallback, useRef } from 'react';
import { CloudProvider, useCloudStore } from '../state/cloudStore.tsx';
import type { EntityField } from '../state/cloudStore.tsx';
import type { ArrowId, ECCloud } from '../types/ec.ts';
import { CloudDiagram } from './CloudDiagram.tsx';
import { EntityEditor } from './EntityEditor.tsx';
import { ArrowDetail } from './ArrowDetail.tsx';
import { FileControls } from './FileControls.tsx';
import { ReviewPanel } from './ReviewPanel.tsx';
import { calculateCompleteness } from '../utils/validation.ts';
import { saveToLocalStorage, loadFromLocalStorage, getLastSavedTimestamp, clearLocalStorage, debounce } from '../utils/persistence.ts';
import '../styles/app.css';

export type Selection =
  | { type: 'entity'; field: EntityField }
  | { type: 'arrow'; arrowId: ArrowId }
  | null;

const ENTITY_FIELDS: EntityField[] = [
  'objective', 'requirementB', 'requirementC', 'prerequisiteD', 'prerequisiteDPrime',
];

function getEntityValue(state: { objective: string; requirementB: string; requirementC: string; prerequisiteD: string; prerequisiteDPrime: string }, field: EntityField): string {
  if (field === 'conflict') return '';
  return state[field];
}

function CloudApp() {
  const { state, dispatch } = useCloudStore();
  const [selection, setSelection] = useState<Selection>(null);
  const [showReview, setShowReview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(getLastSavedTimestamp);

  // Debounced auto-save (2s delay)
  const debouncedSaveRef = useRef<[(...args: never[]) => void, () => void] | null>(null);
  if (!debouncedSaveRef.current) {
    debouncedSaveRef.current = debounce((cloud: ECCloud) => {
      saveToLocalStorage(cloud);
      setLastSaved(new Date().toISOString());
    }, 2000);
  }

  // Auto-save on state changes
  useEffect(() => {
    if (state) {
      const [save] = debouncedSaveRef.current!;
      (save as (cloud: ECCloud) => void)(state);
    }
    return () => {
      debouncedSaveRef.current?.[1]();
    };
  }, [state]);

  // Restore from localStorage on mount, or create empty cloud
  useEffect(() => {
    if (!state) {
      const saved = loadFromLocalStorage();
      if (saved) {
        dispatch({ type: 'SET_CLOUD', payload: { cloud: saved } });
      } else {
        dispatch({ type: 'CREATE_CLOUD', payload: { title: '' } });
      }
    }
  }, [state, dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (state) {
          saveToLocalStorage(state);
          setLastSaved(new Date().toISOString());
        }
      }
      if (e.key === 'Escape') {
        if (showReview) {
          setShowReview(false);
        } else if (selection) {
          setSelection(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, showReview, selection]);

  const handleSaveNow = useCallback(() => {
    if (state) {
      saveToLocalStorage(state);
      setLastSaved(new Date().toISOString());
    }
  }, [state]);

  const handleImport = useCallback((cloud: ECCloud) => {
    dispatch({ type: 'SET_CLOUD', payload: { cloud } });
    saveToLocalStorage(cloud);
    setLastSaved(new Date().toISOString());
  }, [dispatch]);

  const handleNew = useCallback(() => {
    clearLocalStorage();
    setLastSaved(null);
    dispatch({ type: 'CREATE_CLOUD', payload: { title: '' } });
  }, [dispatch]);

  if (!state) return null;

  const filledCount = ENTITY_FIELDS.filter((f) => getEntityValue(state, f)).length;

  const handleSave = (field: EntityField, value: string) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { field, value } });
  };

  const handleTitleChange = (title: string) => {
    dispatch({ type: 'SET_CLOUD', payload: { cloud: { ...state, title, updatedAt: new Date().toISOString() } } });
  };

  const handleSelectEntity = (field: EntityField) => {
    setSelection({ type: 'entity', field });
  };

  const handleSelectArrow = (arrowId: ArrowId) => {
    setSelection({ type: 'arrow', arrowId });
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <h1>Evaporating Cloud Builder</h1>
        <input
          type="text"
          className="cloud-title-input"
          value={state.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Name this conflict..."
        />
        <FileControls
          cloud={state}
          lastSaved={lastSaved}
          onImport={handleImport}
          onNew={handleNew}
          onSaveNow={handleSaveNow}
        />
        <button className="review-btn" onClick={() => setShowReview(true)}>
          Review
        </button>
        <span className="progress-indicator">
          {filledCount} of 5 entities defined
          {' \u00B7 '}
          {calculateCompleteness(state)}% coverage
        </span>
      </header>
      <div className="main-content">
        <main
          className="diagram-area"
          onClick={(e) => {
            // Click on diagram background deselects
            if (e.target === e.currentTarget) {
              setSelection(null);
            }
          }}
        >
          <CloudDiagram
            selection={selection}
            onSelectEntity={handleSelectEntity}
            onSelectArrow={handleSelectArrow}
          />
        </main>
        {selection?.type === 'entity' && (
          <aside className="editor-panel">
            <EntityEditor
              field={selection.field}
              cloud={state}
              onSave={handleSave}
              onClose={() => setSelection(null)}
            />
          </aside>
        )}
        {selection?.type === 'arrow' && (
          <aside className="editor-panel">
            <ArrowDetail
              arrowId={selection.arrowId}
              cloud={state}
              onClose={() => setSelection(null)}
            />
          </aside>
        )}
      </div>
      {showReview && (
        <ReviewPanel cloud={state} onClose={() => setShowReview(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <CloudProvider>
      <div className="app-shell">
        <CloudApp />
        <footer className="app-disclaimer">
          Personal educational project. Not affiliated with Gartner; views are my own.{' '}
          <a href="https://github.com/RogerKWilliams/ec-builder" target="_blank" rel="noopener noreferrer">
            Source on GitHub →
          </a>
        </footer>
      </div>
    </CloudProvider>
  );
}

export default App;
