import React, { useState } from 'react';
import { Cpu, Zap, CheckCircle2, Layers, Cable, Wrench } from 'lucide-react';

export interface NetlistConnection {
  id: string;
  subsystem: 'MIDI_TRS' | 'AUDIO_DAC' | 'TFT_DISPLAY' | 'POWER_CTRL';
  fromComponent: string;
  fromPin: string;
  toComponent: string;
  toPin: string;
  wireColor: string;
  notes: string;
}

export const HARDWARE_NETLIST: NetlistConnection[] = [
  // 1. Alimentação Geral (Barramento 3.3V e GND)
  {
    id: 'PWR-1',
    subsystem: 'POWER_CTRL',
    fromComponent: 'Teensy 4.1',
    fromPin: 'Pino 3.3V (250mA Max)',
    toComponent: 'Barramento +3.3V (Protoboard/PCB)',
    toPin: 'Linha Positiva (+3.3V)',
    wireColor: 'Vermelho',
    notes: 'Alimenta o DAC PCM5102A, o Display ILI9341 e o Pino 8 do 6N138 (NÃO usar 5V nos pinos do Teensy 4.1!)',
  },
  {
    id: 'PWR-2',
    subsystem: 'POWER_CTRL',
    fromComponent: 'Teensy 4.1',
    fromPin: 'Pino GND',
    toComponent: 'Barramento GND Comum',
    toPin: 'Linha Negativa (GND)',
    wireColor: 'Preto',
    notes: 'Terra comum entre Teensy 4.1, PCM5102A, Display ILI9341 e Pino 5 do 6N138',
  },

  // 2. Circuito MIDI IN TRS 3.5mm (P2 Fêmea -> Optoacoplador 6N138 -> Teensy Pino 0 RX1)
  {
    id: 'MIDI-1',
    subsystem: 'MIDI_TRS',
    fromComponent: 'Jack P2 Fêmea (3.5mm TRS MIDI IN)',
    fromPin: 'Ring (Anel do Meio = DIN Pino 4 Source)',
    toComponent: 'Optoacoplador 6N138',
    toPin: 'Pino 2 (Ânodo LED) via Resistor 220 Ω',
    wireColor: 'Amarelo',
    notes: 'Padrão Rockboard TRS Tipo-A: corrente de loop MIDI passa pelo resistor de 220 Ω',
  },
  {
    id: 'MIDI-2',
    subsystem: 'MIDI_TRS',
    fromComponent: 'Jack P2 Fêmea (3.5mm TRS MIDI IN)',
    fromPin: 'Tip (Ponta = DIN Pino 5 Sink)',
    toComponent: 'Optoacoplador 6N138',
    toPin: 'Pino 3 (Cátodo LED)',
    wireColor: 'Laranja',
    notes: 'Ligar também o diodo 1N4148 entre Pino 3 (Ânodo) e Pino 2 (Cátodo) para proteção reversa',
  },
  {
    id: 'MIDI-3',
    subsystem: 'MIDI_TRS',
    fromComponent: 'Jack P2 Fêmea (3.5mm TRS MIDI IN)',
    fromPin: 'Sleeve (Base/Corpo = DIN Pino 2 Shield)',
    toComponent: 'NC (Desconectado / Flutuante)',
    toPin: 'Sem conexão com o GND na entrada MIDI IN',
    wireColor: 'Nenhum',
    notes: 'Regra oficial MIDI Association: manter o Sleeve desconectado na entrada garante isolamento óptico 100% sem ruído (ground loop)',
  },
  {
    id: 'MIDI-4',
    subsystem: 'MIDI_TRS',
    fromComponent: 'Optoacoplador 6N138',
    toComponent: 'Teensy 4.1',
    fromPin: 'Pino 6 (Vo - Saída Coletor Aberto)',
    toPin: 'Pino 0 (RX1) + Pull-up 470 Ω p/ +3.3V',
    wireColor: 'Verde',
    notes: 'Sinal serial MIDI @ 31.250 bps em nível lógico seguro de 3.3V para a Teensy 4.1',
  },
  {
    id: 'MIDI-5',
    subsystem: 'MIDI_TRS',
    fromComponent: 'Optoacoplador 6N138',
    fromPin: 'Pino 7 (Vb - Base) / Pino 8 (VCC) / Pino 5 (GND)',
    toComponent: 'Barramento Teensy 4.1',
    toPin: 'Pino 7 → 4.7kΩ → GND | Pino 8 → +3.3V (c/ 100nF) | Pino 5 → GND',
    wireColor: 'Azul / Preto',
    notes: 'O resistor de 4.7 kΩ do Pino 7 para o GND acelera o tempo de subida do fotodarlington 6N138',
  },

  // 3. Módulo DAC Estéreo 32-Bit PCM5102A (Placa Roxa GY-PCM5102)
  {
    id: 'DAC-1',
    subsystem: 'AUDIO_DAC',
    fromComponent: 'Teensy 4.1 (I2S1)',
    fromPin: 'Pino 21 (BCLK1)',
    toComponent: 'DAC PCM5102A (Placa Roxa)',
    toPin: 'Pino BCK (Bit Clock)',
    wireColor: 'Ciano',
    notes: 'Clock de bits I2S (2.8224 MHz) — também alimenta o PLL interno do PCM5102A',
  },
  {
    id: 'DAC-2',
    subsystem: 'AUDIO_DAC',
    fromComponent: 'Teensy 4.1 (I2S1)',
    fromPin: 'Pino 20 (LRCLK1)',
    toComponent: 'DAC PCM5102A (Placa Roxa)',
    toPin: 'Pino LRCK (Word Select 44.1 kHz)',
    wireColor: 'Azul',
    notes: 'Seleciona canal Esquerdo/Direito a 44.100 Hz',
  },
  {
    id: 'DAC-3',
    subsystem: 'AUDIO_DAC',
    fromComponent: 'Teensy 4.1 (I2S1)',
    fromPin: 'Pino 7 (OUT1A)',
    toComponent: 'DAC PCM5102A (Placa Roxa)',
    toPin: 'Pino DIN (Data In)',
    wireColor: 'Branco',
    notes: 'Fluxo de áudio digital estéreo do motor DSP Roland Jupiter-8',
  },
  {
    id: 'DAC-4',
    subsystem: 'AUDIO_DAC',
    fromComponent: 'BarramentoAlimentação',
    fromPin: 'GND e +3.3V',
    toComponent: 'DAC PCM5102A (Placa Roxa)',
    toPin: 'SCK → GND | GND → GND | VIN → +3.3V',
    wireColor: 'Preto / Vermelho',
    notes: 'CRÍTICO: O pino SCK do módulo roxo DEVE ser ligado ao GND para ativar a geração automática de Master Clock interno!',
  },

  // 4. Display LCD TFT 2.8" ILI9341 240x320 SPI (Placa Vermelha)
  {
    id: 'TFT-1',
    subsystem: 'TFT_DISPLAY',
    fromComponent: 'Teensy 4.1 (SPI0)',
    fromPin: 'Pino 10 (CS)',
    toComponent: 'Display TFT 2.8" ILI9341 (Placa Vermelha)',
    toPin: 'Pino 3: CS (Chip Select)',
    wireColor: 'Roxo',
    notes: 'Seleção SPI do controlador gráfico ILI9341',
  },
  {
    id: 'TFT-2',
    subsystem: 'TFT_DISPLAY',
    fromComponent: 'Teensy 4.1',
    fromPin: 'Pino 8 (RST)',
    toComponent: 'Display TFT 2.8" ILI9341 (Placa Vermelha)',
    toPin: 'Pino 4: RESET',
    wireColor: 'Cinza',
    notes: 'Reset de hardware da tela na inicialização',
  },
  {
    id: 'TFT-3',
    subsystem: 'TFT_DISPLAY',
    fromComponent: 'Teensy 4.1',
    fromPin: 'Pino 9 (DC)',
    toComponent: 'Display TFT 2.8" ILI9341 (Placa Vermelha)',
    toPin: 'Pino 5: DC / RS (Data / Command)',
    wireColor: 'Amarelo',
    notes: 'Comutação rápida Comando/Pixel da biblioteca ILI9341_t3',
  },
  {
    id: 'TFT-4',
    subsystem: 'TFT_DISPLAY',
    fromComponent: 'Teensy 4.1 (SPI0)',
    fromPin: 'Pino 11 (MOSI) e Pino 13 (SCK)',
    toComponent: 'Display TFT 2.8" ILI9341 (Placa Vermelha)',
    toPin: 'Pino 6: SDI(MOSI) ← Pino 11 | Pino 7: SCK ← Pino 13',
    wireColor: 'Verde / Azul',
    notes: 'Barramento SPI de alta velocidade (renderiza osciloscópio e 8 LEDs de voz a 25 FPS)',
  },
  {
    id: 'TFT-5',
    subsystem: 'TFT_DISPLAY',
    fromComponent: 'Barramento +3.3V / GND / Pino 12',
    fromPin: '+3.3V, GND e Pino 12 (MISO)',
    toComponent: 'Display TFT 2.8" ILI9341 (Placa Vermelha)',
    toPin: 'Pino 1 (VCC) → +3.3V | Pino 2 (GND) → GND | Pino 8 (LED) → +3.3V | Pino 9 (SDO) → Pino 12',
    wireColor: 'Vermelho / Preto',
    notes: 'Os pinos 10 a 14 da tela (T_CLK..T_IRQ do Touch) ficam desconectados',
  },

  // 5. Botão Físico COMPU-TUNE (Opcional)
  {
    id: 'BTN-1',
    subsystem: 'POWER_CTRL',
    fromComponent: 'Chave Táctil Momentânea (Push-Button)',
    fromPin: 'Terminal 1 e Terminal 2',
    toComponent: 'Teensy 4.1',
    toPin: 'Terminal 1 → Pino 6 | Terminal 2 → GND',
    wireColor: 'Branco',
    notes: 'Opcional (o Pad RGB 8 do Launchkey MK4 também dispara o Compu-Tune via MIDI)',
  },
];

