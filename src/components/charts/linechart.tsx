// @ts-nocheck
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  attendees: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function Linechart({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="class" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <Bar
              dataKey="attendees"
              fill="var(--color-attendees)"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              <LabelList
                dataKey="attendees"
                position="top"
                fill="hsl(var(--foreground))"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
