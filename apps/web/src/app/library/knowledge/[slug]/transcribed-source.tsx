import styles from './collection-guide.module.css';
export type Transcription = {
  context: { label: string; text: string }[];
  recordFields: string[];
  sections: { heading: string; paragraphs: string[] }[];
  next: string;
  credit: string;
};
export function TranscribedSource({ data }: { data: Transcription }) {
  return (
    <div className={styles.transcription}>
      <dl>
        {data.context.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.text}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.figureNote}>
        Record with your working notes: {data.recordFields.join(' · ')}.
      </p>
      {data.sections.map((section, i) => (
        <section key={i}>
          <h3>{section.heading}</h3>
          {section.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </section>
      ))}
      {data.next && (
        <p>
          <strong>Next step:</strong> {data.next}
        </p>
      )}
      <p className={styles.figureNote}>{data.credit}</p>
    </div>
  );
}
