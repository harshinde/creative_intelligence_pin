import type { MoodProfile, SubjectProfile } from '@shared/types';
import { colors, fonts } from '../tokens';
import { SpectrumBar } from '../components/SpectrumBar';
import { Tag } from '../components/Tag';
import { InfoTable, type InfoRow } from '../components/InfoTable';
import { SectionCopyButtons } from '../components/SectionCopyButtons';
import {
  energyToSpectrum,
  formalityToSpectrum,
  narrativeToSpectrum,
} from '../utils/mappings';
import {
  formatMoodAsBrief,
  formatMoodAsHtmlBrief,
  formatSubjectAsBrief,
  formatSubjectAsHtmlBrief,
} from '../utils/format';

export interface MoodTabProps {
  mood: MoodProfile | undefined;
  subject: SubjectProfile | undefined;
}

export function MoodTab({ mood, subject }: MoodTabProps) {
  if (!mood && !subject) {
    return <Pending label="mood & subject" />;
  }

  return (
    <div>
      {/* Headline + Mood copy buttons */}
      {mood && (
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                fontFamily: fonts.sans,
                color: colors.textPrimary,
                margin: '0 0 4px',
                textTransform: 'capitalize',
                letterSpacing: '-0.01em',
              }}
            >
              {mood.primary}
            </h2>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 9,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Primary mood
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <SectionCopyButtons
              brief={formatMoodAsBrief(mood)}
              html={formatMoodAsHtmlBrief(mood)}
              json={{ mood }}
              label="mood"
            />
          </div>
        </div>
      )}

      {/* Secondary mood tags */}
      {mood && mood.secondary.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {mood.secondary.map((s, i) => (
            <Tag key={i} accent={i === 0}>
              {s}
            </Tag>
          ))}
        </div>
      )}

      {/* Spectrum bars */}
      {mood && (
        <>
          {(() => {
            const v = energyToSpectrum(mood.energyLevel);
            return (
              <SpectrumBar
                lo="Calm"
                hi="Kinetic"
                value={v.value}
                label="Energy"
                description={v.description}
              />
            );
          })()}

          {(() => {
            const v = formalityToSpectrum(mood.formality);
            return (
              <SpectrumBar
                lo="Casual"
                hi="Formal"
                value={v.value}
                label="Formality"
                description={v.description}
              />
            );
          })()}
        </>
      )}

      {subject && (() => {
        const v = narrativeToSpectrum(subject.narrativeQuality);
        return (
          <SpectrumBar
            lo="Abstract"
            hi="Narrative"
            value={v.value}
            label="Narrative quality"
            description={v.description}
          />
        );
      })()}

      {/* Subject details */}
      {subject && <SubjectTable subject={subject} />}

      {/* Sensory associations */}
      {mood && mood.sensoryAssociations.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <SectionLabel label="Sensory associations" />
          <div>
            {mood.sensoryAssociations.map((s, i) => (
              <Tag key={i}>{s}</Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectTable({ subject }: { subject: SubjectProfile }) {
  const rows: InfoRow[] = [];
  rows.push({ label: 'primary', value: subject.primarySubject });
  rows.push({ label: 'setting', value: subject.setting });
  if (subject.brandPresence) {
    rows.push({ label: 'brand', value: subject.brandName ?? 'Detected' });
  }
  if (subject.culturalSignals.length > 0) {
    rows.push({
      label: 'cultural',
      value: (
        <span>
          {subject.culturalSignals.map((c, i) => (
            <Tag key={i}>{c}</Tag>
          ))}
        </span>
      ),
    });
  }
  return (
    <InfoTable
      title="Subject"
      rows={rows}
      copy={{
        brief: formatSubjectAsBrief(subject),
        html: formatSubjectAsHtmlBrief(subject),
        json: { subject },
        label: 'subject',
      }}
    />
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        color: colors.textFaint,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 8,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: fonts.mono,
        fontSize: 11,
        color: colors.textMuted,
      }}
    >
      Waiting for {label} analysis…
    </div>
  );
}
