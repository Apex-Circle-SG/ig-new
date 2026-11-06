import {
  cell,
  choice,
  csv,
  integer,
  number,
  optional,
  result,
  type Inputs,
  type Value,
} from './common';
function date(text: string, end = false) {
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(text)
  )
    throw Error('Use ISO dates (YYYY-MM-DD), or timestamps with an explicit timezone.');
  const n = Date.parse(text);
  if (
    !Number.isFinite(n) ||
    new Date(Date.parse(text.slice(0, 10))).toISOString().slice(0, 10) !== text.slice(0, 10)
  )
    throw Error(`Invalid date: ${text}`);
  return n + (end && text.length === 10 ? 86_400_000 - 1 : 0);
}
export function vwap(v: Inputs) {
  const r = result(),
    basis = choice(v, 'priceBasis', ['trade', 'daily-close', 'typical']),
    unit = number(v, 'volumeMultiplier', 0.000001, 1e9),
    shares = optional(v, 'sharesOutstanding'),
    count = integer(v, 'buckets', 1, 50),
    reset = choice(v, 'reset', ['window', 'daily']),
    periodMode = choice(v, 'periodMode', ['rolling', 'calendar']);
  if (shares !== null && shares <= 0) throw Error('Shares outstanding must be positive or blank.');
  let raw = csv(v.observations ?? '');
  if (raw.length && /^date/i.test(raw[0][0])) raw = raw.slice(1);
  if (!raw.length || raw.length > 20000) throw Error('Enter 1–20,000 observations.');
  const data = raw
    .map((row, i) => {
      if (row.length !== (basis === 'typical' ? 5 : 3))
        throw Error(
          `Row ${i + 1}: use date, price, volume${basis === 'typical' ? ', high, low' : ''}.`,
        );
      const time = date(row[0]),
        close = cell(row[1], 'Price', 0),
        volume = cell(row[2], 'Volume', 0) * unit;
      let price = close;
      if (basis === 'typical') {
        const high = cell(row[3], 'High', close),
          low = cell(row[4], 'Low', 0, close);
        price = (high + low + close) / 3;
      }
      return { time, label: row[0], price, volume, sourceRow: i + 1 };
    })
    .sort((a, b) => a.time - b.time);
  const start = v.start?.trim() ? date(v.start.trim()) : data[0].time,
    end = v.end?.trim() ? date(v.end.trim(), true) : data.at(-1)!.time;
  if (end < start) throw Error('End date must not precede start date.');
  const selected = data.filter((a) => a.time >= start && a.time <= end),
    volume = selected.reduce((s, a) => s + a.volume, 0);
  if (!selected.length || volume <= 0)
    throw Error('The selected window needs observations and positive total volume.');
  const weighted = selected.reduce((s, a) => s + a.price * a.volume, 0) / volume,
    min = Math.min(...selected.map((a) => a.price)),
    max = Math.max(...selected.map((a) => a.price)),
    rangeStart = optional(v, 'rangeStart') ?? min,
    width =
      optional(v, 'bucketWidth') ??
      (max > min ? (max - min) / count : Math.max(0.01, Math.abs(min) * 0.01));
  if (width <= 0 || rangeStart < 0)
    throw Error('Bucket width must be positive and range start nonnegative.');
  const bins = Array.from({ length: count }, (_, i) => ({
    lo: rangeStart + i * width,
    hi: rangeStart + (i + 1) * width,
    volume: 0,
  }));
  let excluded = 0;
  function index(price: number) {
    const last = rangeStart + width * count,
      tolerance = Math.max(1, Math.abs(last)) * 1e-12;
    if (price < rangeStart || price > last + tolerance) return -1;
    return price >= last - tolerance ? count - 1 : Math.floor((price - rangeStart) / width);
  }
  for (const a of selected) {
    const i = index(a.price);
    if (i < 0 || i >= count) excluded += a.volume;
    else bins[i].volume += a.volume;
  }
  const cumulative: Value[][] = [];
  let pv = 0,
    vol = 0,
    day = '';
  for (const a of selected) {
    const currentDay = new Date(a.time).toISOString().slice(0, 10);
    if (reset === 'daily' && day !== currentDay) {
      pv = 0;
      vol = 0;
    }
    day = currentDay;
    pv += a.price * a.volume;
    vol += a.volume;
    cumulative.push([a.label, a.price, a.volume, vol > 0 ? pv / vol : null, a.sourceRow]);
  }
  const endDate = new Date(end),
    periods = [1, 2, 3].map((years) => {
      const y = endDate.getUTCFullYear();
      const from =
        periodMode === 'calendar'
          ? Date.UTC(y - years + 1, 0, 1)
          : (() => {
              const t = new Date(end),
                month = t.getUTCMonth();
              t.setUTCFullYear(y - years);
              if (t.getUTCMonth() !== month) t.setUTCDate(0);
              return t.getTime();
            })();
      const ds = selected.filter((a) =>
          periodMode === 'calendar' ? a.time >= from : a.time > from,
        ),
        sum = ds.reduce((s, a) => s + a.volume, 0),
        profile = bins.map(() => 0);
      for (const a of ds) {
        const i = index(a.price);
        if (i >= 0 && i < count) profile[i] += a.volume;
      }
      return {
        years,
        rows: ds.length,
        volume: sum,
        price: sum > 0 ? ds.reduce((s, a) => s + a.volume * a.price, 0) / sum : null,
        profile,
      };
    });
  r.metrics = [
    {
      label:
        basis === 'trade'
          ? 'Selected-window VWAP (eligible entered trades)'
          : 'Selected-window volume-weighted price proxy',
      value: weighted,
    },
    { label: 'Total raw shares / volume units', value: volume },
    {
      label: 'Share-capital turnover',
      value: shares === null ? null : (volume / shares) * 100,
      unit: '%; repeated turnover can exceed 100%',
    },
    { label: 'Selected observations', value: selected.length },
    { label: 'Zero-volume observations', value: selected.filter((a) => a.volume === 0).length },
    { label: 'Volume outside custom price range', value: excluded },
  ];
  r.tables = [
    {
      title: 'Normalized observations and running weighted price',
      columns: [
        'Date / timestamp',
        'Price basis',
        'Volume units',
        reset === 'daily' ? 'UTC-day running weighted price' : 'Window running weighted price',
        'Original row',
      ],
      rows: cumulative,
    },
    {
      title: 'Selected-window price-volume distribution',
      columns: [
        'Lower inclusive',
        'Upper exclusive (last inclusive)',
        'Volume',
        'Window volume %',
        'Share-capital turnover %',
      ],
      rows: bins.map((a) => [
        a.lo,
        a.hi,
        a.volume,
        (a.volume / volume) * 100,
        shares === null ? null : (a.volume / shares) * 100,
      ]),
    },
    {
      title: 'Period comparisons within the selected window',
      columns: [
        periodMode === 'calendar' ? 'Calendar years through end date' : 'Trailing years',
        'Observations',
        'Volume',
        'Weighted price',
        'Turnover %',
      ],
      rows: periods.map((p) => [
        p.years,
        p.rows,
        p.volume,
        p.price,
        shares === null ? null : (p.volume / shares) * 100,
      ]),
    },
  ];
  const labels = bins.map((a) => `${a.lo.toFixed(2)}–${a.hi.toFixed(2)}`);
  r.charts = [
    {
      title: 'Volume by price bucket and period',
      labels,
      series: periods.map((p) => ({ label: `${p.years} year(s)`, values: p.profile })),
    },
    {
      title: 'Window volume share by bucket — %',
      labels,
      series: [
        { label: '% of selected volume', values: bins.map((a) => (a.volume / volume) * 100) },
      ],
    },
    {
      title: 'Share-capital turnover by bucket — %',
      labels,
      series: [
        {
          label: '% of stated shares',
          values: bins.map((a) => (shares === null ? null : (a.volume / shares) * 100)),
        },
      ],
    },
  ];
  const stride = Math.max(1, Math.ceil(cumulative.length / 300)),
    points = cumulative.filter((_, i) => i % stride === 0 || i === cumulative.length - 1);
  r.charts.unshift({
    title: 'Observed price and running weighted price (chart sampled; table retains every row)',
    labels: points.map((a) => String(a[0])),
    series: [
      { label: 'Observed price basis', values: points.map((a) => Number(a[1])) },
      {
        label: 'Running weighted price',
        values: points.map((a) => (a[3] === null ? null : Number(a[3]))),
      },
    ],
  });
  r.notes = [
    'A single security, consistent currency, eligible observations and normalized units are assumed. Trade mode uses Σ(price × trade volume)/Σ(volume). Daily-close and typical-price modes are proxies; daily volume does not reveal every trade price.',
    'Source historical data is an undated-provenance Perpetual example covering 2003–2010, not live data or verified adjusted prices. Its original inconsistent cleaned-volume formulas are not reused; the same volume multiplier applies to every raw observation.',
    'Date-only inputs use UTC. Daily resets use UTC calendar days; choose/convert session timestamps appropriately before importing. Window summaries retain all selected rows, including zero-volume rows; duplicate timestamps are retained because multiple trades can share a timestamp.',
    'Buckets are lower-inclusive/upper-exclusive with the final upper bound included. Custom out-of-range volume is disclosed, not silently lost. Turnover can exceed 100% because shares trade repeatedly; it is not the fraction of distinct owners who sold.',
    'Period comparisons intersect the user-selected window. Trailing periods exclude the exact earlier anniversary (29 February clamps to 28 February in a non-leap year), while calendar periods begin on 1 January. The line chart is sampled for readability; calculation, tables and exports retain every selected row.',
  ];
  if (selected.some((a, i) => i > 0 && a.time === selected[i - 1].time))
    r.notes.unshift(
      'Duplicate timestamps are present. Confirm whether they are legitimate separate observations or duplicate records.',
    );
  return r;
}
