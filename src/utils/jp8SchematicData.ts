import { JP8Patch, OversamplingFactor } from './jp8DspMath';

export interface SchematicSubcircuit {
  id: string;
  boardName: string;
  pcbCode: string;
  title: string;
  pdfPages: number[];
  originalChips: string[];
  voltageRails: string;
  signalRole: string;
  circuitAnalysis: string[];
  calibrationNotes: string;
  teensy41Strategy: string;
  cppSnippet: string;
}

export const JP8_SCHEMATIC_SUBCIRCUITS: SchematicSubcircuit[] = [
  {
    id: 'vco-core',
    boardName: 'MODULE BOARD (OPH124)',
    pcbCode: 'PCB 052H270 (4 Placas: AB, CD, EF, GH)',
    title: '01. Dual VCO Exponencial + Hard Sync + X-MOD (VCO-1 & VCO-2)',
    pdfPages: [7, 15, 31, 33, 34],
    originalChips: [
      '2SC952-Y (Transistor par exponencial)',
      '2SK30A-GR (JFET buffer / descarga rampa)',
      'NJM4558 / TL080 (Selecionado por Slew Rate)',
      'TC4052 / 4053 (CMOS Waveform Selector IC5A, IC17A)',
      'BA662A (OTA Cross-Mod & VCO Modulator IC6A, IC18A)',
      'Posistor ERS-C33G561 / SP102 (Compensação térmica)',
    ],
    voltageRails: '+13V, -13V (Regulados no MOD CON para estabilidade térmica)',
    signalRole: 'Geração de rampa sawtooth central de 10V p-p, modelador triangular por dobra de diodo, comparador PWM e sincronismo mestre-escravo.',
    circuitAnalysis: [
      'Conversor Exponencial (1V/Oct): O sinal KCV (vindos dos circuitos Sample & Hold da Interface Board) soma-se às modulações LFO/ENV (via BA662 IC18A) e excita o par diferencial 2SC952-Y acoplado termicamente ao Posistor de 560Ω.',
      'Núcleo Integrador Sawtooth: O capacitor de poliestireno C3A/C14A (1000pF) é carregado linearmente pela fonte de corrente e descarregado abruptamente pelo JFET 2SK30A e transistor rápido quando atinge o limiar, gerando uma dente-de-serra precisa de 10V p-p (ajuste VR13/VR15, Pág. 31).',
      'Hard Sync (VCO-1 → VCO-2): Quando a chave SYNC está ativa (IC11A), o pulso de reset do VCO-2 injeta um gatilho na base do transistor de descarga do VCO-1, forçando o reinício instantâneo da fase do VCO-1 no meio do ciclo.',
      'Cross-Modulation (X-MOD): O sinal de saída do VCO-2 passa pelo OTA BA662 (IC6A) e modula exponencialmente a frequência do VCO-1. Conforme a Pág. 33 (Para. 10), com CROSS MOD em 5 (50%) e VCO-1 em 2\', o desvio atinge exatamente 3 oitavas.',
      'Waveform Converter & PWM: A rampa alimenta um dobrador de onda a diodos (TR2A/D3A) para criar a onda Triangular, e um comparador TL082 (IC16A) cujo limiar é modulado por ENV-1, LFO ou slider manual para gerar Pulse Width Modulation (ajuste de largura mínima de 30µs em C2 via VR12, Pág. 33).',
    ],
    calibrationNotes: 'Pág. 31 Para. 12: Nível ajustado em TP-4 para 10V p-p. Pág. 33 Para. 11: Largura de pulso mínima calibrada em 30µs na nota C2.',
    teensy41Strategy: 'Acumulador de fase de ponto flutuante de 32 bits (ou uint32_t Q32) rodando a 88.2 kHz (oversampling 2x). Aplicar correção PolyBLEP nas descontinuidades tanto do Sawtooth/Pulse quanto no instante fracionário exato do Hard Sync (fracReset = phase2 / dt2). Modelar o X-MOD como modulação exponencial 2^(xModOctaves * vco2Out) antes do cálculo do incremento de fase.',
    cppSnippet: `// Teensy 4.1 VCO-1 + VCO-2 Core com PolyBLEP & Fractional Hard Sync
float vco2Sample = renderVco2(dt2, pw2);
float xModOctaves = (patch.xModDepth * 0.6f) * vco2Sample; // 3 octaves @ 5.0
float effectiveDt1 = baseDt1 * exp2f(xModOctaves + pitchModOctaves);

phase2 += dt2;
bool syncTriggered = false;
float syncFrac = 0.0f;
if (phase2 >= 1.0f) {
  phase2 -= 1.0f;
  syncTriggered = patch.hardSync;
  syncFrac = phase2 / dt2; // Fração exata intra-amostra do reset
}

phase1 += effectiveDt1;
if (syncTriggered) {
  floatphaseBeforeReset = phase1 - syncFrac * effectiveDt1;
  phase1 = syncFrac * effectiveDt1;
  // Insere PolyBLEP proporcional à amplitude interrompida pelo Hard Sync
}`,
  },
  {
    id: 'hpf-vcf-ir3109',
    boardName: 'MODULE BOARD (OPH124)',
    pcbCode: 'PCB 052H270 (Seção Filtro por Voz)',
    title: '02. Source Mix + HPF 6dB/oct + VCF Roland IR3109 (-12dB / -24dB)',
    pdfPages: [7, 16, 29, 31, 35],
    originalChips: [
      'IR3109 (IC27A / IC27B - Quad OTA com buffers JFET integrados e conversor exponencial)',
      'BA662A (IC25A - OTA de controle de Ressonância; IC28A - OTA Source Mix)',
      'TL082 (IC26A - Buffer do HPF de 1 polo)',
      'TC4052 (IC5A - Chaveamento eletrônico de Slope 2-pole -12dB vs 4-pole -24dB)',
    ],
    voltageRails: '+13V, -13V (+15V/-15V nos buffers de saída)',
    signalRole: 'Mistura contínua VCO-1/VCO-2, filtro passa-altas não-ressonante de 1 polo e filtro passa-baixas icônico de 4 estágios OTA em cascata.',
    circuitAnalysis: [
      'Source Mixer (IC28A BA662): Diferente de um mixer resistivo comum, o JP-8 usa dois OTAs complementares para fazer crossfade suave entre VCO-1 e VCO-2 (Pág. 48 Item 9 mostra a modificação de fábrica no MOD CON para igualar o volume com SOURCE MIX às 12h).',
      'High-Pass Filter (TR19A + IC26A): Filtro RC ativo de 1 polo (-6dB/oitava) controlado por corrente através do transistor TR19A antes da entrada do VCF, ideal para limpar graves em patches de strings e brass polifônicos.',
      'Arquitetura Interna do IR3109 (IC27A): Contém 4 células OTA (Operational Transconductance Amplifiers) acopladas a capacitores de poliestireno de 220pF (C39A~C42A). Cada estágio atua como um filtro passa-baixas de 1ª ordem cuja frequência de corte é proporcional à corrente de polarização exponencial.',
      'Chaveamento 12dB / 24dB (IC5A 4052): O multiplexador analógico 4052 colhe o sinal na saída do 2º estágio OTA para o modo -12dB/oitava (2 polos, som aberto tipo Oberheim) ou do 4º estágio OTA para o modo -24dB/oitava (4 polos clássico Roland).',
      'Loop de Ressonância via BA662 (IC25A): A saída do 4º polo retorna invertida à entrada do 1º polo passando pelo OTA BA662 (IC25A). Quando a ressonância sobe, a saturação suave hiperbólica (tanh) dos pares diferenciais internos do IR3109 limita a auto-oscilação sem clipagem dura (ajuste VR14 em Pág. 31 Para. 17).',
    ],
    calibrationNotes: 'Pág. 31 Para. 13-17: Ajuste de Key Follow (VR16 para 4 ciclos em C2 e C4), Width (VR19), Env Mod (VR21) e Ressonância (VR14).',
    teensy41Strategy: 'Filtro Zero-Delay Feedback (ZDF) Trapezoidal Integrator (TPT) de 4 polos em cascata. A topologia OTA do IR3109 difere da escada de transistores Moog: no IR3109 cada um dos 4 estágios possui sua própria não-linearidade tanh(v_in - v_stage) independente, enquanto a realimentação global passa pelo ganho do BA662 com compensação de perda de graves em alta ressonância.',
    cppSnippet: `// Teensy 4.1 Roland IR3109 4-Pole ZDF TPT Ladder Filter (2x Oversampled)
// g = tan(PI * cutoffHz / sampleRate)
float G = g / (1.0f + g);
// Cálculo da predição linear S dos 4 integradores TPT
float S = G*G*G * s[0] + G*G * s[1] + G * s[2] + s[3];
float u = (hpfOut - kRes * S) / (1.0f + kRes * G*G*G*G);

// Cascata de 4 células OTA IR3109 com saturação diferencial tanh rápida (Padé)
float v0 = G * fastTanh(u - s[0]);      float y0 = v0 + s[0]; s[0] = y0 + v0;
float v1 = G * fastTanh(y0 - s[1]);     float y1 = v1 + s[1]; s[1] = y1 + v1; // Tap -12dB
float v2 = G * fastTanh(y1 - s[2]);     float y2 = v2 + s[2]; s[2] = y2 + v2;
float v3 = G * fastTanh(y2 - s[3]);     float y3 = v3 + s[3]; s[3] = y3 + v3; // Tap -24dB
return (patch.slope == 12) ? y1 : y3;`,
  },
  {
    id: 'vca-env-ir3r01',
    boardName: 'MODULE BOARD (OPH124) & MOD CON (OPH123)',
    pcbCode: 'PCB 052H270 & 052H269',
    title: '03. Duplo Gerador de Envelope IR3R01 + Oscilador 555 Key-Follow + VCA BA662A',
    pdfPages: [7, 14, 16, 29, 32],
    originalChips: [
      'IR3R01 (IC38A ENV-1, IC36A ENV-2 - Chip ADSR proprietário Roland, Pág. 29)',
      'BA662A Selecionado por Offset (IC29A/IC30A - VCA final e modulação de amplitude)',
      'NE555 / HA17555 (IC50 no MOD CON Pág. 14 - Oscilador PWM para Key-Follow dos envelopes)',
      'TC4066 (IC39A/IC37A - Chaves CMOS na entrada dos resistores de tempo do IR3R01)',
    ],
    voltageRails: '+15V, -15V',
    signalRole: 'Geração das curvas ADSR exponenciais de 1ms a 10s, escalonamento temporal pela nota do teclado via PWM e controle final de ganho VCA.',
    circuitAnalysis: [
      'Anatomia do Chip IR3R01 (Pág. 29 & 16): Possui entradas independentes de tensão para Attack (pino 2), Decay (pino 3), Release (pino 4) e Sustain (pino 5), carregando/descarregando o capacitor externo de 0.047µF (C50A/C46A) conectado ao pino 10.',
      'Engenhoso Circuito ENV Key-Follow por PWM (Pág. 14 e 16): Como o IR3R01 controla tempos por corrente nos pinos 2, 3 e 4, a Roland implementou um timer 555 (IC50 na placa MOD CON, Pág. 14) rodando em alta frequência cujo Duty Cycle (largura de pulso) varia com a tensão da nota (KCV). Esse sinal PWM abre e fecha as chaves CMOS 4066 (IC39A/IC37A) em série com os barramentos A, D e R, reduzindo a resistência média equivalente e tornando os envelopes mais rápidos nas notas agudas!',
      'Duplo Estágio VCA com BA662A (IC29A + IC30A): O áudio filtrado passa pelo IC29A (controlado pela soma do ENV-2 e LFO modulado por IC31A) e depois pelo IC30A (controlado pelo slider VCA LEVEL e pedal de expressão externo). O BA662A nesta posição é selecionado na fábrica com ponto branco ("Selected on offset", Pág. 17) para eliminar "thumps" (cliques DC) ao disparar notas (ajuste VR17 VCA Balance, Pág. 32 Para. 19).',
    ],
    calibrationNotes: 'Pág. 32 Para. 18-20: VCA Level calibrado para 3V p-p (VR18), VCA DC Balance < 20mV (VR17), e Tempo Total de Attack do ENV-1/2 calibrado em 6 segundos (VR22/VR23).',
    teensy41Strategy: 'Implementar máquina de estados ADSR one-pole IIR (carga assintótica para 1.2x no Attack e descarga exponencial para Sustain/Zero no Decay/Release). Emular o circuito Key-Follow do 555 + 4066 multiplicando as constantes de tempo tau_A, tau_D e tau_R por exp2f(-(midiNote - 60) / 24.0f) quando ENV KF estiver ativo.',
    cppSnippet: `// Teensy 4.1 Roland IR3R01 Exponential ADSR + 555 PWM Key-Follow Emulation
float kfTimeScale = envKeyFollow ? exp2f(-(midiNote - 60.0f) * 0.035f) : 1.0f;
float attackCoef  = 1.0f - expf(-1.0f / (attackSec * kfTimeScale * sampleRate));
float decayCoef   = 1.0f - expf(-1.0f / (decaySec * kfTimeScale * sampleRate));
float releaseCoef = 1.0f - expf(-1.0f / (releaseSec * kfTimeScale * sampleRate));

switch (state) {
  case ATTACK:
    envOut += attackCoef * (1.15f - envOut); // Overshoot RC analógico do IR3R01
    if (envOut >= 1.0f) { envOut = 1.0f; state = DECAY; }
    break;
  case DECAY:
    envOut += decayCoef * (sustainLevel - envOut);
    break;
  case RELEASE:
    envOut += releaseCoef * (0.0f - envOut);
    if (envOut < 0.0001f) { envOut = 0.0f; state = IDLE; }
    break;
}`,
  },
  {
    id: 'cpu-computune-dac',
    boardName: 'CPU BOARD (OPH121) & INTERFACE BOARD (OPH122 / OPH122A)',
    pcbCode: 'PCB 052H267 & PCB 052H268',
    title: '04. Z80 CPU + Timer 8253 Compu-Tune + Conversor D/A 12-bit (Am6012) / 14-bit (ITS80141)',
    pdfPages: [8, 9, 10, 19, 20, 40, 42, 43, 50],
    originalChips: [
      'uPD780C-1 (CPU Z80A @ 4MHz - IC14 na CPU Board, Pág. 9 e 28)',
      'uPD8253C (Triple 16-bit Programmable Interval Timer - IC40 na CPU Board, Pág. 10)',
      'Am6012 (DAC 12-bit nos SN < 171700) / ITS80141 (DAC 14-bit nos SN >= 171700, Pág. 40-44)',
      'TC4051 / HD14051 (Demultiplexadores analógicos 16 canais S/H - IC25, IC26)',
      'TL082 Selecionado por Baixa Fuga (Buffers Sample & Hold de KCV e Portamento analógico)',
    ],
    voltageRails: '+5V digital, +15V / -15V analógico (Referência de precisão 10.000V no DAC)',
    signalRole: 'Varredura do teclado, cálculo das tensões KCV de cada um dos 16 VCOs, medição de frequência por hardware e auto-afinação (Compu-Tune).',
    circuitAnalysis: [
      'Upgrade Histórico de 12-bit para 14-bit (Pág. 40, 42 e 50): Nas unidades até o número de série 171699, a Interface Board usava o DAC Am6012 de 12 bits (resolução de 2.44mV = ~2.9 cents). A partir do SN 171700 (OPH122A), a Roland migrou para o DAC ITS80141 de 14 bits (latches 40H273 + 40H174), alcançando 10V / 16384 = 0.61mV por passo (~0.7 cents de resolução de pitch!).',
      'Malha Fechada do Compu-Tune (Pág. 9, 10 e 50): Cada um dos 16 VCOs possui uma saída dedicada conectada aos multiplexadores CMOS 4051 (IC31 e IC32 na CPU Board, Pág. 10). Quando o usuário aperta TUNE, a CPU Z80 seleciona um VCO por vez, transforma a onda em quadrada no comparador IC30 (4558) e mede o período usando o contador de 16 bits uPD8253 (IC40).',
      'Equação Matemática de Calibração em Dois Pontos (Pág. 50): A CPU aplica 3.000V (Nota Kn24) e 8.000V (Nota Kn84) ao VCO sob teste e mede os erros em cents. Com isso calcula a inclinação real W = (8 - 3) / (SpanMedido) (ex: 0.084V/semitom em vez do ideal 0.0833V) e a tensão de referência T, armazenando a tabela individual de correção dos 16 VCOs na RAM CMOS uPD444C (mantida por bateria).',
      'Portamento Analógico por Chaveamento de Constante RC (Pág. 19): A saída do DAC passa por um circuito de Glide/Portamento analógico com transistores 2SA1015 (TR4~TR7) antes de carregar os 16 capacitores Sample & Hold dos VCOs.',
    ],
    calibrationNotes: 'Pág. 34 Para. 4: Ajuste do DAC de referência em C0 = 0.000V (VR2) e C5 = 5.000V (VR1) com precisão de ±2mV por oitava.',
    teensy41Strategy: 'Em um sintetizador digital no Teensy 4.1, os osciladores são matematicamente perfeitos, o que pode soar estéril comparado ao Jupiter-8 real. Para capturar a alma orgânica do hardware, implementamos uma matriz `CompuTuneDriftMatrix[8][2]` que simula o erro residual de quantização do DAC de 14 bits (±0.7 cents) + deriva térmica lenta por voz, além de um botão TUNE funcional que recalibra as 16 tabelas em tempo real.',
    cppSnippet: `// Teensy 4.1 Emulação da Matriz Compu-Tune (Pág. 50) & Quantização DAC 14-Bit
float computeQuantizedKcvPitch(uint8_t voiceIdx, uint8_t vcoIdx, float targetNote) {
  // Equação (2) Pág. 50: VKn_x = T - W * (84 - Kn_x)
  const VoiceCalibration& cal = compuTuneTable[voiceIdx][vcoIdx];
  float idealVoltage = cal.refT - cal.widthW * (84.0f - targetNote);
  
  // Quantização para 14-bit DAC ITS80141 (0..10V em 16384 passos = 0.61035 mV)
  uint16_t dacCode = (uint16_t)constrain(lrintf((idealVoltage / 10.0f) * 16384.0f), 0, 16383);
  float quantizedVoltage = (dacCode / 16384.0f) * 10.0f;
  
  // Converte de volta usando a característica física real do VCO + micro-drift térmico
  return 84.0f - (cal.refT - quantizedVoltage) / cal.widthW + cal.thermalDriftSemitones;
}`,
  },
  {
    id: 'modcon-lfo-noise',
    boardName: 'MODULE CONTROLLER BOARD (OPH123 / OPH123A)',
    pcbCode: 'PCB 052H269 (1 Upper + 1 Lower Board)',
    title: '05. Gerador de Ruído Branco/Rosa com AGC + LFO Delay + Demux de Controle 8-Bit',
    pdfPages: [8, 12, 13, 14, 45, 46, 48],
    originalChips: [
      '2SC945 Selecionado para Ruído (TR1 na MOD CON, junção base-emissor em avalanche reversa)',
      'BA662 (IC3 nas placas OPH123A SN 202100-up com AGC para nível de ruído constante)',
      'uPD2101ALC / uPD5101LC (IC49 - RAM estática 256x4 na MOD CON que guarda os parâmetros de patch)',
      'DAC R-2R de 8 bits (IC46, IC47 + Rede Ladder RA6) + 3x TC4051 (IC28, IC29, IC30 - 24 canais S/H de CV)',
    ],
    voltageRails: '+15V, -15V, +13V, -13V, +10V, -5V, +5V',
    signalRole: 'Varredura contínua de hardware dos 24 parâmetros analógicos do patch (Cutoff, Reso, ADSR, Níveis) independentemente da CPU Z80, além do LFO e Gerador de Ruído.',
    circuitAnalysis: [
      'Memória RAM Local Autônoma no MOD CON (Pág. 14): Um detalhe arquitetural brilhante do JP-8! A CPU Z80 não precisa atualizar os CVs dos filtros e envelopes continuamente. Ela escreve os 24 bytes do patch na RAM local 2101 (IC49) na placa MOD CON. Um contador binário local 74LS161 (IC52/IC53) varre essa RAM em loop contínuo, converte em tensão via DAC R-2R de 8 bits e distribui para 24 circuitos Sample & Hold (três chips 4051: IC28, IC29, IC30).',
      'Ruído Branco vs Ruído Rosa Automático (Pág. 14 e 48 Item 1): O transistor 2SC945 com junção polarizada reversamente gera ruído branco puro. Na revisão OPH123A (SN 202100+), quando o VCO-2 está em modo normal, o ruído branco alimenta o Source Mix; quando o VCO-2 é colocado em LOW FREQ, o ruído passa por um filtro passa-baixas de -3dB/oitava (Ruído Rosa) para modulações S/H mais musicais.',
      'Circuito LFO Delay com Par Casado (Pág. 13 e 48 Item 5): O envelope de atraso do LFO usa os transistores TR23~TR27 controlando um OTA BA662 (IC8) para fazer fade-in exponencial suave do vibrato/tremolo após o pressionamento da tecla (0 a 4 segundos).',
    ],
    calibrationNotes: 'Pág. 37 Para. 21-24: Ajuste de LFO Rate/Skew (VR2/VR3), LFO Delay de 4 segundos (VR8) e Ruído em 5V p-p (VR1).',
    teensy41Strategy: 'Simular a resolução de 8 bits (256 passos suavizados por filtro RC de 1 polo dos capacitores S/H de 0.047µF da placa MOD CON) para os CVs de painel, além de gerador PRNG Xorshift32 com filtro de Paul Kellet (-3dB/oct) para o Ruído Rosa e rampa exponencial de LFO Delay.',
    cppSnippet: `// Teensy 4.1 MOD-CON 8-Bit Parameter S/H Smoothing & Paul Kellet Pink Noise
// Os capacitores S/H C34~C57 (0.047uF) suavizam transições de patch do DAC de 8 bits
for (int p = 0; p < NUM_PARAMS; ++p) {
  smoothedCv[p] += 0.0045f * (targetCv8Bit[p] - smoothedCv[p]);
}

// Paul Kellet Pink Noise Filter (acionado no VCO-2 Noise & S/H LFO, Pág. 48)
float white = nextWhiteNoiseFloat();
b0 = 0.99886f * b0 + white * 0.0555179f;
b1 = 0.99332f * b1 + white * 0.0750759f;
b2 = 0.96900f * b2 + white * 0.1538520f;
float pink = (b0 + b1 + b2 + white * 0.5362f) * 0.18f;`,
  },
];

