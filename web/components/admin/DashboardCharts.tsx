"use client";

import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function DashboardCharts({
  productLabels,
  productData,
  weekLabels,
  weekOrders,
  weekRevenue,
}: {
  productLabels: string[];
  productData: number[];
  weekLabels: string[];
  weekOrders: number[];
  weekRevenue: number[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border border-border bg-surface-2 p-5">
        <h2 className="mb-4 font-data text-xs uppercase tracking-widest text-ink-muted">
          Ürün Satış Dağılımı
        </h2>
        <Doughnut
          data={{
            labels: productLabels,
            datasets: [
              {
                data: productData,
                backgroundColor: ["#E8541E", "#3B6EA5", "#4C8B5F", "#6B6660", "#221F1D"],
                borderWidth: 2,
                borderColor: "#F5F5F2",
              },
            ],
          }}
          options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        />
      </div>

      <div className="border border-border bg-surface-2 p-5">
        <h2 className="mb-4 font-data text-xs uppercase tracking-widest text-ink-muted">
          Haftalık Sipariş / Gelir
        </h2>
        <Line
          data={{
            labels: weekLabels,
            datasets: [
              {
                label: "Sipariş",
                data: weekOrders,
                borderColor: "#3B6EA5",
                backgroundColor: "rgba(59, 110, 165, 0.1)",
                tension: 0.3,
                yAxisID: "y",
              },
              {
                label: "Gelir (TL)",
                data: weekRevenue,
                borderColor: "#E8541E",
                backgroundColor: "rgba(232, 84, 30, 0.1)",
                tension: 0.3,
                yAxisID: "y1",
              },
            ],
          }}
          options={{
            responsive: true,
            scales: {
              y: { type: "linear", position: "left" },
              y1: { type: "linear", position: "right", grid: { drawOnChartArea: false } },
            },
          }}
        />
      </div>
    </div>
  );
}
