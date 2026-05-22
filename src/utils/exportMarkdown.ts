import type { ECCloud, ArrowId, ECAssumption, ECInjection } from '../types/ec.ts';

type ArrowMeta = {
  id: ArrowId;
  label: string;
  sentence: (cloud: ECCloud) => string;
};

const ARROW_ORDER: ArrowMeta[] = [
  {
    id: 'A-B',
    label: 'A \u2190 B',
    sentence: (c) => `In order to **${c.objective || '(A)'}**, we must **${c.requirementB || '(B)'}**`,
  },
  {
    id: 'B-D',
    label: 'B \u2190 D',
    sentence: (c) => `In order to **${c.requirementB || '(B)'}**, we must **${c.prerequisiteD || '(D)'}**`,
  },
  {
    id: 'A-C',
    label: 'A \u2190 C',
    sentence: (c) => `In order to **${c.objective || '(A)'}**, we must **${c.requirementC || '(C)'}**`,
  },
  {
    id: 'C-Dp',
    label: "C \u2190 D'",
    sentence: (c) => `In order to **${c.requirementC || '(C)'}**, we must **${c.prerequisiteDPrime || "(D')"}**`,
  },
  {
    id: 'D-Dp',
    label: "D \u2194 D'",
    sentence: (c) => `**${c.prerequisiteD || '(D)'}** and **${c.prerequisiteDPrime || "(D')"}** cannot coexist`,
  },
];

function assumptionStatus(a: ECAssumption): string {
  if (!a.challenged) return '*Unchallenged*';
  if (a.valid === true) return '**Valid**';
  if (a.valid === false) return '**Invalid**';
  return '*Unchallenged*';
}

/**
 * Exports an ECCloud as a human-readable Markdown string.
 */
export function exportCloudAsMarkdown(cloud: ECCloud): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${cloud.title || 'Evaporating Cloud'}`);
  lines.push('');

  // The Conflict
  lines.push('## The Conflict');
  lines.push('');
  lines.push(`**Objective (A):** ${cloud.objective || '...'}`);
  lines.push('');
  lines.push(`**Requirement B:** In order to ${cloud.objective || '(A)'}, we must ${cloud.requirementB || '(B)'}`);
  lines.push(`**Prerequisite D:** In order to ${cloud.requirementB || '(B)'}, we must ${cloud.prerequisiteD || '(D)'}`);
  lines.push('');
  lines.push(`**Requirement C:** In order to ${cloud.objective || '(A)'}, we must ${cloud.requirementC || '(C)'}`);
  lines.push(`**Prerequisite D':** In order to ${cloud.requirementC || '(C)'}, we must ${cloud.prerequisiteDPrime || "(D')"}`);
  lines.push('');
  lines.push(`**Conflict:** ${cloud.prerequisiteD || '(D)'} and ${cloud.prerequisiteDPrime || "(D')"} cannot coexist because: ${cloud.conflict.description || '...'}`);
  lines.push('');

  // Assumptions
  lines.push('## Assumptions');
  lines.push('');

  const assumptionsByArrow = new Map<ArrowId, ECAssumption[]>();
  for (const a of cloud.assumptions) {
    const list = assumptionsByArrow.get(a.arrowId) ?? [];
    list.push(a);
    assumptionsByArrow.set(a.arrowId, list);
  }

  const injectionsByAssumption = new Map<string, ECInjection[]>();
  for (const inj of cloud.injections) {
    const list = injectionsByAssumption.get(inj.targetAssumptionId) ?? [];
    list.push(inj);
    injectionsByAssumption.set(inj.targetAssumptionId, list);
  }

  for (const arrow of ARROW_ORDER) {
    const assumptions = assumptionsByArrow.get(arrow.id) ?? [];
    lines.push(`### ${arrow.label}: ${arrow.sentence(cloud)}`);
    lines.push('');
    if (assumptions.length === 0) {
      lines.push('*No assumptions surfaced yet.*');
    } else {
      for (let i = 0; i < assumptions.length; i++) {
        const a = assumptions[i];
        lines.push(`${i + 1}. ${a.text} \u2014 ${assumptionStatus(a)}`);
        if (a.challengeNotes) {
          lines.push(`   - Notes: ${a.challengeNotes}`);
        }
        const injections = injectionsByAssumption.get(a.id) ?? [];
        for (const inj of injections) {
          lines.push(`   - \uD83D\uDCA1 Injection: ${inj.text}`);
          if (inj.feasibilityNotes) {
            lines.push(`     - Feasibility: ${inj.feasibilityNotes}`);
          }
          if (inj.sufficiencyNotes) {
            lines.push(`     - Sufficiency: ${inj.sufficiencyNotes}`);
          }
        }
      }
    }
    lines.push('');
  }

  // Injections Summary
  lines.push('## Injections Summary');
  lines.push('');
  if (cloud.injections.length === 0) {
    lines.push('*No injections proposed yet.*');
  } else {
    for (const inj of cloud.injections) {
      const targetAssumption = cloud.assumptions.find((a) => a.id === inj.targetAssumptionId);
      const targetText = targetAssumption ? targetAssumption.text : '(unknown assumption)';
      lines.push(`- **${inj.text}** \u2014 targets: "${targetText}"`);
    }
  }
  lines.push('');

  // Analysis Status
  const entityFields = [cloud.objective, cloud.requirementB, cloud.requirementC, cloud.prerequisiteD, cloud.prerequisiteDPrime];
  const entitiesDefined = entityFields.filter((f) => f.length > 0).length;
  const totalAssumptions = cloud.assumptions.length;
  const challengedAssumptions = cloud.assumptions.filter((a) => a.challenged).length;
  const invalidAssumptions = cloud.assumptions.filter((a) => a.valid === false).length;
  const totalInjections = cloud.injections.length;

  lines.push('## Analysis Status');
  lines.push('');
  lines.push(`- Entities defined: ${entitiesDefined}/5`);
  lines.push(`- Assumptions surfaced: ${totalAssumptions}`);
  lines.push(`- Assumptions challenged: ${challengedAssumptions}/${totalAssumptions}`);
  lines.push(`- Invalid assumptions found: ${invalidAssumptions}`);
  lines.push(`- Injections proposed: ${totalInjections}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Triggers a Markdown file download.
 */
export function downloadMarkdown(cloud: ECCloud): void {
  const md = exportCloudAsMarkdown(cloud);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const safeName = cloud.title
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${safeName || 'ec-cloud'}-${timestamp}.md`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
