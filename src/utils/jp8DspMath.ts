/**
 * Pure DSP & Schematic Engineering Math for Roland Jupiter-8 -> Teensy 4.1 Port
 */

export type WaveformType = 'triangle' | 'sawtooth' | 'pulse' | 'square';
export type FilterSlope = 12 | 24;
export type KeyAssignMode = 'POLY1' | 'POLY2' | 'UNISON' | 'SOLO';
export type OversamplingFactor = 1 | 2 | 4;

export interface JP8Patch {
  id: string;
  name: string;
  category: string;
  description: string;
  // VCO-1
  vco1Range: 16 | 8 | 4 | 2;
  vco1Wave: WaveformType;
  vco1CrossMod: number; // 0 to 10 (FM depth from VCO-2 to VCO-1, up to 3 octaves at 5)
  vco1ModEnv: number;   // 0 to 10
  vco1ModLfo: number;   // 0 to 10
  vco1Pw: number;       // 0.05 to 0.95
  vco1PwmDepth: number; // 0 to 10
  vco1PwmSource: 'MAN' | 'LFO' | 'ENV1';

  // VCO-2
  vco2Range: 16 | 8 | 4 | 2;
  vco2LowFreq: boolean;
  vco2Fine: number;     // -50 to +50 cents
  vco2Wave: WaveformType | 'noise';
  vco2Sync: boolean;    // Hard sync VCO-2 to VCO-1
  vco2Pw: number;       // 0.05 to 0.95

  // Source Mix & HPF
  sourceMix: number;    // 0 (100% VCO-1) to 10 (100% VCO-2)
  hpfCutoffHz: number;  // 20 to 2000 Hz (1-pole 6dB/oct TR19A/IC26A)

  // VCF (IR3109 Quad OTA)
  vcfCutoffHz: number;  // 20 to 18000 Hz
  vcfResonance: number; // 0 to 10 (BA662 feedback loop)
  vcfSlope: FilterSlope;// 12dB (2-pole) or 24dB (4-pole)
  vcfEnvMod: number;    // 0 to 10
  vcfEnvSource: 'ENV1' | 'ENV2';
  vcfEnvPolarity: 1 | -1;
  vcfLfoMod: number;    // 0 to 10
  vcfKeyFollow: number; // 0 to 1.2 (0% to 120%)

  // VCA (BA662A + ENV-2)
  vcaLevel: number;     // 0 to 10
  vcaLfoMod: number;    // 0 to 3

  // ENV-1 (IR3R01 IC38A)
  env1AttackMs: number; // 1 to 5000 ms
  env1DecayMs: number;  // 1 to 10000 ms
  env1Sustain: number;  // 0 to 1.0
  env1ReleaseMs: number;// 1 to 10000 ms
  env1KeyFollow: boolean;

  // ENV-2 (IR3R01 IC36A)
  env2AttackMs: number; // 1 to 5000 ms
  env2DecayMs: number;  // 1 to 10000 ms
  env2Sustain: number;  // 0 to 1.0
  env2ReleaseMs: number;// 1 to 10000 ms
  env2KeyFollow: boolean;

  // LFO & Global
  lfoRateHz: number;    // 0.05 to 40 Hz
  lfoDelayMs: number;   // 0 to 4000 ms
  lfoWave: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'random';
  portamentoMs: number; // 0 to 2000 ms
  keyAssignMode: KeyAssignMode;
  unisonDetuneCents: number; // 0 to 35 cents (Compu-Tune drift simulation)
}

export interface TeensyDspBudget {
  totalCyclesPerSample: number;
  cpuLoadPercentAt44k1: number;
  sramBytesUsed: number;
  sramPercentOfDTCM: number;
  vcoCycles: number;
  vcfCycles: number;
  envLfoCycles: number;
  overheadCycles: number;
  canRunAt600MHz: boolean;
}

export interface CompuTuneVoiceResult {
  voiceLabel: string;
  vcoIndex: 1 | 2;
  moduleBoard: 'MOD AB' | 'MOD CD' | 'MOD EF' | 'MOD GH';
  rawErrorCentsAt3V: number;
  rawErrorCentsAt8V: number;
  scaleFactorW: number;
  referenceVoltageT: number;
  dac14BitCodeAtC2: number;
  calibratedResidualCents: number;
}

