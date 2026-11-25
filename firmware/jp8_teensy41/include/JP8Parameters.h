#pragma once
#include <cstdint>

#ifndef JP8_MAX_VOICES
#define JP8_MAX_VOICES 8
#endif

#ifndef JP8_OVERSAMPLE
#define JP8_OVERSAMPLE 2
#endif

#ifndef JP8_USE_ZDF
#define JP8_USE_ZDF 1
#endif

#ifndef JP8_STEREO_PAN
#define JP8_STEREO_PAN 1
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
  const char* patchName   = "A1: Imperial Jupiter Brass";

  // VCO-1 (Module Board OPH124, Pág. 15)
  int8_t  vco1OctaveShift = 0;
  JP8Wave vco1Wave        = JP8Wave::SAWTOOTH;
  float   crossModDepth   = 0.20f; // 0..10 (3 oitavas @ 5.0, Pág. 33)
  float   vco1ModEnv      = 0.00f;   // 0..10
  float   vco1ModLfo      = 0.15f;   // 0..10
  float   vco1Pw          = 0.500f;       // 0.05..0.95
  float   vco1PwmDepth    = 0.00f; // 0..10

  // VCO-2 (Module Board OPH124, Pág. 15)
  int8_t  vco2OctaveShift = 0;
  bool    vco2LowFreq     = false;
  float   vco2FineCents   = 9.00f;     // -50..+50 cents
  JP8Wave vco2Wave        = JP8Wave::SAWTOOTH;
  bool    hardSync        = false;
  float   vco2Pw          = 0.500f;

  // Source Mix (BA662 IC28A) & HPF (TR19A + IC26A)
  float   sourceMix       = 0.500f; // 0.0 (VCO1) .. 1.0 (VCO2)
  float   hpfCutoffHz     = 55.0f;

  // VCF Roland IR3109 (IC27A Quad OTA + BA662 IC25A, Pág. 16)
  float   vcfCutoffHz     = 1450.0f;
  float   vcfResonance    = 2.80f; // 0..10
  uint8_t vcfSlopeDb      = 24;                 // 12 ou 24 dB/oct
  float   vcfEnvMod       = 6.80f;    // 0..10
  int8_t  vcfEnvPolarity  = 1;           // +1 ou -1
  bool    vcfEnvFromEnv2  = false;
  float   vcfLfoMod       = 0.20f;
  float   vcfKeyFollow    = 0.750f; // 0..1.2

  // VCA (BA662A Selecionado por Offset IC29A/IC30A)
  float   vcaLevel        = 0.850f;
  float   vcaLfoMod       = 0.00f;

  // ENV-1 (IR3R01 IC38A)
  float   env1AttackSec   = 0.0420f;
  float   env1DecaySec    = 0.6800f;
  float   env1Sustain     = 0.480f;
  float   env1ReleaseSec  = 0.3600f;
  bool    env1KeyFollow   = true;

  // ENV-2 (IR3R01 IC36A)
  float   env2AttackSec   = 0.0140f;
  float   env2DecaySec    = 0.9500f;
  float   env2Sustain     = 0.850f;
  float   env2ReleaseSec  = 0.4200f;
  bool    env2KeyFollow   = false;

  // LFO, Bender & Assign (MOD CON OPH123A & Bender OPH132)
  float      lfoRateHz         = 5.20f;
  float      lfoDelaySec       = 0.550f;
  JP8LfoWave lfoWave           = JP8LfoWave::TRIANGLE;
  float      portamentoSec     = 0.000f;
  JP8KeyMode keyMode           = JP8KeyMode::POLY1;
  float      unisonDetuneCents = 6.0f;
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
