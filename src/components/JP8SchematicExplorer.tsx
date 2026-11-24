import React, { useState } from 'react';
import {
  JP8_SCHEMATIC_SUBCIRCUITS,
  SchematicSubcircuit,
} from '../utils/jp8SchematicData';
import { FileText, Cpu, Sliders, ExternalLink } from 'lucide-react';

interface JP8SchematicExplorerProps {
  onOpenPdfAtPage?: (page: number) => void;
}

export const JP8SchematicExplorer: React.FC<JP8SchematicExplorerProps> = () => {
  const [selectedId, setSelectedId] = useState<string>(JP8_SCHEMATIC_SUBCIRCUITS[0].id);
  const [pdfPage, setPdfPage] = useState<number>(15);
  const [showPdfDrawer, setShowPdfDrawer] = useState<boolean>(false);

  const activeSubcircuit: SchematicSubcircuit =
    JP8_SCHEMATIC_SUBCIRCUITS.find((s) => s.id === selectedId) ||
    JP8_SCHEMATIC_SUBCIRCUITS[0];

  const handleJumpToPage = (page: number) => {
    setPdfPage(page);
    setShowPdfDrawer(true);
  };

  return (
    <section id="schematic-analysis" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <p className="text-xs font-mono text-amber-400">
            Roland Service Notes · Second Edition (Dec. 1982 · SN 171700 & Above)
          </p>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            01. Engenharia Reversa Profunda do Esquema Eletrônico
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Inspeção completa das 5 placas principais do Jupiter-8 (Module Board OPH124,
            Module Controller OPH123A, Interface Board OPH122A de 14 bits e CPU Board Z80
            OPH121) com equações de calibração e topologia DSP equivalente para o Teensy 4.1.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPdfDrawer(!showPdfDrawer)}
            className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            {showPdfDrawer ? 'Ocultar Service Manual PDF' : 'Inspecionar PDF Original (Pág. ' + pdfPage + ')'}
          </button>
          <a
            href={`/assets/aistudio/RolandJupiter8-ServiceNotes_c_pia_c414149a.pdf#page=${pdfPage}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Abrir PDF</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Interactive Signal Flow Pipeline Selector */}
      <div
        role="tablist"
        aria-label="Blocos do Esquema Eletrônico do Roland Jupiter-8"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
      >
        {JP8_SCHEMATIC_SUBCIRCUITS.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedId(item.id);
                setPdfPage(item.pdfPages[0]);
              }}
              className={`text-left p-3.5 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/80 text-slate-100'
                  : 'bg-slate-900/40 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono mb-1.5">
                <span className={`whitespace-nowrap shrink-0 ${isSelected ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                  {item.boardName.split(' ')[0]}
                </span>
                <span className="text-slate-500 truncate">
                  Pág. {item.pdfPages.slice(0, 3).join(', ')}{item.pdfPages.length > 3 ? '…' : ''}
                </span>
              </div>
              <div className="text-xs font-semibold leading-snug text-slate-100 line-clamp-2">
                {item.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional Embedded Original Service Manual PDF Viewer */}
      {showPdfDrawer && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300 font-mono">
              Visualizando: <strong className="text-amber-400">RolandJupiter8-ServiceNotes.pdf</strong> · Página {pdfPage} de 60
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Pág. 1: Specs', page: 1 },
                { label: 'Pág. 6: Block Diagram', page: 6 },
                { label: 'Pág. 9-10: CPU Board Z80', page: 9 },
                { label: 'Pág. 13-14: MOD CON Board', page: 13 },
                { label: 'Pág. 15: VCO-1/2 Schematic', page: 15 },
                { label: 'Pág. 16: IR3109 VCF & IR3R01 ENV', page: 16 },
                { label: 'Pág. 19-20: 12-Bit DAC S/H', page: 19 },
                { label: 'Pág. 43-44: 14-Bit DAC ITS80141', page: 43 },
                { label: 'Pág. 50: Compu-Tune Math', page: 50 },
              ].map((shortcut) => (
                <button
                  key={shortcut.page}
                  type="button"
                  onClick={() => setPdfPage(shortcut.page)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                    pdfPage === shortcut.page
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>
          <iframe
            key={pdfPage}
            src={`/assets/aistudio/RolandJupiter8-ServiceNotes_c_pia_c414149a.pdf#page=${pdfPage}`}
            title={`Roland Jupiter-8 Service Notes Page ${pdfPage}`}
            className="w-full h-[460px] rounded border border-slate-800 bg-slate-950"
          />
        </div>
      )}

      {/* Detailed Hardware & DSP Porting Breakdown Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-amber-400 font-semibold">{activeSubcircuit.boardName}</span>
              <span>·</span>
              <span>{activeSubcircuit.pcbCode}</span>
              <span>·</span>
              <span>Barramentos: {activeSubcircuit.voltageRails}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-1">
              {activeSubcircuit.title}
            </h3>
            <p className="text-sm text-slate-300 mt-1">{activeSubcircuit.signalRole}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono text-slate-400 mr-1">Páginas no PDF:</span>
            {activeSubcircuit.pdfPages.map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => handleJumpToPage(pg)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0"
              >
                Pág. {pg}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Left 7 Cols: Analog Circuit Analysis & Calibration Specs */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Análise Eletrônica Detalhada do Circuito Original
            </h4>

            <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
              {activeSubcircuit.circuitAnalysis.map((point, idx) => (
                <li
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3"
                >
                  {point}
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                <div className="text-xs font-mono text-slate-400 mb-1.5">
                  Semicondutores & CIs Críticos
                </div>
                <ul className="space-y-1 text-xs font-mono text-cyan-300">
                  {activeSubcircuit.originalChips.map((chip, i) => (
                    <li key={i}>· {chip}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
                <div className="text-xs font-mono text-slate-400 mb-1.5">
                  Procedimento Oficial de Calibração
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {activeSubcircuit.calibrationNotes}
                </p>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Teensy 4.1 DSP Strategy & C++ Kernel */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Modelagem Matemática para Teensy 4.1 (Cortex-M7 FPU)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/20 border border-cyan-900/40 rounded-lg p-3.5">
                {activeSubcircuit.teensy41Strategy}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Implementação C++ (Teensy Audio Library)</span>
                <span>float32 DSP</span>
              </div>
              <pre className="bg-[#05070B] border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{activeSubcircuit.cppSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
