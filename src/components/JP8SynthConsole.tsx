import React, { useState, useEffect } from 'react';
import {
  JP8Patch,
  WaveformType,
  FilterSlope,
  KeyAssignMode,
  calculateCompuTuneCalibration,
} from '../utils/jp8DspMath';
import { JP8_FACTORY_PATCHES } from '../utils/jp8SchematicData';
import { jp8AudioEngine } from '../utils/jp8AudioEngine';
import { JP8SignalVisualizer } from './JP8SignalVisualizer';
import { Play, Square, RefreshCw, Volume2 } from 'lucide-react';

interface JP8SynthConsoleProps {
  patch: JP8Patch;
  onChangePatch: (updated: JP8Patch) => void;
}

const KEYBOARD_NOTES = [
  { midi: 48, label: 'C3', black: false, keyBind: 'Z' },
  { midi: 49, label: 'C#3', black: true, keyBind: 'S' },
  { midi: 50, label: 'D3', black: false, keyBind: 'X' },
  { midi: 51, label: 'D#3', black: true, keyBind: 'D' },
  { midi: 52, label: 'E3', black: false, keyBind: 'C' },
  { midi: 53, label: 'F3', black: false, keyBind: 'V' },
  { midi: 54, label: 'F#3', black: true, keyBind: 'G' },
  { midi: 55, label: 'G3', black: false, keyBind: 'B' },
  { midi: 56, label: 'G#3', black: true, keyBind: 'H' },
  { midi: 57, label: 'A3', black: false, keyBind: 'N' },
  { midi: 58, label: 'A#3', black: true, keyBind: 'J' },
  { midi: 59, label: 'B3', black: false, keyBind: 'M' },
  { midi: 60, label: 'C4', black: false, keyBind: 'Q' },
  { midi: 61, label: 'C#4', black: true, keyBind: '2' },
  { midi: 62, label: 'D4', black: false, keyBind: 'W' },
  { midi: 63, label: 'D#4', black: true, keyBind: '3' },
  { midi: 64, label: 'E4', black: false, keyBind: 'E' },
  { midi: 65, label: 'F4', black: false, keyBind: 'R' },
  { midi: 66, label: 'F#4', black: true, keyBind: '5' },
  { midi: 67, label: 'G4', black: false, keyBind: 'T' },
  { midi: 68, label: 'G#4', black: true, keyBind: '6' },
  { midi: 69, label: 'A4', black: false, keyBind: 'Y' },
  { midi: 70, label: 'A#4', black: true, keyBind: '7' },
  { midi: 71, label: 'B4', black: false, keyBind: 'U' },
  { midi: 72, label: 'C5', black: false, keyBind: 'I' },
];

