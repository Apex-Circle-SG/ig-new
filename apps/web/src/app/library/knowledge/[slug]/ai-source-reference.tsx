'use client';

import { useState } from 'react';
import groups from '../../../../lib/library/ai-source-notes.json';
import styles from '../../library.module.css';

type Entry = { id: string; text?: string; image?: string; caption?: string };
export function AiSourceReference() {
  const [query,setQuery]=useState('');
  const [section,setSection]=useState('');
  const [page,setPage]=useState(0);
  const selected=groups.find(group=>group.id===section);
  const search=query.trim().toLowerCase();
  const entries=(selected?.entries ?? []).filter((entry: Entry)=>!search || `${entry.id} ${entry.text ?? ''} ${entry.caption ?? ''} ${selected?.title ?? ''}`.toLowerCase().includes(search));
  const size=40, total=Math.max(1,Math.ceil(entries.length/size)), current=Math.min(page,total-1);
  return <section aria-labelledby="source-reference"><h2 id="source-reference">Browse the source collection</h2>
    <p>Source text and pictures are preserved for reference. They contain unverified statements and may include outdated advice. Diagrams are supplied source material; attribution and rights have not been established. Text embedded in images may not be searchable, and extraction does not preserve all document formatting.</p>
    <label className={styles.search}><span>Choose a source section</span><select value={section} onChange={event=>{setSection(event.target.value);setPage(0);}}><option value="">Select a section</option>{groups.map(group=><option key={group.id} value={group.id}>{group.document} · {group.title}</option>)}</select></label>
    {selected && <><label className={styles.search}><span>Search within this section</span><input type="search" value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}} placeholder="Search source notes" /></label>
      <p aria-live="polite">{entries.length} matching source entries · page {current+1} of {total}</p>
      {entries.slice(current*size,(current+1)*size).map((entry: Entry)=><div key={entry.id} className={styles.sourceEntry}><small>{entry.id}</small>{entry.text && <p>{entry.text}</p>}{entry.image && <figure><a href={entry.image} target="_blank" rel="noopener noreferrer"><img src={entry.image} alt={`Source illustration for ${selected.title}; details are in the surrounding source notes.`} loading="lazy" /></a><figcaption>Supplied illustration · context: {entry.caption} · <a href={entry.image} target="_blank" rel="noopener noreferrer">Open full size</a></figcaption></figure>}</div>)}
      <div className={styles.sourcePaging}><button type="button" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><button type="button" disabled={current>=total-1} onClick={()=>setPage(current+1)}>Next</button></div>
      {!entries.length && <p>No entries match this search.</p>}
    </>}
  </section>;
}
