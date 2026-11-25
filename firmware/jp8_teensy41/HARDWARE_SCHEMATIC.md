# Esquema Elétrico Completo e Guia de Montagem — Roland Jupiter-8 no Teensy 4.1

Este documento traz o **esquema elétrico passo a passo**, a **lista de componentes auxiliares** e a **tabela ponto-a-ponto (Netlist)** para montar os 4 módulos na bancada (Protoboard ou Placa de Circuito Impresso Universal 2.54mm).

---

## 1. Lista de Materiais Completa (Bill of Materials)

### Módulos Principais (Comprados no Mercado Livre)
1. **Placa Microcontroladora**: `PJRC Teensy 4.1` (ARM Cortex-M7 @ 600 MHz) + Barras de pinos 2.54mm.
2. **Módulo de Áudio I2S**: `DAC Estéreo PCM5102A I2S` (Placa Roxa `GY-PCM5102` com saída P2 integrada).
3. **Tela Colorida**: `Display LCD TFT 2.8" ILI9341 240x320 SPI` (Placa Vermelha de 14 pinos).
4. **Cabo MIDI**: `Cabo MIDI P2 TRS (3.5mm) para DIN-5 Tipo A (TMA) Rockboard 60cm`.

### Componentes Passivos para a Entrada MIDI TRS 3.5mm (Isolamento Óptico)
- **1× Jack P2 Fêmea Estéreo 3.5mm** para placa/painel (ex: `PJ-307` ou `PJ-320A`).
- **1× Optoacoplador `6N138`** (encapsulamento DIP-8) + Soquete DIP-8.
- **1× Diodo de sinal `1N4148`** (proteção contra inversão do LED interno do 6N138).
- **1× Resistor `220 Ω` (1/4W)** — limita a corrente do loop MIDI no Pino 2 do 6N138.
- **1× Resistor `470 Ω` (1/4W)** — pull-up da saída Pino 6 do 6N138 para o **+3.3V** da Teensy 4.1.
- **1× Resistor `4.7 kΩ` (1/4W)** — descarrega a base do fotodarlington (Pino 7 do 6N138 para o GND).
- **1× Capacitor Cerâmico `100 nF` (0.1 µF)** — desacoplamento entre Pino 8 (+3.3V) e Pino 5 (GND) do 6N138.

---

## 2. Diagrama Esquemático ASCII (Visão Geral de Bancada)

```text
====================================================================================================
[1] ENTRADA MIDI P2 TRS 3.5mm (CABO ROCKBOARD DIN-5 -> P2 TRS TIPO A)
====================================================================================================

  Launchkey MK4 [MIDI OUT DIN-5] ===(Cabo Rockboard Tipo A)===> [Jack P2 Fêmea 3.5mm na Bancada]

  Jack P2 Fêmea 3.5mm:
  ├── RING (Anel / Pino 4 DIN Source) ────[ Resistor 220 Ω ]────┬────► Pino 2 (Ânodo)   [         ]
  │                                                             │                       [  IC1    ]
  │                                                       [1N4148 ▲] (Cátodo no Pino 2) [  6N138  ]
  │                                                             │    (Ânodo no Pino 3)  [  DIP-8  ]
  ├── TIP  (Ponta / Pino 5 DIN Sink)  ──────────────────────────┴────► Pino 3 (Cátodo)  [         ]
  │
  └── SLEEVE (Base/Corpo) ──► DEIXAR DESCONECTADO (NC) na entrada MIDI IN (evita loop de terra!)

  Lado Lógico 3.3V do Optoacoplador 6N138 (ATENÇÃO: USAR +3.3V DA TEENSY, NUNCA 5V!):
  ├── Pino 8 (VCC) ──────────────────────────┬───────────────────────► +3.3V (Teensy 4.1)
  │                                     [Cap 100nF]
  ├── Pino 5 (GND) ──────────────────────────┴───────────────────────► GND   (Teensy 4.1)
  ├── Pino 7 (Vb)  ────[ Resistor 4.7 kΩ ]───────────────────────────► GND   (Teensy 4.1)
  └── Pino 6 (Vo)  ────┬───[ Resistor Pull-up 470 Ω ]────────────────► +3.3V (Teensy 4.1)
                       └─────────────────────────────────────────────► PINO 0 (RX1 da Teensy 4.1)


====================================================================================================
[2] SAÍDA DE ÁUDIO DIGITAL I2S 32-BIT (PLACA ROXA GY-PCM5102A)
====================================================================================================

  Teensy 4.1                                     Módulo Roxo PCM5102A
  ├── Pino 21 (BCLK1)  ────────────────────────► BCK  (Bit Clock)
  ├── Pino 20 (LRCLK1) ────────────────────────► LRCK (Word Clock 44.1 kHz)
  ├── Pino 7  (OUT1A)  ────────────────────────► DIN  (Audio Data In)
  ├── Pino GND         ───────────────┬────────► GND  (Terra)
  │                                   └────────► SCK  (System Clock aterrado = ativa PLL interno!)
  └── Pino 3.3V        ────────────────────────► VIN  (Alimentação 3.3V limpa)


====================================================================================================
[3] DISPLAY COLORIDO TFT 2.8" ILI9341 240x320 SPI (PLACA VERMELHA)
====================================================================================================

  Teensy 4.1                                     Display TFT 2.8" ILI9341 (Pinos 1 a 9)
  ├── Pino 3.3V        ───────────────┬────────► Pino 1: VCC (Alimentação 3.3V)
  │                                   └────────► Pino 8: LED (Backlight 3.3V)
  ├── Pino GND         ────────────────────────► Pino 2: GND
  ├── Pino 10 (CS)     ────────────────────────► Pino 3: CS  (Chip Select)
  ├── Pino 8  (RST)    ────────────────────────► Pino 4: RESET
  ├── Pino 9  (DC)     ────────────────────────► Pino 5: DC / RS (Data / Command)
  ├── Pino 11 (MOSI)   ────────────────────────► Pino 6: SDI (MOSI)
  ├── Pino 13 (SCK)    ────────────────────────► Pino 7: SCK (SPI Clock)
  └── Pino 12 (MISO)   ────────────────────────► Pino 9: SDO (MISO)
                                                 (Pinos 10..14 T_CLK..T_IRQ do Touch = Desconectados)
```