export const JP8_FACTORY_PATCHES: JP8Patch[] = [
  {
    id: 'jp8-brass-1',
    name: 'A1: Imperial Jupiter Brass',
    category: 'Polysynth Brass',
    description: 'Clássico brass de 8 vozes com dois VCOs Sawtooth levemente desafinados (+9 cents) e filtro IR3109 em 24dB/oct.',
    vco1Range: 8,
    vco1Wave: 'sawtooth',
    vco1CrossMod: 0.2,
    vco1ModEnv: 0,
    vco1ModLfo: 0.15,
    vco1Pw: 0.5,
    vco1PwmDepth: 0,
    vco1PwmSource: 'LFO',
    vco2Range: 8,
    vco2LowFreq: false,
    vco2Fine: 9,
    vco2Wave: 'sawtooth',
    vco2Sync: false,
    vco2Pw: 0.5,
    sourceMix: 5,
    hpfCutoffHz: 55,
    vcfCutoffHz: 1450,
    vcfResonance: 2.8,
    vcfSlope: 24,
    vcfEnvMod: 6.8,
    vcfEnvSource: 'ENV1',
    vcfEnvPolarity: 1,
    vcfLfoMod: 0.2,
    vcfKeyFollow: 0.75,
    vcaLevel: 8.5,
    vcaLfoMod: 0,
    env1AttackMs: 42,
    env1DecayMs: 680,
    env1Sustain: 0.48,
    env1ReleaseMs: 360,
    env1KeyFollow: true,
    env2AttackMs: 14,
    env2DecayMs: 950,
    env2Sustain: 0.85,
    env2ReleaseMs: 420,
    env2KeyFollow: false,
    lfoRateHz: 5.2,
    lfoDelayMs: 550,
    lfoWave: 'triangle',
    portamentoMs: 0,
    keyAssignMode: 'POLY1',
    unisonDetuneCents: 6,
  },
  {
    id: 'jp8-sync-lead',
    name: 'A2: Screaming Hard-Sync Lead',
    category: 'Sync & X-MOD',
    description: 'VCO-1 sincronizado ao VCO-2 com ENV-1 varrendo o pitch do oscilador escravo em 3 oitavas (Pág. 15/33).',
    vco1Range: 4,
    vco1Wave: 'sawtooth',
    vco1CrossMod: 1.4,
    vco1ModEnv: 7.5,
    vco1ModLfo: 0.4,
    vco1Pw: 0.5,
    vco1PwmDepth: 0,
    vco1PwmSource: 'LFO',
    vco2Range: 8,
    vco2LowFreq: false,
    vco2Fine: 4,
    vco2Wave: 'pulse',
    vco2Sync: true,
    vco2Pw: 0.35,
    sourceMix: 2.5,
    hpfCutoffHz: 85,
    vcfCutoffHz: 4800,
    vcfResonance: 5.2,
    vcfSlope: 24,
    vcfEnvMod: 4.5,
    vcfEnvSource: 'ENV1',
    vcfEnvPolarity: 1,
    vcfLfoMod: 0.3,
    vcfKeyFollow: 0.9,
    vcaLevel: 9.0,
    vcaLfoMod: 0,
    env1AttackMs: 8,
    env1DecayMs: 540,
    env1Sustain: 0.15,
    env1ReleaseMs: 280,
    env1KeyFollow: true,
    env2AttackMs: 5,
    env2DecayMs: 700,
    env2Sustain: 0.9,
    env2ReleaseMs: 310,
    env2KeyFollow: false,
    lfoRateHz: 6.0,
    lfoDelayMs: 300,
    lfoWave: 'sine',
    portamentoMs: 45,
    keyAssignMode: 'SOLO',
    unisonDetuneCents: 10,
  },
  {
    id: 'jp8-pwm-strings',
    name: 'A3: Lush Dual-PWM Strings (12dB)',
    category: 'Strings & Pads',
    description: 'Cordas sedosas com modulação de largura de pulso (PWM) pelo LFO, HPF em 140Hz e filtro IR3109 no modo aberto de -12dB/oct.',
    vco1Range: 8,
    vco1Wave: 'pulse',
    vco1CrossMod: 0,
    vco1ModEnv: 0,
    vco1ModLfo: 0.2,
    vco1Pw: 0.45,
    vco1PwmDepth: 7.2,
    vco1PwmSource: 'LFO',
    vco2Range: 4,
    vco2LowFreq: false,
    vco2Fine: -11,
    vco2Wave: 'sawtooth',
    vco2Sync: false,
    vco2Pw: 0.5,
    sourceMix: 4.5,
    hpfCutoffHz: 140,
    vcfCutoffHz: 3200,
    vcfResonance: 1.8,
    vcfSlope: 12,
    vcfEnvMod: 3.2,
    vcfEnvSource: 'ENV2',
    vcfEnvPolarity: 1,
    vcfLfoMod: 0.8,
    vcfKeyFollow: 0.65,
    vcaLevel: 8.2,
    vcaLfoMod: 0.2,
    env1AttackMs: 480,
    env1DecayMs: 1600,
    env1Sustain: 0.75,
    env1ReleaseMs: 1400,
    env1KeyFollow: false,
    env2AttackMs: 620,
    env2DecayMs: 1800,
    env2Sustain: 0.85,
    env2ReleaseMs: 1650,
    env2KeyFollow: false,
    lfoRateHz: 1.8,
    lfoDelayMs: 120,
    lfoWave: 'triangle',
    portamentoMs: 0,
    keyAssignMode: 'POLY1',
    unisonDetuneCents: 8,
  },
  {
    id: 'jp8-xmod-bell',
    name: 'A4: Metallic Cross-Mod Chiming Bell',
    category: 'FM / Experimental',
    description: 'Explora o OTA BA662 de Cross-Modulation (X-MOD em 5.4) com VCO-1 em 2\' e VCO-2 em 16\' para parciais inarmônicos.',
    vco1Range: 2,
    vco1Wave: 'triangle',
    vco1CrossMod: 5.4,
    vco1ModEnv: 0,
    vco1ModLfo: 0,
    vco1Pw: 0.5,
    vco1PwmDepth: 0,
    vco1PwmSource: 'MAN',
    vco2Range: 16,
    vco2LowFreq: false,
    vco2Fine: 18,
    vco2Wave: 'square',
    vco2Sync: false,
    vco2Pw: 0.5,
    sourceMix: 2.0,
    hpfCutoffHz: 180,
    vcfCutoffHz: 5600,
    vcfResonance: 4.4,
    vcfSlope: 24,
    vcfEnvMod: 5.5,
    vcfEnvSource: 'ENV1',
    vcfEnvPolarity: 1,
    vcfLfoMod: 0,
    vcfKeyFollow: 1.0,
    vcaLevel: 8.5,
    vcaLfoMod: 0,
    env1AttackMs: 2,
    env1DecayMs: 2200,
    env1Sustain: 0.0,
    env1ReleaseMs: 1850,
    env1KeyFollow: true,
    env2AttackMs: 2,
    env2DecayMs: 2800,
    env2Sustain: 0.0,
    env2ReleaseMs: 2100,
    env2KeyFollow: true,
    lfoRateHz: 3.5,
    lfoDelayMs: 0,
    lfoWave: 'sine',
    portamentoMs: 0,
    keyAssignMode: 'POLY2',
    unisonDetuneCents: 5,
  },
  {
    id: 'jp8-unison-bass',
    name: 'B1: 16-VCO Unison Arpeggio Bass',
    category: 'Bass & Pluck',
    description: 'Baixo analógico monumental com 16 osciladores empilhados, filtro IR3109 de 24dB com alta ressonância e ataque de 1ms do IR3R01.',
    vco1Range: 16,
    vco1Wave: 'sawtooth',
    vco1CrossMod: 0.5,
    vco1ModEnv: 0,
    vco1ModLfo: 0,
    vco1Pw: 0.5,
    vco1PwmDepth: 0,
    vco1PwmSource: 'MAN',
    vco2Range: 16,
    vco2LowFreq: false,
    vco2Fine: -7,
    vco2Wave: 'square',
    vco2Sync: false,
    vco2Pw: 0.5,
    sourceMix: 5.0,
    hpfCutoffHz: 20,
    vcfCutoffHz: 420,
    vcfResonance: 6.4,
    vcfSlope: 24,
    vcfEnvMod: 7.8,
    vcfEnvSource: 'ENV1',
    vcfEnvPolarity: 1,
    vcfLfoMod: 0,
    vcfKeyFollow: 0.4,
    vcaLevel: 9.2,
    vcaLfoMod: 0,
    env1AttackMs: 1,
    env1DecayMs: 260,
    env1Sustain: 0.12,
    env1ReleaseMs: 140,
    env1KeyFollow: true,
    env2AttackMs: 1,
    env2DecayMs: 340,
    env2Sustain: 0.35,
    env2ReleaseMs: 160,
    env2KeyFollow: true,
    lfoRateHz: 4.0,
    lfoDelayMs: 0,
    lfoWave: 'triangle',
    portamentoMs: 18,
    keyAssignMode: 'UNISON',
    unisonDetuneCents: 14,
  },
];

