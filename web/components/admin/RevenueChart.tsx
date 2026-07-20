"use client";

import { useState } from "react";
import type { DashboardChartData, ChartPoint } from "@/lib/types";
import { formatPriceNumber } from "@/lib/formatPrice";
import Card from "@/components/Card";

const VIEW_W = 640;
const VIEW_H = 220;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

const PERIODS: { key: keyof DashboardChartData; title: string; caption: string }[] = [
  { key: "day", title: "Günlük Gelir", caption: "Son 7 gün, indirimler düşülmüş net gelir" },
  { key: "week", title: "Haftalık Gelir", caption: "Son 8 hafta, indirimler düşülmüş net gelir" },
  { key: "month", title: "Aylık Gelir", caption: "Son 6 ay, indirimler düşülmüş net gelir" },
  { key: "year", title: "Yıllık Gelir", caption: "Son 3 yıl, indirimler düşülmüş net gelir" },
];

function pointsFor(values: number[]) {
  const n = values.length;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const usableH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  return values.map((v, i) => ({
    x: n === 1 ? 0 : (i * VIEW_W) / (n - 1),
    y: PAD_TOP + (1 - (v - min) / range) * usableH,
  }));
}

export default function RevenueChart({ chart }: { chart: DashboardChartData }) {
  const [period, setPeriod] = useState<keyof DashboardChartData>("week");
  const points: ChartPoint[] = chart[period];
  const meta = PERIODS.find((p) => p.key === period)!;

  const coords = pointsFor(points.map((p) => p.value));
  const linePath = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;
  const last = coords[coords.length - 1];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-ink">{meta.title}</h2>
          <p className="mt-0.5 font-body text-xs text-ink-muted">{meta.caption}</p>
        </div>
        <div className="inline-flex gap-0.5 rounded-full bg-surface-2 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
              className={`rounded-full px-3.5 py-1.5 font-data text-xs font-semibold transition-colors ${
                period === p.key ? "bg-accent text-accent-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {p.key === "day" ? "Gün" : p.key === "week" ? "Hafta" : p.key === "month" ? "Ay" : "Yıl"}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 || points.every((p) => p.value === 0) ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Bu aralıkta veri yok.</p>
      ) : (
        <div className="mt-4">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            width="100%"
            height="220"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${meta.title} grafiği`}
          >
            <defs>
              <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="var(--color-border)" strokeWidth="1">
              <line x1="0" y1="20" x2={VIEW_W} y2="20" />
              <line x1="0" y1="70" x2={VIEW_W} y2="70" />
              <line x1="0" y1="120" x2={VIEW_W} y2="120" />
              <line x1="0" y1="170" x2={VIEW_W} y2="170" />
            </g>
            <path d={areaPath} fill="url(#revenueAreaFill)" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5">
              {coords.slice(0, -1).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" />
              ))}
            </g>
            <circle cx={last.x} cy={last.y} r="9" fill="var(--color-accent)" opacity="0.18" />
            <circle cx={last.x} cy={last.y} r="5.5" fill="var(--color-accent)" />
          </svg>
          <div className="mt-1 flex justify-between px-0.5 font-data text-[11px] text-ink-muted">
            {points.map((p, i) => (
              <span key={i}>{p.label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 font-body text-xs text-ink-muted">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        Net gelir ({formatPriceNumber(Math.round(points.reduce((s, p) => s + p.value, 0) * 100))} TL toplam)
      </div>
    </Card>
  );
}