---

## 3. Tabela Ponto-a-Ponto de Fiação (Netlist de Conferência)

| Passo | Origem (Módulo / Pino) | Destino (Módulo / Pino) | Função do Sinal |
| :--- | :--- | :--- | :--- |
| **01** | Teensy 4.1 → **Pino 3.3V** | Barramento Positivo **(+3.3V)** | Alimentação lógica 3.3V (NÃO usar 5V nos sinais!) |
| **02** | Teensy 4.1 → **Pino GND** | Barramento Negativo **(GND)** | Referência comum de terra |
| **03** | Jack P2 MIDI IN → **Ring (Anel)** | Resistor **220 Ω** → **Pino 2** do `6N138` | Entrada de corrente MIDI (Pino 4 DIN Type-A) |
| **04** | Jack P2 MIDI IN → **Tip (Ponta)** | Direto no **Pino 3** do `6N138` | Retorno de dados MIDI (Pino 5 DIN Type-A) |
| **05** | Diodo **1N4148** (Proteção) | **Ânodo no Pino 3** / **Cátodo no Pino 2** do `6N138` | Protege o LED do optoacoplador contra tensão reversa |
| **06** | `6N138` → **Pino 8 (VCC)** | Barramento **+3.3V** (+ Cap 100nF p/ GND) | Alimentação do estágio de saída em 3.3V |
| **07** | `6N138` → **Pino 5 (GND)** | Barramento **GND** | Terra do estágio de saída do optoacoplador |
| **08** | `6N138` → **Pino 7 (Vb)** | Resistor **4.7 kΩ** → Barramento **GND** | Polarização de base para bordas rápidas @ 31.250 bps |
| **09** | `6N138` → **Pino 6 (Vo)** | Teensy 4.1 → **Pino 0 (RX1)** + **470 Ω p/ +3.3V** | Dados MIDI recebidos pela UART `Serial1` |
| **10** | Teensy 4.1 → **Pino 21 (BCLK1)** | DAC PCM5102A → **Pino BCK** | Bit Clock I2S |
| **11** | Teensy 4.1 → **Pino 20 (LRCLK1)** | DAC PCM5102A → **Pino LRCK** | Word Select (Left/Right 44.1 kHz) |
| **12** | Teensy 4.1 → **Pino 7 (OUT1A)** | DAC PCM5102A → **Pino DIN** | Áudio Digital Estéreo 32-bit |
| **13** | DAC PCM5102A → **VIN / GND / SCK** | **VIN → +3.3V** | **GND → GND** | **SCK → GND** | Alimentação do DAC e ativação do PLL interno |
| **14** | Teensy 4.1 → **Pino 10** | Display ILI9341 → **Pino 3 (CS)** | Chip Select SPI da tela |
| **15** | Teensy 4.1 → **Pino 8** | Display ILI9341 → **Pino 4 (RESET)** | Reset físico da tela |
| **16** | Teensy 4.1 → **Pino 9** | Display ILI9341 → **Pino 5 (DC/RS)** | Controle Data/Command da tela |
| **17** | Teensy 4.1 → **Pinos 11, 13, 12** | Display ILI9341 → **SDI=11, SCK=13, SDO=12** | Barramento SPI0 de alta velocidade |
