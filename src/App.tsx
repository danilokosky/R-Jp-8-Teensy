/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JP8Patch } from './utils/jp8DspMath';
import { JP8_FACTORY_PATCHES, generateTeensy41CppCode } from './utils/jp8SchematicData';
import { JP8SchematicExplorer } from './components/JP8SchematicExplorer';
import { JP8SynthConsole } from './components/JP8SynthConsole';
import { Teensy41PortingStudio } from './components/Teensy41PortingStudio';

export default function App() {
  const [activePatch, setActivePatch] = useState<JP8Patch>(JP8_FACTORY_PATCHES[0]);

  const handleQuickExportCpp = () => {
    const cpp = generateTeensy41CppCode(activePatch, 8, 2, true);
    const blob = new Blob([cpp], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AudioSynthJupiter8.h';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0E17]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          JP-8 Teensy 4.1 DSP Lab
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Navegação Principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#schematic-analysis"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Esquema Eletrônico
          </a>
          <a
            href="#synth-console"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Motor de Áudio
          </a>
          <a
            href="#teensy-porting"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Arquitetura Teensy
          </a>
          <a
            href="/assets/aistudio/RolandJupiter8-ServiceNotes_c_pia_c414149a.pdf"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Service Notes PDF
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleQuickExportCpp}
            className="px-4 py-2 text-xs font-medium text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 font-semibold"
          >
            Exportar C++ Teensy
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-[1380px] w-full mx-auto px-6 py-8 space-y-12">
        {/* Hero Technical Overview Banner */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <span className="text-amber-400 font-semibold">
                  Roland Jupiter-8 (JP-8) Service Notes
                </span>
                <span>·</span>
                <span>2ª Edição (Dezembro 1982 · SN 171700+)</span>
                <span>·</span>
                <span>Target MCU: Teensy 4.1 (Cortex-M7 @ 600 MHz)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                Análise Estrutural do Esquema & Réplica Aplicável do Motor de Áudio
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                Estudo completo das 60 páginas do manual de serviço original do Roland
                Jupiter-8, traduzindo cada subcircuito analógico e digital — os 16 VCOs
                discretos com BA662 Cross-Modulation, o filtro cascata OTA{' '}
                <strong className="text-cyan-300">IR3109</strong> (-12dB/-24dB), os
                envelopes <strong className="text-emerald-300">IR3R01</strong> modulados
                por PWM de timer 555 e o sistema <strong className="text-amber-300">Compu-Tune</strong>{' '}
                de 14 bits (<strong className="text-amber-300">ITS80141</strong>) — para
                uma arquitetura DSP de ponto flutuante pronta para rodar no Teensy 4.1.
              </p>
            </div>

            {/* Key Engineering Specs Summary Grid */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">ARQUITETURA DE VOZ</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5 tabular-nums">
                  8 Vozes / 16 VCOs
                </div>
                <div className="text-xs text-slate-500">4 Placas OPH124 (AB..GH)</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">FILTRO & VCA</div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5 tabular-nums">
                  IR3109 + BA662A
                </div>
                <div className="text-xs text-slate-500">HPF 6dB + LPF 12/24dB</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">DAC KCV (SN 171700+)</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
                  14-Bit ITS80141
                </div>
                <div className="text-xs text-slate-500">0.61 mV / 0.7 cents res.</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">CARGA TEENSY 4.1</div>
                <div className="text-lg font-bold text-slate-100 mt-0.5 tabular-nums">
                  ~28.4% @ 88.2kHz
                </div>
                <div className="text-xs text-slate-500">Oversampling 2x + ZDF</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Deep Schematic Analysis & Original PDF Viewer */}
        <JP8SchematicExplorer />

        {/* Section 2: Interactive Polyphonic JP-8 Synthesizer & Compu-Tune Lab */}
        <JP8SynthConsole patch={activePatch} onChangePatch={setActivePatch} />

        {/* Section 3: Teensy 4.1 Hardware & C++ AudioStream Code Generator */}
        <Teensy41PortingStudio patch={activePatch} />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-800/80 bg-[#05070B] px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          Baseado no documento técnico Roland JP-8 Service Notes (Second Edition, Dezembro 1982, BB-2).
        </div>
        <div className="font-mono">
          Teensy 4.1 Audio Library (AudioStream · I2S 44.1kHz / 88.2kHz Internal Oversampling)
        </div>
      </footer>
    </div>
  );
}
