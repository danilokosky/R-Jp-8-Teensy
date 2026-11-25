import React, { useState } from 'react';
import {
  JP8Patch,
  OversamplingFactor,
  calculateTeensy41DspBudget,
} from '../utils/jp8DspMath';
import {
  generateTeensy41ProjectFiles,
  FirmwareFileItem,
  LAUNCHKEY_MK4_MAPPINGS,
} from '../utils/jp8TeensyFirmwareGen';
import { buildZipArchive } from '../utils/zipBuilder';
import {
  Cpu,
  Download,
  Copy,
  Check,
  HardDrive,
  GitBranch,
  FolderCode,
  Monitor,
  Sliders,
} from 'lucide-react';
import { HardwareAssemblySchematic } from './HardwareAssemblySchematic';

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
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/main.cpp');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const budget = calculateTeensy41DspBudget(
    targetVoices,
    oversampling,
    enableZdfFilter,
    enableBbdChorus
  );

  const projectFiles = generateTeensy41ProjectFiles(
    patch,
    targetVoices,
    oversampling,
    enableZdfFilter,
    enableBbdChorus
  );

  const activeFile: FirmwareFileItem =
    projectFiles.find((f) => f.path === selectedFilePath) || projectFiles[0];

  const handleCopyActiveFile = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadFullProjectZip = () => {
    const zipBytes = buildZipArchive(
      projectFiles.map((f) => ({
        path: f.path,
        content: f.content,
      }))
    );
    const copyBuffer = new Uint8Array(zipBytes.length);
    copyBuffer.set(zipBytes);
    const blob = new Blob([copyBuffer.buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jp8-teensy41-${patch.id}-trs-midi.zip`;
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
            Stack Operável Completo · Teensy 4.1 + MIDI Padrão TRS (P2/P1 Type-A) + PCM5102A + Display ILI9341
          </p>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            03. Hardware Definitivo, Conexão MIDI TRS (P2/P1) &amp; Firmware C++17
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Substituímos o MIDI por USB pelo{' '}
            <strong className="text-slate-200">MIDI Padrão Serial (31.250 bps) via conector tipo pino P2/P1 (TRS 3.5mm / 2.5mm Type-A)</strong>{' '}
            conectado na UART <code className="text-cyan-300">Serial1 (RX1=Pino 0, TX1=Pino 1)</code> do Teensy 4.1 — ligando um cabo P2-P2 estéreo direto na saída{' '}
            <code className="text-amber-300">MIDI Out</code> do <strong className="text-slate-200">Novation Launchkey MK4</strong> com isolamento óptico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyActiveFile}
            className="px-3.5 py-2 text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Arquivo Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar {activeFile.label}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadFullProjectZip}
            data-testid="download-teensy-zip"
            className="px-4 py-2 text-xs font-mono font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Projeto Completo (.zip)</span>
          </button>
        </div>
      </div>

      {/* Ideal Hardware Selection Matrix (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. MCU Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">01. PLACA MCU IDEAL</span>
            <span className="text-slate-400">600 MHz Cortex-M7</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            PJRC Teensy 4.1
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Equipada com FPU de 64 bits, UART <strong className="text-amber-300">Serial1 com FIFO dedicado de hardware</strong> para leitura MIDI a 31.250 bps com zero jitter, slot <strong className="text-amber-300">MicroSD SDIO</strong> para bancos de patches e pads para 8MB/16MB de PSRAM.
          </p>
          <div className="pt-1 text-xs font-mono text-slate-400">
            FPU 64-bit · 1024KB RAM · 8MB Flash
          </div>
        </div>

        {/* 2. Audio Output DAC */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold">02. SAÍDA DE ÁUDIO IDEAL</span>
            <span className="text-slate-400">112 dB SNR · 32-Bit</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            DAC I2S PCM5102A (GY-PCM5102)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Melhor custo-benefício e faixa dinâmica (<strong className="text-cyan-300">112 dB SNR vs 100 dB do SGTL5000</strong>). Gera seu próprio clock interno a partir do BCLK (dispensa pino MCLK e barramento I2C) e entrega <strong className="text-cyan-300">2.1V RMS Line-Out</strong> em jack P2 integrado.
          </p>
          <div className="pt-1 text-xs font-mono text-cyan-300">
            BCLK=21 · LRCLK=20 · DIN=7 · SCK=GND
          </div>
        </div>

        {/* 3. Display Screen */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">03. TELA / DISPLAY IDEAL</span>
            <span className="text-slate-400">320×240 SPI DMA</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            IPS TFT 2.8&quot; / 3.2&quot; ILI9341
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tela colorida <strong className="text-emerald-300">320×240 SPI (ILI9341_t3)</strong> que mostra os 8 LEDs de vozes (<code className="text-slate-100">A..H</code>), o contador de pacotes MIDI TRS (<code className="text-slate-100">TRS RX1</code>), o osciloscópio em tempo real e o parâmetro movido no Launchkey.
          </p>
          <div className="pt-1 text-xs font-mono text-emerald-300">
            CS=10 · DC=9 · RST=8 · MOSI=11 · SCK=13
          </div>
        </div>

        {/* 4. TRS MIDI Standard Interface */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">04. MIDI PADRÃO TRS (P2/P1)</span>
            <span className="text-cyan-300">Type-A · 31.250 bps</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            TRS 3.5mm / P1 + Opto 6N138
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            O Launchkey MK4 possui saída <strong className="text-amber-300">MIDI Out em jack TRS Type-A</strong>. Com um conector fêmea P2 (3.5mm) ou P1 (2.5mm) + optoacoplador <strong className="text-amber-300">6N138</strong> no <code className="text-cyan-300">Pino 0 (RX1)</code> e saída Thru no <code className="text-cyan-300">Pino 1 (TX1)</code>, você usa um cabo P2-P2 estéreo comum com isolamento total de ruído!
          </p>
          <div className="pt-1 text-xs font-mono text-amber-300">
            Tip=Sink(5) · Ring=Source(4) · RX1=0 · TX1=1
          </div>
        </div>
      </div>

      {/* Complete Interactive Wiring Schematic & Point-to-Point Netlist */}
      <HardwareAssemblySchematic />

      {/* Novation Launchkey MK4 Complete Hardware Mapping & Simulated ILI9341 TFT Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Launchkey MK4 Plug & Play CC/Pad Mapping Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Mapa Oficial via TRS MIDI (31.250 bps): Launchkey MK4 → Roland Jupiter-8
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              Serial1 (RX1=Pino 0 / TX1=Pino 1)
            </span>
          </div>

          <div className="overflow-x-auto max-h-[340px]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3">Controle Launchkey MK4</th>
                  <th className="py-2 px-2">MIDI</th>
                  <th className="py-2 px-3">Parâmetro Jupiter-8</th>
                  <th className="py-2 pl-2">Faixa / Circuito Original</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300 tabular-nums">
                {LAUNCHKEY_MK4_MAPPINGS.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/60">
                    <td className="py-2 pr-3 text-amber-400 font-semibold whitespace-nowrap">
                      {m.hardwareControl}
                    </td>
                    <td className="py-2 px-2 text-cyan-300 whitespace-nowrap">
                      {m.midiMessage}
                    </td>
                    <td className="py-2 px-3 text-slate-100">
                      {m.jp8Parameter}
                    </td>
                    <td className="py-2 pl-2 text-slate-400">
                      {m.rangeDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Live Preview of the 2.8" ILI9341 320x240 TFT Screen rendered by main.cpp */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Preview da Tela IPS 2.8&quot; ILI9341 (320×240 SPI)
            </h3>
            <span className="text-xs font-mono text-slate-400">drawJupiterDashboard()</span>
          </div>

          {/* 320x240 Simulated Hardware TFT Screen */}
          <div className="bg-[#04060A] border-2 border-slate-700 rounded-lg p-3.5 font-mono text-xs space-y-3 shadow-inner">
            <div className="bg-slate-900 border-b border-amber-500 px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-amber-400 font-bold text-[11px]">
                ROLAND JP-8 // TEENSY 4.1 [TRS 3.5mm MIDI TYPE-A]
              </span>
              <span className="text-cyan-300 text-[10px] tabular-nums">
                CPU: {budget.cpuLoadPercentAt44k1}%
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-red-500 font-bold text-base tracking-wider">
                  P1
                </span>
                <span className="text-slate-100 font-bold truncate">
                  {patch.name}
                </span>
              </div>
              <span className="text-amber-400 text-[11px]">
                {patch.keyAssignMode}
              </span>
            </div>

            {/* 8 Voice Boxes A..H */}
            <div className="grid grid-cols-8 gap-1">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((v, i) => (
                <div
                  key={v}
                  className={`py-1 text-center rounded text-[11px] font-bold border ${
                    i < 4
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {v}
                </div>
              ))}
            </div>

            {/* Telemetry Readout synced with active patch */}
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2.5 space-y-1 text-[11px] text-cyan-300 tabular-nums">
              <div className="flex justify-between">
                <span>IR3109 CUT: {patch.vcfCutoffHz}Hz</span>
                <span>RES: {patch.vcfResonance.toFixed(1)}</span>
                <span>SLOPE: -{patch.vcfSlope}dB</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ENV MOD: {patch.vcfEnvMod.toFixed(1)}</span>
                <span>HPF: {patch.hpfCutoffHz}Hz</span>
                <span>LFO: {patch.lfoRateHz.toFixed(1)}Hz</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>X-MOD: {patch.vco1CrossMod.toFixed(1)}</span>
                <span>DETUNE: {patch.vco2Fine > 0 ? `+${patch.vco2Fine}` : patch.vco2Fine}c</span>
                <span>SYNC: {patch.vco2Sync ? 'ON' : 'OFF'}</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>
                  ENV2 A:{(patch.env2AttackMs / 1000).toFixed(2)}s D:{(patch.env2DecayMs / 1000).toFixed(2)}s S:{Math.round(patch.env2Sustain * 100)}% R:{(patch.env2ReleaseMs / 1000).toFixed(2)}s
                </span>
                <span>MIX:{patch.sourceMix * 10}%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            O código de renderização acima já está incluído em{' '}
            <code className="text-slate-200">src/main.cpp</code> rodando a 25 FPS no loop
            principal sem bloquear a interrupção I2S de áudio nem a porta USB Host do
            Launchkey MK4.
          </p>
        </div>
      </div>

      {/* GitHub Cloud Compilation Workflow Architecture Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100">
              Pipeline GitHub Actions Pronto para Compilar seu .HEX na Nuvem
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Toolchain: gcc-arm-none-eabi + USBHost_t36 + ILI9341_t3 + Teensy Audio
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-amber-400 font-semibold">
              01. Exportar &amp; Subir
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Baixe o pacote <code className="text-slate-100">.zip</code> acima e faça{' '}
              <code className="text-cyan-300">git push</code> para um repositório no GitHub com{' '}
              <code className="text-slate-200">platformio.ini</code> e{' '}
              <code className="text-slate-200">.github/workflows/</code>.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-cyan-400 font-semibold">
              02. Teste DSP &amp; Launchkey (CI)
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O Job 1 executa <code className="text-cyan-300">g++ -std=c++17 -Werror</code> em{' '}
              <code className="text-slate-200">test_jp8_dsp_native.cpp</code>, validando o DSP,
              Sustain Pedal, Pitch Bend e os CCs do Launchkey MK4.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-emerald-400 font-semibold">
              03. Build PlatformIO (.hex)
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O Job 2 roda <code className="text-emerald-300">pio run -e teensy41</code> no
              Ubuntu Linux, linkando <code className="text-slate-100">USBHost_t36</code> e{' '}
              <code className="text-slate-100">ILI9341_t3</code> e gerando{' '}
              <code className="text-slate-100">firmware.hex</code>.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-slate-200 font-semibold">
              04. Baixar Artifact &amp; Tocar
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Grave o <code className="text-amber-300">firmware.hex</code> no Teensy 4.1 via
              Teensy Loader, plugue o Launchkey MK4 no USB Host e toque imediatamente!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Cortex-M7 Cycle Budget & Complete Source Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: DSP Engine Configuration, Cycle Budget & Pinout */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Parâmetros de Compilação (platformio.ini)
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                ● {budget.canRunAt600MHz ? 'Real-Time Nominal' : '▲ Sobrecarga'}
              </span>
            </div>

            {/* Polyphony Voices Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <label htmlFor="teensy-voices">JP8_MAX_VOICES (POLIFONIA)</label>
                <span className="text-amber-400 tabular-nums">
                  {targetVoices} Vozes ({targetVoices * 2} VCOs)
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
                <span>16 Vozes (Dual)</span>
              </div>
            </div>

            {/* Internal Oversampling Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span>JP8_OVERSAMPLE (DSP INTERNO)</span>
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
                  JP8_USE_ZDF={enableZdfFilter ? '1' : '0'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {enableZdfFilter ? 'IR3109 4-Stage Tanh ZDF' : 'Chamberlin Linear SVF'}
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
                  JP8_STEREO_PAN={enableBbdChorus ? '1' : '0'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {enableBbdChorus ? 'Panning Upper/Lower A..H' : 'Saída Mono (Panel B)'}
                </div>
              </button>
            </div>

            {/* Resource Telemetry Cards */}
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
                  {budget.totalCyclesPerSample} / 13605 ciclos
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
                  Zero Wait-State TCM
                </div>
              </div>
            </div>
          </div>

          {/* Hardware BOM & Teensy 4.1 Pinout Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Pinagem Completa (Teensy 4.1 + TRS P2/P1 MIDI + PCM5102A + ILI9341)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-2">Módulo</th>
                    <th className="py-2 px-2">Função</th>
                    <th className="py-2 pl-2">Pinos Teensy 4.1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 tabular-nums">
                  <tr>
                    <td className="py-2 pr-2 text-amber-400 font-semibold">TRS MIDI IN (P2/P1)</td>
                    <td className="py-2 px-2">Type-A (Ring→220Ω→6N138, Tip→6N138)</td>
                    <td className="py-2 pl-2 text-cyan-300">Pino 0 (RX1 @ 31.250 bps)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400 font-semibold">TRS MIDI OUT/THRU</td>
                    <td className="py-2 px-2">Type-A (Tip←33Ω←TX1, Ring←10Ω←3.3V)</td>
                    <td className="py-2 pl-2 text-cyan-300">Pino 1 (TX1 @ 31.250 bps)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">DAC PCM5102A</td>
                    <td className="py-2 px-2">Saída I2S 32-Bit Stereo (SCK=GND)</td>
                    <td className="py-2 pl-2 text-cyan-300">BCLK=21, LRCLK=20, DIN=7</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">Tela ILI9341</td>
                    <td className="py-2 px-2">Display TFT 320×240 SPI</td>
                    <td className="py-2 pl-2 text-cyan-300">CS=10, DC=9, RST=8, MOSI=11, SCK=13</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">Botão TUNE</td>
                    <td className="py-2 px-2">Compu-Tune Físico (Opc.)</td>
                    <td className="py-2 pl-2 text-cyan-300">Pino 6 (INPUT_PULLUP)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Complete Compilable Repository File Explorer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FolderCode className="w-4 h-4 text-amber-400" />
              Explorador de Arquivos do Firmware ({projectFiles.length} arquivos)
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Preset embutido: &quot;{patch.name}&quot;
            </span>
          </div>

          {/* File Selector Tabs */}
          <div
            role="tablist"
            aria-label="Arquivos do Projeto PlatformIO Teensy 4.1"
            className="flex flex-wrap gap-1.5"
          >
            {projectFiles.map((file) => {
              const isSelected = file.path === activeFile.path;
              return (
                <button
                  key={file.path}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  {file.label}
                </button>
              );
            })}
          </div>

          {/* Active File Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs">
            <span className="font-mono text-cyan-300">{activeFile.path}</span>
            <span className="text-slate-400">{activeFile.summary}</span>
          </div>

          {/* Active File Source Code */}
          <pre
            data-testid="teensy-cpp-code"
            className="flex-1 bg-[#05070B] border border-slate-800 rounded-lg p-4 text-xs font-mono text-emerald-300 overflow-auto max-h-[540px] leading-relaxed"
          >
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
