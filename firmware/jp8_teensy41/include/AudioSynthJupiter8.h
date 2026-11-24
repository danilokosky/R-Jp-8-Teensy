#pragma once
#include <Arduino.h>
#include <AudioStream.h>
#include "JP8Parameters.h"
#include "JP8DspCore.h"

/**
 * AudioSynthJupiter8 — Wrapper Teensy Audio Library (AudioStream @ 44.1kHz)
 * Conecta o motor DSP C++17 (Oversampling 2x = 88200.0 Hz)
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