/**
 * Calculates PolyBLEP (Polynomial Bandlimited Step) correction for anti-aliased
 * sawtooth and pulse oscillators on Teensy 4.1.
 * @param t Normalized phase [0, 1)
 * @param dt Normalized phase increment (freq / sampleRate)
 */
export function polyBlep(t: number, dt: number): number {
  if (dt <= 0) return 0;
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1.0;
  } else if (t > 1.0 - dt) {
    const x = (t - 1.0) / dt;
    return x * x + x + x + 1.0;
  }
  return 0.0;
}

/**
 * Calculates frequency in Hz for a MIDI note with range multiplier, fine tune cents,
 * and cross-modulation (X-MOD) offset.
 * Per page 33 (Para 10: VCO CROSS MOD DEPTH), when CROSS MOD is at 5 (50%) and range at 2',
 * VCO-1 frequency shifts by 3 octaves.
 */
export function calculateVcoFrequency(
  midiNote: number,
  rangeFeet: 16 | 8 | 4 | 2,
  fineCents: number,
  xModAmount0To10: number = 0,
  modulatorInstantValueMinus1To1: number = 0
): number {
  const rangeOctaveOffset =
    rangeFeet === 16 ? -1 : rangeFeet === 8 ? 0 : rangeFeet === 4 ? 1 : 2;
  const effectiveNote = midiNote + rangeOctaveOffset * 12 + fineCents / 100;
  const baseFreq = 440 * Math.pow(2, (effectiveNote - 69) / 12);

  // At xMod = 5, shift is 3 octaves; full scale (10) reaches up to 6 octaves peak exponential FM
  const xModOctaves = (xModAmount0To10 / 5.0) * 3.0 * modulatorInstantValueMinus1To1;
  return Math.max(10, Math.min(22000, baseFreq * Math.pow(2, xModOctaves)));
}

/**
 * Simulates the Roland Jupiter-8 Compu-Tune algorithm documented on Page 50 of the Service Notes.
 * Equations (1) & (2):
 * VKn_x = VKn_0 + W(WIDTH) * Kn_x
 * VKn_x = T(TUNE) - W * (84 - Kn_x)
 * Where W = (8V - 3V) / (9570 - 3620 cents) = 0.084V per semitone (ideal 1/12V = 0.08333V)
 * And fine tune bias = 0.084 * (30 / 100) = 0.0252V
 */
export function calculateCompuTuneCalibration(
  errorCentsAt3V: number, // e.g., +20 cents at Kn24 (3V)
  errorCentsAt8V: number, // e.g., -30 cents at Kn84 (8V)
  keyNumber: number = 24
): {
  measuredSpanCents: number;
  scaleFactorW: number;
  biasVoltage: number;
  kcvVoltage: number;
  dac12BitStepMv: number;
  dac14BitStepMv: number;
  dac14BitCode: number;
} {
  // Ideal span between 3V (Kn24 = 3600 cents) and 8V (Kn84 = 9600 cents) is 6000 cents (5 octaves)
  const measuredLowCents = 3600 + errorCentsAt3V;
  const measuredHighCents = 9600 + errorCentsAt8V;
  const measuredSpanCents = measuredHighCents - measuredLowCents;

  // W in Volts per 100 cents (1 semitone)
  const scaleFactorW = Number(((5.0 / measuredSpanCents) * 100).toFixed(5));
  const biasVoltage = Number((scaleFactorW * (-errorCentsAt8V / 100)).toFixed(4));
  const referenceT = 8.0 + biasVoltage;

  // Equation (2): VKn_x = T - W * (84 - Kn_x)
  const kcvVoltage = Number((referenceT - scaleFactorW * (84 - keyNumber)).toFixed(4));

  // Page 50: 14-bit DAC ITS80141 output range 0-10V -> 10V / 2^14 = 0.61035 mV (~0.7 cents)
  const dac12BitStepMv = Number(((10000 / 4096)).toFixed(3));
  const dac14BitStepMv = Number(((10000 / 16384)).toFixed(3));
  const dac14BitCode = Math.max(0, Math.min(16383, Math.round((kcvVoltage / 10.0) * 16384)));

  return {
    measuredSpanCents,
    scaleFactorW,
    biasVoltage,
    kcvVoltage,
    dac12BitStepMv,
    dac14BitStepMv,
    dac14BitCode,
  };
}

