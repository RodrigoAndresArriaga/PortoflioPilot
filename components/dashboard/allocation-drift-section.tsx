import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDriftColor, getSliceColor } from "@/lib/dashboard/chart-colors";
import type { DriftRow } from "@/lib/dashboard/types";

type AllocationDriftSectionProps = {
  driftRows: DriftRow[];
};

function statusLabel(status: DriftRow["status"]): string {
  if (status === "on_target") {
    return "On target";
  }
  if (status === "underweight") {
    return "Underweight";
  }
  return "Overweight";
}

function statusVariant(
  status: DriftRow["status"],
): "default" | "secondary" | "destructive" {
  if (status === "on_target") {
    return "default";
  }
  if (status === "underweight") {
    return "secondary";
  }
  return "destructive";
}

function driftTextStyle(
  status: DriftRow["status"],
  driftPercent: number,
): { color: string } {
  return { color: getDriftColor(status, driftPercent) };
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function AllocationDriftSection({
  driftRows,
}: AllocationDriftSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio drift</CardTitle>
        <CardDescription>
          Difference between current and target allocation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {driftRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add holdings and target allocations to see drift.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium text-right">Current</th>
                  <th className="pb-2 pr-4 font-medium text-right">Target</th>
                  <th className="pb-2 pr-4 font-medium text-right">Drift</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {driftRows.map((row, index) => (
                  <tr key={row.key} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: getSliceColor(row.key, index),
                          }}
                        />
                        {row.label}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {row.currentPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {row.targetPercent.toFixed(1)}%
                    </td>
                    <td
                      className="py-3 pr-4 text-right tabular-nums font-medium"
                      style={driftTextStyle(row.status, row.driftPercent)}
                    >
                      {formatSignedPercent(row.driftPercent)}
                    </td>
                    <td className="py-3">
                      <Badge variant={statusVariant(row.status)}>
                        {statusLabel(row.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
