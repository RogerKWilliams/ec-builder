export type ArrowId = 'A-B' | 'A-C' | 'B-D' | 'C-Dp' | 'D-Dp';

export type ConflictStatement = {
  description: string;
};

export type ECAssumption = {
  id: string;
  arrowId: ArrowId;
  text: string;
  challenged: boolean;
  valid: boolean | null;
  challengeNotes: string;
};

export type ECInjection = {
  id: string;
  targetAssumptionId: string;
  text: string;
  feasibilityNotes: string;
  sufficiencyNotes: string;
};

export type ECCloud = {
  schemaVersion: 1;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  objective: string;
  requirementB: string;
  requirementC: string;
  prerequisiteD: string;
  prerequisiteDPrime: string;
  conflict: ConflictStatement;
  assumptions: ECAssumption[];
  injections: ECInjection[];
};