/**
 * Computes the frequency response magnitude (in dB) of the Roland IR3109 cascaded OTA filter
 * (switchable 2-pole -12dB/oct or 4-pole -24dB/oct) plus the 1-pole -6dB/oct High Pass Filter.
 */
export function computeIr3109MagnitudeDb(
  freqHz: number,
  hpfCutoffHz: number,
  vcfCutoffHz: number,
  vcfResonance0To10: number,
  slope: FilterSlope
): number {
  const safeFreq = Math.max(10, freqHz);
  const safeHpf = Math.max(10, hpfCutoffHz);
  const safeVcf = Math.max(20, vcfCutoffHz);

  // 1-pole HPF (TR19A + IC26A TL082): |H_hpf(f)| = (f/fc) / sqrt(1 + (f/fc)^2)
  const hpfRatio = safeFreq / safeHpf;
  const hpfMag = hpfRatio / Math.sqrt(1 + hpfRatio * hpfRatio);

  // IR3109 2-pole or 4-pole cascade with BA662 resonance feedback k in [0, 3.95]
  const vcfRatio = safeFreq / safeVcf;
  const poles = slope === 24 ? 4 : 2;
  const baseAtten = Math.pow(1 + vcfRatio * vcfRatio, poles / 2);

  // Resonance peak modeling around cutoff (f / fc == 1)
  const k = (vcfResonance0To10 / 10) * 3.85;
  const gaussianWidth = slope === 24 ? 0.18 : 0.28;
  const logDist = Math.log2(vcfRatio);
  const resBell = 1 + k * Math.exp(-(logDist * logDist) / (2 * gaussianWidth * gaussianWidth));

  const totalMag = Math.max(1e-5, (hpfMag * resBell) / baseAtten);
  return Number((20 * Math.log10(totalMag)).toFixed(2));
}

/**
 * Estimates exact ARM Cortex-M7 @ 600MHz cycle budget and DTCM SRAM usage on Teensy 4.1
 * for the complete Jupiter-8 audio engine.
 */
export function calculateTeensy41DspBudget(
  activeVoices: number,
  oversampling: OversamplingFactor,
  enableZdfNewtonRaphson: boolean,
  enableChorusBbd: boolean
): TeensyDspBudget {
  const clampedVoices = Math.max(1, Math.min(16, activeVoices));
  const sampleRate = 44100;
  const cpuClockHz = 600_000_000;
  const availableCyclesPerSample = cpuClockHz / sampleRate; // ~13,605.4 cycles/sample

  // Per-voice cycle cost on Cortex-M7 FPU (dual-issue superscalar float32)
  // 2x VCO with PolyBLEP + Hard Sync + X-MOD + PWM
  const vcoPerVoice = 95 * oversampling;
  // IR3109 4-pole OTA ladder with tanh() OTA saturation + HPF
  const vcfBase = enableZdfNewtonRaphson ? 165 : 85;
  const vcfPerVoice = vcfBase * oversampling;
  // 2x IR3R01 Envelopes (with 555 Key-Follow timer scaling) + LFO + VCA BA662 curve
  const envLfoPerVoice = 42;

  const vcoCycles = clampedVoices * vcoPerVoice;
  const vcfCycles = clampedVoices * vcfPerVoice;
  const envLfoCycles = clampedVoices * envLfoPerVoice;
  const overheadCycles = 65 + (enableChorusBbd ? 140 : 0);

  const totalCyclesPerSample = vcoCycles + vcfCycles + envLfoCycles + overheadCycles;
  const cpuLoadPercentAt44k1 = Number(
    ((totalCyclesPerSample / availableCyclesPerSample) * 100).toFixed(2)
  );

  // Teensy 4.1 DTCM / tightly coupled RAM1 is 512 KB (524,288 bytes)
  const audioBlockBuffers = 32 * 256; // 32 AudioStream blocks
  const voiceStateStructBytes = clampedVoices * 384;
  const polyBlepLutAndTanhLutBytes = 16384; // 4096 float32 tanh table for OTA nonlinearity
  const chorusDelayLineBytes = enableChorusBbd ? 32768 : 0;
  const sramBytesUsed =
    audioBlockBuffers + voiceStateStructBytes + polyBlepLutAndTanhLutBytes + chorusDelayLineBytes;
  const sramPercentOfDTCM = Number(((sramBytesUsed / 524288) * 100).toFixed(2));

  return {
    totalCyclesPerSample,
    cpuLoadPercentAt44k1,
    sramBytesUsed,
    sramPercentOfDTCM,
    vcoCycles,
    vcfCycles,
    envLfoCycles,
    overheadCycles,
    canRunAt600MHz: cpuLoadPercentAt44k1 < 85,
  };
}

