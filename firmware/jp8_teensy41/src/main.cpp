// ============================================================================
// main.cpp — Roland Jupiter-8 Teensy 4.1 Hardware Firmware
// Preset Base: "A1: Imperial Jupiter Brass"
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
