'use client';
import { useState } from 'react';
import groups from '../../../../lib/library/games-directory.json';
import styles from '../../library.module.css';

export function GamesDirectory() {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All categories');
  const q=search.trim().toLowerCase();
  const filtered=groups.filter(group=>category==='All categories'||group.category===category).map(group=>({...group,games:group.games.filter(name=>`${name} ${group.category}`.toLowerCase().includes(q))})).filter(group=>group.games.length);
  const count=filtered.reduce((sum,group)=>sum+group.games.length,0);
  return <section aria-labelledby="game-index"><h2 id="game-index">Explore the source list</h2><p>These are names and categories from the supplied notes, not verified active games. Titles may be misspelled, repeated, renamed, unavailable or unrelated to games. Check official sources before downloading, connecting a wallet or paying.</p>
    <label className={styles.search}><span>Search names</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search the list" /></label>
    <label className={styles.search}><span>Category from the notes</span><select value={category} onChange={e=>setCategory(e.target.value)}><option>All categories</option>{groups.map(group=><option key={group.category}>{group.category}</option>)}</select></label>
    <p aria-live="polite">{count} source entries</p>{filtered.map(group=><section key={group.category}><h3>{group.category}</h3><ul>{group.games.map((name,i)=><li key={`${name}-${i}`}>{name}</li>)}</ul></section>)}{!count && <p>No entries match your search.</p>}
  </section>;
}
