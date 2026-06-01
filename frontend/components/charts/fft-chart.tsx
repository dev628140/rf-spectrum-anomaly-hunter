"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(
  () => import("react-plotly.js"),
  {
    ssr: false
  }
) as any;

type FFTChartProps = {

  frequencies: number[];

  magnitudes: number[];
};

export default function FFTChart({

  frequencies,
  magnitudes

}: FFTChartProps) {

  return (

    <div
      className="
        w-full
        h-[500px]
      "
    >
      <Plot
        data={[
          {
            x: frequencies,

            y: magnitudes,

            type: "scatter",

            mode: "lines",

            line: {
              color: "#00e5ff",
              width: 2
            }
          }
        ]}

        layout={{

          paper_bgcolor:
            "#07111f",

          plot_bgcolor:
            "#07111f",

          font: {
            color: "#ffffff"
          },

          xaxis: {

            title:
              "Frequency (MHz)"
          },

          yaxis: {

            title:
              "Power (dB)"
          },

          autosize: true
        }}

        style={{
          width: "100%",
          height: "100%"
        }}

        useResizeHandler
      />
    </div>
  );
}