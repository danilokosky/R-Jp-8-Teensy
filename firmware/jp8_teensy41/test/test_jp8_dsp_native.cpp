// ============================================================================
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

  std::cout << "[OK] JP-8 C++17 DSP Engine passou em todos os testes (peak=" << peak << ")\n";
  return 0;
}
