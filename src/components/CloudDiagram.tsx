import { useCloudStore } from '../state/cloudStore.tsx';
import type { EntityField } from '../state/cloudStore.tsx';
import type { ArrowId, ECAssumption } from '../types/ec.ts';
import type { Selection } from './App.tsx';

// --- Layout constants ---
const VB_W = 800;
const VB_H = 500;

// Entity box dimensions
const BOX_W = 180;
const BOX_H = 70;

// Entity positions (center of each box)
const positions = {
  A: { x: VB_W / 2, y: 60 },
  B: { x: 180, y: 220 },
  C: { x: VB_W - 180, y: 220 },
  D: { x: 180, y: 400 },
  Dp: { x: VB_W - 180, y: 400 },
} as const;

// Map diagram keys to EntityField
const FIELD_MAP: Record<string, EntityField> = {
  A: 'objective',
  B: 'requirementB',
  C: 'requirementC',
  D: 'prerequisiteD',
  Dp: 'prerequisiteDPrime',
};

// Arrow definitions: from → to (direction of necessity: "In order to [to], I must [from]")
// Visually drawn as: to ← from
const arrows: { from: keyof typeof positions; to: keyof typeof positions; arrowId: ArrowId }[] = [
  { from: 'B', to: 'A', arrowId: 'A-B' },
  { from: 'C', to: 'A', arrowId: 'A-C' },
  { from: 'D', to: 'B', arrowId: 'B-D' },
  { from: 'Dp', to: 'C', arrowId: 'C-Dp' },
];

function boxLeft(cx: number) { return cx - BOX_W / 2; }
function boxTop(cy: number) { return cy - BOX_H / 2; }

// Get the point on the edge of a box closest to a target point
function edgePoint(box: { x: number; y: number }, target: { x: number; y: number }): { x: number; y: number } {
  const dx = target.x - box.x;
  const dy = target.y - box.y;
  const halfW = BOX_W / 2;
  const halfH = BOX_H / 2;

  if (dx === 0 && dy === 0) return { x: box.x, y: box.y };

  // Scale to box edge
  const scaleX = halfW / Math.abs(dx || 1);
  const scaleY = halfH / Math.abs(dy || 1);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: box.x + dx * scale,
    y: box.y + dy * scale,
  };
}

// Arrowhead marker ID
const ARROW_MARKER = 'arrowhead';
const ARROW_SIZE = 8;

// Conflict zigzag between D and D'
function conflictPath(): string {
  const startX = positions.D.x + BOX_W / 2;
  const endX = positions.Dp.x - BOX_W / 2;
  const y = positions.D.y;
  const segments = 6;
  const segW = (endX - startX) / segments;
  const amp = 10;

  let d = `M ${startX} ${y}`;
  for (let i = 0; i < segments; i++) {
    const x1 = startX + segW * i + segW / 2;
    const y1 = y + (i % 2 === 0 ? -amp : amp);
    const x2 = startX + segW * (i + 1);
    const y2 = y;
    d += ` L ${x1} ${y1} L ${x2} ${y2}`;
  }
  return d;
}

// Arrow label position (midpoint of the arrow, offset to the side)
function arrowLabelPos(from: keyof typeof positions, to: keyof typeof positions) {
  const start = edgePoint(positions[from], positions[to]);
  const end = edgePoint(positions[to], positions[from]);
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  // Offset to avoid overlapping the line
  const dx = end.x - start.x;
  const isLeftSide = dx <= 0;
  return { x: mx + (isLeftSide ? -12 : 12), y: my };
}

// Badge position: near the midpoint of an arrow, offset perpendicular
function badgePos(from: keyof typeof positions, to: keyof typeof positions) {
  const start = edgePoint(positions[from], positions[to]);
  const end = edgePoint(positions[to], positions[from]);
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const isLeftSide = dx <= 0;
  return { x: mx + (isLeftSide ? 14 : -14), y: my - 14 };
}

