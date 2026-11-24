import React, { useState } from 'react';
import {
  JP8Patch,
  OversamplingFactor,
  calculateTeensy41DspBudget,
} from '../utils/jp8DspMath';
import {
  generateTeensy41ProjectFiles,
  FirmwareFileItem,
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
} from 'lucide-react';

interface Teensy41PortingStudioProps {
  patch: JP8Patch;
  onExportStateChange?: {
    voices: number;
    oversampling: OversamplingFactor;
    zdf: boolean;
    stereoSplit: boolean;
  };
}

export const Teensy41PortingStudio: React.FC<Teensy41PortingStudioProps> = ({
  patch,
}) => {
  const [targetVoices, setTargetVoices] = useState<number>(8);
  const [oversampling, setOversampling] = useState<OversamplingFactor>(2);
  const [enableZdfFilter, setEnableZdfFilter] = useState<boolean>(true);
  const [enableBbdChorus, setEnableBbdChorus] = useState<boolean>(true);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    '.github/workflows/build-teensy41.yml'
  );
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
        path: `jp8-teensy41-firmware/${f.path}`,
        content: f.content,
      }))
    );
    const copyBuffer = new Uint8Array(zipBytes.length);
    copyBuffer.set(zipBytes);
    const blob = new Blob([copyBuffer.buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jp8-teensy41-${patch.id}-platformio-github.zip`;
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
            PlatformIO + GitHub Actions CI · Compilação Automática ARM Cortex-M7 (.hex)
          </p>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            03. Projeto Compilável Teensy 4.1 & Pipeline GitHub Actions
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Sim: você pode compilar este firmware para o Teensy 4.1 diretamente na nuvem
            pelo GitHub usando <strong className="text-slate-200">GitHub Actions + PlatformIO CLI</strong>.
            A cada <code className="text-cyan-300">git push</code>, o servidor valida o núcleo DSP C++17 com{' '}
            <code className="text-amber-300">g++ -Werror</code> e gera o arquivo{' '}
            <code className="text-emerald-300">firmware.hex</code> pronto para gravar na placa.
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

      {/* GitHub Cloud Compilation Workflow Architecture Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100">
              Como Compilar Diretamente no GitHub (Sem IDE Local)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Toolchain: gcc-arm-none-eabi + framework-arduinoteensy + Teensy Audio
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-amber-400 font-semibold">
              01. Exportar & Subir
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Baixe o pacote <code className="text-slate-100">.zip</code> ao lado e faça{' '}
              <code className="text-cyan-300">git push</code> para um repositório no GitHub com{' '}
              <code className="text-slate-200">platformio.ini</code> e{' '}
              <code className="text-slate-200">.github/workflows/</code>.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-cyan-400 font-semibold">
              02. Teste DSP Nativo (CI)
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O Job 1 executa <code className="text-cyan-300">g++ -std=c++17 -Werror</code> em{' '}
              <code className="text-slate-200">test_jp8_dsp_native.cpp</code>, validando os
              osciladores PolyBLEP, IR3109 ZDF e Compu-Tune antes do build ARM.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-emerald-400 font-semibold">
              03. Build PlatformIO (.hex)
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O Job 2 roda <code className="text-emerald-300">pio run -e teensy41</code> no
              Ubuntu Linux, gera <code className="text-slate-100">firmware.hex</code> e mede o
              uso exato de Flash e RAM1 (DTCM).
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs font-mono text-slate-200 font-semibold">
              04. Baixar Artifact & Gravar
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Na aba <strong>Actions</strong> do GitHub, baixe o Artifact com o{' '}
              <code className="text-amber-300">firmware.hex</code> e grave direto no Teensy 4.1
              pelo <strong>Teensy Loader</strong>.
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
                Mapeamento Físico de Pinos (Teensy 4.1)
              </h3>
              <span className="text-xs font-mono text-slate-400">I2S1 + MIDI + MUX</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-2">Bloco JP-8</th>
                    <th className="py-2 px-2">Hardware Teensy</th>
                    <th className="py-2 pl-2">Pinos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 tabular-nums">
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">Audio Out (Panel B)</td>
                    <td className="py-2 px-2">PCM5102A / SGTL5000 I2S</td>
                    <td className="py-2 pl-2 text-cyan-300">21, 20, 7, 23</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">Sliders (Panel C/D)</td>
                    <td className="py-2 px-2">CD74HC4067 MUX</td>
                    <td className="py-2 pl-2 text-cyan-300">2, 3, 4, 5 + A0</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">MIDI / DCB</td>
                    <td className="py-2 px-2">USB Host + Opto 6N138</td>
                    <td className="py-2 pl-2 text-cyan-300">USB / RX1 (0)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-amber-400">Botão TUNE</td>
                    <td className="py-2 px-2">Chave Momentânea</td>
                    <td className="py-2 pl-2 text-cyan-300">Pino 6 (GND)</td>
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
