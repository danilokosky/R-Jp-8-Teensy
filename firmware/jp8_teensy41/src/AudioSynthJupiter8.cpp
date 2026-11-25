#include "AudioSynthJupiter8.h"
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
