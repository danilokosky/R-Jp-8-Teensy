import React, { useEffect, useRef } from 'react';
import {
  JP8Patch,
  computeIr3109MagnitudeDb,
  synthesizeSingleCyclePreview,
} from '../utils/jp8DspMath';
import { jp8AudioEngine } from '../utils/jp8AudioEngine';

interface JP8SignalVisualizerProps {
  patch: JP8Patch;
  activeNotes: number[];
}

export const JP8SignalVisualizer: React.FC<JP8SignalVisualizerProps> = ({
  patch,
  activeNotes,
}) => {
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    const liveBuffer = new Float32Array(512);

    const renderScope = () => {
      const canvas = scopeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, width, height);

      // Subtle oscilloscope graticule grid
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += width / 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Check if live audio is playing
      const hasLive = activeNotes.length > 0 && jp8AudioEngine.getAnalyserTimeDomainData(liveBuffer);
      let samples: number[] | Float32Array;

      if (hasLive) {
        let maxAbs = 0;
        for (let i = 0; i < liveBuffer.length; i++) {
          if (Math.abs(liveBuffer[i]) > maxAbs) maxAbs = Math.abs(liveBuffer[i]);
        }
        samples = maxAbs > 0.005 ? liveBuffer : synthesizeSingleCyclePreview(patch, 256);
      } else {
        samples = synthesizeSingleCyclePreview(patch, 256);
      }

      ctx.strokeStyle = activeNotes.length > 0 ? '#06B6D4' : '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const len = samples.length;
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * width;
        const y = height * 0.5 - samples[i] * (height * 0.38);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (activeNotes.length > 0) {
        animId = requestAnimationFrame(renderScope);
      }
    };

    renderScope();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [patch, activeNotes]);

  // Generate SVG Bode Plot points for HPF + IR3109 VCF (20 Hz to 20 kHz log scale)
  const bodePoints: string[] = [];
  const bodeFillPoints: string[] = ['0,115'];
  const numFreqPoints = 72;
  for (let i = 0; i <= numFreqPoints; i++) {
    const norm = i / numFreqPoints;
    const freq = 20 * Math.pow(1000, norm); // 20 Hz to 20,000 Hz
    const db = computeIr3109MagnitudeDb(
      freq,
      patch.hpfCutoffHz,
      patch.vcfCutoffHz,
      patch.vcfResonance,
      patch.vcfSlope
    );
    const x = (norm * 320).toFixed(1);
    // Map -36 dB .. +18 dB to y = 110 .. 10
    const clampedDb = Math.max(-36, Math.min(18, db));
    const y = (110 - ((clampedDb + 36) / 54) * 96).toFixed(1);
    bodePoints.push(`${x},${y}`);
    bodeFillPoints.push(`${x},${y}`);
  }
  bodeFillPoints.push('320,115');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Time-Domain Oscilloscope (TP-4 / TP-6) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Osciloscópio de Voz (TP-4 VCO / TP-6 VCF Out)
            </h3>
            <p className="text-xs text-slate-400">
              {activeNotes.length > 0
                ? 'Sinal WebAudio em Tempo Real (10V p-p eq.)'
                : 'Simulação de Ciclo Único (VCO-1 + VCO-2 + X-MOD + IR3109)'}
            </p>
          </div>
          <div className="text-right font-mono text-xs text-amber-400 tabular-nums">
            <span>MIX {100 - patch.sourceMix * 10}%/{patch.sourceMix * 10}%</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>X-MOD {patch.vco1CrossMod.toFixed(1)}</span>
          </div>
        </div>
        <canvas
          ref={scopeCanvasRef}
          width={420}
          height={120}
          data-testid="jp8-oscilloscope-canvas"
          className="w-full h-[120px] rounded border border-slate-800 bg-[#07090E]"
        />
      </div>

      {/* Frequency-Domain IR3109 Filter Bode Response */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Resposta em Frequência: HPF + Roland IR3109 OTA
            </h3>
            <p className="text-xs text-slate-400">
              HPF 6dB ({patch.hpfCutoffHz} Hz) + VCF -{patch.vcfSlope}dB/oct ({patch.vcfCutoffHz} Hz)
            </p>
          </div>
          <div className="text-right font-mono text-xs text-cyan-400 tabular-nums">
            <span>Q/RES {patch.vcfResonance.toFixed(1)}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>-{patch.vcfSlope} dB/oct</span>
          </div>
        </div>

        <svg
          viewBox="0 0 320 120"
          className="w-full h-[120px] rounded border border-slate-800 bg-[#07090E]"
          aria-label="Curva de resposta em frequência do filtro IR3109"
        >
          {/* Reference dB grid lines */}
          <line x1="0" y1="46" x2="320" y2="46" stroke="#1E293B" strokeDasharray="3 3" />
          <line x1="0" y1="78" x2="320" y2="78" stroke="#1E293B" />
          {/* Decade vertical lines: 100Hz, 1kHz, 10kHz */}
          <line x1="74" y1="0" x2="74" y2="120" stroke="#1E293B" />
          <line x1="181" y1="0" x2="181" y2="120" stroke="#1E293B" />
          <line x1="288" y1="0" x2="288" y2="120" stroke="#1E293B" />

          <polygon points={bodeFillPoints.join(' ')} fill="rgba(6, 182, 212, 0.14)" />
          <polyline
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2"
            points={bodePoints.join(' ')}
          />

          <text x="6" y="14" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            +12dB (BA662 Auto-Osc)
          </text>
          <text x="6" y="43" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            0dB
          </text>
          <text x="76" y="114" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            100Hz
          </text>
          <text x="183" y="114" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            1kHz
          </text>
          <text x="275" y="114" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            10kHz
          </text>
        </svg>
      </div>
    </div>
  );
};
