import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ECCloud, ArrowId, ECAssumption, ECInjection } from '../types/ec.ts';

// --- Actions ---

export type EntityField =
  | 'objective'
  | 'requirementB'
  | 'requirementC'
  | 'prerequisiteD'
  | 'prerequisiteDPrime'
  | 'conflict';

export type CloudAction =
  | { type: 'CREATE_CLOUD'; payload: { title: string } }
  | { type: 'UPDATE_ENTITY'; payload: { field: EntityField; value: string } }
  | { type: 'ADD_ASSUMPTION'; payload: { arrowId: ArrowId; text: string } }
  | { type: 'UPDATE_ASSUMPTION'; payload: { id: string; updates: Partial<Pick<ECAssumption, 'text' | 'challenged' | 'valid' | 'challengeNotes'>> } }
  | { type: 'REMOVE_ASSUMPTION'; payload: { id: string } }
  | { type: 'ADD_INJECTION'; payload: { targetAssumptionId: string; text: string } }
  | { type: 'UPDATE_INJECTION'; payload: { id: string; updates: Partial<Pick<ECInjection, 'text' | 'feasibilityNotes' | 'sufficiencyNotes'>> } }
  | { type: 'REMOVE_INJECTION'; payload: { id: string } }
  | { type: 'SET_CLOUD'; payload: { cloud: ECCloud } };

// --- Reducer ---

export function cloudReducer(state: ECCloud | null, action: CloudAction): ECCloud | null {
  switch (action.type) {
    case 'CREATE_CLOUD': {
      const now = new Date().toISOString();
      return {
        schemaVersion: 1,
        id: uuidv4(),
        title: action.payload.title,
        createdAt: now,
        updatedAt: now,
        objective: '',
        requirementB: '',
        requirementC: '',
        prerequisiteD: '',
        prerequisiteDPrime: '',
        conflict: { description: '' },
        assumptions: [],
        injections: [],
      };
    }

    case 'SET_CLOUD':
      return action.payload.cloud;

    case 'UPDATE_ENTITY': {
      if (!state) return state;
      const { field, value } = action.payload;
      if (field === 'conflict') {
        return {
          ...state,
          conflict: { description: value },
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...state,
        [field]: value,
        updatedAt: new Date().toISOString(),
      };
    }

    case 'ADD_ASSUMPTION': {
      if (!state) return state;
      const newAssumption: ECAssumption = {
        id: uuidv4(),
        arrowId: action.payload.arrowId,
        text: action.payload.text,
        challenged: false,
        valid: null,
        challengeNotes: '',
      };
      return {
        ...state,
        assumptions: [...state.assumptions, newAssumption],
        updatedAt: new Date().toISOString(),
      };
    }

    case 'UPDATE_ASSUMPTION': {
      if (!state) return state;
      return {
        ...state,
        assumptions: state.assumptions.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'REMOVE_ASSUMPTION': {
      if (!state) return state;
      const removedId = action.payload.id;
      return {
        ...state,
        assumptions: state.assumptions.filter((a) => a.id !== removedId),
        injections: state.injections.filter((inj) => inj.targetAssumptionId !== removedId),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'ADD_INJECTION': {
      if (!state) return state;
      const newInjection: ECInjection = {
        id: uuidv4(),
        targetAssumptionId: action.payload.targetAssumptionId,
        text: action.payload.text,
        feasibilityNotes: '',
        sufficiencyNotes: '',
      };
      return {
        ...state,
        injections: [...state.injections, newInjection],
        updatedAt: new Date().toISOString(),
      };
    }

    case 'UPDATE_INJECTION': {
      if (!state) return state;
      return {
        ...state,
        injections: state.injections.map((inj) =>
          inj.id === action.payload.id ? { ...inj, ...action.payload.updates } : inj
        ),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'REMOVE_INJECTION': {
      if (!state) return state;
      return {
        ...state,
        injections: state.injections.filter((inj) => inj.id !== action.payload.id),
        updatedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

// --- Context ---

type CloudContextValue = {
  state: ECCloud | null;
  dispatch: React.Dispatch<CloudAction>;
};

const CloudContext = createContext<CloudContextValue | null>(null);

interface CloudProviderProps {
  children: ReactNode;
}

export function CloudProvider({ children }: CloudProviderProps) {
  const [state, dispatch] = useReducer(cloudReducer, null);

  return (
    <CloudContext.Provider value={{ state, dispatch }}>
      {children}
    </CloudContext.Provider>
  );
}

export function useCloudStore(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) {
    throw new Error('useCloudStore must be used within a CloudProvider');
  }
  return ctx;
}
