// ============================================================================
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
