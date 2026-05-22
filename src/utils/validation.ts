import type { ECCloud, ArrowId } from '../types/ec.ts';

export type FlagSeverity = 'warning' | 'info';

export type ValidationFlag = {
  severity: FlagSeverity;
  category: string;
  message: string;
  arrowId?: ArrowId;
  elementId?: string;
};

const ARROW_IDS: ArrowId[] = ['A-B', 'A-C', 'B-D', 'C-Dp', 'D-Dp'];

const ARROW_LABELS: Record<ArrowId, string> = {
  'A-B': 'A \u2190 B',
  'A-C': 'A \u2190 C',
  'B-D': 'B \u2190 D',
  'C-Dp': "C \u2190 D'",
  'D-Dp': "D \u2194 D'",
};

const ENTITY_NAMES: { field: keyof ECCloud; label: string }[] = [
  { field: 'objective', label: 'Objective (A)' },
  { field: 'requirementB', label: 'Requirement B' },
  { field: 'requirementC', label: 'Requirement C' },
  { field: 'prerequisiteD', label: 'Prerequisite D' },
  { field: 'prerequisiteDPrime', label: "Prerequisite D'" },
];

export function validateCloud(cloud: ECCloud): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // 1. Incomplete entities
  for (const { field, label } of ENTITY_NAMES) {
    if (!(cloud[field] as string)) {
      flags.push({
        severity: 'warning',
        category: 'Incomplete entities',
        message: `${label} is empty`,
      });
    }
  }

  // 2. Missing conflict statement
  if (!cloud.conflict.description) {
    flags.push({
      severity: 'warning',
      category: 'Missing conflict',
      message: 'Conflict statement is empty',
    });
  }

  // 3. Arrows with no assumptions
  for (const arrowId of ARROW_IDS) {
    const count = cloud.assumptions.filter((a) => a.arrowId === arrowId).length;
    if (count === 0) {
      flags.push({
        severity: 'warning',
        category: 'Arrows without assumptions',
        message: `${ARROW_LABELS[arrowId]} has no assumptions`,
        arrowId,
      });
    }
  }

  // 4. Unchallenged assumptions
  for (const a of cloud.assumptions) {
    if (!a.challenged) {
      flags.push({
        severity: 'info',
        category: 'Unchallenged assumptions',
        message: `"${a.text}" on ${ARROW_LABELS[a.arrowId]} is unchallenged`,
        arrowId: a.arrowId,
        elementId: a.id,
      });
    }
  }

  // 5. Injections without feasibility notes
  for (const inj of cloud.injections) {
    if (!inj.feasibilityNotes) {
      flags.push({
        severity: 'info',
        category: 'Injections missing notes',
        message: `Injection "${inj.text}" has no feasibility notes`,
        elementId: inj.id,
      });
    }
  }

  // 6. Injections without sufficiency notes
  for (const inj of cloud.injections) {
    if (!inj.sufficiencyNotes) {
      flags.push({
        severity: 'info',
        category: 'Injections missing notes',
        message: `Injection "${inj.text}" has no sufficiency notes`,
        elementId: inj.id,
      });
    }
  }

  return flags;
}

/**
 * Calculates analysis coverage as a percentage (0–100).
 *
 * Weights:
 * - Entities defined: 25% (5 fields)
 * - Conflict statement: 10%
 * - Arrows with assumptions: 25% (5 arrows)
 * - Assumptions challenged: 25% (proportion of all assumptions)
 * - Injections with notes: 15% (proportion with both feasibility + sufficiency)
 */
export function calculateCompleteness(cloud: ECCloud): number {
  // Entities: 25%
  const entityFields = [cloud.objective, cloud.requirementB, cloud.requirementC, cloud.prerequisiteD, cloud.prerequisiteDPrime];
  const entitiesScore = entityFields.filter((f) => f.length > 0).length / 5;

  // Conflict: 10%
  const conflictScore = cloud.conflict.description ? 1 : 0;

  // Arrows with assumptions: 25%
  const arrowsWithAssumptions = ARROW_IDS.filter(
    (id) => cloud.assumptions.some((a) => a.arrowId === id)
  ).length;
  const arrowsScore = arrowsWithAssumptions / 5;

  // Assumptions challenged: 25%
  const totalAssumptions = cloud.assumptions.length;
  const challengedScore = totalAssumptions > 0
    ? cloud.assumptions.filter((a) => a.challenged).length / totalAssumptions
    : 0;

  // Injections with notes: 15%
  const totalInjections = cloud.injections.length;
  const injectionsWithBothNotes = totalInjections > 0
    ? cloud.injections.filter((inj) => inj.feasibilityNotes && inj.sufficiencyNotes).length / totalInjections
    : 0;
  // If no injections exist, score depends on whether any invalid assumptions need them
  const hasInvalidAssumptions = cloud.assumptions.some((a) => a.valid === false);
  const injectionsScore = totalInjections > 0
    ? injectionsWithBothNotes
    : hasInvalidAssumptions ? 0 : 1;

  return Math.round(
    (entitiesScore * 25) +
    (conflictScore * 10) +
    (arrowsScore * 25) +
    (challengedScore * 25) +
    (injectionsScore * 15)
  );
}
