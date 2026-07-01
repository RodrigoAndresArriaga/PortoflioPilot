"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSliceColor } from "@/lib/dashboard/chart-colors";
import type { AllocationSlice } from "@/lib/dashboard/types";

type AllocationDonutChartProps = {
  title: string;
  description: string;
  slices: AllocationSlice[];
  emptyMessage?: string;
};

type ChartDatum = AllocationSlice & {
  color: string;
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildChartData(slices: AllocationSlice[]): ChartDatum[] {
  return slices.map((slice, index) => ({
    ...slice,
    color: getSliceColor(slice.key, index),
  }));
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum; value: number }>;
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-sm font-medium text-popover-foreground">
          {item.label}
        </span>
      </div>
      <p className="mt-1 ml-4 text-sm tabular-nums text-muted-foreground">
        {formatPercent(item.percent)}
      </p>
    </div>
  );
}

export function AllocationDonutChart({
  title,
  description,
  slices,
  emptyMessage = "No allocation data yet.",
}: AllocationDonutChartProps) {
  const chartData = buildChartData(slices);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="percent"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {chartData.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-sm text-foreground">
                      {entry.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatPercent(entry.percent)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
