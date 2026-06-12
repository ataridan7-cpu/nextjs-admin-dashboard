"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

import { useStocksData } from "@/hooks/use-stocks-data";
import { stocksApi } from "@/lib/stocks/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Primary-tinted palette for longs, red tints for shorts, gray for cash
const LONG_COLORS = ["#5750F1", "#5475E5", "#8099EC", "#ADBCF2", "#C3CEF6", "#D6DEF9", "#E8ECFC"];
const SHORT_COLORS = ["#FB5454", "#F89090", "#FBC0C0"];
const CASH_COLOR = "#9CA3AF";

export function AllocationDonut() {
  const { data } = useStocksData(() => stocksApi.latestVerdicts());
  const target = data?.portfolio_target;
  if (!target) return null;

  const longs = Object.entries(target.weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);
  const shorts = Object.entries(target.weights)
    .filter(([, w]) => w < 0)
    .sort((a, b) => a[1] - b[1]);

  // Donuts can't draw negatives: slices are |exposure|, labels carry the side
  const labels = [
    ...longs.map(([t]) => `${t} long`),
    ...shorts.map(([t]) => `${t} short`),
    "Cash",
  ];
  const series = [
    ...longs.map(([, w]) => round2(w * 100)),
    ...shorts.map(([, w]) => round2(Math.abs(w) * 100)),
    round2(target.cash * 100),
  ];
  const colors = [
    ...longs.map((_, i) => LONG_COLORS[i % LONG_COLORS.length]),
    ...shorts.map((_, i) => SHORT_COLORS[i % SHORT_COLORS.length]),
    CASH_COLOR,
  ];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    colors,
    labels,
    legend: {
      show: true,
      position: "bottom",
      itemMargin: { horizontal: 10, vertical: 5 },
      formatter: (name, opts) =>
        `${name}: ${series[opts.seriesIndex].toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "78%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Gross exposure",
              fontSize: "14px",
              fontWeight: "400",
              formatter: () => `${(target.gross * 100).toFixed(1)}%`,
            },
            value: { show: true, fontSize: "24px", fontWeight: "bold" },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `${v.toFixed(1)}% of portfolio` } },
  };

  return (
    <div className="rounded-[10px] bg-white px-7.5 py-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-3 text-body-2xlg font-bold text-dark dark:text-white">
        Current Allocation
      </h2>
      <Chart options={options} series={series} type="donut" height={340} />
    </div>
  );
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}