export const HardwareAssemblySchematic: React.FC = () => {
  const [filterSubsystem, setFilterSubsystem] = useState<string>('ALL');

  const filteredNetlist =
    filterSubsystem === 'ALL'
      ? HARDWARE_NETLIST
      : HARDWARE_NETLIST.filter((item) => item.subsystem === filterSubsystem);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Zap className="w-3.5 h-3.5" />
            <span>ESQUEMA ELÉTRICO DE BANCADA &amp; PROJETO DE MONTAGEM</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">
            Diagrama Unifilar Completo: Teensy 4.1 + TRS MIDI (6N138) + DAC PCM5102A + TFT ILI9341
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Projeto pronto para montagem em Protoboard ou Placa Ilhada/PCB padrão 2.54mm utilizando exatamente as placas que você adquiriu e o cabo{' '}
            <strong className="text-slate-200">Rockboard DIN-5 → P2 TRS Tipo A</strong>.
          </p>
        </div>

        {/* Subsystem Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'Esquema Completo (17 Ligações)' },
            { id: 'MIDI_TRS', label: '1. Entrada TRS MIDI (6N138)' },
            { id: 'AUDIO_DAC', label: '2. Áudio I2S (PCM5102A)' },
            { id: 'TFT_DISPLAY', label: '3. Tela SPI (ILI9341)' },
            { id: 'POWER_CTRL', label: '4. Alimentação 3.3V' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterSubsystem(tab.id)}
              className={`px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
                filterSubsystem === tab.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive High-Precision Engineering SVG Schematic */}
      <div className="bg-[#050811] border border-slate-800 rounded-lg p-3 overflow-x-auto">
        <svg
          viewBox="0 0 1120 620"
          className="w-full min-w-[920px] h-auto font-mono"
          role="img"
          aria-label="Esquema elétrico de montagem do Roland Jupiter-8 no Teensy 4.1"
        >
          <defs>
            <pattern id="schemGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Background Engineering Blueprint Grid */}
          <rect width="1120" height="620" fill="url(#schemGrid)" />

          {/* Title Block Top Bar */}
          <rect x="16" y="14" width="1088" height="34" rx="4" fill="#0f172a" stroke="#1e293b" />
          <text x="28" y="35" fill="#fbbf24" fontSize="12" fontWeight="bold">
            SCHEMATIC: ROLAND JP-8 TEENSY 4.1 HARDWARE REPLICA (REV 2.0 - TRS 3.5mm MIDI TYPE-A)
          </text>
          <text x="790" y="35" fill="#38bdf8" fontSize="11">
            LOGIC LEVEL: 3.3V STRICT | MIDI: 31.250 BPS | I2S: 44.1kHz
          </text>

          {/* ============================================================== */}
          {/* MODULE 1 (TOP LEFT): LAUNCHKEY MK4 -> ROCKBOARD CABLE -> TRS JACK + 6N138 OPTOCOUPLER */}
          {/* ============================================================== */}
          <rect x="20" y="64" width="380" height="270" rx="6" fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="20" y="64" width="380" height="26" rx="4" fill="#451a03" />
          <text x="32" y="81" fill="#fbbf24" fontSize="11" fontWeight="bold">
            1. CIRCUITO DE ENTRADA MIDI P2 TRS TIPO-A (ISOLADO)
          </text>

          {/* TRS 3.5mm Female Jack Box */}
          <rect x="34" y="106" width="122" height="125" rx="4" fill="#0f172a" stroke="#475569" />
          <text x="44" y="124" fill="#f8fafc" fontSize="10" fontWeight="bold">
            JACK P2 FÊMEA 3.5mm
          </text>
          <text x="44" y="137" fill="#94a3b8" fontSize="9">
            (Cabo Rockboard TMA)
          </text>

          {/* Ring Pin */}
          <circle cx="146" cy="160" r="4" fill="#facc15" />
          <text x="44" y="163" fill="#fde047" fontSize="10" fontWeight="bold">
            RING (Anel/Pino 4)
          </text>

          {/* Tip Pin */}
          <circle cx="146" cy="192" r="4" fill="#fb923c" />
          <text x="44" y="195" fill="#fdba74" fontSize="10" fontWeight="bold">
            TIP (Ponta/Pino 5)
          </text>

          {/* Sleeve Pin */}
          <circle cx="146" cy="218" r="4" fill="#64748b" />
          <text x="44" y="221" fill="#94a3b8" fontSize="9">
            SLEEVE (Flutuante/NC)
          </text>

          {/* 220 Ohm Resistor on Ring line */}
          <line x1="150" y1="160" x2="176" y2="160" stroke="#facc15" strokeWidth="2" />
          <rect x="176" y="152" width="44" height="16" rx="2" fill="#1e293b" stroke="#facc15" />
          <text x="184" y="164" fill="#fef08a" fontSize="9" fontWeight="bold">
            220 Ω
          </text>
          <line x1="220" y1="160" x2="255" y2="160" stroke="#facc15" strokeWidth="2" />

          {/* Tip wire to Pin 3 */}
          <line x1="150" y1="192" x2="255" y2="192" stroke="#fb923c" strokeWidth="2" />

          {/* 1N4148 Protection Diode between Pin 2 and Pin 3 */}
          <line x1="236" y1="160" x2="236" y2="192" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,2" />
          <text x="174" y="212" fill="#cbd5e1" fontSize="9">
            Diodo 1N4148 (K↑ A↓)
          </text>

          {/* 6N138 Optocoupler DIP-8 Chip */}
          <rect x="255" y="118" width="128" height="156" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="275" y="136" fill="#38bdf8" fontSize="11" fontWeight="bold">
            IC1: 6N138
          </text>
          <text x="266" y="149" fill="#94a3b8" fontSize="9">
            Optoacoplador DIP-8
          </text>

          <text x="262" y="164" fill="#fde047" fontSize="9">
            2:ANODE
          </text>
          <text x="262" y="195" fill="#fdba74" fontSize="9">
            3:CATHODE
          </text>
          <text x="262" y="242" fill="#94a3b8" fontSize="9">
            5:GND ──► GND
          </text>
          <text x="262" y="260" fill="#94a3b8" fontSize="9">
            7:Vb ──[4.7kΩ]─► GND
          </text>

          <text x="318" y="164" fill="#f87171" fontSize="9">
            8:VCC (+3.3V)
          </text>
          <text x="322" y="205" fill="#4ade80" fontSize="10" fontWeight="bold">
            6:Vo (OUT)
          </text>
          <circle cx="383" cy="201" r="4" fill="#4ade80" />

          {/* 470 Ohm Pull-up Note inside Module 1 */}
          <rect x="34" y="286" width="350" height="36" rx="4" fill="#0f172a" stroke="#334155" />
          <text x="44" y="302" fill="#4ade80" fontSize="10" fontWeight="bold">
            ● PULL-UP OBRIGATÓRIO: Ligar Resistor 470 Ω entre Pino 6 (Vo) e +3.3V
          </text>
          <text x="44" y="315" fill="#94a3b8" fontSize="9">
            ● DESACOPLAMENTO: Ligar Capacitor Cerâmico 100nF entre Pino 8 (+3.3V) e Pino 5 (GND)
          </text>

          {/* ============================================================== */}
          {/* MODULE 2 (BOTTOM LEFT): BOTÃO COMPU-TUNE + BARRAMENTO 3.3V / GND */}
          {/* ============================================================== */}
          <rect x="20" y="354" width="380" height="246" rx="6" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
          <rect x="20" y="354" width="380" height="26" rx="4" fill="#1e293b" />
          <text x="32" y="371" fill="#e2e8f0" fontSize="11" fontWeight="bold">
            2. ALIMENTAÇÃO (+3.3V / GND) &amp; BOTÃO COMPU-TUNE
          </text>

          <text x="36" y="404" fill="#f87171" fontSize="11" fontWeight="bold">
            BARRAMENTO +3.3V (Pino 3V3 da Teensy 4.1):
          </text>
          <text x="46" y="422" fill="#cbd5e1" fontSize="10">
            ├─► Pino 8 (VCC) do 6N138 + Resistor 470 Ω (Pull-up do Pino 6)
          </text>
          <text x="46" y="439" fill="#cbd5e1" fontSize="10">
            ├─► Pino VIN do DAC Roxo PCM5102A
          </text>
          <text x="46" y="456" fill="#cbd5e1" fontSize="10">
            └─► Pino 1 (VCC) e Pino 8 (LED Backlight) da Tela TFT ILI9341
          </text>

          <text x="36" y="486" fill="#38bdf8" fontSize="11" fontWeight="bold">
            BARRAMENTO GND COMUM (Pinos GND da Teensy 4.1):
          </text>
          <text x="46" y="504" fill="#cbd5e1" fontSize="10">
            ├─► Pino 5 do 6N138 + Resistor 4.7 kΩ vindo do Pino 7 do 6N138
          </text>
          <text x="46" y="521" fill="#cbd5e1" fontSize="10">
            ├─► Pino GND e Pino SCK do DAC Roxo PCM5102A (Jumpers H1L/H2L/H4L)
          </text>
          <text x="46" y="538" fill="#cbd5e1" fontSize="10">
            └─► Pino 2 (GND) da Tela TFT 2.8&quot; ILI9341
          </text>

          <rect x="34" y="552" width="350" height="34" rx="4" fill="#0f172a" stroke="#475569" />
          <text x="46" y="573" fill="#fbbf24" fontSize="10" fontWeight="bold">
            [SW1 COMPU-TUNE (Opcional)]: Pino 6 da Teensy 4.1 ──[Push-Button]──► GND
          </text>

          {/* ============================================================== */}
          {/* CENTER MODULE: PJRC TEENSY 4.1 (CORTEX-M7 @ 600 MHz) */}
          {/* ============================================================== */}
          <rect x="440" y="64" width="245" height="536" rx="8" fill="#062e22" stroke="#10b981" strokeWidth="2" />
          <rect x="440" y="64" width="245" height="32" rx="6" fill="#064e3b" />
          <text x="464" y="84" fill="#6ee7b7" fontSize="12" fontWeight="bold">
            PJRC TEENSY 4.1 (600 MHz)
          </text>

          {/* Micro-USB Top Indicator */}
          <rect x="525" y="102" width="75" height="18" rx="2" fill="#334155" stroke="#94a3b8" />
          <text x="536" y="114" fill="#f8fafc" fontSize="9">
            USB 5V PWR
          </text>

          {/* Left side pins of Teensy 4.1 */}
          <circle cx="440" cy="155" r="5" fill="#ef4444" />
          <text x="454" y="159" fill="#fca5a5" fontSize="10" fontWeight="bold">
            GND (Terra Comum)
          </text>

          <circle cx="440" cy="201" r="5" fill="#4ade80" />
          <text x="454" y="205" fill="#4ade80" fontSize="11" fontWeight="bold">
            Pino 0 (RX1 - MIDI IN)
          </text>

          <circle cx="440" cy="238" r="5" fill="#38bdf8" />
          <text x="454" y="242" fill="#93c5fd" fontSize="10">
            Pino 1 (TX1 - MIDI THRU)
          </text>

          <circle cx="440" cy="305" r="5" fill="#fbbf24" />
          <text x="454" y="309" fill="#fde047" fontSize="10">
            Pino 6 (TUNE BTN)
          </text>

          {/* Right side pins of Teensy 4.1 (Audio DAC + SPI Display) */}
          <circle cx="685" cy="135" r="5" fill="#ef4444" />
          <text x="565" y="139" fill="#fca5a5" fontSize="10" fontWeight="bold">
            3.3V OUT (250mA)
          </text>

          {/* I2S Pins to PCM5102A */}
          <circle cx="685" cy="180" r="5" fill="#22d3ee" />
          <text x="550" y="184" fill="#67e8f9" fontSize="11" fontWeight="bold">
            Pino 21 (BCLK1)
          </text>

          <circle cx="685" cy="215" r="5" fill="#38bdf8" />
          <text x="545" y="219" fill="#7dd3fc" fontSize="11" fontWeight="bold">
            Pino 20 (LRCLK1)
          </text>

          <circle cx="685" cy="250" r="5" fill="#f8fafc" />
          <text x="555" y="254" fill="#f8fafc" fontSize="11" fontWeight="bold">
            Pino 7 (OUT1A)
          </text>

          {/* SPI0 Pins to ILI9341 Display */}
          <circle cx="685" cy="355" r="5" fill="#c084fc" />
          <text x="562" y="359" fill="#d8b4fe" fontSize="11" fontWeight="bold">
            Pino 10 (TFT CS)
          </text>

          <circle cx="685" cy="390" r="5" fill="#94a3b8" />
          <text x="555" y="394" fill="#cbd5e1" fontSize="11" fontWeight="bold">
            Pino 8 (TFT RST)
          </text>

          <circle cx="685" cy="425" r="5" fill="#facc15" />
          <text x="562" y="429" fill="#fef08a" fontSize="11" fontWeight="bold">
            Pino 9 (TFT DC)
          </text>

          <circle cx="685" cy="460" r="5" fill="#4ade80" />
          <text x="550" y="464" fill="#86efac" fontSize="11" fontWeight="bold">
            Pino 11 (SPI MOSI)
          </text>

          <circle cx="685" cy="495" r="5" fill="#38bdf8" />
          <text x="555" y="499" fill="#7dd3fc" fontSize="11" fontWeight="bold">
            Pino 13 (SPI SCK)
          </text>

          <circle cx="685" cy="530" r="5" fill="#64748b" />
          <text x="550" y="534" fill="#94a3b8" fontSize="10">
            Pino 12 (SPI MISO)
          </text>

          {/* Cortex-M7 Center Chip Graphic */}
          <rect x="505" y="265" width="115" height="72" rx="4" fill="#0f172a" stroke="#10b981" />
          <text x="522" y="294" fill="#ecfdf5" fontSize="11" fontWeight="bold">
            NXP i.MX RT1062
          </text>
          <text x="524" y="310" fill="#34d399" fontSize="9">
            ARM Cortex-M7
          </text>
          <text x="522" y="324" fill="#6ee7b7" fontSize="9">
            JP-8 DSP 88.2kHz
          </text>

          {/* Wire from 6N138 Pin 6 to Teensy Pin 0 (RX1) */}
          <line x1="387" y1="201" x2="435" y2="201" stroke="#4ade80" strokeWidth="2.5" />

          {/* ============================================================== */}
          {/* MODULE 3 (TOP RIGHT): MÓDULO DAC ESTÉREO PCM5102A (PLACA ROXA) */}
          {/* ============================================================== */}
          <rect x="745" y="64" width="355" height="236" rx="6" fill="#1e0b2e" stroke="#a855f7" strokeWidth="1.5" />
          <rect x="745" y="64" width="355" height="26" rx="4" fill="#3b0764" />
          <text x="758" y="81" fill="#e9d5ff" fontSize="11" fontWeight="bold">
            3. DAC I2S 32-BIT PCM5102A (PLACA ROXA GY-PCM5102)
          </text>

          <circle cx="745" cy="115" r="4" fill="#ef4444" />
          <text x="758" y="119" fill="#fca5a5" fontSize="10" fontWeight="bold">
            VIN ◄── +3.3V | GND ◄── GND
          </text>

          <circle cx="745" cy="145" r="4" fill="#fbbf24" />
          <text x="758" y="149" fill="#fde047" fontSize="10" fontWeight="bold">
            SCK ◄── LIGAR DIRETO NO GND (PLL Interno)
          </text>

          <circle cx="745" cy="180" r="4" fill="#22d3ee" />
          <text x="758" y="184" fill="#67e8f9" fontSize="11" fontWeight="bold">
            BCK (Bit Clock) ◄── Pino 21
          </text>

          <circle cx="745" cy="215" r="4" fill="#38bdf8" />
          <text x="758" y="219" fill="#7dd3fc" fontSize="11" fontWeight="bold">
            LRCK (Word Clock) ◄── Pino 20
          </text>

          <circle cx="745" cy="250" r="4" fill="#f8fafc" />
          <text x="758" y="254" fill="#f8fafc" fontSize="11" fontWeight="bold">
            DIN (Audio Data) ◄── Pino 7
          </text>

          {/* I2S Wires from Teensy to PCM5102A */}
          <line x1="690" y1="180" x2="741" y2="180" stroke="#22d3ee" strokeWidth="2.5" />
          <line x1="690" y1="215" x2="741" y2="215" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="690" y1="250" x2="741" y2="250" stroke="#f8fafc" strokeWidth="2.5" />

          {/* Audio Line Out Jack on Purple Board */}
          <rect x="760" y="266" width="324" height="24" rx="4" fill="#090d16" stroke="#a855f7" />
          <text x="772" y="282" fill="#d8b4fe" fontSize="10" fontWeight="bold">
            SAÍDA P2 ESTÉREO 2.1V RMS ──► Monitores / Mixer / Fone
          </text>

          {/* ============================================================== */}
          {/* MODULE 4 (BOTTOM RIGHT): DISPLAY LCD TFT 2.8" ILI9341 (PLACA VERMELHA) */}
          {/* ============================================================== */}
          <rect x="745" y="316" width="355" height="284" rx="6" fill="#2a0a10" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="745" y="316" width="355" height="26" rx="4" fill="#881337" />
          <text x="758" y="333" fill="#fecdd3" fontSize="11" fontWeight="bold">
            4. DISPLAY TFT 2.8&quot; ILI9341 240×320 SPI (PLACA VERMELHA)
          </text>

          <circle cx="745" cy="355" r="4" fill="#c084fc" />
          <text x="758" y="359" fill="#e9d5ff" fontSize="11" fontWeight="bold">
            Pino 3: CS (Chip Select) ◄── Pino 10
          </text>

          <circle cx="745" cy="390" r="4" fill="#94a3b8" />
          <text x="758" y="394" fill="#e2e8f0" fontSize="11" fontWeight="bold">
            Pino 4: RESET ◄── Pino 8
          </text>

          <circle cx="745" cy="425" r="4" fill="#facc15" />
          <text x="758" y="429" fill="#fef08a" fontSize="11" fontWeight="bold">
            Pino 5: DC / RS ◄── Pino 9
          </text>

          <circle cx="745" cy="460" r="4" fill="#4ade80" />
          <text x="758" y="464" fill="#86efac" fontSize="11" fontWeight="bold">
            Pino 6: SDI (MOSI) ◄── Pino 11
          </text>

          <circle cx="745" cy="495" r="4" fill="#38bdf8" />
          <text x="758" y="499" fill="#7dd3fc" fontSize="11" fontWeight="bold">
            Pino 7: SCK (Clock) ◄── Pino 13
          </text>

          <circle cx="745" cy="530" r="4" fill="#64748b" />
          <text x="758" y="534" fill="#cbd5e1" fontSize="10">
            Pino 9: SDO (MISO) ◄── Pino 12
          </text>

          {/* SPI Wires from Teensy to ILI9341 */}
          <line x1="690" y1="355" x2="741" y2="355" stroke="#c084fc" strokeWidth="2.5" />
          <line x1="690" y1="390" x2="741" y2="390" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="690" y1="425" x2="741" y2="425" stroke="#facc15" strokeWidth="2.5" />
          <line x1="690" y1="460" x2="741" y2="460" stroke="#4ade80" strokeWidth="2.5" />
          <line x1="690" y1="495" x2="741" y2="495" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="690" y1="530" x2="741" y2="530" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,2" />

          <rect x="760" y="550" width="324" height="38" rx="4" fill="#090d16" stroke="#f43f5e" />
          <text x="770" y="566" fill="#fda4af" fontSize="10" fontWeight="bold">
            Pino 1 (VCC) ──► +3.3V | Pino 2 (GND) ──► GND
          </text>
          <text x="770" y="581" fill="#cbd5e1" fontSize="9">
            Pino 8 (LED Backlight) ──► +3.3V | Pinos 10..14 (Touch) = NC
          </text>
        </svg>
      </div>

      {/* Auxiliary Passive Components List (Peças Extras de R$ 15 para o Circuito MIDI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
            <Cpu className="w-4 h-4" />
            <span>COMPONENTES DO CIRCUITO MIDI TRS</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
            <li>• 1× Jack P2 Fêmea Estéreo 3.5mm (PJ-307 / PJ-320A)</li>
            <li>• 1× Optoacoplador <strong className="text-amber-300">6N138</strong> (DIP-8) + Soquete 8 pinos</li>
            <li>• 1× Diodo de sinal rápido <strong className="text-amber-300">1N4148</strong></li>
            <li>• 1× Resistor <strong className="text-cyan-300">220 Ω</strong> 1/4W (Entrada Anel/Ring)</li>
            <li>• 1× Resistor <strong className="text-cyan-300">470 Ω</strong> 1/4W (Pull-up Pino 6 → 3.3V)</li>
            <li>• 1× Resistor <strong className="text-cyan-300">4.7 kΩ</strong> 1/4W (Base Pino 7 → GND)</li>
            <li>• 1× Capacitor Cerâmico <strong className="text-cyan-300">100 nF</strong> (Pino 8 → GND)</li>
          </ul>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <Layers className="w-4 h-4" />
            <span>CONFIGURAÇÃO DA PLACA ROXA PCM5102A</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O módulo roxo <code className="text-cyan-300">GY-PCM5102</code> funciona sem pino MCLK quando o pino{' '}
            <strong className="text-amber-300">SCK é aterrado no GND</strong>. Confira os 4 pads de solda na placa roxa:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 font-mono">
            <li>• <strong className="text-emerald-400">H1L (FLT)</strong>: Fechado para GND (Filtro Normal)</li>
            <li>• <strong className="text-emerald-400">H2L (DEMP)</strong>: Fechado para GND (De-emphasis OFF)</li>
            <li>• <strong className="text-emerald-400">H3L (XSMT)</strong>: Fechado para 3.3V (Soft Mute Desligado = Som Ativo)</li>
            <li>• <strong className="text-emerald-400">H4L (FMT)</strong>: Fechado para GND (Formato Padrão I2S)</li>
          </ul>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
            <Wrench className="w-4 h-4" />
            <span>CHECKLIST ANTES DE LIGAR O USB (5V)</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Regra de Ouro 3.3V:</strong> A Teensy 4.1 NÃO é tolerante a 5V nos pinos digitais. Alimente o Pino 8 do 6N138 e o pull-up de 470 Ω exclusivamente no pino <code className="text-amber-300">3.3V</code> da Teensy!
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Cabo Rockboard Tipo A:</strong> Plugue o DIN-5 no <code className="text-cyan-300">MIDI OUT</code> do Launchkey MK4 e o P2 3.5mm no seu Jack P2 Fêmea.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Step-by-Step Point-to-Point Netlist Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Cable className="w-3.5 h-3.5 text-amber-400" />
            Tabela Ponto-a-Ponto de Fiação (Netlist de Bancada — {filteredNetlist.length} Conexões)
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Também documentada em HARDWARE_SCHEMATIC.md dentro do .ZIP
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Origem (Componente &amp; Pino)</th>
                <th className="py-2.5 px-3">Destino (Componente &amp; Pino)</th>
                <th className="py-2.5 px-3">Cor Sugerida</th>
                <th className="py-2.5 px-3">Observação Técnica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filteredNetlist.map((net) => (
                <tr key={net.id} className="hover:bg-slate-950/60">
                  <td className="py-2 px-3 text-amber-400 font-bold whitespace-nowrap">
                    {net.id}
                  </td>
                  <td className="py-2 px-3">
                    <div className="text-slate-100 font-semibold">{net.fromComponent}</div>
                    <div className="text-cyan-300">{net.fromPin}</div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="text-slate-100 font-semibold">{net.toComponent}</div>
                    <div className="text-emerald-300">{net.toPin}</div>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-slate-300">
                    {net.wireColor}
                  </td>
                  <td className="py-2 px-3 text-slate-400 leading-relaxed">
                    {net.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
