"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { getFunnelData, getProductPerformance, getZonePerformance, getEngagementTrend } from "@/src/lib/analytics";

type Funnel = ReturnType<typeof getFunnelData>;
type Trend = ReturnType<typeof getEngagementTrend>;
type Zones = ReturnType<typeof getZonePerformance>;
type Products = ReturnType<typeof getProductPerformance>;

export function EngagementFunnel({ data }: { data: Funnel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((step, index) => (
          <div key={step.name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">{step.name}</span>
              <span className="text-slate-500">{step.value}</span>
            </div>
            <Progress value={step.conversion} className={index === data.length - 1 ? "[&>div]:bg-green" : ""} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EngagementTrend({ data }: { data: Trend }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1d2c48" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#0a1020", border: "1px solid #1d2c48", color: "#e8f2ff" }} />
            <Line type="monotone" dataKey="detected" stroke="#35d5ff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="scriptPlayed" stroke="#9c6cff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="samplingInterest" stroke="#31e981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ZoneProductRanking({ zones, products }: { zones: Zones; products: Products }) {
  const chartData = zones.map((zone) => ({ name: zone.zone, value: zone.interactions + zone.sampling_interest }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Zones / Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 14 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={88} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a1020", border: "1px solid #1d2c48", color: "#e8f2ff" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={["#35d5ff", "#9c6cff", "#31e981", "#f6b743", "#ff4d67"][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-2 text-xs">
          {products.slice(0, 4).map((product, index) => (
            <div key={product.product_id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/45 p-2">
              <span className="text-slate-300">{index + 1}. {product.product_name}</span>
              <span className="text-green">{product.sampling_interest} interest</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
