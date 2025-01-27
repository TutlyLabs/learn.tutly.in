// @ts-nocheck
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { class: "class-1", attendees: 186, absentees: 80 },
  { class: "class-2", attendees: 305, absentees: 200 },
  { class: "class-3", attendees: 237, absentees: 120 },
  { class: "class-4", attendees: 73, absentees: 190 },
  { class: "class-5", attendees: 209, absentees: 130 },
  { class: "class-6", attendees: 214, absentees: 140 },
];

const chartConfig = {
  attendees: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
  absentees: {
    label: "Absent",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function Linechart({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Class wise attendance</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[190px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}         // realtime data
            // data={chartData} // fake data
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="class"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              //   tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-attendees)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-attendees)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-absentees)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-absentees)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            {/* absent chart */}
            {/* <Area
              dataKey="absentees"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-absentees)"
              stackId="a"
            /> */}
            {/* present chart */}
            <Area
              dataKey="attendees"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.4}
              stroke="var(--color-attendees)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter></CardFooter> */}
    </Card>
  );
}