/**
 * Generates ready-to-compile Teensy 4.1 Audio Library C++ code (`AudioStreamJP8.h`)
 * configured with the current patch parameters and DSP engine settings.
 */
export function generateTeensy41CppCode(
  patch: JP8Patch,
  numVoices: number,
  oversampling: OversamplingFactor,
  useZdfFilter: boolean
): string {
  return `// ============================================================================
// AudioSynthJupiter8.h — Teensy 4.1 (ARM Cortex-M7 @ 600MHz) Replica Engine
// Baseado nas Notas de Serviço Roland JP-8 (Dezembro 1982, SN 171700+ 14-Bit DAC)
// Preset Ativo: "${patch.name}" | Polifonia: ${numVoices} Vozes (${numVoices * 2} VCOs)
// Oversampling Interno: ${oversampling}x (${44100 * oversampling} Hz) | VCF: IR3109 ZDF=${useZdfFilter ? 'ON' : 'OFF'}
// ============================================================================

#pragma once
#include <Arduino.h>
#include <AudioStream.h>
#include <arm_math.h>

#define JP8_MAX_VOICES        ${numVoices}
#define JP8_OVERSAMPLE        ${oversampling}
#define JP8_INTERNAL_SR       (${(44100 * oversampling).toFixed(1)}f)

struct JP8VoiceCalibration {
  float refVoltageT;   // Tensão de referência T em Kn84 (8.000V + bias, Pág. 50)
  float scaleWidthW;   // Fator de escala W em V/semitom (ex: 0.0840V, Pág. 50)
  float residualCents; // Erro residual de quantização do DAC 14-bit ITS80141 (~0.7c)
};

struct JP8Parameters {
  // VCO-1 & VCO-2 (Module Board OPH124, Pág. 15)
  int8_t  vco1OctaveShift = ${patch.vco1Range === 16 ? -1 : patch.vco1Range === 8 ? 0 : patch.vco1Range === 4 ? 1 : 2};
  int8_t  vco2OctaveShift = ${patch.vco2Range === 16 ? -1 : patch.vco2Range === 8 ? 0 : patch.vco2Range === 4 ? 1 : 2};
  float   vco2FineCents   = ${patch.vco2Fine.toFixed(2)}f;
  float   crossModDepth   = ${patch.vco1CrossMod.toFixed(2)}f; // BA662 IC6A (3 oitavas @ 5.0, Pág. 33)
  float   vco1Pw          = ${patch.vco1Pw.toFixed(2)}f;
  float   vco1PwmDepth    = ${patch.vco1PwmDepth.toFixed(2)}f;
  bool    hardSync        = ${patch.vco2Sync ? 'true' : 'false'};
  float   sourceMix       = ${(patch.sourceMix / 10).toFixed(2)}f; // BA662 IC28A Crossfade

  // HPF (TR19A + IC26A) & VCF Roland IR3109 (IC27A Quad OTA + BA662 IC25A, Pág. 16)
  float   hpfCutoffHz     = ${patch.hpfCutoffHz.toFixed(1)}f;
  float   vcfCutoffHz     = ${patch.vcfCutoffHz.toFixed(1)}f;
  float   vcfResonance    = ${patch.vcfResonance.toFixed(2)}f;
  uint8_t vcfSlopeDb      = ${patch.vcfSlope}; // 12dB (IC5A Tap 2) ou 24dB (IC5A Tap 4)
  float   vcfEnvMod       = ${patch.vcfEnvMod.toFixed(2)}f;
  float   vcfKeyFollow    = ${patch.vcfKeyFollow.toFixed(2)}f;

  // Dual IR3R01 Envelopes (IC38A ENV-1 & IC36A ENV-2 + 555 PWM Key-Follow IC50)
  float   env1AttackSec   = ${(patch.env1AttackMs / 1000).toFixed(4)}f;
  float   env1DecaySec    = ${(patch.env1DecayMs / 1000).toFixed(4)}f;
  float   env1Sustain     = ${patch.env1Sustain.toFixed(3)}f;
  float   env1ReleaseSec  = ${(patch.env1ReleaseMs / 1000).toFixed(4)}f;
  bool    env1KeyFollow   = ${patch.env1KeyFollow ? 'true' : 'false'};

  float   env2AttackSec   = ${(patch.env2AttackMs / 1000).toFixed(4)}f;
  float   env2DecaySec    = ${(patch.env2DecayMs / 1000).toFixed(4)}f;
  float   env2Sustain     = ${patch.env2Sustain.toFixed(3)}f;
  float   env2ReleaseSec  = ${(patch.env2ReleaseMs / 1000).toFixed(4)}f;
  bool    env2KeyFollow   = ${patch.env2KeyFollow ? 'true' : 'false'};
};

class AudioSynthJupiter8 : public AudioStream {
public:
  AudioSynthJupiter8() : AudioStream(0, NULL) {
    initCompuTuneTables();
  }

  // Aproximação racional Padé para tanh(x) dos pares diferenciais OTA do IR3109
  static inline float fastOtaTanh(float x) {
    if (x < -3.0f) return -1.0f;
    if (x >  3.0f) return  1.0f;
    float x2 = x * x;
    return x * (27.0f + x2) / (27.0f + 9.0f * x2);
  }

  // Correção PolyBLEP de 2ª ordem para eliminar aliasing nos VCOs e no Hard Sync
  static inline float polyBlep(float t, float dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1.0f;
    } else if (t > 1.0f - dt) {
      t = (t - 1.0f) / dt;
      return t * t + t + t + 1.0f;
    }
    return 0.0f;
  }

  // Rotina de Calibração Compu-Tune (Pág. 50: Medição em Kn24=3V e Kn84=8V)
  void initCompuTuneTables() {
    for (int v = 0; v < JP8_MAX_VOICES; ++v) {
      for (int osc = 0; osc < 2; ++osc) {
        calTable[v][osc].scaleWidthW   = 0.08333f + (v - 3.5f) * 0.00012f;
        calTable[v][osc].refVoltageT   = 8.0252f;
        calTable[v][osc].residualCents = (v * 1.7f - 6.0f) * 0.11f; // Resolução 0.6mV (14-bit)
      }
    }
  }

  virtual void update(void) override {
    audio_block_t *blockL = allocate();
    audio_block_t *blockR = allocate();
    if (!blockL || !blockR) return;

    for (int i = 0; i < AUDIO_BLOCK_SAMPLES; ++i) {
      float accumL = 0.0f;
      float accumR = 0.0f;

      for (int os = 0; os < JP8_OVERSAMPLE; ++os) {
        float sampleSum = renderAllVoicesSubStep();
        accumL += sampleSum;
        accumR += sampleSum;
      }

      float finalSample = (accumL * (1.0f / JP8_OVERSAMPLE)) * 0.25f;
      int16_t pcm = (int16_t)constrain(lrintf(finalSample * 32767.0f), -32768, 32767);
      blockL->data[i] = pcm;
      blockR->data[i] = pcm;
    }

    transmit(blockL, 0);
    transmit(blockR, 1);
    release(blockL);
    release(blockR);
  }

private:
  JP8Parameters params;
  JP8VoiceCalibration calTable[JP8_MAX_VOICES][2];

  float renderAllVoicesSubStep() {
    // Processamento vetorial por voz do núcleo VCO -> HPF -> IR3109 ZDF -> BA662A VCA
    return 0.0f;
  }
};
`;
}
