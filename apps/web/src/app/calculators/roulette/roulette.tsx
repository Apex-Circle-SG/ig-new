'use client';

import { useState, type FormEvent } from 'react';
import styles from './roulette.module.css';

type Bet = 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3' | 'two-columns' | 'straight';
type Spin = { number: string; stake: number; net: number; balance: number };
type Run = { history: Spin[]; points: number[]; final: number; spins: number; turnover: number; peak: number; maxDrawdown: number; reason: string };
type Output = { first: Run; runs: number; profitRuns: number; mean: number; ruined: number; wheel: string; edge: number; winChance: number; totalStake: number };
const red = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const bets: { value: Bet; label: string }[] = [
  {value:'red',label:'Red'}, {value:'black',label:'Black'}, {value:'even',label:'Even'}, {value:'odd',label:'Odd'}, {value:'low',label:'1–18'}, {value:'high',label:'19–36'},
  {value:'dozen1',label:'First dozen'}, {value:'dozen2',label:'Second dozen'}, {value:'dozen3',label:'Third dozen'},
  {value:'column1',label:'First column'}, {value:'column2',label:'Second column'}, {value:'column3',label:'Third column'}, {value:'two-columns',label:'First and second columns'}, {value:'straight',label:'Single number'},
];
const money = (cents: number) => (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function hits(n: number, bet: Bet, number: number) {
  if (bet === 'straight') return n === number;
  if (n <= 0 || n > 36) return false;
  switch (bet) {
    case 'red': return red.has(n); case 'black': return !red.has(n); case 'even': return n % 2 === 0; case 'odd': return n % 2 === 1;
    case 'low': return n <= 18; case 'high': return n >= 19;
    case 'dozen1': return n <= 12; case 'dozen2': return n >= 13 && n <= 24; case 'dozen3': return n >= 25;
    case 'column1': return n % 3 === 1; case 'column2': return n % 3 === 2; case 'column3': return n % 3 === 0;
    case 'two-columns': return n % 3 !== 0;
  }
}
function play(wheel: number, bet: Bet, number: number, base: number, initial: number, limit: number, target: number, loss: number, spins: number, progression: boolean): Run {
  let balance = initial, stake = base, peak = initial, maxDrawdown = 0, turnover = 0, count = 0, reason = 'Spin limit reached';
  const history: Spin[] = [], points = [initial], units = bet === 'two-columns' ? 2 : 1;
  const payout = bet === 'straight' ? 35 : bet.startsWith('dozen') || bet.startsWith('column') ? 2 : 1;
  for (let i = 0; i < spins; i++) {
    if (stake > limit) { reason = 'Next stake exceeds the table limit'; break; }
    if (stake * units > balance) { reason = 'Balance cannot cover the next bet'; break; }
    const n = Math.floor(Math.random() * wheel), won = hits(n, bet, number), net = bet === 'two-columns' ? (won ? stake : -2 * stake) : (won ? stake * payout : -stake);
    balance += net; turnover += stake * units; count++; peak = Math.max(peak,balance); maxDrawdown = Math.max(maxDrawdown,peak-balance);
    history.push({ number:n === 37 ? '00' : String(n), stake:stake * units, net, balance });
    if (history.length > 30) history.shift();
    if (i % Math.max(1, Math.ceil(spins / 200)) === 0 || i === spins - 1) points.push(balance);
    if (target > 0 && balance - initial >= target) { reason = 'Profit target reached'; break; }
    if (loss > 0 && initial - balance >= loss) { reason = 'Loss limit reached'; break; }
    stake = progression && !won ? stake * 2 : base;
  }
  if (points[points.length - 1] !== balance) points.push(balance);
  return {history,points,final:balance,spins:count,turnover,peak,maxDrawdown,reason};
}
export default function Roulette() {
  const [wheel,setWheel]=useState(37), [bet,setBet]=useState<Bet>('red'), [number,setNumber]=useState(0), [base,setBase]=useState(10), [initial,setInitial]=useState(1000), [limit,setLimit]=useState(500), [spins,setSpins]=useState(100), [runs,setRuns]=useState(1), [target,setTarget]=useState(0), [loss,setLoss]=useState(0), [strategy,setStrategy]=useState('fixed'), [output,setOutput]=useState<Output|null>(null), [error,setError]=useState('');
  function run(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const toCents = (n: number) => Math.round(n * 100);
    if (![base,initial,limit,target,loss,spins,runs,number].every(Number.isFinite) || base < .01 || initial < .01 || limit < .01 || target < 0 || loss < 0 || [base,initial,limit,target,loss].some(n => n > 1000000) || !Number.isInteger(spins) || spins < 1 || spins > 10000 || !Number.isInteger(runs) || runs < 1 || runs > 100 || !Number.isInteger(number) || number < 0 || number > (wheel === 38 ? 37 : 36)) { setError('Enter valid amounts up to 1,000,000, 1–10,000 spins and 1–100 runs.'); return; }
    setError(''); const results: Run[] = [];
    for (let i=0; i<runs; i++) results.push(play(wheel,bet,number,toCents(base),toCents(initial),toCents(limit),toCents(target),toCents(loss),spins,strategy==='double'));
    const first=results[0], winning = bet==='straight' ? 1 : bet==='two-columns' ? 24 : bet.startsWith('dozen') || bet.startsWith('column') ? 12 : 18;
    setOutput({first,runs,profitRuns:results.filter(x=>x.final>toCents(initial)).length,mean:results.reduce((n,x)=>n+x.final,0)/runs,ruined:results.filter(x=>x.reason==='Balance cannot cover the next bet').length,wheel:wheel===37?'European':'American',edge:(wheel-36)/wheel*100,winChance:winning/wheel*100,totalStake:toCents(base)*(bet==='two-columns'?2:1)});
  }
  const points=output?.first.points ?? [], min=Math.min(...points), max=Math.max(...points), range=Math.max(1,max-min), polyline=points.map((value,i)=>`${points.length===1?0:i/(points.length-1)*600},${145-(value-min)/range*130}`).join(' ');
  return <div className={`shell ${styles.page}`}><header><p className={styles.eyebrow}>PROBABILITY LAB · VIRTUAL MONEY</p><h1>Roulette probability simulator</h1><p>Explore how chance, bet sizes and table limits affect a virtual balance. No real money or predictions.</p></header>
    <div className={styles.callout}><strong>Every spin is independent.</strong> A progression changes the size and timing of outcomes; it does not remove the house edge. Results are illustrative, not a way to predict a wheel.</div>
    <form onSubmit={run} className={styles.form}><h2>Set up a simulation</h2><div className={styles.grid}>
      <label>Wheel<select value={wheel} onChange={e=>{setWheel(Number(e.target.value));setNumber(0);}}><option value={37}>European · 0</option><option value={38}>American · 0 and 00</option></select></label>
      <label>Bet<select value={bet} onChange={e=>setBet(e.target.value as Bet)}>{bets.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
      {bet==='straight' && <label>Number<select value={number} onChange={e=>setNumber(Number(e.target.value))}>{Array.from({length:wheel},(_,i)=><option value={i} key={i}>{i===37?'00':i}</option>)}</select></label>}
      <label>Strategy<select value={strategy} onChange={e=>setStrategy(e.target.value)}><option value="fixed">Fixed stake</option><option value="double">Double stake after a loss</option></select></label>
      <label>Starting balance<input type="number" min="0.01" max="1000000" step="0.01" value={initial} onChange={e=>setInitial(Number(e.target.value))}/></label>
      <label>{bet==='two-columns'?'Stake per column':'Starting stake'}<input type="number" min="0.01" max="1000000" step="0.01" value={base} onChange={e=>setBase(Number(e.target.value))}/></label>
      <label>Table limit per bet<input type="number" min="0.01" max="1000000" step="0.01" value={limit} onChange={e=>setLimit(Number(e.target.value))}/></label>
      <label>Spins per run<input type="number" min="1" max="10000" step="1" value={spins} onChange={e=>setSpins(Number(e.target.value))}/></label>
      <label>Independent runs<input type="number" min="1" max="100" step="1" value={runs} onChange={e=>setRuns(Number(e.target.value))}/></label>
      <label>Stop at profit <small>0 disables</small><input type="number" min="0" max="1000000" step="0.01" value={target} onChange={e=>setTarget(Number(e.target.value))}/></label>
      <label>Stop at loss <small>0 disables</small><input type="number" min="0" max="1000000" step="0.01" value={loss} onChange={e=>setLoss(Number(e.target.value))}/></label>
    </div><p>All amounts are virtual units. Runs stop before placing a bet that exceeds the table limit or available balance. A stop threshold can be exceeded by the last spin.</p>{error && <p role="alert">{error}</p>}<button type="submit">Run simulation</button></form>
    {output && <section aria-live="polite" className={styles.results}><h2>Results</h2><p>{output.wheel} wheel · initial combined stake {money(output.totalStake)} · {output.runs} independent {output.runs===1?'run':'runs'}. Settings shown reflect the last run; rerun after changing them.</p>
      <div className={styles.metrics}><div><span>House edge per unit wagered</span><strong>{output.edge.toFixed(2)}%</strong></div><div><span>Chance of a winning spin</span><strong>{output.winChance.toFixed(2)}%</strong></div><div><span>Runs ending in profit</span><strong>{output.profitRuns} / {output.runs}</strong></div><div><span>Average final balance</span><strong>{money(output.mean)}</strong></div></div>
      <p>{output.ruined} {output.ruined===1?'run stopped':'runs stopped'} because the balance could not cover the next bet. A table-limit stop is counted separately.</p>
      <h3>First run</h3><p>{output.first.spins} spins · final balance {money(output.first.final)} · total wagered {money(output.first.turnover)} · maximum drawdown {money(output.first.maxDrawdown)} · {output.first.reason}.</p>
      <svg viewBox="0 0 600 160" role="img" aria-label={`First run balance, ranging from ${money(min)} to ${money(max)} virtual units`} className={styles.chart}><polyline fill="none" stroke="currentColor" strokeWidth="3" points={polyline}/></svg><p>Balance range on sampled chart: {money(min)}–{money(max)}. The chart samples long runs; the drawdown uses every spin.</p>
      <details><summary>Last {output.first.history.length} spins of first run</summary><div className={styles.table}><table><thead><tr><th>Number</th><th>Stake</th><th>Net</th><th>Balance</th></tr></thead><tbody>{output.first.history.map((x,i)=><tr key={i}><td>{x.number}</td><td>{money(x.stake)}</td><td>{money(x.net)}</td><td>{money(x.balance)}</td></tr>)}</tbody></table></div></details>
      <p>Standard payouts: even-money bets 1:1, dozens and columns 2:1, single numbers 35:1. The two-column option places equal separate bets on the first two columns. Zero and 00 lose outside bets; no special surrender or bonus rules. Each simulated outcome is sampled independently with JavaScript’s pseudo-random generator.</p>
    </section>}
    <p>Learn more about <a href="https://www.gamblingcommission.gov.uk/public-and-players/guide/return-to-player-how-much-gaming-machines-payout">house edge from the Gambling Commission</a>. Workbook-specific bonus games and unusual payouts are not modeled.</p>
  </div>;
}
