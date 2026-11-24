import { JP8Patch, OversamplingFactor } from './jp8DspMath';

export interface FirmwareFileItem {
  path: string;
  label: string;
  language: 'ini' | 'yaml' | 'cpp' | 'markdown';
  summary: string;
  content: string;
}

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
; Compila localmente (pio run) ou na nuvem via GitHub Actions (.github/workflows)
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
  PaulStoffregen/Audio
  fortyseveneffects/MIDI Library

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
    branches: [ main, master ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  native-dsp-tests:
    name: 1. Validar Núcleo DSP C++17 (Native Unit Tests)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do repositório
        uses: actions/checkout@v4

      - name: Compilar e executar testes unitários do motor DSP (g++ -Werror)
        run: |
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
          key: \${{ runner.os }}-pio-teensy41-\${{ hashFiles('platformio.ini') }}

      - name: Instalar PlatformIO CLI
        run: pip install --upgrade platformio

      - name: Compilar projeto Teensy 4.1 (ARM Cortex-M7)
        run: pio run -e teensy41

      - name: Verificar tamanho do binário e SRAM
        run: pio run -e teensy41 -t size

      - name: Publicar Artifact (firmware.hex & firmware.elf)
        uses: actions/upload-artifact@v4
        with:
          name: jp8-teensy41-firmware-\${{ github.sha }}
          path: |
            .pio/build/teensy41/firmware.hex
            .pio/build/teensy41/firmware.elf

      - name: Anexar .hex ao GitHub Release (quando houver tag v*)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: |
            .pio/build/teensy41/firmware.hex
            .pio/build/teensy41/firmware.elf
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

  // LFO & Assign (MOD CON OPH123A)
  float      lfoRateHz         = ${patch.lfoRateHz.toFixed(2)}f;
  float      lfoDelaySec       = ${(patch.lfoDelayMs / 1000).toFixed(3)}f;
  JP8LfoWave lfoWave           = ${mapLfoWaveEnum(patch.lfoWave)};
  float      portamentoSec     = ${(patch.portamentoMs / 1000).toFixed(3)}f;
  JP8KeyMode keyMode           = ${mapKeyModeEnum(patch.keyAssignMode)};
  float      unisonDetuneCents = ${patch.unisonDetuneCents.toFixed(1)}f;
};

