# Roland Jupiter-8 DSP Engine — Stack Ideal: Teensy 4.1 + TRS 3.5mm MIDI (P2/P1) + PCM5102A + ILI9341

Este repositório contém o firmware C++17 completo, compilável e 100% operável da réplica do **Roland Jupiter-8** para o **Teensy 4.1**, projetado para conexão via **MIDI Padrão por pino TRS 3.5mm (P2/P1 — Padrão MIDI Type-A)** diretamente da saída `MIDI OUT 3.5mm` do **Novation Launchkey MK4**.

## 1. Conexão MIDI Padrão via Conector TRS 3.5mm (P2 / P1 — Padrão MIDI Type-A)

O **Novation Launchkey MK4** (inclusive os modelos 25 e 37 Mini) possui saída física **MIDI Out em conector TRS 3.5mm (P2) padrão Type-A** (o padrão oficial da MIDI Association). Usando um jack fêmea TRS 3.5mm (ou P1 2.5mm com adaptador) no Teensy 4.1 ligado ao `Serial1` (`RX1 = Pino 0`, `TX1 = Pino 1` a `31.250 bps`), você conecta o controlador diretamente com um **cabo estéreo P2-P2 comum**, sem depender de pilha USB Host e com **isolamento galvânico por optoacoplador** (zero ruído de loop de terra no áudio!).

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
| **Microcontrolador** | **Teensy 4.1** (ARM Cortex-M7 @ 600 MHz) | Processamento DSP em 64-bit FPU + UART `Serial1` c/ FIFO dedicado para MIDI 31.250 bps. |
| **Interface MIDI Padrão** | **Jack TRS 3.5mm (P2) ou 2.5mm (P1) Type-A + Opto 6N138** | `RX1 = Pino 0` (MIDI IN do Launchkey MK4), `TX1 = Pino 1` (MIDI OUT / Soft Thru). |
| **Saída de Áudio (DAC)** | **Módulo I2S PCM5102A (Placa Roxa GY-PCM5102)** | `BCLK = Pino 21`, `LRCLK = Pino 20`, `DIN = Pino 7`, `SCK = GND`, `VIN = 3.3V`. |
| **Tela / Display** | **Display IPS TFT 2.8" ILI9341 (320×240 SPI — Placa Vermelha)** | `CS = 10`, `DC = 9`, `RST = 8`, `MOSI = 11`, `SCK = 13`, `MISO = 12`, `VCC/LED = 3.3V`. |

## 3. Mapeamento do Novation Launchkey MK4 via TRS MIDI

- **Encoders 1 a 8 (`CC 21..28`)**: VCF Cutoff (`CC 21`), Resonance (`CC 22`), Env Mod (`CC 23`), Cross-Mod (`CC 24`), VCO-2 Fine (`CC 25`), Pulse Width (`CC 26`), HPF (`CC 27`), LFO Rate (`CC 28`).
- **Faders 1 a 4 (`CC 53..56`)**: ENV-1 ADSR (`IR3R01 IC38A`) | **Faders 5 a 8 (`CC 57..60`)**: ENV-2 ADSR (`IR3R01 IC36A`) | **Fader 9 (`CC 61`)**: Source Mix.
- **Pads RGB 1 a 5 (Notas `36..40` Ch 10)**: Presets `A1..B1` | **Pad 6 (`CC 80`)**: Hard Sync | **Pad 7 (`CC 81`)**: Filtro 12/24 dB | **Pad 8 (`CC 82`)**: Compu-Tune.
