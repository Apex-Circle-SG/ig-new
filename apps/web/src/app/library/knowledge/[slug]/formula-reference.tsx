import type entries from '../../../../lib/library/business/accounting-formulas.json';
import styles from './collection-guide.module.css';

type Formula = Omit<(typeof entries)[number], 'slug' | 'guideTitle'>;

export function FormulaReference({ formula }: { formula: Formula }) {
  return <div className={styles.formula} id={formula.id}>
    <h3>{formula.name}</h3>
    <p className={styles.formulaState}>{formula.reviewState}{formula.status !== formula.reviewState && <> · {formula.status}</>}</p>
    {formula.expression ? <p className={styles.formulaExpression}>{formula.expression}</p> : <p><strong>The supplied expression needs the definitions below before use.</strong></p>}
    <p className={styles.formulaUnits}><strong>Result units:</strong> {formula.units}</p>
    <p><strong>Inputs and definitions</strong></p><ul>{formula.inputs.map((input) => <li key={input}>{input}</li>)}</ul>
    <p><strong>Scope and interpretation:</strong> {formula.scope}</p>
    <div className={styles.formulaOriginal} data-nosnippet><details><summary>Original supplied wording</summary>{formula.original.map((text, i) => <p key={i}>{text}</p>)}</details></div>
    {formula.references.map((reference) => <p className={styles.formulaUnits} key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>)}
  </div>;
}
