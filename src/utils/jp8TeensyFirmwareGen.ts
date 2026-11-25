import { JP8Patch, OversamplingFactor } from './jp8DspMath';

export interface FirmwareFileItem {
  path: string;
  label: string;
  language: 'ini' | 'yaml' | 'cpp' | 'markdown';
  summary: string;
  content: string;
}

export interface LaunchkeyControlMapping {
  hardwareControl: string;
  midiMessage: string;
  ccNumber: number | string;
  jp8Parameter: string;
  schematicRef: string;
  rangeDescription: string;
}

export const LAUNCHKEY_MK4_MAPPINGS: LaunchkeyControlMapping[] = [
  {
    hardwareControl: 'Encoder 1 (Top Row)',
    midiMessage: 'CC 21',
    ccNumber: 21,
    jp8Parameter: 'VCF Cutoff Freq (IR3109)',
    schematicRef: 'Panel D VR6 · IC27A Pág. 16',
    rangeDescription: '20 Hz a 18.000 Hz (Curva Exponencial)',
  },
  {
    hardwareControl: 'Encoder 2 (Top Row)',
    midiMessage: 'CC 22',
    ccNumber: 22,
    jp8Parameter: 'VCF Resonance (BA662)',
    schematicRef: 'Panel D VR7 · IC25A Pág. 16',
    rangeDescription: '0.0 a 10.0 (Auto-oscilação suave)',
  },
  {
    hardwareControl: 'Encoder 3 (Top Row)',
    midiMessage: 'CC 23',
    ccNumber: 23,
    jp8Parameter: 'VCF Env Mod Depth',
    schematicRef: 'Panel D VR8 · IC28B Pág. 16',
    rangeDescription: '0.0 a 10.0 (Intensidade ENV -> VCF)',
  },
  {
    hardwareControl: 'Encoder 4 (Top Row)',
    midiMessage: 'CC 24',
    ccNumber: 24,
    jp8Parameter: 'VCO Cross-Mod (X-MOD)',
    schematicRef: 'Panel C VR6 · BA662 IC6A Pág. 15',
    rangeDescription: '0.0 a 10.0 (3 Oitavas @ 5.0 Pág. 33)',
  },
  {
    hardwareControl: 'Encoder 5 (Top Row)',
    midiMessage: 'CC 25',
    ccNumber: 25,
    jp8Parameter: 'VCO-2 Fine Detune',
    schematicRef: 'Panel C VR8 · Pág. 15',
    rangeDescription: '-50 cents a +50 cents',
  },
  {
    hardwareControl: 'Encoder 6 (Top Row)',
    midiMessage: 'CC 26',
    ccNumber: 26,
    jp8Parameter: 'VCO-1 Pulse Width / PWM',
    schematicRef: 'Panel C VR4/VR5 · IC16A Pág. 15',
    rangeDescription: '5% a 95% Duty Cycle (Mín. 30µs)',
  },
  {
    hardwareControl: 'Encoder 7 (Top Row)',
    midiMessage: 'CC 27',
    ccNumber: 27,
    jp8Parameter: 'HPF Cutoff (-6dB/oct)',
    schematicRef: 'Panel D VR5 · TR19A/IC26A Pág. 16',
    rangeDescription: '20 Hz a 1.500 Hz',
  },
  {
    hardwareControl: 'Encoder 8 (Top Row)',
    midiMessage: 'CC 28',
    ccNumber: 28,
    jp8Parameter: 'LFO Rate (MOD CON)',
    schematicRef: 'Panel C VR1 · IC5/IC7 Pág. 13',
    rangeDescription: '0.05 Hz a 40.0 Hz',
  },
  {
    hardwareControl: 'Fader 1..4 (Launchkey 49/61)',
    midiMessage: 'CC 53..56',
    ccNumber: '53-56',
    jp8Parameter: 'ENV-1 Attack / Decay / Sustain / Release',
    schematicRef: 'Panel D VR12..15 · IR3R01 IC38A Pág. 16',
    rangeDescription: '1ms a 10s (Escalonado pelo 555 KF)',
  },
  {
    hardwareControl: 'Fader 5..8 (Launchkey 49/61)',
    midiMessage: 'CC 57..60',
    ccNumber: '57-60',
    jp8Parameter: 'ENV-2 Attack / Decay / Sustain / Release',
    schematicRef: 'Panel D VR16..19 · IR3R01 IC36A Pág. 16',
    rangeDescription: '1ms a 10s (Envelope VCA BA662A)',
  },
  {
    hardwareControl: 'Fader 9 (Master Fader)',
    midiMessage: 'CC 61 / CC 7',
    ccNumber: 61,
    jp8Parameter: 'Source Mix (VCO-1 ↔ VCO-2)',
    schematicRef: 'Panel C VR9 · BA662 IC28A Pág. 16',
    rangeDescription: '0% (VCO-1) a 100% (VCO-2)',
  },
  {
    hardwareControl: 'Pads RGB 1..5 (Ch 10 / Ch 1)',
    midiMessage: 'Note 36..40 / PC 0..4',
    ccNumber: 'Pad 1-5',
    jp8Parameter: 'Seleção Instantânea de Patch (A1..B1)',
    schematicRef: 'Panel E Patch Preset Buttons Pág. 27',
    rangeDescription: 'Carrega os 5 Patches Clássicos JP-8',
  },
  {
    hardwareControl: 'Pad RGB 6 / CC 80',
    midiMessage: 'Note 41 / CC 80',
    ccNumber: 'Pad 6',
    jp8Parameter: 'Hard Sync Toggle (VCO-1 → VCO-2)',
    schematicRef: 'Panel C SW7 · IC11A Pág. 15',
    rangeDescription: 'Liga/Desliga Sincronismo Mestre-Escravo',
  },
  {
    hardwareControl: 'Pad RGB 7 / CC 81',
    midiMessage: 'Note 42 / CC 81',
    ccNumber: 'Pad 7',
    jp8Parameter: 'IR3109 Slope Toggle (-12dB / -24dB)',
    schematicRef: 'Panel D SW2 · TC4052 IC5A Pág. 16',
    rangeDescription: 'Alterna entre 2 Polos e 4 Polos OTA',
  },
  {
    hardwareControl: 'Pad RGB 8 / CC 82',
    midiMessage: 'Note 43 / CC 82',
    jp8Parameter: 'COMPU-TUNE Auto-Calibração (14-Bit)',
    ccNumber: 'Pad 8',
    schematicRef: 'Panel E TUNE · Z80 + uPD8253 Pág. 50',
    rangeDescription: 'Executa rotina de afinação nos 16 VCOs',
  },
  {
    hardwareControl: 'Pitch Wheel + Mod Wheel + Sustain',
    midiMessage: 'PitchBend / CC 1 / CC 64',
    ccNumber: 'PB/1/64',
    jp8Parameter: 'Bender (±2..12 semitons), Vibrato LFO e Hold',
    schematicRef: 'Bender Board OPH132 Pág. 24',
    rangeDescription: 'Performance completa sem latência',
  },
];

function mapWaveEnum(wave: string): string {
  switch (wave) {
    case 'triangle':
      return 'JP8Wave::TRIANGLE';
    case 'sawtooth':
      return 'JP8Wave::SAWTOOTH';
    case 'pulse':
      return 'JP8Wave::PULSE';
    case 'square':
      return 'JP8Wave::SQUARE';
    case 'noise':
      return 'JP8Wave::NOISE';
    default:
      return 'JP8Wave::SAWTOOTH';
  }
}

function mapLfoWaveEnum(wave: string): string {
  switch (wave) {
    case 'sine':
      return 'JP8LfoWave::SINE';
    case 'triangle':
      return 'JP8LfoWave::TRIANGLE';
    case 'sawtooth':
      return 'JP8LfoWave::SAWTOOTH';
    case 'square':
      return 'JP8LfoWave::SQUARE';
    case 'random':
      return 'JP8LfoWave::RANDOM_SH';
    default:
      return 'JP8LfoWave::TRIANGLE';
  }
}

function mapKeyModeEnum(mode: string): string {
  switch (mode) {
    case 'POLY1':
      return 'JP8KeyMode::POLY1';
    case 'POLY2':
      return 'JP8KeyMode::POLY2';
    case 'UNISON':
      return 'JP8KeyMode::UNISON';
    case 'SOLO':
      return 'JP8KeyMode::SOLO';
    default:
      return 'JP8KeyMode::POLY1';
  }
}

