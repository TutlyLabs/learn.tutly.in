// @ts-nocheck
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

let chartData = [
  { browser: "evaluated", submissions: 275, fill: "var(--color-evaluated)" },
  { browser: "unreviewed", submissions: 200, fill: "var(--color-unreviewed)" },
  { browser: "unsubmitted", submissions: 187, fill: "var(--color-unsubmitted)" },
];

const chartConfig = {
  submissions: {
    label: "Submissions",
  },
  evaluated: {
    label: "Evaluated",
    color: "hsl(var(--chart-1))",
  },
  unreviewed: {
    label: "Unreviewed",
    color: "hsl(var(--chart-2))",
  },
  unsubmitted: {
    label: "Unsubmitted",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function StudentBarchart({ data }: any) {
  chartData.forEach((d, ind) => (d.submissions = data[ind]));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
        {/* <CardDescription></CardDescription> */}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[190px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
            />
            <XAxis dataKey="submissions" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="submissions" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm"></CardFooter> */}
    </Card>
  );
}
