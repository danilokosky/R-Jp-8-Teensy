#pragma once
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
