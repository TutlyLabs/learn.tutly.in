// @ts-nocheck
import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  evaluated: {
    label: "Evaluated",
    color: "hsl(var(--chart-1))",
  },
  unreviewed: {
    label: "Unreviewed",
    color: "hsl(var(--chart-3))",
  },
  unsubmitted: {
    label: "Unsubmitted",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const COLORS = ["var(--color-evaluated)", "var(--color-unreviewed)", "var(--color-unsubmitted)"];
const LABELS = ["Evaluated", "Unreviewed", "Unsubmitted"];

export function Piechart({ data }: { data: any }) {
  const chartData = [
    { name: "Evaluated", value: data[0] || 0 },
    { name: "Unreviewed", value: data[1] || 0 },
    { name: "Unsubmitted", value: data[2] || 0 },
  ];

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="flex flex-col h-full w-full">
      <CardHeader className="items-center pb-2">
        <CardTitle>Assignments</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              label={(entry) => `${entry.name}: ${entry.value}`}
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
              <Label
                value={`Total\n${total}`}
                position="center"
                className="text-sm font-medium"
                fill="hsl(var(--foreground))"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