// Word-wrap text into lines that fit within a character limit
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '\u2026' : word;
      if (lines.length >= maxLines) { current = ''; break; }
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length >= maxChars ? last.slice(0, maxChars - 1) + '\u2026' : last + '\u2026';
  }

  return lines;
}

interface EntityBoxProps {
  label: string;
  role: string;
  cx: number;
  cy: number;
  text: string;
  isEmpty: boolean;
  isSelected: boolean;
  prompt: string;
  onClick: () => void;
}

function EntityBox({ label, role, cx, cy, text, isEmpty, isSelected, prompt, onClick }: EntityBoxProps) {
  const x = boxLeft(cx);
  const y = boxTop(cy);
  const boxClass = `ec-entity-box${isEmpty ? ' ec-entity-empty' : ' ec-entity-filled'}${isSelected ? ' ec-entity-selected' : ''}`;

  const textLines = isEmpty
    ? wrapText(prompt, 26, 2)
    : wrapText(text, 26, 2);
  const textClass = isEmpty ? 'ec-entity-prompt' : 'ec-entity-text';

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Role label above box */}
      <text x={cx} y={y - 6} textAnchor="middle" className="ec-entity-role">
        {role}
      </text>
      <rect
        x={x}
        y={y}
        width={BOX_W}
        height={BOX_H}
        rx={6}
        ry={6}
        className={boxClass}
      />
      <text x={cx} y={y + 18} textAnchor="middle" className="ec-entity-label">
        {label}
      </text>
      {textLines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={y + 36 + i * 16}
          textAnchor="middle"
          className={textClass}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// Progress state for an arrow's assumptions
type ArrowProgress = 'empty' | 'unchallenged' | 'partial' | 'complete' | 'breakthrough';

function getArrowProgress(assumptions: ECAssumption[]): ArrowProgress {
  if (assumptions.length === 0) return 'empty';
  const allChallenged = assumptions.every((a) => a.challenged);
  const anyChallenged = assumptions.some((a) => a.challenged);
  const hasInvalid = assumptions.some((a) => a.challenged && !a.valid);

  if (hasInvalid && allChallenged) return 'breakthrough';
  if (hasInvalid) return 'breakthrough'; // at least one invalid = breakthrough indicator
  if (allChallenged) return 'complete';
  if (anyChallenged) return 'partial';
  return 'unchallenged';
}

interface AssumptionBadgeProps {
  x: number;
  y: number;
  count: number;
  progress: ArrowProgress;
  isSelected: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function AssumptionBadge({ x, y, count, progress, isSelected, onClick }: AssumptionBadgeProps) {
  const r = 10;
  const selectedClass = isSelected ? ' ec-badge-selected' : '';
  const style = onClick
    ? { cursor: 'pointer' as const }
    : { pointerEvents: 'none' as const };

  const content = (() => {
    if (progress === 'empty') {
      return (
        <>
          <circle cx={x} cy={y} r={r} className={`ec-badge ec-badge-attention${selectedClass}`} />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="ec-badge-text ec-badge-attention-text">!</text>
        </>
      );
    }
    if (progress === 'complete') {
      return (
        <>
          <circle cx={x} cy={y} r={r} className={`ec-badge ec-badge-complete${selectedClass}`} />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="ec-badge-text ec-badge-complete-text">{'\u2713'}</text>
        </>
      );
    }
    if (progress === 'breakthrough') {
      return (
        <>
          <circle cx={x} cy={y} r={r} className={`ec-badge ec-badge-breakthrough${selectedClass}`} />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="ec-badge-text ec-badge-breakthrough-text">{'\u2605'}</text>
        </>
      );
    }
    if (progress === 'partial') {
      return (
        <>
          <circle cx={x} cy={y} r={r} className={`ec-badge ec-badge-partial${selectedClass}`} />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="ec-badge-text ec-badge-partial-text">{count}</text>
        </>
      );
    }
    // unchallenged — default gray
    return (
      <>
        <circle cx={x} cy={y} r={r} className={`ec-badge${selectedClass}`} />
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className="ec-badge-text">{count}</text>
      </>
    );
  })();

  return (
    <g className="ec-badge-group" style={style} onClick={onClick}>
      {content}
    </g>
  );
}

interface CloudDiagramProps {
  selection: Selection;
  onSelectEntity: (field: EntityField) => void;
  onSelectArrow: (arrowId: ArrowId) => void;
}

export function CloudDiagram({ selection, onSelectEntity, onSelectArrow }: CloudDiagramProps) {
  const { state } = useCloudStore();

  const entityText = {
    A: state?.objective ?? '',
    B: state?.requirementB ?? '',
    C: state?.requirementC ?? '',
    D: state?.prerequisiteD ?? '',
    Dp: state?.prerequisiteDPrime ?? '',
  };

  // Short prompts for in-box display
  const boxPrompts: Record<string, string> = {
    A: 'Click to set objective...',
    B: 'Click to set requirement...',
    C: 'Click to set requirement...',
    D: 'Click to set prerequisite...',
    Dp: 'Click to set prerequisite...',
  };

  // Compute assumptions and progress per arrow
  const assumptionsByArrow: Record<ArrowId, ECAssumption[]> = {
    'A-B': [], 'A-C': [], 'B-D': [], 'C-Dp': [], 'D-Dp': [],
  };
  if (state) {
    for (const a of state.assumptions) {
      assumptionsByArrow[a.arrowId].push(a);
    }
  }

  const selectedEntity = selection?.type === 'entity' ? selection.field : null;
  const selectedArrow = selection?.type === 'arrow' ? selection.arrowId : null;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="ec-diagram"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id={ARROW_MARKER}
          viewBox={`0 0 ${ARROW_SIZE} ${ARROW_SIZE}`}
          refX={ARROW_SIZE}
          refY={ARROW_SIZE / 2}
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          orient="auto-start-reverse"
        >
          <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} Z`} className="ec-arrowhead" />
        </marker>
      </defs>

      {/* Arrows (necessity lines: from → to, drawn as to ← from) */}
      {arrows.map(({ from, to, arrowId }) => {
        const start = edgePoint(positions[from], positions[to]);
        const end = edgePoint(positions[to], positions[from]);
        const labelPos = arrowLabelPos(from, to);
        const bPos = badgePos(from, to);
        const isSelected = selectedArrow === arrowId;
        const arrowAssumptions = assumptionsByArrow[arrowId];
        const count = arrowAssumptions.length;
        const progress = getArrowProgress(arrowAssumptions);
        const needsAttention = count === 0;
        return (
          <g key={`${from}-${to}`}>
            {/* Invisible wider hit area for clicking */}
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="transparent"
              strokeWidth="20"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectArrow(arrowId); }}
            />
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className={`ec-arrow${isSelected ? ' ec-arrow-selected' : ''}${needsAttention ? ' ec-arrow-needs-attention' : ''}`}
              markerEnd={`url(#${ARROW_MARKER})`}
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              className="ec-arrow-label"
            >
              In order to... we must...
            </text>
            <AssumptionBadge
              x={bPos.x}
              y={bPos.y}
              count={count}
              progress={progress}
              isSelected={isSelected}
              onClick={(e) => { e.stopPropagation(); onSelectArrow(arrowId); }}
            />
          </g>
        );
      })}

      {/* Conflict zigzag (D ↔ D') — split into two click zones */}
      {(() => {
        const isArrowSelected = selectedArrow === 'D-Dp';
        const isConflictEntitySelected = selectedEntity === 'conflict';
        const conflictAssumptions = assumptionsByArrow['D-Dp'];
        const count = conflictAssumptions.length;
        const progress = getArrowProgress(conflictAssumptions);
        const needsAttention = count === 0;
        const conflictMidX = (positions.D.x + positions.Dp.x) / 2;
        const zigzagY = positions.D.y; // 400
        const conflictDesc = state?.conflict.description ?? '';
        const conflictLines = conflictDesc
          ? wrapText(conflictDesc, 34, 2)
          : [];
        return (
          <g>
            {/* The zigzag line itself (visual only, no pointer events) */}
            <path d={conflictPath()} className={`ec-conflict-line${isArrowSelected ? ' ec-conflict-selected' : ''}${needsAttention ? ' ec-conflict-needs-attention' : ''}`} style={{ pointerEvents: 'none' }} />

            {/* ABOVE the zigzag: click to define/edit the conflict statement */}
            <rect
              x={positions.D.x + BOX_W / 2}
              y={zigzagY - 60}
              width={positions.Dp.x - BOX_W / 2 - (positions.D.x + BOX_W / 2)}
              height={60}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectEntity('conflict'); }}
            />
            {conflictDesc ? (
              <>
                <text
                  x={conflictMidX}
                  y={zigzagY - 46}
                  textAnchor="middle"
                  className={`ec-conflict-role-label${isConflictEntitySelected ? ' ec-conflict-selected' : ''}`}
                  style={{ pointerEvents: 'none' }}
                >
                  CONFLICT
                </text>
                {conflictLines.map((line, i) => (
                  <text
                    key={i}
                    x={conflictMidX}
                    y={zigzagY - 28 + i * 14}
                    textAnchor="middle"
                    className="ec-conflict-text"
                    style={{ pointerEvents: 'none' }}
                  >
                    {line}
                  </text>
                ))}
              </>
            ) : (
              <text
                x={conflictMidX}
                y={zigzagY - 20}
                textAnchor="middle"
                className={`ec-conflict-label${isConflictEntitySelected ? ' ec-conflict-selected' : ''}`}
                style={{ pointerEvents: 'none' }}
              >
                Click to define conflict...
              </text>
            )}

            {/* BELOW the zigzag: click to view/edit assumptions */}
            <rect
              x={positions.D.x + BOX_W / 2}
              y={zigzagY}
              width={positions.Dp.x - BOX_W / 2 - (positions.D.x + BOX_W / 2)}
              height={48}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectArrow('D-Dp'); }}
            />
            <text
              x={conflictMidX}
              y={zigzagY + 28}
              textAnchor="middle"
              className={`ec-conflict-assumptions-label${isArrowSelected ? ' ec-conflict-selected' : ''}`}
              style={{ pointerEvents: 'none' }}
            >
              {needsAttention ? 'Click to add assumptions...' : `${count} assumption${count !== 1 ? 's' : ''}`}
            </text>
            <AssumptionBadge
              x={conflictMidX}
              y={zigzagY + 46}
              count={count}
              progress={progress}
              isSelected={isArrowSelected}
              onClick={(e) => { e.stopPropagation(); onSelectArrow('D-Dp'); }}
            />
          </g>
        );
      })()}

      {/* Entity boxes */}
      {(['A', 'B', 'C', 'D', 'Dp'] as const).map((key) => {
        const field = FIELD_MAP[key];
        const labels: Record<string, string> = { A: 'A', B: 'B', C: 'C', D: 'D', Dp: "D'" };
        const roles: Record<string, string> = { A: 'Objective', B: 'Requirement', C: 'Requirement', D: 'Prerequisite', Dp: 'Prerequisite' };
        return (
          <EntityBox
            key={key}
            label={labels[key]}
            role={roles[key]}
            cx={positions[key].x}
            cy={positions[key].y}
            text={entityText[key]}
            isEmpty={!entityText[key]}
            isSelected={selectedEntity === field}
            prompt={boxPrompts[key]}
            onClick={() => onSelectEntity(field)}
          />
        );
      })}
    </svg>
  );
}
