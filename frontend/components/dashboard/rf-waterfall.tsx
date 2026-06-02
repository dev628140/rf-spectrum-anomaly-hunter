"use client";

import { useEffect, useRef, useState } from "react";
import { useRFStore } from "@/store/rf-store";
import { Flame, RefreshCw } from "lucide-react";

export function RFWaterfall() {
  const { rf } = useRFStore();
  const waterfall = rf?.signal?.waterfall || [];
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ freq: number; power: number; x: number; y: number } | null>(null);

  // Normalize and render spectrogram on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waterfall.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fit canvas display size to container bounds
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const rowsCount = waterfall.length;
    const colsCount = waterfall[0]?.length || 0;
    if (colsCount === 0) return;

    const marginLeft = 50;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 24;

    const spectroWidth = width - marginLeft - marginRight;
    const spectroHeight = height - marginTop - marginBottom;

    const cellWidth = spectroWidth / colsCount;
    const cellHeight = spectroHeight / rowsCount;

    // Track spectrum range
    let min = Infinity;
    let max = -Infinity;
    for (const row of waterfall) {
      for (const val of row) {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    const range = max - min || 1;

    // Draw spectrogram cells
    for (let r = 0; r < rowsCount; r++) {
      const row = waterfall[waterfall.length - 1 - r];
      if (!row) continue;
      
      for (let c = 0; c < colsCount; c++) {
        const val = row[c];
        const intensity = (val - min) / range;

        let hue, sat, light, alpha;
        if (intensity < 0.3) {
          hue = 240 - (intensity / 0.3) * 40;
          sat = 100;
          light = 6 + (intensity / 0.3) * 14;
          alpha = 0.45 + (intensity / 0.3) * 0.25;
        } else if (intensity < 0.7) {
          hue = 200 + ((intensity - 0.3) / 0.4) * 120;
          sat = 100;
          light = 20 + ((intensity - 0.3) / 0.4) * 35;
          alpha = 0.7 + ((intensity - 0.3) / 0.4) * 0.3;
        } else {
          hue = 320 + ((intensity - 0.7) / 0.3) * 60;
          sat = 100;
          light = 55 + ((intensity - 0.7) / 0.3) * 40;
          alpha = 1.0;
        }

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.fillRect(
          marginLeft + c * cellWidth,
          marginTop + r * cellHeight,
          cellWidth + 0.6,
          cellHeight + 0.6
        );

        if (intensity > 0.85) {
          ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(
            marginLeft + c * cellWidth,
            marginTop + r * cellHeight,
            cellWidth + 0.1,
            cellHeight + 0.1
          );
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw detailed grids on top of the spectrogram
    ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const gridCols = 5;
    for (let i = 1; i < gridCols; i++) {
      const gridX = marginLeft + (i / gridCols) * spectroWidth;
      ctx.beginPath();
      ctx.moveTo(gridX, marginTop);
      ctx.lineTo(gridX, marginTop + spectroHeight);
      ctx.stroke();
    }

    const gridRows = 4;
    for (let i = 1; i < gridRows; i++) {
      const gridY = marginTop + (i / gridRows) * spectroHeight;
      ctx.beginPath();
      ctx.moveTo(marginLeft, gridY);
      ctx.lineTo(marginLeft + spectroWidth, gridY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + spectroHeight);
    ctx.lineTo(marginLeft + spectroWidth, marginTop + spectroHeight);
    ctx.stroke();

    // Draw bottom frequency tick marks and text labels (Upscaled to 11px)
    ctx.fillStyle = "#cbd5e1"; // Slate text
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const freqTicks = 5;
    for (let i = 0; i <= freqTicks; i++) {
      const ratio = i / freqTicks;
      const x = marginLeft + ratio * spectroWidth;
      const freqVal = 88.0 + ratio * 20.0;

      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.beginPath();
      ctx.moveTo(x, marginTop + spectroHeight);
      ctx.lineTo(x, marginTop + spectroHeight + 4);
      ctx.stroke();

      ctx.fillText(`${freqVal.toFixed(1)}`, x, marginTop + spectroHeight + 6);
    }

    // Draw left time tick marks and text labels (Upscaled to 11px)
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const timeTicks = 4;
    const maxTimeVal = rowsCount === 64 ? 64 : 30;
    for (let i = 0; i <= timeTicks; i++) {
      const ratio = i / timeTicks;
      const y = marginTop + ratio * spectroHeight;
      const timeVal = -Math.round(ratio * maxTimeVal);

      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft - 4, y);
      ctx.stroke();

      const timeText = timeVal === 0 ? "Now" : `${timeVal}s`;
      ctx.fillText(timeText, marginLeft - 6, y);
    }
  }, [waterfall]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || waterfall.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const marginLeft = 50;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 24;

    const spectroWidth = width - marginLeft - marginRight;
    const spectroHeight = height - marginTop - marginBottom;

    if (x < marginLeft || x > marginLeft + spectroWidth || y < marginTop || y > marginTop + spectroHeight) {
      setHoverInfo(null);
      return;
    }

    const colsCount = waterfall[0]?.length || 0;
    const rowsCount = waterfall.length;
    if (colsCount === 0 || rowsCount === 0) return;

    const colIndex = Math.min(
      colsCount - 1,
      Math.max(0, Math.floor(((x - marginLeft) / spectroWidth) * colsCount))
    );
    const rowIndex = Math.min(
      rowsCount - 1,
      Math.max(0, Math.floor(((y - marginTop) / spectroHeight) * rowsCount))
    );

    const spectrumPoint = rf.signal.spectrum[colIndex];
    const freq = spectrumPoint ? spectrumPoint.frequency : 88.0 + (colIndex / colsCount) * 20.0;
    const power = waterfall[waterfall.length - 1 - rowIndex]?.[colIndex] || -100.0;

    const cellWidth = spectroWidth / colsCount;
    const cellHeight = spectroHeight / rowsCount;
    const cellCenterX = marginLeft + (colIndex + 0.5) * cellWidth;
    const cellCenterY = marginTop + (rowIndex + 0.5) * cellHeight;

    setHoverInfo({
      freq: parseFloat(freq.toFixed(3)),
      power: parseFloat(power.toFixed(2)),
      x: cellCenterX,
      y: cellCenterY
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  if (waterfall.length === 0) {
    return (
      <div className="rounded-[2rem] border border-cyan-500/10 bg-[#07111f] p-6 h-full flex items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.04)]">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto text-cyan-400 animate-spin" />
          <div className="mt-4 text-xl font-black text-white tracking-widest font-mono">
            ESTABLISHING TELEMETRY LINK...
          </div>
          <div className="mt-2 text-slate-400 text-sm">
            Waiting for live rolling RF Waterfall history buffer
          </div>
        </div>
      </div>
    );
  }

  const fftBins = waterfall[0]?.length || 0;

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.03)] h-full flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-cyan-300 animate-pulse" />
          <div>
            <div className="text-base font-black text-white tracking-tight">RF Waterfall</div>
            <div className="mt-1 text-[10px] font-semibold text-slate-300">
              Realtime spectrogram rolling history (MHz)
            </div>
          </div>
        </div>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 tracking-widest font-mono uppercase">
          Live stream
        </div>
      </div>

      {/* HEATMAP CANVAS CONTAINER (h-[210px]) */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/15 bg-black p-1 group flex-1">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-[210px] bg-black rounded-lg cursor-crosshair block transition-all"
        />

        {/* Laser Grid Hover Crosshairs & Tooltip */}
        {hoverInfo && (
          <>
            <div
              className="absolute pointer-events-none top-0 bottom-0 border-l border-cyan-400/40 border-dashed transition-all duration-75"
              style={{ left: `${hoverInfo.x + 6}px` }}
            />
            <div
              className="absolute pointer-events-none left-0 right-0 border-t border-cyan-400/40 border-dashed transition-all duration-75"
              style={{ top: `${hoverInfo.y + 6}px` }}
            />
            <div
              className="absolute pointer-events-none bg-slate-950/95 border border-cyan-500/35 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-white shadow-[0_0_12px_rgba(0,255,255,0.25)] backdrop-blur-md z-30 space-y-0.5 transition-all duration-75"
              style={{
                left: `${Math.min(hoverInfo.x + 15, canvasRef.current ? canvasRef.current.offsetWidth - 150 : 0)}px`,
                top: `${Math.min(hoverInfo.y + 15, canvasRef.current ? canvasRef.current.offsetHeight - 70 : 0)}px`
              }}
            >
              <div className="text-cyan-300 font-black tracking-wide text-[9px] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                SPECTROGRAM POINT
              </div>
              <div className="border-t border-white/5 my-0.5" />
              <div>Freq: <span className="text-white font-bold">{hoverInfo.freq} MHz</span></div>
              <div className="flex items-center gap-1">
                <span>Power:</span>
                <span className={hoverInfo.power > -40 ? "text-red-400 font-extrabold animate-pulse bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20" : "text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20"}>
                  {hoverInfo.power} dBm
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* COLOR LEGEND SCALE */}
      <div className="mt-3 p-2.5 rounded-xl border border-white/5 bg-black/25 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-center text-[9px] font-black font-mono text-slate-300 tracking-wider">
          <span>SPECTRAL ENERGY COLOR SCALE</span>
          <span className="text-cyan-400">dBm REFERENCE LEVEL</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-950 via-purple-500 via-pink-500 to-yellow-200 border border-white/10 relative overflow-hidden" />
        <div className="flex justify-between text-[8px] font-bold font-mono text-slate-200 tracking-wider">
          <span className="text-blue-400">NOISE FLOOR (-120 dBm)</span>
          <span className="text-purple-400">MID LEVEL (-70 dBm)</span>
          <span className="text-yellow-300 animate-pulse">PEAK POWER (0 dBm)</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-3 grid grid-cols-3 gap-3 shrink-0">
        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Time Slices</div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            {waterfall.length}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">FFT Bins</div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            {fftBins}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stream State</div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}