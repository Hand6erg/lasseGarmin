import { useRef, useState, type ReactNode } from 'react';

// Small dependency-free SVG charts. Specs: bars ≤24px with a 4px rounded top and
// square base, 2px surface gaps between stacked segments, 2px lines, ≥8px markers
// with a surface ring, hairline solid grid, one y-axis, text in text colours only.

const W = 340;
const H = 180;
const PAD = { top: 14, right: 10, bottom: 24, left: 34 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

export interface Series {
  key: string;
  label: string;
  color: string;
  values: (number | undefined)[];
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

function ticks(min: number, max: number, count = 4): number[] {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + i * step);
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));

/** Column path with a 4px rounded top and square bottom. */
function columnPath(x: number, y: number, w: number, h: number, round: boolean): string {
  if (h <= 0) return '';
  const r = round ? Math.min(4, w / 2, h) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

interface TipState {
  x: number;
  index: number;
}

function useTip() {
  const [tip, setTip] = useState<TipState | null>(null);
  return { tip, setTip };
}

function Tooltip({ tip, children }: { tip: TipState; children: ReactNode }) {
  const left = Math.min(Math.max((tip.x / W) * 100, 18), 82);
  return (
    <div className="chart-tip" role="status" style={{ left: `${left}%` }}>
      {children}
    </div>
  );
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="chart-legend">
      {series.map((s) => (
        <li key={s.key}>
          <span className="swatch" style={{ background: s.color }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function Axis({ yTicks, y, labels, x }: { yTicks: number[]; y: (v: number) => number; labels: string[]; x: (i: number) => number }) {
  const every = Math.ceil(labels.length / 7);
  return (
    <g className="axis">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
          <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end">
            {fmt(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % every === (labels.length - 1) % every ? (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle">
            {l}
          </text>
        ) : null,
      )}
    </g>
  );
}

interface ColumnProps {
  title: string;
  subtitle?: string;
  labels: string[];
  series: Series[];
  unit: string;
  tooltip: (index: number) => ReactNode;
}

/** Stacked (or single) column chart. */
export function ColumnChart({ title, subtitle, labels, series, unit, tooltip }: ColumnProps) {
  const { tip, setTip } = useTip();
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const band = PW / n;
  const bw = Math.min(24, band * 0.62);
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (v: number) => PAD.top + PH - (v / max) * PH;

  return (
    <figure className="chart card" aria-label={title}>
      <figcaption>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </figcaption>
      <Legend series={series} />
      <div className="chart-box">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} (${unit})`} onPointerLeave={() => setTip(null)}>
          <Axis yTicks={ticks(0, max)} y={y} labels={labels} x={x} />
          {labels.map((_, i) => {
            let acc = 0;
            const visible = series.filter((s) => (s.values[i] ?? 0) > 0);
            return (
              <g key={i} className={tip?.index === i ? 'col active' : 'col'}>
                {visible.map((s, j) => {
                  const v = s.values[i] ?? 0;
                  const top = y(acc + v);
                  const bottom = y(acc);
                  acc += v;
                  const gap = j > 0 ? 2 : 0; // surface gap between stacked segments
                  return (
                    <path
                      key={s.key}
                      d={columnPath(x(i) - bw / 2, top, bw, Math.max(0, bottom - top - gap), j === visible.length - 1)}
                      fill={s.color}
                    />
                  );
                })}
                <rect
                  x={x(i) - band / 2}
                  y={PAD.top}
                  width={band}
                  height={PH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={labels[i]}
                  onPointerEnter={() => setTip({ x: x(i), index: i })}
                  onPointerDown={() => setTip({ x: x(i), index: i })}
                  onFocus={() => setTip({ x: x(i), index: i })}
                  onBlur={() => setTip(null)}
                />
              </g>
            );
          })}
        </svg>
        {tip && <Tooltip tip={tip}>{tooltip(tip.index)}</Tooltip>}
      </div>
      <DataTable labels={labels} series={series} unit={unit} />
    </figure>
  );
}

interface LineProps {
  title: string;
  subtitle?: string;
  labels: string[];
  series: Series; // one series per chart – never two y-axes
  unit: string;
  tooltip: (index: number) => ReactNode;
  /** Pad the y-range instead of starting at 0 (for HR/HRV trends). */
  zoom?: boolean;
}

export function LineChart({ title, subtitle, labels, series, unit, tooltip, zoom }: LineProps) {
  const { tip, setTip } = useTip();
  const ref = useRef<SVGSVGElement>(null);
  const vals = series.values.filter((v): v is number => typeof v === 'number');
  const n = labels.length;
  let lo = 0;
  let hi = niceMax(Math.max(...vals, 0));
  if (zoom && vals.length) {
    const span = Math.max(4, Math.max(...vals) - Math.min(...vals));
    lo = Math.max(0, Math.floor((Math.min(...vals) - span * 0.25) / 2) * 2);
    hi = Math.ceil((Math.max(...vals) + span * 0.25) / 2) * 2;
  }
  const x = (i: number) => PAD.left + (n === 1 ? PW / 2 : (PW * i) / (n - 1));
  const y = (v: number) => PAD.top + PH - ((v - lo) / (hi - lo || 1)) * PH;

  // Build path segments, breaking at missing values
  const segments: string[] = [];
  let cur = '';
  series.values.forEach((v, i) => {
    if (typeof v !== 'number') {
      if (cur) segments.push(cur);
      cur = '';
    } else cur += `${cur ? 'L' : 'M'}${x(i)},${y(v)}`;
  });
  if (cur) segments.push(cur);
  const lastIndex = series.values.map((v, i) => (typeof v === 'number' ? i : -1)).filter((i) => i >= 0).pop();

  const onMove = (e: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / PW) * (n - 1));
    const idx = Math.min(n - 1, Math.max(0, i));
    setTip({ x: x(idx), index: idx });
  };

  return (
    <figure className="chart card" aria-label={title}>
      <figcaption>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </figcaption>
      <div className="chart-box">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title} (${unit})`}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setTip(null)}
          style={{ touchAction: 'pan-y' }}
        >
          <Axis yTicks={ticks(lo, hi)} y={y} labels={labels} x={x} />
          <path d={`${segments.join('')}`} fill="none" stroke={series.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {tip && <line className="crosshair" x1={tip.x} x2={tip.x} y1={PAD.top} y2={PAD.top + PH} />}
          {series.values.map((v, i) =>
            typeof v === 'number' && (i === lastIndex || tip?.index === i) ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={series.color} className="dot" />
            ) : null,
          )}
          {lastIndex !== undefined && (
            <text className="end-label" x={x(lastIndex)} y={y(series.values[lastIndex]!) - 10} textAnchor="end" dx={-4}>
              {fmt(series.values[lastIndex]!)}
            </text>
          )}
        </svg>
        {tip && <Tooltip tip={tip}>{tooltip(tip.index)}</Tooltip>}
      </div>
      <DataTable labels={labels} series={[series]} unit={unit} />
    </figure>
  );
}

function DataTable({ labels, series, unit }: { labels: string[]; series: Series[]; unit: string }) {
  return (
    <details className="chart-table">
      <summary>Se tallene</summary>
      <table>
        <thead>
          <tr>
            <th />
            {series.map((s) => (
              <th key={s.key}>
                {s.label} ({unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={i}>
              <th>{l}</th>
              {series.map((s) => (
                <td key={s.key}>{typeof s.values[i] === 'number' ? fmt(s.values[i]!) : '–'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat card">
      <div className="muted stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="muted stat-sub">{sub}</div>}
    </div>
  );
}
