import type { ECCloud, ArrowId, ECAssumption, ECInjection } from '../types/ec.ts';
import { validateCloud, calculateCompleteness } from '../utils/validation.ts';
import type { ValidationFlag } from '../utils/validation.ts';

// Reuse ARROW_ORDER from exportMarkdown — duplicated here to avoid coupling
// the review panel to the export module's internal structure.
type ArrowMeta = {
  id: ArrowId;
  label: string;
  sentence: (cloud: ECCloud) => string;
};

const ARROW_ORDER: ArrowMeta[] = [
  {
    id: 'A-B',
    label: 'A \u2190 B',
    sentence: (c) => `In order to ${c.objective || '(A)'}, we must ${c.requirementB || '(B)'}`,
  },
  {
    id: 'B-D',
    label: 'B \u2190 D',
    sentence: (c) => `In order to ${c.requirementB || '(B)'}, we must ${c.prerequisiteD || '(D)'}`,
  },
  {
    id: 'A-C',
    label: 'A \u2190 C',
    sentence: (c) => `In order to ${c.objective || '(A)'}, we must ${c.requirementC || '(C)'}`,
  },
  {
    id: 'C-Dp',
    label: "C \u2190 D'",
    sentence: (c) => `In order to ${c.requirementC || '(C)'}, we must ${c.prerequisiteDPrime || "(D')"}`,
  },
  {
    id: 'D-Dp',
    label: "D \u2194 D'",
    sentence: (c) => `${c.prerequisiteD || '(D)'} and ${c.prerequisiteDPrime || "(D')"} cannot coexist`,
  },
];

function statusLabel(a: ECAssumption): string {
  if (!a.challenged) return 'Unchallenged';
  if (a.valid === true) return 'Valid';
  if (a.valid === false) return 'Invalid';
  return 'Unchallenged';
}

function statusClass(a: ECAssumption): string {
  if (!a.challenged) return 'unchallenged';
  if (a.valid === true) return 'valid';
  if (a.valid === false) return 'invalid';
  return 'unchallenged';
}

interface ReviewPanelProps {
  cloud: ECCloud;
  onClose: () => void;
}

export function ReviewPanel({ cloud, onClose }: ReviewPanelProps) {
  const flags = validateCloud(cloud);
  const completeness = calculateCompleteness(cloud);

  // Group assumptions and injections
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

  // Group flags by category
  const flagsByCategory = new Map<string, ValidationFlag[]>();
  for (const flag of flags) {
    const list = flagsByCategory.get(flag.category) ?? [];
    list.push(flag);
    flagsByCategory.set(flag.category, list);
  }

  const warningCount = flags.filter((f) => f.severity === 'warning').length;
  const infoCount = flags.filter((f) => f.severity === 'info').length;

  return (
    <div className="review-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="review-panel">
        <div className="review-header">
          <h2>Analysis Review</h2>
          <button className="review-close" onClick={onClose}>&times;</button>
        </div>

        {/* Completeness + flag summary */}
        <div className="review-summary">
          <div className="review-completeness">
            <span className="review-completeness-value">{completeness}%</span>
            <span className="review-completeness-label">analysis coverage</span>
          </div>
          {flags.length > 0 && (
            <div className="review-flag-counts">
              {warningCount > 0 && (
                <span className="review-flag-count review-flag-warning">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
              {infoCount > 0 && (
                <span className="review-flag-count review-flag-info">
                  {infoCount} suggestion{infoCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          {flags.length === 0 && (
            <span className="review-all-clear">All checks pass</span>
          )}
        </div>

        <div className="review-body">
          {/* Cloud title */}
          <h3 className="review-title">{cloud.title || 'Untitled Cloud'}</h3>

          {/* Conflict */}
          <section className="review-section">
            <h4>The Conflict</h4>
            {cloud.conflict.description ? (
              <p className="review-conflict">{cloud.conflict.description}</p>
            ) : (
              <p className="review-empty">No conflict statement yet.</p>
            )}
          </section>

          {/* Arrows + assumptions */}
          {ARROW_ORDER.map((arrow) => {
            const assumptions = assumptionsByArrow.get(arrow.id) ?? [];
            return (
              <section key={arrow.id} className="review-section" id={`review-arrow-${arrow.id}`}>
                <h4>
                  <span className="review-arrow-label">{arrow.label}</span>{' '}
                  {arrow.sentence(cloud)}
                </h4>
                {assumptions.length === 0 ? (
                  <p className="review-empty">No assumptions surfaced yet.</p>
                ) : (
                  <ol className="review-assumptions">
                    {assumptions.map((a) => (
                      <li key={a.id} className="review-assumption" id={`review-${a.id}`}>
                        <div className="review-assumption-row">
                          <span className="review-assumption-text">{a.text}</span>
                          <span className={`review-status review-status-${statusClass(a)}`}>
                            {statusLabel(a)}
                          </span>
                        </div>
                        {a.challengeNotes && (
                          <p className="review-notes">Notes: {a.challengeNotes}</p>
                        )}
                        {(injectionsByAssumption.get(a.id) ?? []).map((inj) => (
                          <div key={inj.id} className="review-injection" id={`review-${inj.id}`}>
                            <span className="review-injection-marker">Injection:</span>{' '}
                            {inj.text}
                            {inj.feasibilityNotes && (
                              <p className="review-notes">Feasibility: {inj.feasibilityNotes}</p>
                            )}
                            {inj.sufficiencyNotes && (
                              <p className="review-notes">Sufficiency: {inj.sufficiencyNotes}</p>
                            )}
                          </div>
                        ))}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}

          {/* Injections summary */}
          <section className="review-section">
            <h4>Injections Summary</h4>
            {cloud.injections.length === 0 ? (
              <p className="review-empty">No injections proposed yet.</p>
            ) : (
              <ul className="review-injections-summary">
                {cloud.injections.map((inj) => {
                  const target = cloud.assumptions.find((a) => a.id === inj.targetAssumptionId);
                  return (
                    <li key={inj.id}>
                      <strong>{inj.text}</strong>
                      {' \u2014 targets: "'}
                      {target ? target.text : '(unknown assumption)'}
                      {'"'}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Validation flags */}
          {flags.length > 0 && (
            <section className="review-section review-flags-section">
              <h4>Validation Flags</h4>
              {[...flagsByCategory.entries()].map(([category, categoryFlags]) => (
                <div key={category} className="review-flag-group">
                  <h5 className="review-flag-category">{category}</h5>
                  <ul className="review-flag-list">
                    {categoryFlags.map((flag, i) => (
                      <li
                        key={i}
                        className={`review-flag review-flag-${flag.severity}`}
                        onClick={() => {
                          // Scroll to the relevant section if an arrowId or elementId is present
                          const targetId = flag.elementId
                            ? `review-${flag.elementId}`
                            : flag.arrowId
                              ? `review-arrow-${flag.arrowId}`
                              : null;
                          if (targetId) {
                            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        style={{ cursor: flag.arrowId || flag.elementId ? 'pointer' : 'default' }}
                      >
                        <span className={`review-flag-icon review-flag-icon-${flag.severity}`}>
                          {flag.severity === 'warning' ? '\u26A0' : '\u2139'}
                        </span>
                        {flag.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