/**
 * Generates an instantaneous 1-cycle waveform buffer (256 samples) for visual oscilloscope
 * preview and harmonic verification of a given JP8Patch.
 */
export function synthesizeSingleCyclePreview(patch: JP8Patch, numSamples: number = 256): number[] {
  const out: number[] = new Array(numSamples);
  const ratio2To1 =
    (patch.vco2Range === 16 ? 0.5 : patch.vco2Range === 8 ? 1 : patch.vco2Range === 4 ? 2 : 4) /
    (patch.vco1Range === 16 ? 0.5 : patch.vco1Range === 8 ? 1 : patch.vco1Range === 4 ? 2 : 4);
  const detuneMult = Math.pow(2, patch.vco2Fine / 1200);
  const vco2FreqMult = ratio2To1 * detuneMult;

  const mix2 = patch.sourceMix / 10;
  const mix1 = 1 - mix2;

  let lpState1 = 0;
  let lpState2 = 0;
  const normCutoff = Math.min(0.95, Math.max(0.05, patch.vcfCutoffHz / 12000));
  const resBoost = (patch.vcfResonance / 10) * 1.35;

  for (let i = 0; i < numSamples; i++) {
    const phase1 = i / numSamples;
    // Hard sync resets phase2 every time phase1 wraps (at i === 0)
    let phase2 = ((i / numSamples) * vco2FreqMult) % 1.0;
    if (phase2 < 0) phase2 += 1.0;

    // VCO-2 sample (also acts as X-MOD modulator for VCO-1)
    let s2 = 0;
    if (patch.vco2Wave === 'sawtooth') {
      s2 = 2 * phase2 - 1;
    } else if (patch.vco2Wave === 'triangle') {
      s2 = 1 - 4 * Math.abs(Math.round(phase2 - 0.25) - (phase2 - 0.25));
    } else if (patch.vco2Wave === 'pulse' || patch.vco2Wave === 'square') {
      const pw2 = patch.vco2Wave === 'square' ? 0.5 : patch.vco2Pw;
      s2 = phase2 < pw2 ? 1 : -1;
    } else {
      // Pseudo-deterministic pink noise for preview
      s2 = Math.sin(i * 12.9898) * 0.7;
    }

    // Apply X-MOD phase perturbation to VCO-1
    const xModPhaseOffset = (patch.vco1CrossMod / 10) * 0.45 * s2;
    let modPhase1 = (phase1 + xModPhaseOffset) % 1.0;
    if (modPhase1 < 0) modPhase1 += 1.0;

    let s1 = 0;
    if (patch.vco1Wave === 'sawtooth') {
      s1 = 2 * modPhase1 - 1;
    } else if (patch.vco1Wave === 'triangle') {
      s1 = 1 - 4 * Math.abs(Math.round(modPhase1 - 0.25) - (modPhase1 - 0.25));
    } else {
      const pw1 = patch.vco1Wave === 'square' ? 0.5 : patch.vco1Pw;
      s1 = modPhase1 < pw1 ? 1 : -1;
    }

    const mixed = s1 * mix1 + s2 * mix2;
    // Simple 2-stage OTA saturation filter approximation for time-domain preview
    const feedback = resBoost * Math.tanh(lpState2);
    const inputDrive = Math.tanh(mixed - feedback);
    lpState1 += normCutoff * (inputDrive - lpState1);
    lpState2 += normCutoff * (lpState1 - lpState2);

    out[i] = Number(Math.max(-1, Math.min(1, lpState2 * 1.25)).toFixed(4));
  }

  return out;
}
