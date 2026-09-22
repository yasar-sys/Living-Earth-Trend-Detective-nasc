import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SeriesPoint } from "@/data/nasa-datasets";

export interface ChartSeries {
  name: string;
  color: string;
  points: SeriesPoint[];
  /** Draw as the straight Theil-Sen trend line rather than the observations */
  trendLine?: boolean;
}

interface TrendChartProps {
  series: ChartSeries[];
  unit: string;
  height?: number;
  showLegend?: boolean;
}

export function TrendChart({
  series,
  unit,
  height = 220,
  showLegend = false,
}: TrendChartProps) {
  const years = series[0]?.points.map((p) => p.year) ?? [];
  const data = years.map((year, i) => {
    const row: Record<string, number | null> = { year };
    for (const s of series) row[s.name] = s.points[i]?.value ?? null;
    return row;
  });

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
            width={46}
            tickFormatter={(v: number) => `${v}`}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(value: number, name: string) => [`${value} ${unit}`, name]}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.name}
              type={s.trendLine ? "linear" : "monotone"}
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={s.trendLine ? 1.5 : 2}
              strokeDasharray={s.trendLine ? "6 4" : undefined}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Builds the straight Theil-Sen fit through a series for overlay on the chart. */
export function trendLinePoints(
  points: SeriesPoint[],
  slopePerYear: number,
): SeriesPoint[] {
  if (points.length === 0) return [];
  const meanYear = points.reduce((a, p) => a + p.year, 0) / points.length;
  const meanValue = points.reduce((a, p) => a + p.value, 0) / points.length;
  return points.map((p) => ({
    year: p.year,
    value: Math.round((meanValue + (p.year - meanYear) * slopePerYear) * 1000) / 1000,
  }));
}