export const JP8SynthConsole: React.FC<JP8SynthConsoleProps> = ({
  patch,
  onChangePatch,
}) => {
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [activeVoiceLeds, setActiveVoiceLeds] = useState<number[]>([]);
  const [isCompuTuning, setIsCompuTuning] = useState<boolean>(false);
  const [compuTuneProgressVoice, setCompuTuneProgressVoice] = useState<number>(-1);
  const [isArpPlaying, setIsArpPlaying] = useState<boolean>(false);

  // Compu-Tune two-point equation interactive calculator (Page 50)
  const [errAt3V, setErrAt3V] = useState<number>(20);
  const [errAt8V, setErrAt8V] = useState<number>(-30);
  const compuTuneStats = calculateCompuTuneCalibration(errAt3V, errAt8V, 24);

  const triggerNoteOn = (midi: number) => {
    const spawnedVoices = jp8AudioEngine.noteOn(midi, patch);
    setActiveNotes((prev) => (prev.includes(midi) ? prev : [...prev, midi]));
    setActiveVoiceLeds(spawnedVoices);
  };

  const triggerNoteOff = (midi: number) => {
    jp8AudioEngine.noteOff(midi, patch);
    setActiveNotes((prev) => prev.filter((n) => n !== midi));
  };

  const handlePlayChordDemo = () => {
    if (isArpPlaying) {
      setIsArpPlaying(false);
      jp8AudioEngine.panicStopAll(patch);
      setActiveNotes([]);
      return;
    }
    setIsArpPlaying(true);
    const chord = [48, 55, 60, 64, 67]; // C Major 9 lush poly chord
    chord.forEach((n, idx) => {
      window.setTimeout(() => {
        triggerNoteOn(n);
      }, idx * 80);
    });
    window.setTimeout(() => {
      chord.forEach((n) => triggerNoteOff(n));
      setIsArpPlaying(false);
    }, 1800);
  };

  // Run authentic Compu-Tune cycle across all 8 Module Voices (A..H, 16 VCOs)
  const handleRunCompuTune = () => {
    if (isCompuTuning) return;
    setIsCompuTuning(true);
    setCompuTuneProgressVoice(0);

    let step = 0;
    const interval = window.setInterval(() => {
      step++;
      if (step < 8) {
        setCompuTuneProgressVoice(step);
      } else {
        window.clearInterval(interval);
        // Tighten all 16 VCO drift offsets to 14-bit DAC tolerance (±0.7 cents per Page 50)
        const calibratedTable: [number, number][] = Array.from({ length: 8 }, (_, idx) => [
          Number((((idx % 2 === 0 ? 1 : -1) * 0.45)).toFixed(2)),
          Number((((idx % 2 === 0 ? -1 : 1) * 0.55)).toFixed(2)),
        ]);
        jp8AudioEngine.setVoiceDriftTable(calibratedTable);
        setIsCompuTuning(false);
        setCompuTuneProgressVoice(-1);
      }
    }, 180);
  };

  useEffect(() => {
    return () => {
      jp8AudioEngine.panicStopAll(patch);
    };
  }, []);

  const updateField = <K extends keyof JP8Patch>(key: K, value: JP8Patch[K]) => {
    onChangePatch({
      ...patch,
      [key]: value,
    });
  };

  const MODULE_VOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <section id="synth-console" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <p className="text-xs font-mono text-cyan-400">
            Bancada de Síntese Polifônica Real-Time · Emulação dos Painéis A, C e D
          </p>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            02. Simulador Interativo do Motor de Áudio Roland Jupiter-8
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Teste em tempo real o comportamento dos 16 VCOs com Cross-Modulation (BA662),
            Hard Sync, filtro passa-altas + IR3109 (-12dB/-24dB) e envelopes duplos IR3R01.
            Todas as alterações atualizam instantaneamente o código C++ para o Teensy 4.1.
          </p>
        </div>

        {/* Preset Selector & Audition Trigger */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label htmlFor="jp8-preset-select" className="sr-only">
            Selecionar Patch de Fábrica
          </label>
          <select
            id="jp8-preset-select"
            aria-label="Selecionar Patch de Fábrica"
            value={patch.id}
            onChange={(e) => {
              const found = JP8_FACTORY_PATCHES.find((p) => p.id === e.target.value);
              if (found) onChangePatch(found);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            {JP8_FACTORY_PATCHES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePlayChordDemo}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isArpPlaying
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isArpPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Parar Áudio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tocar Acorde JP-8</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRunCompuTune}
            disabled={isCompuTuning}
            className="px-3.5 py-2 text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompuTuning ? 'animate-spin' : ''}`} />
            <span>{isCompuTuning ? 'COMPU-TUNING...' : 'COMPU-TUNE (Pág. 50)'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Oscilloscope + IR3109 Bode Plot */}
      <JP8SignalVisualizer patch={patch} activeNotes={activeNotes} />

      {/* Authentic Hardware Panel Strip (VCO-1 | VCO-2 & MIX | HPF & IR3109 VCF | IR3R01 ENV-1 & ENV-2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6">
        {/* Top Hardware LED Display Bar (Panel F & Module Voice Indicators A-H per Page 30) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800/90 rounded-lg px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="bg-[#140707] border border-red-950 px-3 py-1.5 rounded font-mono text-lg font-bold text-red-500 tracking-widest tabular-nums">
              {isCompuTuning
                ? `cU 0${compuTuneProgressVoice + 1}`
                : patch.id.slice(0, 2).toUpperCase() + ' 88'}
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 font-semibold">
                {patch.name}
              </div>
              <div className="text-xs text-slate-400">{patch.description}</div>
            </div>
          </div>

          {/* 8 Voice Assignment LEDs (Modules A to H - Page 30 Test LEDs) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              VOZES ATIVAS (MOD AB/CD/EF/GH):
            </span>
            <div className="flex items-center gap-1.5">
              {MODULE_VOICE_LABELS.map((label, idx) => {
                const isLit =
                  isCompuTuning
                    ? compuTuneProgressVoice === idx
                    : activeVoiceLeds.includes(idx);
                return (
                  <div
                    key={label}
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                      isLit
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4-Column Synthesizer Parameter Matrix (Panel Boards C & D) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Column 1: VCO-1 & VCO MODULATOR (Panel C) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-amber-400">
                VCO-1 & X-MOD (IC1A / BA662)
              </h3>
              <span className="text-xs font-mono text-slate-500">Pág. 15</span>
            </div>

            {/* Range Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>VCO-1 RANGE</span>
                <span className="text-amber-400">{patch.vco1Range}&apos;</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded">
                {([16, 8, 4, 2] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateField('vco1Range', r)}
                    className={`py-1 text-xs font-mono rounded transition-colors ${
                      patch.vco1Range === r
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}&apos;
                  </button>
                ))}
              </div>
            </div>

            {/* Waveform Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>WAVEFORM (IC5A 4052)</span>
                <span className="text-amber-400">{patch.vco1Wave}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded">
                {(['triangle', 'sawtooth', 'pulse', 'square'] as WaveformType[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateField('vco1Wave', w)}
                    className={`py-1 text-xs font-mono rounded capitalize transition-colors ${
                      patch.vco1Wave === w
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cross Mod Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-xmod">CROSS MOD (VCO2 → VCO1)</label>
                <span className="text-amber-400 tabular-nums">
                  {patch.vco1CrossMod.toFixed(1)} / 10
                </span>
              </div>
              <input
                id="slider-xmod"
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={patch.vco1CrossMod}
                onChange={(e) => updateField('vco1CrossMod', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>

            {/* VCO-1 ENV-1 Pitch Mod */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-vco-env">ENV-1 PITCH MOD</label>
                <span className="text-amber-400 tabular-nums">
                  {patch.vco1ModEnv.toFixed(1)}
                </span>
              </div>
              <input
                id="slider-vco-env"
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={patch.vco1ModEnv}
                onChange={(e) => updateField('vco1ModEnv', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>

            {/* Pulse Width */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-pw">PULSE WIDTH (IC16A)</label>
                <span className="text-amber-400 tabular-nums">
                  {Math.round(patch.vco1Pw * 100)}%
                </span>
              </div>
              <input
                id="slider-pw"
                type="range"
                min={0.05}
                max={0.95}
                step={0.01}
                value={patch.vco1Pw}
                onChange={(e) => updateField('vco1Pw', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>
          </div>

          {/* Column 2: VCO-2, HARD SYNC & SOURCE MIX (Panel C) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-amber-400">
                VCO-2, SYNC & MIX (BA662)
              </h3>
              <span className="text-xs font-mono text-slate-500">Pág. 15/16</span>
            </div>

            {/* VCO-2 Range */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>VCO-2 RANGE</span>
                <span className="text-amber-400">{patch.vco2Range}&apos;</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded">
                {([16, 8, 4, 2] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateField('vco2Range', r)}
                    className={`py-1 text-xs font-mono rounded transition-colors ${
                      patch.vco2Range === r
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}&apos;
                  </button>
                ))}
              </div>
            </div>

            {/* VCO-2 Waveform & Sync Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="text-xs font-mono text-slate-300 mb-1">VCO-2 WAVE</div>
                <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded">
                  {(['sawtooth', 'pulse', 'triangle', 'noise'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => updateField('vco2Wave', w)}
                      className={`py-1 text-xs font-mono rounded capitalize transition-colors ${
                        patch.vco2Wave === w
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {w.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-slate-300 mb-1">SYNC</div>
                <button
                  type="button"
                  onClick={() => updateField('vco2Sync', !patch.vco2Sync)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition-colors ${
                    patch.vco2Sync
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {patch.vco2Sync ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* VCO-2 Fine Tune (-50 to +50 cents) */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-vco2-fine">VCO-2 FINE TUNE</label>
                <span className="text-amber-400 tabular-nums">
                  {patch.vco2Fine > 0 ? `+${patch.vco2Fine}` : patch.vco2Fine} cents
                </span>
              </div>
              <input
                id="slider-vco2-fine"
                type="range"
                min={-50}
                max={50}
                step={1}
                value={patch.vco2Fine}
                onChange={(e) => updateField('vco2Fine', parseInt(e.target.value, 10))}
                className="w-full jp8-slider"
              />
            </div>

            {/* Source Mix (VCO-1 vs VCO-2) */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-source-mix">SOURCE MIX (VCO1 ↔ VCO2)</label>
                <span className="text-amber-400 tabular-nums">
                  {patch.sourceMix.toFixed(1)}
                </span>
              </div>
              <input
                id="slider-source-mix"
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={patch.sourceMix}
                onChange={(e) => updateField('sourceMix', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>

            {/* Key Assign Mode (POLY1, POLY2, UNISON, SOLO) */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>KEY ASSIGN MODE</span>
                <span className="text-cyan-400">{patch.keyAssignMode}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded">
                {(['POLY1', 'POLY2', 'UNISON', 'SOLO'] as KeyAssignMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateField('keyAssignMode', m)}
                    className={`py-1 text-xs font-mono rounded transition-colors ${
                      patch.keyAssignMode === m
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: HPF & IR3109 VCF (Panel D) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400">
                HPF & VCF IR3109 (IC27A)
              </h3>
              <span className="text-xs font-mono text-slate-500">Pág. 16</span>
            </div>

            {/* 1-Pole High Pass Filter */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-hpf">HPF CUTOFF (-6dB/oct)</label>
                <span className="text-cyan-400 tabular-nums">{patch.hpfCutoffHz} Hz</span>
              </div>
              <input
                id="slider-hpf"
                type="range"
                min={20}
                max={1200}
                step={5}
                value={patch.hpfCutoffHz}
                onChange={(e) => updateField('hpfCutoffHz', parseInt(e.target.value, 10))}
                className="w-full jp8-slider"
              />
            </div>

            {/* IR3109 VCF Cutoff */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-vcf-cutoff">VCF CUTOFF FREQ (IR3109)</label>
                <span className="text-cyan-400 tabular-nums">{patch.vcfCutoffHz} Hz</span>
              </div>
              <input
                id="slider-vcf-cutoff"
                type="range"
                min={40}
                max={16000}
                step={20}
                value={patch.vcfCutoffHz}
                onChange={(e) => updateField('vcfCutoffHz', parseInt(e.target.value, 10))}
                className="w-full jp8-slider"
              />
            </div>

            {/* Resonance (BA662 IC25A) */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-vcf-res">RESONANCE (BA662 IC25A)</label>
                <span className="text-cyan-400 tabular-nums">
                  {patch.vcfResonance.toFixed(1)} / 10
                </span>
              </div>
              <input
                id="slider-vcf-res"
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={patch.vcfResonance}
                onChange={(e) => updateField('vcfResonance', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>

            {/* Slope Switch (-12dB 2-Pole vs -24dB 4-Pole via IC5A 4052) */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs font-mono text-slate-300 mb-1">
                  SLOPE (IC5A 4052)
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded">
                  {([12, 24] as FilterSlope[]).map((sl) => (
                    <button
                      key={sl}
                      type="button"
                      onClick={() => updateField('vcfSlope', sl)}
                      className={`py-1 text-xs font-mono rounded transition-colors ${
                        patch.vcfSlope === sl
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      -{sl} dB/oct
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-vcf-env">ENV MOD</label>
                  <span className="text-cyan-400 tabular-nums">
                    {patch.vcfEnvMod.toFixed(1)}
                  </span>
                </div>
                <input
                  id="slider-vcf-env"
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={patch.vcfEnvMod}
                  onChange={(e) => updateField('vcfEnvMod', parseFloat(e.target.value))}
                  className="w-full jp8-slider"
                />
              </div>
            </div>

            {/* Key Follow */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <label htmlFor="slider-vcf-kf">VCF KEY FOLLOW (VR16)</label>
                <span className="text-cyan-400 tabular-nums">
                  {Math.round(patch.vcfKeyFollow * 100)}%
                </span>
              </div>
              <input
                id="slider-vcf-kf"
                type="range"
                min={0}
                max={1.2}
                step={0.05}
                value={patch.vcfKeyFollow}
                onChange={(e) => updateField('vcfKeyFollow', parseFloat(e.target.value))}
                className="w-full jp8-slider"
              />
            </div>
          </div>

          {/* Column 4: IR3R01 ENVELOPES (ENV-1 & ENV-2 + 555 PWM Key-Follow) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-emerald-400">
                IR3R01 ADSR & 555 KEY-FOLLOW
              </h3>
              <span className="text-xs font-mono text-slate-500">Pág. 14/16</span>
            </div>

            {/* ENV-1 Attack & Decay */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-env1-a">ENV1 ATT</label>
                  <span className="text-emerald-400 tabular-nums">
                    {patch.env1AttackMs}ms
                  </span>
                </div>
                <input
                  id="slider-env1-a"
                  type="range"
                  min={1}
                  max={2000}
                  step={5}
                  value={patch.env1AttackMs}
                  onChange={(e) =>
                    updateField('env1AttackMs', parseInt(e.target.value, 10))
                  }
                  className="w-full jp8-slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-env1-d">ENV1 DEC</label>
                  <span className="text-emerald-400 tabular-nums">
                    {patch.env1DecayMs}ms
                  </span>
                </div>
                <input
                  id="slider-env1-d"
                  type="range"
                  min={10}
                  max={4000}
                  step={20}
                  value={patch.env1DecayMs}
                  onChange={(e) =>
                    updateField('env1DecayMs', parseInt(e.target.value, 10))
                  }
                  className="w-full jp8-slider"
                />
              </div>
            </div>

            {/* ENV-2 (VCA) ADSR */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-env2-a">ENV2 ATT</label>
                  <span className="text-emerald-400 tabular-nums">
                    {patch.env2AttackMs}ms
                  </span>
                </div>
                <input
                  id="slider-env2-a"
                  type="range"
                  min={1}
                  max={2000}
                  step={5}
                  value={patch.env2AttackMs}
                  onChange={(e) =>
                    updateField('env2AttackMs', parseInt(e.target.value, 10))
                  }
                  className="w-full jp8-slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-env2-r">ENV2 REL</label>
                  <span className="text-emerald-400 tabular-nums">
                    {patch.env2ReleaseMs}ms
                  </span>
                </div>
                <input
                  id="slider-env2-r"
                  type="range"
                  min={20}
                  max={4000}
                  step={20}
                  value={patch.env2ReleaseMs}
                  onChange={(e) =>
                    updateField('env2ReleaseMs', parseInt(e.target.value, 10))
                  }
                  className="w-full jp8-slider"
                />
              </div>
            </div>

            {/* ENV-2 Sustain & LFO Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-env2-s">ENV2 SUS</label>
                  <span className="text-emerald-400 tabular-nums">
                    {Math.round(patch.env2Sustain * 100)}%
                  </span>
                </div>
                <input
                  id="slider-env2-s"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={patch.env2Sustain}
                  onChange={(e) =>
                    updateField('env2Sustain', parseFloat(e.target.value))
                  }
                  className="w-full jp8-slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor="slider-lfo-rate">LFO RATE</label>
                  <span className="text-emerald-400 tabular-nums">
                    {patch.lfoRateHz.toFixed(1)}Hz
                  </span>
                </div>
                <input
                  id="slider-lfo-rate"
                  type="range"
                  min={0.1}
                  max={25}
                  step={0.2}
                  value={patch.lfoRateHz}
                  onChange={(e) =>
                    updateField('lfoRateHz', parseFloat(e.target.value))
                  }
                  className="w-full jp8-slider"
                />
              </div>
            </div>

            {/* 555 Timer Key-Follow Switches (IC50 + 4066 IC37A/39A) */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
              <span className="text-xs font-mono text-slate-400">
                555 PWM KEY-FOLLOW (IC50):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateField('env1KeyFollow', !patch.env1KeyFollow)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    patch.env1KeyFollow
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ENV-1 KF {patch.env1KeyFollow ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('env2KeyFollow', !patch.env2KeyFollow)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    patch.env2KeyFollow
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  ENV-2 KF {patch.env2KeyFollow ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Polyphonic Test Keyboard (SK-361C Matrix Emulation) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              TECLADO SK-361C (Clique ou segure as notas para ouvir o motor de síntese WebAudio)
            </span>
            <span>Matriz de Diodos 1S1588 × 61 (Pág. 18)</span>
          </div>

          <div className="grid grid-cols-12 sm:grid-cols-25 gap-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            {KEYBOARD_NOTES.map((k) => {
              const isPressed = activeNotes.includes(k.midi);
              return (
                <button
                  key={k.midi}
                  type="button"
                  onMouseDown={() => triggerNoteOn(k.midi)}
                  onMouseUp={() => triggerNoteOff(k.midi)}
                  onMouseLeave={() => {
                    if (isPressed) triggerNoteOff(k.midi);
                  }}
                  aria-label={`Tocar nota ${k.label}`}
                  className={`h-20 rounded flex flex-col items-center justify-end pb-2 text-xs font-mono transition-colors select-none ${
                    isPressed
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : k.black
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-200 hover:bg-white text-slate-900'
                  }`}
                >
                  <span>{k.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compu-Tune Mathematical Proof Calculator (Service Notes Page 50 Equations 1 & 2) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="text-xs font-mono text-amber-400 font-semibold">
                Laboratório Matemático Compu-Tune (Página 50 · Upgrade DAC 12-Bit Am6012 → 14-Bit ITS80141)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No boot ou ao pressionar TUNE, a CPU Z80 aplica <code className="text-cyan-300">3.000V (Kn24)</code> e{' '}
                <code className="text-cyan-300">8.000V (Kn84)</code> a cada VCO e mede o desvio em cents pelo timer uPD8253.
                A equação da Pág. 50 calcula o passo real <code className="text-amber-300">W = (8 - 3) / Span</code> e
                corrige cada tecla <code className="text-amber-300">VKn_x = T - W · (84 - Kn_x)</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div>
                <label htmlFor="err-3v" className="block text-xs font-mono text-slate-400">
                  Erro VCO em 3V (Kn24)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="err-3v"
                    type="number"
                    min={-100}
                    max={100}
                    value={errAt3V}
                    onChange={(e) => setErrAt3V(Number(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 tabular-nums"
                  />
                  <span className="text-xs font-mono text-slate-400">cents</span>
                </div>
              </div>

              <div>
                <label htmlFor="err-8v" className="block text-xs font-mono text-slate-400">
                  Erro VCO em 8V (Kn84)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="err-8v"
                    type="number"
                    min={-100}
                    max={100}
                    value={errAt8V}
                    onChange={(e) => setErrAt8V(Number(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 tabular-nums"
                  />
                  <span className="text-xs font-mono text-slate-400">cents</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 font-mono text-xs space-y-0.5 tabular-nums">
                <div className="text-slate-400">
                  Fator W: <strong className="text-amber-400">{compuTuneStats.scaleFactorW} V/semitom</strong>
                </div>
                <div className="text-slate-400">
                  VKn24 Calibrado: <strong className="text-cyan-400">{compuTuneStats.kcvVoltage} V</strong> (Cód. 14-bit: {compuTuneStats.dac14BitCode})
                </div>
                <div className="text-slate-500">
                  Resolução DAC: 12-bit={compuTuneStats.dac12BitStepMv}mV vs 14-bit={compuTuneStats.dac14BitStepMv}mV (~0.7c)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