export function generateTeensy41ProjectFiles(
  patch: JP8Patch,
  numVoices: number,
  oversampling: OversamplingFactor,
  useZdfFilter: boolean,
  enableStereoSplit: boolean
): FirmwareFileItem[] {
  const internalSr = (44100 * oversampling).toFixed(1);

  const platformioIni = `; ============================================================================
; PlatformIO Project Configuration — Roland Jupiter-8 Teensy 4.1 DSP Replica
; Hardware Alvo:
;   1. MCU: Teensy 4.1 (NXP i.MX RT1062 ARM Cortex-M7 @ 600 MHz)
;   2. MIDI Primário: TRS 3.5mm (P2/P1) MIDI Type-A @ 31.250 bps (Serial1 RX1=Pino 0, TX1=Pino 1)
;      com Optoacoplador 6N138 / H11L1 direto da saída MIDI Out 3.5mm do Launchkey MK4
;   3. DAC: PCM5102A 32-Bit/384kHz I2S DAC (112dB SNR) + Audio Shield SGTL5000
;   4. Tela: Display IPS TFT 2.8" ILI9341 320x240 SPI com DMA (ILI9341_t3)
;
; NOTA IMPORTANTE SOBRE BIBLIOTECAS TEENSY (Teensyduino 1.62 / GCC 15.2):
;   As bibliotecas 'Audio', 'USBHost_t36', 'ILI9341_t3', 'SPI', 'SD', 'Wire' e 'SerialFlash'
;   JÁ VÊM EMBUTIDAS e atualizadas para Teensy 4.1 dentro do pacote oficial
;   'framework-arduinoteensy'. Não devem ser baixadas via lib_deps do registro antigo!
; ============================================================================

[env:teensy41]
platform = teensy
board = teensy41
framework = arduino
build_flags =
  -std=gnu++17
  -O3
  -ffast-math
  -D USB_MIDI_AUDIO_SERIAL
  -D JP8_MAX_VOICES=${numVoices}
  -D JP8_OVERSAMPLE=${oversampling}
  -D JP8_USE_ZDF=${useZdfFilter ? 1 : 0}
  -D JP8_STEREO_PAN=${enableStereoSplit ? 1 : 0}
lib_deps =
  fortyseveneffects/MIDI Library@^5.0.2

[env:native_test]
platform = native
build_flags =
  -std=c++17
  -O2
  -Wall
  -Wextra
  -Werror
  -I include
  -D JP8_MAX_VOICES=${numVoices}
  -D JP8_OVERSAMPLE=${oversampling}
  -D JP8_USE_ZDF=${useZdfFilter ? 1 : 0}
`;

  const githubWorkflow = `# ============================================================================
# GitHub Actions CI/CD — Compilação Automática do Firmware JP-8 para Teensy 4.1
# Gera firmware.hex e firmware.elf na nuvem a cada push ou tag (sem IDE local)
# ============================================================================
name: Build Roland JP-8 Teensy 4.1 Firmware

on:
  push:
    branches: [ "**" ]
    tags: [ "v*" ]
  pull_request:
  workflow_dispatch:

jobs:
  native-dsp-tests:
    name: 1. Validar Núcleo DSP C++17 & Mapeamento TRS MIDI Launchkey MK4
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do repositório
        uses: actions/checkout@v4

      - name: Compilar e executar testes unitários do motor DSP (g++ -Werror)
        run: |
          if [ -d "firmware/jp8_teensy41" ]; then
            cd firmware/jp8_teensy41
          fi
          g++ -std=c++17 -O2 -Wall -Wextra -Werror \\
            -I include \\
            -D JP8_MAX_VOICES=${numVoices} \\
            -D JP8_OVERSAMPLE=${oversampling} \\
            -D JP8_USE_ZDF=${useZdfFilter ? 1 : 0} \\
            test/test_jp8_dsp_native.cpp -lm -o test_jp8_dsp
          ./test_jp8_dsp

  compile-teensy41:
    name: 2. Compilar Firmware Teensy 4.1 (.hex)
    needs: native-dsp-tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do repositório
        uses: actions/checkout@v4

      - name: Configurar Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Cache PlatformIO (~/.platformio)
        uses: actions/cache@v4
        with:
          path: ~/.platformio
          key: \${{ runner.os }}-pio-teensy41-\${{ hashFiles('**/platformio.ini') }}

      - name: Instalar PlatformIO CLI
        run: pip install --upgrade platformio

      - name: Compilar projeto Teensy 4.1 (ARM Cortex-M7)
        run: |
          if [ -d "firmware/jp8_teensy41" ]; then
            cd firmware/jp8_teensy41
          fi
          pio run -e teensy41
          pio run -e teensy41 -t size
          mkdir -p "\$GITHUB_WORKSPACE/build_out"
          cp .pio/build/teensy41/firmware.hex "\$GITHUB_WORKSPACE/build_out/firmware.hex"
          cp .pio/build/teensy41/firmware.elf "\$GITHUB_WORKSPACE/build_out/firmware.elf"

      - name: Publicar Artifact (firmware.hex & firmware.elf)
        uses: actions/upload-artifact@v4
        with:
          name: jp8-teensy41-firmware-\${{ github.sha }}
          path: |
            build_out/firmware.hex
            build_out/firmware.elf

      - name: Anexar .hex ao GitHub Release (quando houver tag v*)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: |
            build_out/firmware.hex
            build_out/firmware.elf
`;

  const jp8ParametersH = `#pragma once
#include <cstdint>

#ifndef JP8_MAX_VOICES
#define JP8_MAX_VOICES ${numVoices}
#endif

#ifndef JP8_OVERSAMPLE
#define JP8_OVERSAMPLE ${oversampling}
#endif

#ifndef JP8_USE_ZDF
#define JP8_USE_ZDF ${useZdfFilter ? 1 : 0}
#endif

#ifndef JP8_STEREO_PAN
#define JP8_STEREO_PAN ${enableStereoSplit ? 1 : 0}
#endif

enum class JP8Wave : uint8_t {
  TRIANGLE = 0,
  SAWTOOTH = 1,
  PULSE    = 2,
  SQUARE   = 3,
  NOISE    = 4
};

enum class JP8LfoWave : uint8_t {
  SINE      = 0,
  TRIANGLE  = 1,
  SAWTOOTH  = 2,
  SQUARE    = 3,
  RANDOM_SH = 4
};

enum class JP8KeyMode : uint8_t {
  POLY1  = 0,
  POLY2  = 1,
  UNISON = 2,
  SOLO   = 3
};

struct JP8Parameters {
  const char* patchName   = "${patch.name}";

  // VCO-1 (Module Board OPH124, Pág. 15)
  int8_t  vco1OctaveShift = ${patch.vco1Range === 16 ? -1 : patch.vco1Range === 8 ? 0 : patch.vco1Range === 4 ? 1 : 2};
  JP8Wave vco1Wave        = ${mapWaveEnum(patch.vco1Wave)};
  float   crossModDepth   = ${patch.vco1CrossMod.toFixed(2)}f; // 0..10 (3 oitavas @ 5.0, Pág. 33)
  float   vco1ModEnv      = ${patch.vco1ModEnv.toFixed(2)}f;   // 0..10
  float   vco1ModLfo      = ${patch.vco1ModLfo.toFixed(2)}f;   // 0..10
  float   vco1Pw          = ${patch.vco1Pw.toFixed(3)}f;       // 0.05..0.95
  float   vco1PwmDepth    = ${patch.vco1PwmDepth.toFixed(2)}f; // 0..10

  // VCO-2 (Module Board OPH124, Pág. 15)
  int8_t  vco2OctaveShift = ${patch.vco2Range === 16 ? -1 : patch.vco2Range === 8 ? 0 : patch.vco2Range === 4 ? 1 : 2};
  bool    vco2LowFreq     = ${patch.vco2LowFreq ? 'true' : 'false'};
  float   vco2FineCents   = ${patch.vco2Fine.toFixed(2)}f;     // -50..+50 cents
  JP8Wave vco2Wave        = ${mapWaveEnum(patch.vco2Wave)};
  bool    hardSync        = ${patch.vco2Sync ? 'true' : 'false'};
  float   vco2Pw          = ${patch.vco2Pw.toFixed(3)}f;

  // Source Mix (BA662 IC28A) & HPF (TR19A + IC26A)
  float   sourceMix       = ${(patch.sourceMix / 10).toFixed(3)}f; // 0.0 (VCO1) .. 1.0 (VCO2)
  float   hpfCutoffHz     = ${patch.hpfCutoffHz.toFixed(1)}f;

  // VCF Roland IR3109 (IC27A Quad OTA + BA662 IC25A, Pág. 16)
  float   vcfCutoffHz     = ${patch.vcfCutoffHz.toFixed(1)}f;
  float   vcfResonance    = ${patch.vcfResonance.toFixed(2)}f; // 0..10
  uint8_t vcfSlopeDb      = ${patch.vcfSlope};                 // 12 ou 24 dB/oct
  float   vcfEnvMod       = ${patch.vcfEnvMod.toFixed(2)}f;    // 0..10
  int8_t  vcfEnvPolarity  = ${patch.vcfEnvPolarity};           // +1 ou -1
  bool    vcfEnvFromEnv2  = ${patch.vcfEnvSource === 'ENV2' ? 'true' : 'false'};
  float   vcfLfoMod       = ${patch.vcfLfoMod.toFixed(2)}f;
  float   vcfKeyFollow    = ${patch.vcfKeyFollow.toFixed(3)}f; // 0..1.2

  // VCA (BA662A Selecionado por Offset IC29A/IC30A)
  float   vcaLevel        = ${(patch.vcaLevel / 10).toFixed(3)}f;
  float   vcaLfoMod       = ${patch.vcaLfoMod.toFixed(2)}f;

  // ENV-1 (IR3R01 IC38A)
  float   env1AttackSec   = ${(patch.env1AttackMs / 1000).toFixed(4)}f;
  float   env1DecaySec    = ${(patch.env1DecayMs / 1000).toFixed(4)}f;
  float   env1Sustain     = ${patch.env1Sustain.toFixed(3)}f;
  float   env1ReleaseSec  = ${(patch.env1ReleaseMs / 1000).toFixed(4)}f;
  bool    env1KeyFollow   = ${patch.env1KeyFollow ? 'true' : 'false'};

  // ENV-2 (IR3R01 IC36A)
  float   env2AttackSec   = ${(patch.env2AttackMs / 1000).toFixed(4)}f;
  float   env2DecaySec    = ${(patch.env2DecayMs / 1000).toFixed(4)}f;
  float   env2Sustain     = ${patch.env2Sustain.toFixed(3)}f;
  float   env2ReleaseSec  = ${(patch.env2ReleaseMs / 1000).toFixed(4)}f;
  bool    env2KeyFollow   = ${patch.env2KeyFollow ? 'true' : 'false'};

  // LFO, Bender & Assign (MOD CON OPH123A & Bender OPH132)
  float      lfoRateHz         = ${patch.lfoRateHz.toFixed(2)}f;
  float      lfoDelaySec       = ${(patch.lfoDelayMs / 1000).toFixed(3)}f;
  JP8LfoWave lfoWave           = ${mapLfoWaveEnum(patch.lfoWave)};
  float      portamentoSec     = ${(patch.portamentoMs / 1000).toFixed(3)}f;
  JP8KeyMode keyMode           = ${mapKeyModeEnum(patch.keyAssignMode)};
  float      unisonDetuneCents = ${patch.unisonDetuneCents.toFixed(1)}f;
  float      pitchBendRangeSemi = 2.0f; // Ajustável de 2 a 12 semitons
};

inline JP8Parameters makeDefaultJP8Patch() {
  JP8Parameters p;
  return p;
}

// Banco de 5 Presets de Fábrica acionáveis pelos Pads 1..5 do Launchkey MK4
inline JP8Parameters makeFactoryPresetBank(uint8_t slot) {
  JP8Parameters p = makeDefaultJP8Patch();
  switch (slot % 5) {
    case 0: // A1: Imperial Jupiter Brass
      p.patchName = "A1: Imperial JP8 Brass";
      break;
    case 1: // A2: Screaming Hard-Sync Lead
      p.patchName = "A2: Hard-Sync Lead";
      p.vco1OctaveShift = 1;
      p.vco1ModEnv = 7.5f;
      p.crossModDepth = 1.4f;
      p.hardSync = true;
      p.sourceMix = 0.25f;
      p.vcfCutoffHz = 4800.0f;
      p.vcfResonance = 5.2f;
      p.keyMode = JP8KeyMode::SOLO;
      break;
    case 2: // A3: Lush Dual-PWM Strings (12dB)
      p.patchName = "A3: Lush PWM Strings";
      p.vco1Wave = JP8Wave::PULSE;
      p.vco1PwmDepth = 7.2f;
      p.vco2FineCents = -11.0f;
      p.hpfCutoffHz = 140.0f;
      p.vcfCutoffHz = 3200.0f;
      p.vcfSlopeDb = 12;
      p.env2AttackSec = 0.62f;
      p.env2ReleaseSec = 1.65f;
      break;
    case 3: // A4: Metallic Cross-Mod Chiming Bell
      p.patchName = "A4: X-Mod Chiming Bell";
      p.vco1OctaveShift = 2;
      p.vco1Wave = JP8Wave::TRIANGLE;
      p.crossModDepth = 5.4f;
      p.vco2OctaveShift = -1;
      p.vco2Wave = JP8Wave::SQUARE;
      p.vcfCutoffHz = 5600.0f;
      p.env1AttackSec = 0.002f;
      p.env1Sustain = 0.0f;
      p.env2AttackSec = 0.002f;
      p.env2Sustain = 0.0f;
      p.env2ReleaseSec = 2.1f;
      break;
    case 4: // B1: 16-VCO Unison Arpeggio Bass
      p.patchName = "B1: 16-VCO Unison Bass";
      p.vco1OctaveShift = -1;
      p.vco2OctaveShift = -1;
      p.vco2Wave = JP8Wave::SQUARE;
      p.vcfCutoffHz = 420.0f;
      p.vcfResonance = 6.4f;
      p.vcfEnvMod = 7.8f;
      p.env1AttackSec = 0.001f;
      p.env1DecaySec = 0.26f;
      p.env1Sustain = 0.12f;
      p.env2AttackSec = 0.001f;
      p.env2DecaySec = 0.34f;
      p.env2Sustain = 0.35f;
      p.keyMode = JP8KeyMode::UNISON;
      p.unisonDetuneCents = 14.0f;
      break;
  }
  return p;
}
`;

  const jp8DspCoreH = `#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include "JP8Parameters.h"

namespace jp8 {

constexpr float kPi = 3.14159265358979323846f;

// Aproximação racional Padé para saturação hiperbólica OTA do IR3109
inline float fastOtaTanh(float x) {
  if (x < -3.0f) return -1.0f;
  if (x >  3.0f) return  1.0f;
  const float x2 = x * x;
  return x * (27.0f + x2) / (27.0f + 9.0f * x2);
}

// Correção polinomial de banda limitada (PolyBLEP) para eliminar aliasing
inline float polyBlep(float t, float dt) {
  if (dt <= 0.0f) return 0.0f;
  if (t < dt) {
    const float x = t / dt;
    return x + x - x * x - 1.0f;
  }
  if (t > 1.0f - dt) {
    const float x = (t - 1.0f) / dt;
    return x * x + x + x + 1.0f;
  }
  return 0.0f;
}

struct VoiceCalibration {
  float refVoltageT = 8.0252f;   // Equação (2) Pág. 50: T = VKn84
  float scaleWidthW = 0.083333f; // Ideal 1/12V por semitom
  float thermalDriftCents = 0.0f;
};

struct EnvelopeState {
  enum Stage : uint8_t { IDLE = 0, ATTACK, DECAY, SUSTAIN, RELEASE };
  Stage stage = IDLE;
  float level = 0.0f;

  void trigger() { stage = ATTACK; }
  void releaseNote() {
    if (stage != IDLE) stage = RELEASE;
  }

  float process(float attSec, float decSec, float sus, float relSec,
                bool keyFollow, uint8_t midiNote, float sr) {
    const float kfScale = keyFollow
      ? std::exp2(-static_cast<float>(static_cast<int>(midiNote) - 60) * 0.035f)
      : 1.0f;

    switch (stage) {
      case IDLE:
        level = 0.0f;
        break;
      case ATTACK: {
        const float tau = std::max(0.001f, attSec * kfScale);
        const float coef = 1.0f - std::exp(-1.0f / (tau * sr));
        level += coef * (1.15f - level); // Overshoot RC analógico do IR3R01
        if (level >= 1.0f) {
          level = 1.0f;
          stage = DECAY;
        }
        break;
      }
      case DECAY: {
        const float tau = std::max(0.005f, decSec * kfScale);
        const float coef = 1.0f - std::exp(-1.0f / (tau * sr));
        level += coef * (sus - level);
        if (std::fabs(level - sus) < 0.0005f) {
          level = sus;
          stage = SUSTAIN;
        }
        break;
      }
      case SUSTAIN:
        level = sus;
        break;
      case RELEASE: {
        const float tau = std::max(0.005f, relSec * kfScale);
        const float coef = 1.0f - std::exp(-1.0f / (tau * sr));
        level += coef * (0.0f - level);
        if (level < 0.0002f) {
          level = 0.0f;
          stage = IDLE;
        }
        break;
      }
    }
    return level;
  }
};

struct VoiceState {
  bool active = false;
  bool heldBySustainPedal = false;
  uint8_t midiNote = 60;
  float velocity = 1.0f;
  float currentNotePitch = 60.0f;
  float lfoDelayEnv = 0.0f; // Emula circuito LFO Delay TR23~TR27 + BA662 IC8 (Pág. 13)
  uint32_t ageCounter = 0;

  // Fases dos VCOs e integradores do filtro
  float phase1 = 0.0f;
  float phase2 = 0.0f;
  float triIntegrator1 = 0.0f;
  float triIntegrator2 = 0.0f;

  // Filtro HPF 1-polo (TR19A + IC26A) e 4 estágios IR3109 TPT ZDF
  float hpfState = 0.0f;
  float vcfState[4] = {0.0f, 0.0f, 0.0f, 0.0f};

  EnvelopeState env1;
  EnvelopeState env2;

  // Ruído & Compu-Tune
  uint32_t prng = 0x12345678u;
  float pinkB0 = 0.0f, pinkB1 = 0.0f, pinkB2 = 0.0f;
  VoiceCalibration cal[2];

  float nextNoise(bool pinkMode) {
    prng ^= prng << 13;
    prng ^= prng >> 17;
    prng ^= prng << 5;
    const float white = (static_cast<int32_t>(prng) * 4.6566129e-10f);
    if (!pinkMode) return white;
    // Filtro Paul Kellet (-3dB/oct, Pág. 48 Item 1)
    pinkB0 = 0.99886f * pinkB0 + white * 0.0555179f;
    pinkB1 = 0.99332f * pinkB1 + white * 0.0750759f;
    pinkB2 = 0.96900f * pinkB2 + white * 0.1538520f;
    return (pinkB0 + pinkB1 + pinkB2 + white * 0.5362f) * 0.22f;
  }
};

template <int MaxVoices = JP8_MAX_VOICES, int Oversample = JP8_OVERSAMPLE>
class JP8DspEngine {
public:
  static constexpr float kBaseSampleRate = 44100.0f;
  static constexpr float kInternalSampleRate = kBaseSampleRate * static_cast<float>(Oversample);

  JP8DspEngine() {
    initCompuTuneTables();
  }

  void setParameters(const JP8Parameters& p) { params_ = p; }
  const JP8Parameters& parameters() const { return params_; }
  JP8Parameters& mutableParameters() { return params_; }

  // Calibração Compu-Tune em 2 pontos (Pág. 50) com erro residual do DAC 14-bit ITS80141
  void initCompuTuneTables() {
    for (int v = 0; v < MaxVoices; ++v) {
      voices_[v].prng = 0x9E3779B9u ^ (static_cast<uint32_t>(v + 1) * 2654435761u);
      for (int osc = 0; osc < 2; ++osc) {
        const float sign = ((v + osc) % 2 == 0) ? 1.0f : -1.0f;
        voices_[v].cal[osc].scaleWidthW = 0.083333f + sign * 0.00018f;
        voices_[v].cal[osc].refVoltageT = 8.0252f;
        voices_[v].cal[osc].thermalDriftCents = sign * (0.45f + 0.12f * static_cast<float>(v));
      }
    }
  }

  void runCompuTune() {
    for (int v = 0; v < MaxVoices; ++v) {
      for (int osc = 0; osc < 2; ++osc) {
        voices_[v].cal[osc].scaleWidthW = 0.083333f;
        voices_[v].cal[osc].thermalDriftCents *= 0.25f;
      }
    }
  }

  // Bender Board OPH132 (Pitch Bend normalizado -1.0 a +1.0)
  void setPitchBend(float normMinus1To1) {
    pitchBendNorm_ = std::clamp(normMinus1To1, -1.0f, 1.0f);
  }

  // Mod Wheel do Launchkey MK4 (CC 1 -> LFO Send)
  void setModWheel(float norm0To1) {
    modWheelNorm_ = std::clamp(norm0To1, 0.0f, 1.0f);
  }

  // Pedal de Sustain / Hold Jack (AJ1-10 Pág. 3 & 25)
  void setSustainPedal(bool held) {
    sustainPedalHeld_ = held;
    if (!held) {
      for (int v = 0; v < MaxVoices; ++v) {
        if (voices_[v].active && voices_[v].heldBySustainPedal) {
          voices_[v].heldBySustainPedal = false;
          voices_[v].env1.releaseNote();
          voices_[v].env2.releaseNote();
        }
      }
    }
  }

  // Handler completo de MIDI CC otimizado para Novation Launchkey MK4
  void applyLaunchkeyMidiCC(uint8_t cc, uint8_t val) {
    const float norm = static_cast<float>(val) / 127.0f;
    switch (cc) {
      case 1: // Mod Wheel
        setModWheel(norm);
        break;
      case 5: // Portamento Time
        params_.portamentoSec = norm * 1.5f;
        break;
      case 7: // Master VCA Volume
        params_.vcaLevel = norm;
        break;
      case 21: // Launchkey Encoder 1 -> VCF Cutoff
      case 74:
        params_.vcfCutoffHz = 30.0f * std::exp2(norm * 9.2f);
        break;
      case 22: // Launchkey Encoder 2 -> VCF Resonance
      case 71:
        params_.vcfResonance = norm * 10.0f;
        break;
      case 23: // Launchkey Encoder 3 -> VCF Env Mod
        params_.vcfEnvMod = norm * 10.0f;
        break;
      case 24: // Launchkey Encoder 4 -> VCO Cross-Mod (X-MOD)
        params_.crossModDepth = norm * 10.0f;
        break;
      case 25: // Launchkey Encoder 5 -> VCO-2 Fine Detune (-50..+50c)
        params_.vco2FineCents = (norm - 0.5f) * 100.0f;
        break;
      case 26: // Launchkey Encoder 6 -> VCO-1 Pulse Width
        params_.vco1Pw = 0.05f + norm * 0.90f;
        break;
      case 27: // Launchkey Encoder 7 -> HPF Cutoff
        params_.hpfCutoffHz = 20.0f * std::exp2(norm * 6.2f);
        break;
      case 28: // Launchkey Encoder 8 -> LFO Rate
        params_.lfoRateHz = 0.1f + norm * 30.0f;
        break;
      // Launchkey 49/61 Faders 1..4 -> ENV-1 ADSR
      case 53: params_.env1AttackSec  = 0.001f + norm * 2.5f; break;
      case 54: params_.env1DecaySec   = 0.010f + norm * 4.0f; break;
      case 55: params_.env1Sustain    = norm; break;
      case 56: params_.env1ReleaseSec = 0.010f + norm * 4.0f; break;
      // Launchkey 49/61 Faders 5..8 -> ENV-2 ADSR
      case 57:
      case 73: params_.env2AttackSec  = 0.001f + norm * 2.5f; break;
      case 58: params_.env2DecaySec   = 0.010f + norm * 4.0f; break;
      case 59: params_.env2Sustain    = norm; break;
      case 60:
      case 72: params_.env2ReleaseSec = 0.010f + norm * 4.0f; break;
      // Launchkey Fader 9 -> Source Mix VCO-1 / VCO-2
      case 61: params_.sourceMix      = norm; break;
      // Sustain Pedal
      case 64: setSustainPedal(val >= 64); break;
      // Botões/Pads de Atalho
      case 80: params_.hardSync   = (val >= 64); break;
      case 81: params_.vcfSlopeDb = (val >= 64) ? 24 : 12; break;
      case 82: if (val >= 64) runCompuTune(); break;
      case 123: allNotesOff(); break;
      default: break;
    }
  }

  void noteOn(uint8_t midiNote, float velocityNorm) {
    globalAge_++;
    if (params_.keyMode == JP8KeyMode::UNISON) {
      const int stackCount = std::min(4, MaxVoices);
      for (int i = 0; i < stackCount; ++i) {
        const float spread = (static_cast<float>(i) - 1.5f) * (params_.unisonDetuneCents / 100.0f);
        allocateVoice(i, midiNote, velocityNorm, spread);
      }
      return;
    }

    if (params_.keyMode == JP8KeyMode::SOLO) {
      allocateVoice(0, midiNote, velocityNorm, 0.0f);
      return;
    }

    int chosen = -1;
    for (int step = 0; step < MaxVoices; ++step) {
      const int idx = (rrCursor_ + step) % MaxVoices;
      if (!voices_[idx].active || voices_[idx].env2.stage == EnvelopeState::IDLE) {
        chosen = idx;
        rrCursor_ = (idx + 1) % MaxVoices;
        break;
      }
    }
    if (chosen < 0) {
      chosen = 0;
      uint32_t oldestAge = voices_[0].ageCounter;
      for (int i = 1; i < MaxVoices; ++i) {
        if (voices_[i].ageCounter < oldestAge) {
          oldestAge = voices_[i].ageCounter;
          chosen = i;
        }
      }
    }
    allocateVoice(chosen, midiNote, velocityNorm, 0.0f);
  }

  void noteOff(uint8_t midiNote) {
    for (int v = 0; v < MaxVoices; ++v) {
      if (voices_[v].active && voices_[v].midiNote == midiNote) {
        if (sustainPedalHeld_) {
          voices_[v].heldBySustainPedal = true;
        } else {
          voices_[v].env1.releaseNote();
          voices_[v].env2.releaseNote();
        }
      }
    }
  }

  void allNotesOff() {
    sustainPedalHeld_ = false;
    for (int v = 0; v < MaxVoices; ++v) {
      voices_[v].heldBySustainPedal = false;
      voices_[v].env1.releaseNote();
      voices_[v].env2.releaseNote();
    }
  }

  void processSampleStereo(float& outLeft, float& outRight) {
    float accumL = 0.0f;
    float accumR = 0.0f;

    for (int os = 0; os < Oversample; ++os) {
      const float lfoVal = stepLfo(kInternalSampleRate);
      float stepL = 0.0f;
      float stepR = 0.0f;

      for (int v = 0; v < MaxVoices; ++v) {
        if (!voices_[v].active) continue;
        const float sample = renderVoiceSubStep(voices_[v], lfoVal);

#if JP8_STEREO_PAN
        const float pan = (static_cast<float>(v) / std::max(1, MaxVoices - 1));
        const float gainL = 0.85f * (1.0f - 0.35f * pan);
        const float gainR = 0.85f * (0.65f + 0.35f * pan);
        stepL += sample * gainL;
        stepR += sample * gainR;
#else
        stepL += sample;
        stepR += sample;
#endif
      }
      accumL += stepL;
      accumR += stepR;
    }

    const float invOs = (1.0f / static_cast<float>(Oversample)) * 0.28f;
    outLeft  = fastOtaTanh(accumL * invOs);
    outRight = fastOtaTanh(accumR * invOs);

    // Captura de decimação para o osciloscópio da tela TFT ILI9341
    scopeRing_[scopeWriteIdx_ & 0xFF] = outLeft;
    scopeWriteIdx_++;
  }

  int activeVoiceCount() const {
    int count = 0;
    for (int v = 0; v < MaxVoices; ++v) {
      if (voices_[v].active) count++;
    }
    return count;
  }

  uint8_t activeVoiceBitmask() const {
    uint8_t mask = 0;
    for (int v = 0; v < std::min(8, MaxVoices); ++v) {
      if (voices_[v].active) mask |= (1u << v);
    }
    return mask;
  }

  float getScopeSample(uint8_t idx) const {
    return scopeRing_[idx];
  }

private:
  JP8Parameters params_;
  VoiceState voices_[MaxVoices];
  int rrCursor_ = 0;
  uint32_t globalAge_ = 0;
  float lfoPhase_ = 0.0f;
  float lfoHeldRandom_ = 0.0f;
  uint32_t lfoPrng_ = 0xCAFEBABEu;
  float pitchBendNorm_ = 0.0f;
  float modWheelNorm_ = 0.0f;
  bool sustainPedalHeld_ = false;
  float scopeRing_[256] = {0.0f};
  uint8_t scopeWriteIdx_ = 0;

  void allocateVoice(int idx, uint8_t midiNote, float velocityNorm, float unisonSemitones) {
    VoiceState& v = voices_[idx];
    v.active = true;
    v.heldBySustainPedal = false;
    v.midiNote = midiNote;
    v.velocity = std::clamp(velocityNorm, 0.05f, 1.0f);
    if (params_.portamentoSec <= 0.001f) {
      v.currentNotePitch = static_cast<float>(midiNote) + unisonSemitones;
    }
    v.lfoDelayEnv = (params_.lfoDelaySec <= 0.002f) ? 1.0f : 0.0f;
    v.ageCounter = globalAge_;
    v.env1.trigger();
    v.env2.trigger();
  }

  float stepLfo(float sr) {
    const float dt = std::clamp(params_.lfoRateHz / sr, 0.000001f, 0.25f);
    lfoPhase_ += dt;
    if (lfoPhase_ >= 1.0f) {
      lfoPhase_ -= 1.0f;
      lfoPrng_ ^= lfoPrng_ << 13;
      lfoPrng_ ^= lfoPrng_ >> 17;
      lfoPrng_ ^= lfoPrng_ << 5;
      lfoHeldRandom_ = static_cast<int32_t>(lfoPrng_) * 4.6566129e-10f;
    }

    switch (params_.lfoWave) {
      case JP8LfoWave::SINE:
        return std::sin(2.0f * kPi * lfoPhase_);
      case JP8LfoWave::TRIANGLE:
        return 1.0f - 4.0f * std::fabs(lfoPhase_ - 0.5f);
      case JP8LfoWave::SAWTOOTH:
        return 2.0f * lfoPhase_ - 1.0f;
      case JP8LfoWave::SQUARE:
        return (lfoPhase_ < 0.5f) ? 1.0f : -1.0f;
      case JP8LfoWave::RANDOM_SH:
        return lfoHeldRandom_;
    }
    return 0.0f;
  }

  static float renderOscSample(JP8Wave wave, float phase, float dt, float pw,
                               float& triState, VoiceState& v, bool pinkNoise) {
    if (wave == JP8Wave::NOISE) {
      return v.nextNoise(pinkNoise);
    }
    if (wave == JP8Wave::SAWTOOTH) {
      float saw = 2.0f * phase - 1.0f;
      saw -= polyBlep(phase, dt);
      return saw;
    }
    if (wave == JP8Wave::SQUARE || wave == JP8Wave::PULSE) {
      const float duty = (wave == JP8Wave::SQUARE) ? 0.5f : std::clamp(pw, 0.05f, 0.95f);
      float sq = (phase < duty) ? 1.0f : -1.0f;
      sq += polyBlep(phase, dt);
      float shifted = phase - duty;
      if (shifted < 0.0f) shifted += 1.0f;
      sq -= polyBlep(shifted, dt);
      return sq;
    }
    float sq = (phase < 0.5f) ? 1.0f : -1.0f;
    sq += polyBlep(phase, dt);
    float shifted = phase - 0.5f;
    if (shifted < 0.0f) shifted += 1.0f;
    sq -= polyBlep(shifted, dt);
    triState = triState * 0.999f + (4.0f * dt) * sq;
    return std::clamp(triState, -1.0f, 1.0f);
  }

  float computeDac14BitNote(const VoiceCalibration& cal, float targetNote) const {
    const float vIdeal = cal.refVoltageT - cal.scaleWidthW * (84.0f - targetNote);
    const float qCode = std::round(std::clamp((vIdeal / 10.0f) * 16384.0f, 0.0f, 16383.0f));
    const float vQuant = (qCode / 16384.0f) * 10.0f;
    return 84.0f - (cal.refVoltageT - vQuant) / cal.scaleWidthW + (cal.thermalDriftCents / 100.0f);
  }

  float renderVoiceSubStep(VoiceState& v, float lfoVal) {
    const float sr = kInternalSampleRate;

    // 1. Envelopes IR3R01 + LFO Delay (TR23~TR27 + BA662 IC8 Pág. 13)
    const float e1 = v.env1.process(params_.env1AttackSec, params_.env1DecaySec,
                                    params_.env1Sustain, params_.env1ReleaseSec,
                                    params_.env1KeyFollow, v.midiNote, sr);
    const float e2 = v.env2.process(params_.env2AttackSec, params_.env2DecaySec,
                                    params_.env2Sustain, params_.env2ReleaseSec,
                                    params_.env2KeyFollow, v.midiNote, sr);

    if (v.env2.stage == EnvelopeState::IDLE) {
      v.active = false;
      return 0.0f;
    }

    if (params_.lfoDelaySec > 0.002f && v.lfoDelayEnv < 1.0f) {
      const float delayCoef = 1.0f - std::exp(-1.0f / (params_.lfoDelaySec * sr));
      v.lfoDelayEnv = std::min(1.0f, v.lfoDelayEnv + delayCoef * (1.05f - v.lfoDelayEnv));
    }
    const float effectiveLfo = lfoVal * std::max(v.lfoDelayEnv, modWheelNorm_);

    // 2. Portamento analógico (Pág. 19) + Pitch Bend (Bender OPH132 Pág. 24)
    if (params_.portamentoSec > 0.001f) {
      const float target = static_cast<float>(v.midiNote);
      const float coef = 1.0f - std::exp(-1.0f / (params_.portamentoSec * sr));
      v.currentNotePitch += coef * (target - v.currentNotePitch);
    }
    const float bentNotePitch = v.currentNotePitch + (pitchBendNorm_ * params_.pitchBendRangeSemi);

    // 3. Frequências VCO-2 e VCO-1 com quantização 14-bit Compu-Tune + X-MOD + Hard Sync
    const float pitch2Note = computeDac14BitNote(
      v.cal[1],
      bentNotePitch + static_cast<float>(params_.vco2OctaveShift * 12) + (params_.vco2FineCents / 100.0f)
    );
    float freq2 = 440.0f * std::exp2((pitch2Note - 69.0f) / 12.0f);
    if (params_.vco2LowFreq) freq2 *= 0.0625f;
    const float dt2 = std::clamp(freq2 / sr, 0.00001f, 0.45f);

    v.phase2 += dt2;
    bool syncTriggered = false;
    float syncFrac = 0.0f;
    if (v.phase2 >= 1.0f) {
      v.phase2 -= 1.0f;
      syncTriggered = params_.hardSync;
      syncFrac = v.phase2 / dt2;
    }

    const float vco2Out = renderOscSample(params_.vco2Wave, v.phase2, dt2, params_.vco2Pw,
                                          v.triIntegrator2, v, params_.vco2LowFreq);

    const float xModOctaves = (params_.crossModDepth * 0.6f) * vco2Out;
    const float envOctaves  = (params_.vco1ModEnv * 0.25f) * e1;
    const float lfoOctaves  = ((params_.vco1ModLfo * 0.08f) + (modWheelNorm_ * 0.12f)) * effectiveLfo;

    const float pitch1Note = computeDac14BitNote(
      v.cal[0],
      bentNotePitch + static_cast<float>(params_.vco1OctaveShift * 12)
    );
    const float freq1 = 440.0f * std::exp2(((pitch1Note - 69.0f) / 12.0f) + xModOctaves + envOctaves + lfoOctaves);
    const float dt1 = std::clamp(freq1 / sr, 0.00001f, 0.45f);

    v.phase1 += dt1;
    if (v.phase1 >= 1.0f) v.phase1 -= 1.0f;
    if (syncTriggered) {
      v.phase1 = std::clamp(syncFrac * dt1, 0.0f, 0.9999f);
    }

    const float pw1 = std::clamp(params_.vco1Pw + (params_.vco1PwmDepth * 0.04f) * effectiveLfo, 0.05f, 0.95f);
    const float vco1Out = renderOscSample(params_.vco1Wave, v.phase1, dt1, pw1,
                                          v.triIntegrator1, v, false);

    // 4. Source Mix (BA662 IC28A)
    const float mixed = vco1Out * (1.0f - params_.sourceMix) + vco2Out * params_.sourceMix;

    // 5. HPF 1-Polo (TR19A + IC26A)
    const float hpfG = std::clamp(params_.hpfCutoffHz / sr, 0.0001f, 0.45f);
    v.hpfState += hpfG * (mixed - v.hpfState);
    const float hpfOut = mixed - v.hpfState;

    // 6. VCF Roland IR3109 (4-Stage Cascaded OTA ZDF TPT Ladder)
    const float vcfEnvVal = params_.vcfEnvFromEnv2 ? e2 : e1;
    const float kfSemi = (bentNotePitch - 60.0f) * params_.vcfKeyFollow;
    const float modOct = (params_.vcfEnvMod * 0.45f * static_cast<float>(params_.vcfEnvPolarity) * vcfEnvVal)
                       + (params_.vcfLfoMod * 0.25f * effectiveLfo);
    const float dynCutoff = std::clamp(
      params_.vcfCutoffHz * std::exp2((kfSemi / 12.0f) + modOct),
      25.0f, sr * 0.42f
    );

    const float g = std::tan(kPi * dynCutoff / sr);
    const float G = g / (1.0f + g);
    const float kRes = (params_.vcfResonance / 10.0f) * 3.85f;

#if JP8_USE_ZDF
    const float G2 = G * G;
    const float G3 = G2 * G;
    const float G4 = G2 * G2;
    const float S = G3 * v.vcfState[0] + G2 * v.vcfState[1] + G * v.vcfState[2] + v.vcfState[3];
    const float u = (hpfOut - kRes * S) / (1.0f + kRes * G4);

    const float v0 = G * fastOtaTanh(u - v.vcfState[0]);   const float y0 = v0 + v.vcfState[0]; v.vcfState[0] = y0 + v0;
    const float v1 = G * fastOtaTanh(y0 - v.vcfState[1]);  const float y1 = v1 + v.vcfState[1]; v.vcfState[1] = y1 + v1;
    const float v2 = G * fastOtaTanh(y1 - v.vcfState[2]);  const float y2 = v2 + v.vcfState[2]; v.vcfState[2] = y2 + v2;
    const float v3 = G * fastOtaTanh(y2 - v.vcfState[3]);  const float y3 = v3 + v.vcfState[3]; v.vcfState[3] = y3 + v3;
    const float vcfOut = (params_.vcfSlopeDb == 12) ? y1 : y3;
#else
    float stageIn = hpfOut - kRes * v.vcfState[3];
    for (int p = 0; p < 4; ++p) {
      v.vcfState[p] += G * (stageIn - v.vcfState[p]);
      stageIn = v.vcfState[p];
    }
    const float vcfOut = (params_.vcfSlopeDb == 12) ? v.vcfState[1] : v.vcfState[3];
#endif

    // 7. VCA BA662A (ENV-2 * VCA Level * Velocity)
    const float lfoVca = 1.0f + (params_.vcaLfoMod * 0.15f) * effectiveLfo;
    return vcfOut * e2 * params_.vcaLevel * v.velocity * lfoVca;
  }
};

} // namespace jp8
`;

  const audioSynthHeader = `#pragma once
#include <Arduino.h>
#include <AudioStream.h>
#include "JP8Parameters.h"
#include "JP8DspCore.h"

/**
 * AudioSynthJupiter8 — Wrapper Teensy Audio Library (AudioStream @ 44.1kHz)
 * Conecta o motor DSP C++17 (Oversampling ${oversampling}x = ${internalSr} Hz)
 * diretamente ao barramento I2S (PCM5102A / SGTL5000) e USB Audio do Teensy 4.1.
 */
class AudioSynthJupiter8 : public AudioStream {
public:
  AudioSynthJupiter8() : AudioStream(0, nullptr) {
    engine_.setParameters(makeDefaultJP8Patch());
  }

  void noteOn(uint8_t midiNote, uint8_t velocity127);
  void noteOff(uint8_t midiNote);
  void allNotesOff();
  void runCompuTune();
  void setPitchBend(float normMinus1To1);
  void applyLaunchkeyCC(uint8_t cc, uint8_t val);
  void loadPresetSlot(uint8_t slot);

  void setParameters(const JP8Parameters& p);
  JP8Parameters getParameters() const;
  int activeVoices() const;
  uint8_t activeVoiceMask() const;
  float getScopeSample(uint8_t idx) const;

  virtual void update(void) override;

private:
  jp8::JP8DspEngine<JP8_MAX_VOICES, JP8_OVERSAMPLE> engine_;
};
`;

  const audioSynthCpp = `#include "AudioSynthJupiter8.h"
#include <algorithm>
#include <cmath>

void AudioSynthJupiter8::noteOn(uint8_t midiNote, uint8_t velocity127) {
  __disable_irq();
  engine_.noteOn(midiNote, static_cast<float>(velocity127) / 127.0f);
  __enable_irq();
}

void AudioSynthJupiter8::noteOff(uint8_t midiNote) {
  __disable_irq();
  engine_.noteOff(midiNote);
  __enable_irq();
}

void AudioSynthJupiter8::allNotesOff() {
  __disable_irq();
  engine_.allNotesOff();
  __enable_irq();
}

void AudioSynthJupiter8::runCompuTune() {
  __disable_irq();
  engine_.runCompuTune();
  __enable_irq();
}

void AudioSynthJupiter8::setPitchBend(float normMinus1To1) {
  __disable_irq();
  engine_.setPitchBend(normMinus1To1);
  __enable_irq();
}

void AudioSynthJupiter8::applyLaunchkeyCC(uint8_t cc, uint8_t val) {
  __disable_irq();
  engine_.applyLaunchkeyMidiCC(cc, val);
  __enable_irq();
}

void AudioSynthJupiter8::loadPresetSlot(uint8_t slot) {
  __disable_irq();
  engine_.setParameters(makeFactoryPresetBank(slot));
  __enable_irq();
}

void AudioSynthJupiter8::setParameters(const JP8Parameters& p) {
  __disable_irq();
  engine_.setParameters(p);
  __enable_irq();
}

JP8Parameters AudioSynthJupiter8::getParameters() const {
  return engine_.parameters();
}

int AudioSynthJupiter8::activeVoices() const {
  return engine_.activeVoiceCount();
}

uint8_t AudioSynthJupiter8::activeVoiceMask() const {
  return engine_.activeVoiceBitmask();
}

float AudioSynthJupiter8::getScopeSample(uint8_t idx) const {
  return engine_.getScopeSample(idx);
}

void AudioSynthJupiter8::update(void) {
  audio_block_t* blockL = allocate();
  audio_block_t* blockR = allocate();
  if (!blockL || !blockR) {
    if (blockL) release(blockL);
    if (blockR) release(blockR);
    return;
  }

  for (int i = 0; i < AUDIO_BLOCK_SAMPLES; ++i) {
    float left = 0.0f;
    float right = 0.0f;
    engine_.processSampleStereo(left, right);

    const float clampedL = std::clamp(left, -1.0f, 1.0f);
    const float clampedR = std::clamp(right, -1.0f, 1.0f);
    blockL->data[i] = static_cast<int16_t>(lrintf(clampedL * 32767.0f));
    blockR->data[i] = static_cast<int16_t>(lrintf(clampedR * 32767.0f));
  }

  transmit(blockL, 0);
  transmit(blockR, 1);
  release(blockL);
  release(blockR);
}
`;

  const mainCpp = `// ============================================================================
// main.cpp — Firmware Operável Completo: Teensy 4.1 + TRS 3.5mm MIDI + PCM5102A + ILI9341
//
// Arquitetura de Hardware Ideal Selecionada:
//   1. Placa: Teensy 4.1 (Cortex-M7 @ 600MHz)
//   2. MIDI Primário: Conector TRS 3.5mm (P2/P1) Padrão MIDI Type-A @ 31.250 bps
//      no Serial1 (RX1 = Pino 0 c/ Optoacoplador 6N138/H11L1, TX1 = Pino 1 MIDI Out/Thru)
//      conectado por cabo P2-P2 estéreo direto na saída MIDI Out 3.5mm do Launchkey MK4!
//   3. Áudio: DAC I2S 32-bit PCM5102A (BCLK=21, LRCLK=20, DIN=7, SCK=GND)
//   4. Tela:  Display IPS TFT 2.8" ILI9341 320x240 SPI (CS=10, DC=9, RST=8, MOSI=11, SCK=13)
// ============================================================================
#include <Arduino.h>
#include "AudioSynthJupiter8.h"
#include <Audio.h>
#include <MIDI.h>
#include <USBHost_t36.h>
#include <SPI.h>
#include <ILI9341_t3.h>
#ifdef swap
#undef swap
#endif

// --- 1. Subsistema de Áudio I2S (PCM5102A 32-Bit DAC + SGTL5000 + USB Audio) ---
AudioSynthJupiter8     jp8Synth;
AudioOutputI2S         i2sOut;     // PCM5102A (sem MCLK) ou SGTL5000 nos pinos 21, 20, 7
AudioOutputUSB         usbOut;     // Áudio digital direto para DAW via USB Device
AudioControlSGTL5000   sgtl5000;   // Inicializado automaticamente caso Audio Shield esteja plugado

AudioConnection        patchCordL1(jp8Synth, 0, i2sOut, 0);
AudioConnection        patchCordR1(jp8Synth, 1, i2sOut, 1);
AudioConnection        patchCordL2(jp8Synth, 0, usbOut, 0);
AudioConnection        patchCordR2(jp8Synth, 1, usbOut, 1);

// --- 2. Subsistema MIDI Primário: TRS 3.5mm (P2/P1) Type-A no Serial1 (31.250 bps) ---
// Pinagem TRS MIDI Type-A (Novation Launchkey MK4 & MIDI Association Standard):
//   - Tip (Ponta)   = Pino 5 DIN (Sink / Dados MIDI) -> Pino 3 do Opto 6N138 (via 220R)
//   - Ring (Anel)   = Pino 4 DIN (Source +3.3V/+5V)  -> Pino 2 do Opto 6N138 (via 220R)
//   - Sleeve (Base) = Pino 2 DIN (Shield / GND na saída MIDI Out; flutuante na entrada MIDI In)
//   - Saída do Opto (Pino 6 do 6N138 c/ pull-up 470R p/ 3.3V) -> Teensy 4.1 Pino 0 (RX1)
//   - MIDI Out/Thru TRS (Tip via 33R do Pino 1 TX1, Ring via 10R do +3.3V) -> Teensy 4.1 Pino 1 (TX1)
struct TrsMidiSerialSettings : public midi::DefaultSettings {
  static const long BaudRate = 31250;
  static const bool UseRunningStatus = true;
};
MIDI_CREATE_CUSTOM_INSTANCE(HardwareSerial, Serial1, trsMidi, TrsMidiSerialSettings);

// Buffer de Hardware UART adicional para garantir zero perda de pacotes em sweeps de 8 encoders
static uint8_t serial1RxBuffer[256];
static uint8_t serial1TxBuffer[128];

// --- 3. Subsistema USB Host (Fallback secundário opcional) ---
USBHost                myusb;
USBHub                 hub1(myusb);
MIDIDevice_BigBuffer   launchkeyHostMidi(myusb);

// --- 4. Subsistema de Tela Colorida IPS 2.8" ILI9341 (320x240 SPI) ---
constexpr uint8_t TFT_CS  = 10;
constexpr uint8_t TFT_DC  = 9;
constexpr uint8_t TFT_RST = 8;
ILI9341_t3 tft = ILI9341_t3(TFT_CS, TFT_DC, TFT_RST);

constexpr uint8_t TUNE_BTN_PIN = 6;
static uint8_t currentPresetSlot = 0;
static uint8_t lastMovedCC = 21;
static uint8_t lastMovedVal = 64;
static uint32_t trsMidiPacketCount = 0;
static bool uiDirty = true;

// --- Callbacks Unificados de Performance (TRS 3.5mm MIDI Type-A + USB Fallback) ---
void handleNoteOn(uint8_t channel, uint8_t note, uint8_t velocity) {
  trsMidiPacketCount++;
  if (velocity == 0) {
    jp8Synth.noteOff(note);
    uiDirty = true;
    return;
  }
  // No Launchkey MK4, os Pads RGB (canal 10 ou notas 36..43) acionam Presets e Funções JP-8
  if (channel == 10 && note >= 36 && note <= 43) {
    const uint8_t padIndex = note - 36;
    if (padIndex < 5) {
      currentPresetSlot = padIndex;
      jp8Synth.loadPresetSlot(currentPresetSlot);
    } else if (padIndex == 5) {
      JP8Parameters p = jp8Synth.getParameters();
      p.hardSync = !p.hardSync;
      jp8Synth.setParameters(p);
    } else if (padIndex == 6) {
      JP8Parameters p = jp8Synth.getParameters();
      p.vcfSlopeDb = (p.vcfSlopeDb == 24) ? 12 : 24;
      jp8Synth.setParameters(p);
    } else if (padIndex == 7) {
      jp8Synth.runCompuTune();
    }
    uiDirty = true;
    return;
  }
  jp8Synth.noteOn(note, velocity);
  uiDirty = true;
}

void handleNoteOff(uint8_t channel, uint8_t note, uint8_t velocity) {
  (void)channel;
  (void)velocity;
  trsMidiPacketCount++;
  jp8Synth.noteOff(note);
  uiDirty = true;
}

void handleControlChange(uint8_t channel, uint8_t cc, uint8_t val) {
  (void)channel;
  trsMidiPacketCount++;
  jp8Synth.applyLaunchkeyCC(cc, val);
  lastMovedCC = cc;
  lastMovedVal = val;
  uiDirty = true;
}

void handlePitchBend(uint8_t channel, int bend) {
  (void)channel;
  trsMidiPacketCount++;
  // MIDI Library (TRS Serial1) envia bend entre -8192 e +8191
  float norm = 0.0f;
  if (bend >= 0 && bend <= 16383 && bend != 8192) {
    norm = (static_cast<float>(bend) - 8192.0f) / 8192.0f;
  } else {
    norm = static_cast<float>(bend) / 8192.0f;
  }
  jp8Synth.setPitchBend(norm);
}

void handleProgramChange(uint8_t channel, uint8_t program) {
  (void)channel;
  trsMidiPacketCount++;
  currentPresetSlot = program % 5;
  jp8Synth.loadPresetSlot(currentPresetSlot);
  uiDirty = true;
}

// --- Renderizador Gráfico do Painel Jupiter-8 no Display ILI9341 (320x240) ---
void drawJupiterDashboard() {
  const JP8Parameters p = jp8Synth.getParameters();
  const uint8_t voiceMask = jp8Synth.activeVoiceMask();

  // Topo estilo Roland JP-8 (Barra Laranja & Telemetria TRS MIDI 31.25kbps)
  tft.fillRect(0, 0, 320, 28, 0x0841);
  tft.drawFastHLine(0, 28, 320, 0xFBE0);
  tft.setTextColor(0xFBE0);
  tft.setTextSize(1);
  tft.setCursor(8, 6);
  tft.print("ROLAND JP-8 // TEENSY 4.1 [TRS 3.5mm MIDI TYPE-A]");
  tft.setCursor(8, 17);
  tft.setTextColor(0x07FF);
  tft.printf("CPU:%.1f%% | TRS RX1:%lu | CC#%d=%d",
             AudioProcessorUsage(), static_cast<unsigned long>(trsMidiPacketCount),
             lastMovedCC, lastMovedVal);

  // Display Patch Number & Nome
  tft.fillRect(8, 34, 304, 30, 0x1082);
  tft.setTextColor(0xF800);
  tft.setTextSize(2);
  tft.setCursor(14, 41);
  tft.printf("P%d", currentPresetSlot + 1);
  tft.setTextColor(0xFFFF);
  tft.setCursor(54, 41);
  tft.print(p.patchName);

  // 8 LEDs de Vozes A..H (Pág. 30 Service Notes)
  const char* vLabels = "ABCDEFGH";
  for (int v = 0; v < 8; ++v) {
    const bool lit = (voiceMask & (1u << v)) != 0;
    const int x = 8 + v * 38;
    tft.fillRect(x, 70, 34, 18, lit ? 0xFBE0 : 0x18E3);
    tft.setTextColor(lit ? 0x0000 : 0x7BEF);
    tft.setTextSize(1);
    tft.setCursor(x + 14, 75);
    tft.print(vLabels[v]);
  }

  // Telemetria dos 8 Encoders do Launchkey MK4 via TRS MIDI
  tft.fillRect(8, 94, 304, 68, 0x0841);
  tft.setTextColor(0x07FF);
  tft.setTextSize(1);
  tft.setCursor(12, 99);
  tft.printf("IR3109 CUT: %5.0fHz | RES: %3.1f | SLOPE: -%ddB",
             p.vcfCutoffHz, p.vcfResonance, p.vcfSlopeDb);
  tft.setCursor(12, 113);
  tft.printf("ENV MOD: %4.1f     | HPF: %4.0fHz | LFO: %4.1fHz",
             p.vcfEnvMod, p.hpfCutoffHz, p.lfoRateHz);
  tft.setCursor(12, 127);
  tft.printf("X-MOD: %4.1f       | DETUNE: %+3.0fc | SYNC: %s",
             p.crossModDepth, p.vco2FineCents, p.hardSync ? "ON " : "OFF");
  tft.setCursor(12, 141);
  tft.printf("ENV2 A:%.2fs D:%.2fs S:%.0f%% R:%.2fs | MIX:%.0f%%",
             p.env2AttackSec, p.env2DecaySec, p.env2Sustain * 100.0f,
             p.env2ReleaseSec, p.sourceMix * 100.0f);

  // Osciloscópio Real-Time na base da tela (y = 168..232)
  tft.fillRect(8, 166, 304, 68, 0x0000);
  tft.drawRect(8, 166, 304, 68, 0x3186);
  int prevY = 200;
  for (int x = 0; x < 300; ++x) {
    const float s = jp8Synth.getScopeSample(static_cast<uint8_t>((x * 256) / 300));
    const int y = constrain(200 - static_cast<int>(s * 28.0f), 168, 231);
    if (x > 0) {
      tft.drawLine(9 + x, prevY, 10 + x, y, 0x07E0);
    }
    prevY = y;
  }
}

void setup() {
  AudioMemory(32);
  Serial.begin(115200);
  pinMode(TUNE_BTN_PIN, INPUT_PULLUP);

  // 1. Inicializa Codec SGTL5000 (se presente); o PCM5102A funciona direto via I2S sem I2C
  sgtl5000.enable();
  sgtl5000.volume(0.75f);

  // 2. Inicializa Tela TFT ILI9341 320x240 SPI
  tft.begin();
  tft.setRotation(1);
  tft.fillScreen(0x0000);

  // 3. Inicializa MIDI Primário TRS 3.5mm (P2/P1) Type-A no Serial1 (RX1=Pino 0, TX1=Pino 1)
  Serial1.addMemoryForRead(serial1RxBuffer, sizeof(serial1RxBuffer));
  Serial1.addMemoryForWrite(serial1TxBuffer, sizeof(serial1TxBuffer));
  trsMidi.setHandleNoteOn(handleNoteOn);
  trsMidi.setHandleNoteOff(handleNoteOff);
  trsMidi.setHandleControlChange(handleControlChange);
  trsMidi.setHandlePitchBend(handlePitchBend);
  trsMidi.setHandleProgramChange(handleProgramChange);
  trsMidi.begin(MIDI_CHANNEL_OMNI);
  // Habilita Soft MIDI Thru no TX1 (Pino 1) para encadear outros synths via P2 TRS
  trsMidi.turnThruOn();

  // 4. Inicializa USB Host & USB Device como entradas secundárias simultâneas
  myusb.begin();
  launchkeyHostMidi.setHandleNoteOn(handleNoteOn);
  launchkeyHostMidi.setHandleNoteOff(handleNoteOff);
  launchkeyHostMidi.setHandleControlChange(handleControlChange);
  launchkeyHostMidi.setHandlePitchChange(handlePitchBend);
  launchkeyHostMidi.setHandleProgramChange(handleProgramChange);

  usbMIDI.setHandleNoteOn(handleNoteOn);
  usbMIDI.setHandleNoteOff(handleNoteOff);
  usbMIDI.setHandleControlChange(handleControlChange);
  usbMIDI.setHandlePitchChange(handlePitchBend);
  usbMIDI.setHandleProgramChange(handleProgramChange);

  jp8Synth.setParameters(makeDefaultJP8Patch());
  drawJupiterDashboard();
}

elapsedMillis displayTimer;
elapsedMillis tuneDebounceTimer;
bool lastTuneBtnState = HIGH;

void loop() {
  // Prioridade #1: Leitura UART Hardware Serial1 (Conector TRS 3.5mm / P1-P2 @ 31.250 bps)
  while (trsMidi.read()) {}

  // Prioridade #2: USB Host & USB Device (opcionais)
  myusb.Task();
  while (launchkeyHostMidi.read()) {}
  while (usbMIDI.read()) {}

  // Botão físico COMPU-TUNE não-bloqueante (zero travamento de MIDI)
  const bool tuneBtn = digitalRead(TUNE_BTN_PIN);
  if (tuneBtn == LOW && lastTuneBtnState == HIGH && tuneDebounceTimer > 250) {
    tuneDebounceTimer = 0;
    jp8Synth.runCompuTune();
    uiDirty = true;
  }
  lastTuneBtnState = tuneBtn;

  // Atualiza tela ILI9341 a ~25 FPS quando houver atividade
  if (displayTimer >= 40) {
    displayTimer = 0;
    if (uiDirty || jp8Synth.activeVoices() > 0) {
      drawJupiterDashboard();
      uiDirty = false;
    }
  }
}
`;

  const nativeTestCpp = `// ============================================================================
// test_jp8_dsp_native.cpp — Testes Unitários Nativos C++17 do Motor DSP JP-8
// Valida DSP, Presets de Fábrica e Mapeamento Completo do Launchkey MK4!
// ============================================================================
#include <cassert>
#include <cmath>
#include <iostream>
#include "JP8DspCore.h"

int main() {
  // 1. Verificar saturação Padé OTA do IR3109 e PolyBLEP
  assert(std::fabs(jp8::fastOtaTanh(0.0f)) < 1e-6f);
  assert(jp8::fastOtaTanh(5.0f) == 1.0f);
  assert(jp8::fastOtaTanh(-5.0f) == -1.0f);
  assert(jp8::polyBlep(0.5f, 0.01f) == 0.0f);
  assert(jp8::polyBlep(0.001f, 0.01f) < 0.0f);

  // 2. Instanciar o motor polifônico completo com o patch configurado
  jp8::JP8DspEngine<JP8_MAX_VOICES, JP8_OVERSAMPLE> engine;
  JP8Parameters p = makeDefaultJP8Patch();
  engine.setParameters(p);

  // 3. Testar Mapeamento de Encoders e Faders do Novation Launchkey MK4 (via TRS MIDI 31.250 bps)
  engine.applyLaunchkeyMidiCC(21, 100); // Encoder 1: VCF Cutoff
  assert(engine.parameters().vcfCutoffHz > 2000.0f);
  engine.applyLaunchkeyMidiCC(22, 64);  // Encoder 2: VCF Resonance
  assert(engine.parameters().vcfResonance > 4.5f && engine.parameters().vcfResonance < 5.5f);
  engine.applyLaunchkeyMidiCC(24, 64);  // Encoder 4: X-MOD Depth
  assert(engine.parameters().crossModDepth > 4.5f);
  engine.applyLaunchkeyMidiCC(80, 127); // Pad 6 / CC 80: Hard Sync ON
  assert(engine.parameters().hardSync == true);
  engine.applyLaunchkeyMidiCC(81, 0);   // Pad 7 / CC 81: Slope 12dB
  assert(engine.parameters().vcfSlopeDb == 12);

  // 4. Testar Pedal de Sustain (CC 64) + Pitch Bend + Mod Wheel
  engine.setPitchBend(0.5f);
  engine.applyLaunchkeyMidiCC(1, 90);   // Mod Wheel
  engine.applyLaunchkeyMidiCC(64, 127); // Sustain Pedal Down

  engine.noteOn(60, 0.9f);
  engine.noteOff(60); // Deve continuar soando por causa do pedal de sustain!
  assert(engine.activeVoiceCount() == 1);

  float peak = 0.0f;
  for (int i = 0; i < 4410; ++i) {
    float l = 0.0f, r = 0.0f;
    engine.processSampleStereo(l, r);
    assert(std::isfinite(l) && std::isfinite(r));
    assert(l >= -1.05f && l <= 1.05f);
    peak = std::max(peak, std::fabs(l));
  }
  assert(peak > 0.05f);

  // Soltar pedal de sustain e verificar liberação das vozes
  engine.applyLaunchkeyMidiCC(64, 0);
  engine.allNotesOff();
  for (int i = 0; i < 44100 * 6; ++i) {
    float l = 0.0f, r = 0.0f;
    engine.processSampleStereo(l, r);
  }
  assert(engine.activeVoiceCount() == 0);

  // 5. Verificar os 5 Presets de Fábrica (Pads 1..5 do Launchkey MK4)
  for (uint8_t slot = 0; slot < 5; ++slot) {
    JP8Parameters preset = makeFactoryPresetBank(slot);
    assert(preset.patchName != nullptr);
  }

  std::cout << "[OK] JP-8 C++17 DSP Engine + TRS 3.5mm MIDI Launchkey MK4 passou em todos os testes (peak=" << peak << ")\\n";
  return 0;
}
`;

  const readmeMd = `# Roland Jupiter-8 DSP Engine — Stack Ideal: Teensy 4.1 + TRS 3.5mm MIDI (P2/P1) + PCM5102A + ILI9341

Este repositório contém o firmware C++17 completo, compilável e 100% operável da réplica do **Roland Jupiter-8** para o **Teensy 4.1**, projetado para conexão via **MIDI Padrão por pino TRS 3.5mm (P2/P1 — Padrão MIDI Type-A)** diretamente da saída \`MIDI OUT 3.5mm\` do **Novation Launchkey MK4**.

## 1. Conexão MIDI Padrão via Conector TRS 3.5mm (P2 / P1 — Padrão MIDI Type-A)

O **Novation Launchkey MK4** (inclusive os modelos 25 e 37 Mini) possui saída física **MIDI Out em conector TRS 3.5mm (P2) padrão Type-A** (o padrão oficial da MIDI Association). Usando um jack fêmea TRS 3.5mm (ou P1 2.5mm com adaptador) no Teensy 4.1 ligado ao \`Serial1\` (\`RX1 = Pino 0\`, \`TX1 = Pino 1\` a \`31.250 bps\`), você conecta o controlador diretamente com um **cabo estéreo P2-P2 comum**, sem depender de pilha USB Host e com **isolamento galvânico por optoacoplador** (zero ruído de loop de terra no áudio!).

### Esquema Elétrico TRS MIDI IN (Conector P2/P1 Fêmea → Optoacoplador 6N138 → Teensy Pino 0 RX1)
- **Tip (Ponta do P2/P1 — MIDI Sink / Pino 5 DIN)**: ligar ao **Pino 3 (Cátodo LED)** do optoacoplador **6N138** (ou **H11L1**).
- **Ring (Anel do P2/P1 — MIDI Source / Pino 4 DIN)**: ligar através de um **resistor de 220 Ω** ao **Pino 2 (Ânodo LED)** do **6N138**.
- **Diodo 1N4148 de proteção**: ligar em antiparalelo entre os pinos 2 e 3 do 6N138 (Cátodo no Pino 2, Ânodo no Pino 3).
- **Sleeve (Base/Terra do P2/P1)**: deixar **desconectado (flutuante)** no jack de entrada MIDI IN (padrão oficial MIDI para evitar ground loop).
- **Saída do 6N138 para o Teensy 4.1 (3.3V Logic)**:
  - **Pino 8 (VCC)** do 6N138 → **+3.3V** do Teensy 4.1 (com capacitor de desacoplamento 100nF para o GND).
  - **Pino 5 (GND)** do 6N138 → **GND** do Teensy 4.1.
  - **Pino 6 (Vo)** do 6N138 → ligar direto ao **Pino 0 (RX1)** do Teensy 4.1 + **resistor pull-up de 470 Ω para +3.3V**.
  - **Pino 7 (Vb)** do 6N138 → resistor de **4.7 kΩ para o GND**.

### Esquema Elétrico TRS MIDI OUT / THRU (Teensy Pino 1 TX1 → Conector P2/P1 Fêmea)
- **Ring (Anel — Source)**: ligar ao **+3.3V** do Teensy 4.1 através de um **resistor de 10 Ω**.
- **Tip (Ponta — Sink)**: ligar ao **Pino 1 (TX1)** do Teensy 4.1 através de um **resistor de 33 Ω**.
- **Sleeve (Base — Shield)**: ligar ao **GND** do Teensy 4.1.

## 2. O Conjunto Ideal de Hardware (Bill of Materials)

| Componente | Modelo Escolhido | Conexão no Teensy 4.1 |
| :--- | :--- | :--- |
| **Microcontrolador** | **Teensy 4.1** (ARM Cortex-M7 @ 600 MHz) | Processamento DSP em 64-bit FPU + UART \`Serial1\` c/ FIFO dedicado para MIDI 31.250 bps. |
| **Interface MIDI Padrão** | **Jack TRS 3.5mm (P2) ou 2.5mm (P1) Type-A + Opto 6N138** | \`RX1 = Pino 0\` (MIDI IN do Launchkey MK4), \`TX1 = Pino 1\` (MIDI OUT / Soft Thru). |
| **Saída de Áudio (DAC)** | **Módulo I2S PCM5102A (Placa Roxa GY-PCM5102)** | \`BCLK = Pino 21\`, \`LRCLK = Pino 20\`, \`DIN = Pino 7\`, \`SCK = GND\`, \`VIN = 3.3V\`. |
| **Tela / Display** | **Display IPS TFT 2.8" ILI9341 (320×240 SPI — Placa Vermelha)** | \`CS = 10\`, \`DC = 9\`, \`RST = 8\`, \`MOSI = 11\`, \`SCK = 13\`, \`MISO = 12\`, \`VCC/LED = 3.3V\`. |

## 3. Mapeamento do Novation Launchkey MK4 via TRS MIDI

- **Encoders 1 a 8 (\`CC 21..28\`)**: VCF Cutoff (\`CC 21\`), Resonance (\`CC 22\`), Env Mod (\`CC 23\`), Cross-Mod (\`CC 24\`), VCO-2 Fine (\`CC 25\`), Pulse Width (\`CC 26\`), HPF (\`CC 27\`), LFO Rate (\`CC 28\`).
- **Faders 1 a 4 (\`CC 53..56\`)**: ENV-1 ADSR (\`IR3R01 IC38A\`) | **Faders 5 a 8 (\`CC 57..60\`)**: ENV-2 ADSR (\`IR3R01 IC36A\`) | **Fader 9 (\`CC 61\`)**: Source Mix.
- **Pads RGB 1 a 5 (Notas \`36..40\` Ch 10)**: Presets \`A1..B1\` | **Pad 6 (\`CC 80\`)**: Hard Sync | **Pad 7 (\`CC 81\`)**: Filtro 12/24 dB | **Pad 8 (\`CC 82\`)**: Compu-Tune.
`;

  const hardwareSchematicMd = `# Esquema Elétrico Completo e Guia de Montagem — Roland Jupiter-8 no Teensy 4.1

Este documento traz o **esquema elétrico passo a passo**, a **lista de componentes auxiliares** e a **tabela ponto-a-ponto (Netlist)** para montar os 4 módulos na bancada (Protoboard ou Placa de Circuito Impresso Universal 2.54mm).

---

## 1. Lista de Materiais Completa (Bill of Materials)

### Módulos Principais (Comprados no Mercado Livre)
1. **Placa Microcontroladora**: \`PJRC Teensy 4.1\` (ARM Cortex-M7 @ 600 MHz) + Barras de pinos 2.54mm.
2. **Módulo de Áudio I2S**: \`DAC Estéreo PCM5102A I2S\` (Placa Roxa \`GY-PCM5102\` com saída P2 integrada).
3. **Tela Colorida**: \`Display LCD TFT 2.8" ILI9341 240x320 SPI\` (Placa Vermelha de 14 pinos).
4. **Cabo MIDI**: \`Cabo MIDI P2 TRS (3.5mm) para DIN-5 Tipo A (TMA) Rockboard 60cm\`.

### Componentes Passivos para a Entrada MIDI TRS 3.5mm (Isolamento Óptico)
- **1× Jack P2 Fêmea Estéreo 3.5mm** para placa/painel (ex: \`PJ-307\` ou \`PJ-320A\`).
- **1× Optoacoplador \`6N138\`** (encapsulamento DIP-8) + Soquete DIP-8.
- **1× Diodo de sinal \`1N4148\`** (proteção contra inversão do LED interno do 6N138).
- **1× Resistor \`220 Ω\` (1/4W)** — limita a corrente do loop MIDI no Pino 2 do 6N138.
- **1× Resistor \`470 Ω\` (1/4W)** — pull-up da saída Pino 6 do 6N138 para o **+3.3V** da Teensy 4.1.
- **1× Resistor \`4.7 kΩ\` (1/4W)** — descarrega a base do fotodarlington (Pino 7 do 6N138 para o GND).
- **1× Capacitor Cerâmico \`100 nF\` (0.1 µF)** — desacoplamento entre Pino 8 (+3.3V) e Pino 5 (GND) do 6N138.

---

## 2. Diagrama Esquemático ASCII (Visão Geral de Bancada)

\`\`\`text
====================================================================================================
[1] ENTRADA MIDI P2 TRS 3.5mm (CABO ROCKBOARD DIN-5 -> P2 TRS TIPO A)
====================================================================================================

  Launchkey MK4 [MIDI OUT DIN-5] ===(Cabo Rockboard Tipo A)===> [Jack P2 Fêmea 3.5mm na Bancada]

  Jack P2 Fêmea 3.5mm:
  ├── RING (Anel / Pino 4 DIN Source) ────[ Resistor 220 Ω ]────┬────► Pino 2 (Ânodo)   [         ]
  │                                                             │                       [  IC1    ]
  │                                                       [1N4148 ▲] (Cátodo no Pino 2) [  6N138  ]
  │                                                             │    (Ânodo no Pino 3)  [  DIP-8  ]
  ├── TIP  (Ponta / Pino 5 DIN Sink)  ──────────────────────────┴────► Pino 3 (Cátodo)  [         ]
  │
  └── SLEEVE (Base/Corpo) ──► DEIXAR DESCONECTADO (NC) na entrada MIDI IN (evita loop de terra!)

  Lado Lógico 3.3V do Optoacoplador 6N138 (ATENÇÃO: USAR +3.3V DA TEENSY, NUNCA 5V!):
  ├── Pino 8 (VCC) ──────────────────────────┬───────────────────────► +3.3V (Teensy 4.1)
  │                                     [Cap 100nF]
  ├── Pino 5 (GND) ──────────────────────────┴───────────────────────► GND   (Teensy 4.1)
  ├── Pino 7 (Vb)  ────[ Resistor 4.7 kΩ ]───────────────────────────► GND   (Teensy 4.1)
  └── Pino 6 (Vo)  ────┬───[ Resistor Pull-up 470 Ω ]────────────────► +3.3V (Teensy 4.1)
                       └─────────────────────────────────────────────► PINO 0 (RX1 da Teensy 4.1)


====================================================================================================
[2] SAÍDA DE ÁUDIO DIGITAL I2S 32-BIT (PLACA ROXA GY-PCM5102A)
====================================================================================================

  Teensy 4.1                                     Módulo Roxo PCM5102A
  ├── Pino 21 (BCLK1)  ────────────────────────► BCK  (Bit Clock)
  ├── Pino 20 (LRCLK1) ────────────────────────► LRCK (Word Clock 44.1 kHz)
  ├── Pino 7  (OUT1A)  ────────────────────────► DIN  (Audio Data In)
  ├── Pino GND         ───────────────┬────────► GND  (Terra)
  │                                   └────────► SCK  (System Clock aterrado = ativa PLL interno!)
  └── Pino 3.3V        ────────────────────────► VIN  (Alimentação 3.3V limpa)


====================================================================================================
[3] DISPLAY COLORIDO TFT 2.8" ILI9341 240x320 SPI (PLACA VERMELHA)
====================================================================================================

  Teensy 4.1                                     Display TFT 2.8" ILI9341 (Pinos 1 a 9)
  ├── Pino 3.3V        ───────────────┬────────► Pino 1: VCC (Alimentação 3.3V)
  │                                   └────────► Pino 8: LED (Backlight 3.3V)
  ├── Pino GND         ────────────────────────► Pino 2: GND
  ├── Pino 10 (CS)     ────────────────────────► Pino 3: CS  (Chip Select)
  ├── Pino 8  (RST)    ────────────────────────► Pino 4: RESET
  ├── Pino 9  (DC)     ────────────────────────► Pino 5: DC / RS (Data / Command)
  ├── Pino 11 (MOSI)   ────────────────────────► Pino 6: SDI (MOSI)
  ├── Pino 13 (SCK)    ────────────────────────► Pino 7: SCK (SPI Clock)
  └── Pino 12 (MISO)   ────────────────────────► Pino 9: SDO (MISO)
                                                 (Pinos 10..14 T_CLK..T_IRQ do Touch = Desconectados)
\`\`\`

---

## 3. Tabela Ponto-a-Ponto de Fiação (Netlist de Conferência)

| Passo | Origem (Módulo / Pino) | Destino (Módulo / Pino) | Função do Sinal |
| :--- | :--- | :--- | :--- |
| **01** | Teensy 4.1 → **Pino 3.3V** | Barramento Positivo **(+3.3V)** | Alimentação lógica 3.3V (NÃO usar 5V nos sinais!) |
| **02** | Teensy 4.1 → **Pino GND** | Barramento Negativo **(GND)** | Referência comum de terra |
| **03** | Jack P2 MIDI IN → **Ring (Anel)** | Resistor **220 Ω** → **Pino 2** do \`6N138\` | Entrada de corrente MIDI (Pino 4 DIN Type-A) |
| **04** | Jack P2 MIDI IN → **Tip (Ponta)** | Direto no **Pino 3** do \`6N138\` | Retorno de dados MIDI (Pino 5 DIN Type-A) |
| **05** | Diodo **1N4148** (Proteção) | **Ânodo no Pino 3** / **Cátodo no Pino 2** do \`6N138\` | Protege o LED do optoacoplador contra tensão reversa |
| **06** | \`6N138\` → **Pino 8 (VCC)** | Barramento **+3.3V** (+ Cap 100nF p/ GND) | Alimentação do estágio de saída em 3.3V |
| **07** | \`6N138\` → **Pino 5 (GND)** | Barramento **GND** | Terra do estágio de saída do optoacoplador |
| **08** | \`6N138\` → **Pino 7 (Vb)** | Resistor **4.7 kΩ** → Barramento **GND** | Polarização de base para bordas rápidas @ 31.250 bps |
| **09** | \`6N138\` → **Pino 6 (Vo)** | Teensy 4.1 → **Pino 0 (RX1)** + **470 Ω p/ +3.3V** | Dados MIDI recebidos pela UART \`Serial1\` |
| **10** | Teensy 4.1 → **Pino 21 (BCLK1)** | DAC PCM5102A → **Pino BCK** | Bit Clock I2S |
| **11** | Teensy 4.1 → **Pino 20 (LRCLK1)** | DAC PCM5102A → **Pino LRCK** | Word Select (Left/Right 44.1 kHz) |
| **12** | Teensy 4.1 → **Pino 7 (OUT1A)** | DAC PCM5102A → **Pino DIN** | Áudio Digital Estéreo 32-bit |
| **13** | DAC PCM5102A → **VIN / GND / SCK** | **VIN → +3.3V** | **GND → GND** | **SCK → GND** | Alimentação do DAC e ativação do PLL interno |
| **14** | Teensy 4.1 → **Pino 10** | Display ILI9341 → **Pino 3 (CS)** | Chip Select SPI da tela |
| **15** | Teensy 4.1 → **Pino 8** | Display ILI9341 → **Pino 4 (RESET)** | Reset físico da tela |
| **16** | Teensy 4.1 → **Pino 9** | Display ILI9341 → **Pino 5 (DC/RS)** | Controle Data/Command da tela |
| **17** | Teensy 4.1 → **Pinos 11, 13, 12** | Display ILI9341 → **SDI=11, SCK=13, SDO=12** | Barramento SPI0 de alta velocidade |
`;

  return [
    {
      path: '.github/workflows/build-teensy41.yml',
      label: 'GitHub Actions CI',
      language: 'yaml',
      summary: 'Pipeline completo que testa o DSP + mapeamento Launchkey MK4 e compila o firmware.hex na nuvem.',
      content: githubWorkflow,
    },
    {
      path: 'platformio.ini',
      label: 'platformio.ini',
      language: 'ini',
      summary: 'Configuração PlatformIO com MIDI Library (Serial1 TRS 31.250 bps), Audio e ILI9341_t3.',
      content: platformioIni,
    },
    {
      path: 'HARDWARE_SCHEMATIC.md',
      label: 'HARDWARE_SCHEMATIC.md',
      language: 'markdown',
      summary: 'Esquema elétrico completo, diagrama ASCII de bancada, circuito 6N138 e tabela Netlist de 17 ligações.',
      content: hardwareSchematicMd,
    },
    {
      path: 'include/JP8Parameters.h',
      label: 'JP8Parameters.h',
      language: 'cpp',
      summary: `Struct de parâmetros e banco de 5 presets acionáveis pelos Pads do Launchkey MK4.`,
      content: jp8ParametersH,
    },
    {
      path: 'include/JP8DspCore.h',
      label: 'JP8DspCore.h',
      language: 'cpp',
      summary: 'Núcleo DSP C++17 com LFO Delay, Pitch Bend, Sustain Pedal e handler completo de CCs do Launchkey MK4.',
      content: jp8DspCoreH,
    },
    {
      path: 'include/AudioSynthJupiter8.h',
      label: 'AudioSynthJupiter8.h',
      language: 'cpp',
      summary: 'Declaração da classe AudioStream compatível com a Teensy Audio Library.',
      content: audioSynthHeader,
    },
    {
      path: 'src/AudioSynthJupiter8.cpp',
      label: 'AudioSynthJupiter8.cpp',
      language: 'cpp',
      summary: 'Implementação thread-safe (IRQ guard) dos métodos MIDI, presets e bloco I2S de 128 amostras.',
      content: audioSynthCpp,
    },
    {
      path: 'src/main.cpp',
      label: 'main.cpp',
      language: 'cpp',
      summary: 'Firmware operável completo: TRS 3.5mm (P2/P1) MIDI Type-A no Serial1 (Pinos 0 e 1), DAC PCM5102A e UI ILI9341.',
      content: mainCpp,
    },
    {
      path: 'test/test_jp8_dsp_native.cpp',
      label: 'test_dsp_native.cpp',
      language: 'cpp',
      summary: 'Suíte de testes unitários C++17 validando o DSP, Sustain Pedal, Pitch Bend e os CCs do Launchkey MK4.',
      content: nativeTestCpp,
    },
    {
      path: 'README.md',
      label: 'README.md',
      language: 'markdown',
      summary: 'Esquema elétrico do conector TRS MIDI (P2/P1 Type-A c/ 6N138), BOM e mapa do Launchkey MK4.',
      content: readmeMd,
    },
  ];
}
