// ============================================================================
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

  std::cout << "[OK] JP-8 C++17 DSP Engine + TRS 3.5mm MIDI Launchkey MK4 passou em todos os testes (peak=" << peak << ")\n";
  return 0;
}