inline JP8Parameters makeDefaultJP8Patch() {
  JP8Parameters p;
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
  uint8_t midiNote = 60;
  float velocity = 1.0f;
  float currentNotePitch = 60.0f;
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
    // Recalibra todas as vozes para tolerância do DAC ITS80141 (±0.61 mV / ±0.7 cents)
    for (int v = 0; v < MaxVoices; ++v) {
      for (int osc = 0; osc < 2; ++osc) {
        voices_[v].cal[osc].scaleWidthW = 0.083333f;
        voices_[v].cal[osc].thermalDriftCents *= 0.25f;
      }
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

    // POLY1 (Round-Robin / Reassign) ou POLY2
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
      // Voice stealing pela voz mais antiga
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
        voices_[v].env1.releaseNote();
        voices_[v].env2.releaseNote();
      }
    }
  }

  void allNotesOff() {
    for (int v = 0; v < MaxVoices; ++v) {
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
        // Espalhamento estéreo sutil das vozes A..H (Upper/Lower pan)
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
  }

  int activeVoiceCount() const {
    int count = 0;
    for (int v = 0; v < MaxVoices; ++v) {
      if (voices_[v].active) count++;
    }
    return count;
  }

private:
  JP8Parameters params_;
  VoiceState voices_[MaxVoices];
  int rrCursor_ = 0;
  uint32_t globalAge_ = 0;
  float lfoPhase_ = 0.0f;
  float lfoHeldRandom_ = 0.0f;
  uint32_t lfoPrng_ = 0xCAFEBABEu;

  void allocateVoice(int idx, uint8_t midiNote, float velocityNorm, float unisonSemitones) {
    VoiceState& v = voices_[idx];
    v.active = true;
    v.midiNote = midiNote;
    v.velocity = std::clamp(velocityNorm, 0.05f, 1.0f);
    if (params_.portamentoSec <= 0.001f) {
      v.currentNotePitch = static_cast<float>(midiNote) + unisonSemitones;
    }
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
    // TRIANGLE via Leaky Integrated PolyBLEP Square (sem aliasing)
    float sq = (phase < 0.5f) ? 1.0f : -1.0f;
    sq += polyBlep(phase, dt);
    float shifted = phase - 0.5f;
    if (shifted < 0.0f) shifted += 1.0f;
    sq -= polyBlep(shifted, dt);
    triState = triState * 0.999f + (4.0f * dt) * sq;
    return std::clamp(triState, -1.0f, 1.0f);
  }

  float computeDac14BitNote(const VoiceCalibration& cal, float targetNote) const {
    // Equação (2) Pág. 50: VKn_x = T - W * (84 - Kn_x), quantizado em 14 bits (ITS80141)
    const float vIdeal = cal.refVoltageT - cal.scaleWidthW * (84.0f - targetNote);
    const float qCode = std::round(std::clamp((vIdeal / 10.0f) * 16384.0f, 0.0f, 16383.0f));
    const float vQuant = (qCode / 16384.0f) * 10.0f;
    return 84.0f - (cal.refVoltageT - vQuant) / cal.scaleWidthW + (cal.thermalDriftCents / 100.0f);
  }

  float renderVoiceSubStep(VoiceState& v, float lfoVal) {
    const float sr = kInternalSampleRate;

    // 1. Envelopes IR3R01
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

    // 2. Portamento analógico (Pág. 19)
    if (params_.portamentoSec > 0.001f) {
      const float target = static_cast<float>(v.midiNote);
      const float coef = 1.0f - std::exp(-1.0f / (params_.portamentoSec * sr));
      v.currentNotePitch += coef * (target - v.currentNotePitch);
    }

    // 3. Frequências VCO-2 e VCO-1 com quantização 14-bit Compu-Tune + X-MOD + Hard Sync
    const float pitch2Note = computeDac14BitNote(
      v.cal[1],
      v.currentNotePitch + static_cast<float>(params_.vco2OctaveShift * 12) + (params_.vco2FineCents / 100.0f)
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

    // X-MOD (BA662 IC6A): 3 oitavas de modulação em depth=5.0 (Pág. 33)
    const float xModOctaves = (params_.crossModDepth * 0.6f) * vco2Out;
    const float envOctaves  = (params_.vco1ModEnv * 0.25f) * e1;
    const float lfoOctaves  = (params_.vco1ModLfo * 0.08f) * lfoVal;

    const float pitch1Note = computeDac14BitNote(
      v.cal[0],
      v.currentNotePitch + static_cast<float>(params_.vco1OctaveShift * 12)
    );
    const float freq1 = 440.0f * std::exp2(((pitch1Note - 69.0f) / 12.0f) + xModOctaves + envOctaves + lfoOctaves);
    const float dt1 = std::clamp(freq1 / sr, 0.00001f, 0.45f);

    v.phase1 += dt1;
    if (v.phase1 >= 1.0f) v.phase1 -= 1.0f;
    if (syncTriggered) {
      v.phase1 = std::clamp(syncFrac * dt1, 0.0f, 0.9999f);
    }

    const float pw1 = std::clamp(params_.vco1Pw + (params_.vco1PwmDepth * 0.04f) * lfoVal, 0.05f, 0.95f);
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
    const float kfSemi = (v.currentNotePitch - 60.0f) * params_.vcfKeyFollow;
    const float modOct = (params_.vcfEnvMod * 0.45f * static_cast<float>(params_.vcfEnvPolarity) * vcfEnvVal)
                       + (params_.vcfLfoMod * 0.25f * lfoVal);
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
    const float lfoVca = 1.0f + (params_.vcaLfoMod * 0.15f) * lfoVal;
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
 * diretamente ao barramento I2S/USB do Teensy 4.1.
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

  void setParameters(const JP8Parameters& p);
  JP8Parameters getParameters() const;
  int activeVoices() const;

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
// main.cpp — Roland Jupiter-8 Teensy 4.1 Hardware Firmware
// Preset Base: "${patch.name}"
// ============================================================================
#include <Arduino.h>
#include <Audio.h>
#include <MIDI.h>
#include "AudioSynthJupiter8.h"

AudioSynthJupiter8 jp8Synth;
AudioOutputI2S     i2sOut;   // Pinos I2S1 Teensy 4.1: BCLK=21, LRCLK=20, TX=7, MCLK=23
AudioOutputUSB     usbOut;   // Saída de áudio USB estéreo simultânea para DAW

AudioConnection    patchCordL1(jp8Synth, 0, i2sOut, 0);
AudioConnection    patchCordR1(jp8Synth, 1, i2sOut, 1);
AudioConnection    patchCordL2(jp8Synth, 0, usbOut, 0);
AudioConnection    patchCordR2(jp8Synth, 1, usbOut, 1);

// Interface DIN MIDI Hardware no Serial1 (Pino RX1 = 0 via optoacoplador 6N138)
MIDI_CREATE_INSTANCE(HardwareSerial, Serial1, dinMidi);

// Pinos dos 2 Multiplexadores CD74HC4067 (emulação dos sliders Panel C/D)
constexpr uint8_t MUX_S0 = 2;
constexpr uint8_t MUX_S1 = 3;
constexpr uint8_t MUX_S2 = 4;
constexpr uint8_t MUX_S3 = 5;
constexpr uint8_t MUX_SIG_A = A0; // Pino 14
constexpr uint8_t TUNE_BTN_PIN = 6;

static JP8Parameters liveParams;
static float adcSmooth[16] = {0};

void onMidiNoteOn(uint8_t channel, uint8_t note, uint8_t velocity) {
  (void)channel;
  if (velocity == 0) {
    jp8Synth.noteOff(note);
  } else {
    jp8Synth.noteOn(note, velocity);
  }
}

void onMidiNoteOff(uint8_t channel, uint8_t note, uint8_t velocity) {
  (void)channel;
  (void)velocity;
  jp8Synth.noteOff(note);
}

void onMidiControlChange(uint8_t channel, uint8_t cc, uint8_t val) {
  (void)channel;
  const float norm = static_cast<float>(val) / 127.0f;
  switch (cc) {
    case 74: liveParams.vcfCutoffHz  = 40.0f * exp2f(norm * 8.6f); break; // VCF Cutoff
    case 71: liveParams.vcfResonance = norm * 10.0f; break;               // BA662 Resonance
    case 73: liveParams.env2AttackSec = 0.002f + norm * 2.5f; break;      // ENV-2 Attack
    case 72: liveParams.env2ReleaseSec = 0.010f + norm * 3.5f; break;     // ENV-2 Release
    case 1:  liveParams.vcfLfoMod    = norm * 10.0f; break;               // Mod Wheel -> VCF LFO
    case 5:  liveParams.portamentoSec = norm * 1.5f; break;               // Portamento
    case 123: jp8Synth.allNotesOff(); return;
    default: return;
  }
  jp8Synth.setParameters(liveParams);
}

void setup() {
  AudioMemory(24);
  Serial.begin(115200);

  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  pinMode(MUX_S3, OUTPUT);
  pinMode(TUNE_BTN_PIN, INPUT_PULLUP);
  analogReadResolution(10);

  liveParams = makeDefaultJP8Patch();
  jp8Synth.setParameters(liveParams);

  // Configurar callbacks USB MIDI nativo
  usbMIDI.setHandleNoteOn(onMidiNoteOn);
  usbMIDI.setHandleNoteOff(onMidiNoteOff);
  usbMIDI.setHandleControlChange(onMidiControlChange);

  // Configurar callbacks DIN MIDI Serial1
  dinMidi.setHandleNoteOn(onMidiNoteOn);
  dinMidi.setHandleNoteOff(onMidiNoteOff);
  dinMidi.setHandleControlChange(onMidiControlChange);
  dinMidi.begin(MIDI_CHANNEL_OMNI);
}

elapsedMillis panelScanTimer;
uint8_t muxChannel = 0;

void loop() {
  usbMIDI.read();
  dinMidi.read();

  // Botão físico COMPU-TUNE (Pág. 50)
  if (digitalRead(TUNE_BTN_PIN) == LOW) {
    jp8Synth.runCompuTune();
    delay(250);
  }

  // Varredura contínua dos sliders analógicos a cada 2ms (emula MOD CON 8-bit S/H)
  if (panelScanTimer >= 2) {
    panelScanTimer = 0;
    digitalWrite(MUX_S0, muxChannel & 0x01);
    digitalWrite(MUX_S1, (muxChannel >> 1) & 0x01);
    digitalWrite(MUX_S2, (muxChannel >> 2) & 0x01);
    digitalWrite(MUX_S3, (muxChannel >> 3) & 0x01);

    const float raw = static_cast<float>(analogRead(MUX_SIG_A)) / 1023.0f;
    adcSmooth[muxChannel] += 0.15f * (raw - adcSmooth[muxChannel]);
    muxChannel = (muxChannel + 1) & 0x0F;
  }
}
`;

  const nativeTestCpp = `// ============================================================================
// test_jp8_dsp_native.cpp — Testes Unitários Nativos C++17 do Motor DSP JP-8
// Executado automaticamente no GitHub Actions antes de compilar para o Teensy!
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

  // 3. Disparar um acorde de 4 notas e verificar áudio não-nulo e sem NaN/Inf
  engine.noteOn(48, 0.9f);
  engine.noteOn(55, 0.85f);
  engine.noteOn(60, 0.9f);
  engine.noteOn(64, 0.85f);
  assert(engine.activeVoiceCount() >= 1);

  float peak = 0.0f;
  for (int i = 0; i < 4410; ++i) {
    float l = 0.0f, r = 0.0f;
    engine.processSampleStereo(l, r);
    assert(std::isfinite(l) && std::isfinite(r));
    assert(l >= -1.05f && l <= 1.05f);
    peak = std::max(peak, std::fabs(l));
  }
  assert(peak > 0.05f);

  // 4. Testar calibração Compu-Tune e AllNotesOff
  engine.runCompuTune();
  engine.allNotesOff();
  for (int i = 0; i < 44100 * 5; ++i) {
    float l = 0.0f, r = 0.0f;
    engine.processSampleStereo(l, r);
  }
  assert(engine.activeVoiceCount() == 0);

  std::cout << "[OK] JP-8 C++17 DSP Engine passou em todos os testes (peak=" << peak << ")\\n";
  return 0;
}
`;

  const readmeMd = `# Roland Jupiter-8 DSP Engine para Teensy 4.1 (PlatformIO + GitHub Actions)

Este projeto implementa uma réplica fiel em C++17 do motor de áudio do **Roland Jupiter-8** para a placa **Teensy 4.1** (ARM Cortex-M7 @ 600 MHz), baseado nas Notas de Serviço originais de dezembro de 1982.

## Como compilar diretamente pelo GitHub (Sem instalar IDE local)

1. Crie um repositório novo no GitHub (ex: \`jp8-teensy41-synth\`).
2. Extraia o arquivo \`.zip\` exportado e envie os arquivos para o GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: roland jp8 teensy 4.1 dsp engine"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/jp8-teensy41-synth.git
   git push -u origin main
   \`\`\`
3. Acesse a aba **Actions** no seu repositório do GitHub.
4. O workflow \`.github/workflows/build-teensy41.yml\` executará automaticamente:
   - **Job 1 (\`native-dsp-tests\`)**: Compila e testa o núcleo DSP (\`include/JP8DspCore.h\`) com \`g++ -std=c++17 -Werror\`.
   - **Job 2 (\`compile-teensy41\`)**: Instala o PlatformIO CLI, baixa o SDK do Teensy e gera o binário **\`firmware.hex\`**.
5. Ao final do build, clique no Artifact **\`jp8-teensy41-firmware-...\`** dentro do Action para baixar o \`firmware.hex\` e gravá-lo na placa via **Teensy Loader**!

## Compilação Local Opcional (PlatformIO)

\`\`\`bash
# Testar o motor DSP nativamente no PC
g++ -std=c++17 -O2 -Wall -Wextra -Werror -I include test/test_jp8_dsp_native.cpp -lm -o test_dsp && ./test_dsp

# Compilar e gravar no Teensy 4.1 conectado via USB
pio run -e teensy41 -t upload
\`\`\`
`;

  return [
    {
      path: '.github/workflows/build-teensy41.yml',
      label: 'GitHub Actions CI',
      language: 'yaml',
      summary: 'Pipeline completo que testa o DSP nativamente e compila o firmware.hex na nuvem do GitHub.',
      content: githubWorkflow,
    },
    {
      path: 'platformio.ini',
      label: 'platformio.ini',
      language: 'ini',
      summary: 'Configuração PlatformIO para Teensy 4.1 com USB_MIDI_AUDIO_SERIAL e flags -O3.',
      content: platformioIni,
    },
    {
      path: 'include/JP8Parameters.h',
      label: 'JP8Parameters.h',
      language: 'cpp',
      summary: `Struct de parâmetros e valores iniciais sincronizados com "${patch.name}".`,
      content: jp8ParametersH,
    },
    {
      path: 'include/JP8DspCore.h',
      label: 'JP8DspCore.h',
      language: 'cpp',
      summary: 'Núcleo DSP completo em C++17: 16 VCOs PolyBLEP, Hard Sync, X-MOD, IR3109 ZDF, IR3R01 e Compu-Tune.',
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
      summary: 'Implementação thread-safe (IRQ guard) dos métodos MIDI e bloco I2S de 128 amostras.',
      content: audioSynthCpp,
    },
    {
      path: 'src/main.cpp',
      label: 'main.cpp',
      language: 'cpp',
      summary: 'Ponto de entrada Teensy 4.1 com AudioOutputI2S, AudioOutputUSB, MIDI DIN/USB e scanner CD74HC4067.',
      content: mainCpp,
    },
    {
      path: 'test/test_jp8_dsp_native.cpp',
      label: 'test_dsp_native.cpp',
      language: 'cpp',
      summary: 'Suíte de testes unitários C++17 executada no CI antes da geração do binário ARM.',
      content: nativeTestCpp,
    },
    {
      path: 'README.md',
      label: 'README.md',
      language: 'markdown',
      summary: 'Guia passo-a-passo de deploy no GitHub e gravação do .hex no Teensy 4.1.',
      content: readmeMd,
    },
  ];
}
