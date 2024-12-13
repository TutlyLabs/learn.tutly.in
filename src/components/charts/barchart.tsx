import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { assignment: "Assignment-1", submissions: 186 },
  { assignment: "Assignment-2", submissions: 505 },
  { assignment: "Assignment-3", submissions: 237 },
  { assignment: "Assignment-4", submissions: 73 },
  { assignment: "Assignment-5", submissions: 209 },
  { assignment: "Assignment-6", submissions: 214 },
  { assignment: "Assignment-7", submissions: 466 },
  { assignment: "Assignment-8", submissions: 134 },
  { assignment: "Assignment-9", submissions: 237 },
  { assignment: "Assignment-10", submissions: 73 },
  { assignment: "Assignment-11", submissions: 409 },
  { assignment: "Assignment-12", submissions: 214 },
  
]

const chartConfig = {
  submissions: {
    label: "Submissions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function Barchart({
  data
}:{
  data: any
}) {
  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
        <CardDescription>Submissions per assignment</CardDescription>
      </CardHeader>
      <CardContent className="h-[190px] w-full">
        <ChartContainer config={chartConfig} className="h-[190px] w-full">
          <BarChart
            accessibilityLayer
            // data={data}    // realtime data
            data={chartData}  // fake data
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="assignment"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // tickFormatter={(value) => value.slice(0,3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="submissions" fill="var(--color-submissions)" radius={[8, 8, 0, 0]}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
      </CardFooter> */}
    </Card>
  )
}
