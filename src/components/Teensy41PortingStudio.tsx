import React, { useState } from 'react';
import {
  JP8Patch,
  OversamplingFactor,
  calculateTeensy41DspBudget,
} from '../utils/jp8DspMath';
import { generateTeensy41CppCode } from '../utils/jp8SchematicData';
import { Cpu, Download, Copy, Check, HardDrive, Layers } from 'lucide-react';

interface Teensy41PortingStudioProps {
  patch: JP8Patch;
}

export const Teensy41PortingStudio: React.FC<Teensy41PortingStudioProps> = ({
  patch,
}) => {
  const [targetVoices, setTargetVoices] = useState<number>(8);
  const [oversampling, setOversampling] = useState<OversamplingFactor>(2);
  const [enableZdfFilter, setEnableZdfFilter] = useState<boolean>(true);
  const [enableBbdChorus, setEnableBbdChorus] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const budget = calculateTeensy41DspBudget(
    targetVoices,
    oversampling,
    enableZdfFilter,
    enableBbdChorus
  );

  const generatedCpp = generateTeensy41CppCode(
    patch,
    targetVoices,
    oversampling,
    enableZdfFilter
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCpp);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadHeader = () => {
    const blob = new Blob([generatedCpp], { type: 'text/plain;charset=utf-8' });
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
    <section id="teensy-porting" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <p className="text-xs font-mono text-emerald-400">
            NXP i.MX RT1062 · ARM Cortex-M7 @ 600 MHz · FPU Dual-Issue Float32/64
          </p>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            03. Viabilidade, Arquitetura de Hardware & Motor C++ para Teensy 4.1
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Sim: o Teensy 4.1 é capaz de rodar uma réplica completa de 8 vozes (16 VCOs)
            do Roland Jupiter-8 com oversampling 2x (88.2 kHz), filtro ZDF TPT modelando
            os 4 estágios OTA do IR3109 e matriz Compu-Tune consumindo apenas ~28% da CPU.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3.5 py-2 text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Código C++ Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Header C++</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadHeader}
            className="px-4 py-2 text-xs font-mono font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar AudioSynthJupiter8.h</span>
          </button>
        </div>
      </div>

      {/* Interactive Cortex-M7 Cycle Budget & Memory Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: DSP Engine Configuration & Live Resource Metrics */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Calculadora de Carga DSP (Cortex-M7 @ 600 MHz)
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              ● {budget.canRunAt600MHz ? 'Real-Time Nominal' : '▲ Sobrecarga'}
            </span>
          </div>

          {/* Polyphony Voices Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <label htmlFor="teensy-voices">POLIFONIA ALVO (VOZES / VCOs)</label>
              <span className="text-amber-400 tabular-nums">
                {targetVoices} Vozes ({targetVoices * 2} VCOs + {targetVoices * 2} IR3R01 ENVs)
              </span>
            </div>
            <input
              id="teensy-voices"
              type="range"
              min={4}
              max={16}
              step={2}
              value={targetVoices}
              onChange={(e) => setTargetVoices(parseInt(e.target.value, 10))}
              className="w-full jp8-slider"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
              <span>4 Vozes (JP-4)</span>
              <span>8 Vozes (JP-8 Original)</span>
              <span>16 Vozes (Dual/Split)</span>
            </div>
          </div>

          {/* Internal Oversampling Selector */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span>OVERSAMPLING INTERNO (VCO Hard-Sync/X-MOD + IR3109)</span>
              <span className="text-cyan-400 tabular-nums">
                {oversampling}x ({(44.1 * oversampling).toFixed(1)} kHz)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {([1, 2, 4] as OversamplingFactor[]).map((os) => (
                <button
                  key={os}
                  type="button"
                  onClick={() => setOversampling(os)}
                  className={`py-1.5 text-xs font-mono rounded transition-colors ${
                    oversampling === os
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {os}x ({(44.1 * os).toFixed(1)} kHz)
                </button>
              ))}
            </div>
          </div>

          {/* Toggles for Non-Linear OTA Tanh ZDF & Stereo Ensemble */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setEnableZdfFilter(!enableZdfFilter)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                enableZdfFilter
                  ? 'bg-slate-950 border-amber-500/70 text-slate-100'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-mono font-bold text-amber-400">
                IR3109 4-Stage Tanh ZDF
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {enableZdfFilter ? 'Ativo (Padé Tanh por polo)' : 'Linear Chamberlin SVF'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEnableBbdChorus(!enableBbdChorus)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                enableBbdChorus
                  ? 'bg-slate-950 border-cyan-500/70 text-slate-100'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-mono font-bold text-cyan-400">
                Dual Stereo Split / Pan
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {enableBbdChorus ? 'Upper/Lower Stereo Balance' : 'Mono Sum (Panel B)'}
              </div>
            </button>
          </div>

          {/* Resource Telemetry Cards (Follows Science Reference Metric Display Spec) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs tracking-wider uppercase text-slate-400 font-mono">
                CARGA DE CPU (600 MHZ)
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                  {budget.cpuLoadPercentAt44k1}
                </span>
                <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                  % @ 44.1 kHz
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1 tabular-nums">
                {budget.totalCyclesPerSample} / 13605 ciclos/amostra
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs tracking-wider uppercase text-slate-400 font-mono">
                USO DE RAM1 (DTCM 512KB)
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                  {(budget.sramBytesUsed / 1024).toFixed(1)}
                </span>
                <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                  KB ({budget.sramPercentOfDTCM}%)
                </span>
              </div>
              <div className="text-xs font-mono text-cyan-400 mt-1 tabular-nums">
                Zero Wait-State TCM Access
              </div>
            </div>
          </div>

          {/* Cycle Breakdown Bars */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>16x VCO PolyBLEP + Hard Sync + X-MOD:</span>
              <span className="text-amber-400 tabular-nums">{budget.vcoCycles} ciclos</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>8x HPF + IR3109 4-Pole OTA ZDF VCF:</span>
              <span className="text-cyan-400 tabular-nums">{budget.vcfCycles} ciclos</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>16x IR3R01 Envelopes + 555 KF + BA662 VCA:</span>
              <span className="text-emerald-400 tabular-nums">{budget.envLfoCycles} ciclos</span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Hardware Pinout Map & Generated C++ Header */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Hardware BOM & Teensy 4.1 Pinout Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Topologia de Hardware Recomendada para a Réplica no Teensy 4.1
              </h3>
              <span className="text-xs font-mono text-slate-400">I2S1 + SPI + 3x CD74HC4067</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3">Subsistema JP-8 Original</th>
                    <th className="py-2 px-3">Equivalente Teensy 4.1</th>
                    <th className="py-2 pl-3">Pinos Teensy 4.1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 tabular-nums">
                  <tr>
                    <td className="py-2 pr-3 text-amber-400">
                      Panel B Balanced Upper/Lower Out (Pág. 25)
                    </td>
                    <td className="py-2 px-3">
                      PCM5102A 32-bit DAC ou Teensy Audio Shield SGTL5000 (24-bit)
                    </td>
                    <td className="py-2 pl-3 text-cyan-300">
                      BCLK=21, LRCLK=20, TX=7, MCLK=23
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-amber-400">
                      Panel C & D (24 Sliders Analógicos + 3x 4051 Pág. 21)
                    </td>
                    <td className="py-2 px-3">
                      2x Multiplexadores 16-Ch CD74HC4067 + Filtro EMA 8-bit S/H
                    </td>
                    <td className="py-2 pl-3 text-cyan-300">
                      S0..S3 = Pinos 2,3,4,5 | ADC = A0 (14), A1 (15)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-amber-400">
                      DCB (Digital Comm Bus uPD8251 Pág. 53) & Teclado SK-361C
                    </td>
                    <td className="py-2 px-3">
                      USB Host MIDI Nativo + Serial1 DIN MIDI (Opto 6N138)
                    </td>
                    <td className="py-2 pl-3 text-cyan-300">
                      USB Host 5-Pin Header / RX1 = Pino 0
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-amber-400">
                      Panel F 7-Segment LED + 40 Botões KHC11901 (Pág. 26)
                    </td>
                    <td className="py-2 px-3">
                      Display OLED SSD1306/ILI9341 SPI + 3x Shift Registers 74HC165
                    </td>
                    <td className="py-2 pl-3 text-cyan-300">
                      MOSI=11, SCK=13, CS=10, DC=9
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-amber-400">
                      CMOS RAM uPD444C (64 Patches + Cassette FSK Pág. 9)
                    </td>
                    <td className="py-2 px-3">
                      Slot MicroSD Nativo SDIO (Bancos SysEx/JSON ilimitados)
                    </td>
                    <td className="py-2 pl-3 text-cyan-300">
                      BUILTIN_SDCARD (SDIO 4-bit)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live C++ Firmware Code Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                AudioSynthJupiter8.h — Sincronizado com o Patch &quot;{patch.name}&quot;
              </span>
              <span className="text-slate-400">Teensyduino / PlatformIO C++17</span>
            </div>
            <pre
              data-testid="teensy-cpp-code"
              className="bg-[#05070B] border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[290px] leading-relaxed"
            >
              <code>{generatedCpp}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
