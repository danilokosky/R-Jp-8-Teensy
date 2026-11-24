import test from 'node:test';
import assert from 'node:assert/strict';
import {
  polyBlep,
  calculateVcoFrequency,
  calculateCompuTuneCalibration,
  computeIr3109MagnitudeDb,
  calculateTeensy41DspBudget,
  synthesizeSingleCyclePreview,
  JP8Patch,
} from './jp8DspMath';

const defaultPatch: JP8Patch = {
  id: 'jp8-brass-1',
  name: 'Jupiter Signature Brass',
  category: 'Classic Poly',
  description: 'Warm dual-VCO sawtooth brass with IR3109 24dB filter envelope sweep.',
  vco1Range: 8,
  vco1Wave: 'sawtooth',
  vco1CrossMod: 0,
  vco1ModEnv: 0,
  vco1ModLfo: 0,
  vco1Pw: 0.5,
  vco1PwmDepth: 0,
  vco1PwmSource: 'LFO',
  vco2Range: 8,
  vco2LowFreq: false,
  vco2Fine: 8,
  vco2Wave: 'sawtooth',
  vco2Sync: false,
  vco2Pw: 0.5,
  sourceMix: 5,
  hpfCutoffHz: 45,
  vcfCutoffHz: 2400,
  vcfResonance: 3.5,
  vcfSlope: 24,
  vcfEnvMod: 6.5,
  vcfEnvSource: 'ENV1',
  vcfEnvPolarity: 1,
  vcfLfoMod: 0.5,
  vcfKeyFollow: 0.75,
  vcaLevel: 8.5,
  vcaLfoMod: 0,
  env1AttackMs: 35,
  env1DecayMs: 650,
  env1Sustain: 0.45,
  env1ReleaseMs: 320,
  env1KeyFollow: true,
  env2AttackMs: 12,
  env2DecayMs: 800,
  env2Sustain: 0.8,
  env2ReleaseMs: 380,
  env2KeyFollow: false,
  lfoRateHz: 4.5,
  lfoDelayMs: 450,
  lfoWave: 'triangle',
  portamentoMs: 0,
  keyAssignMode: 'POLY1',
  unisonDetuneCents: 6,
};

test('polyBlep discontinuity correction is non-zero at phase wraparound and zero in middle', () => {
  const dt = 440 / 44100;
  assert.equal(polyBlep(0.5, dt), 0);
  assert.ok(polyBlep(0.001, dt) < 0);
  assert.ok(polyBlep(0.999, dt) > 0);
});

test('calculateVcoFrequency matches A4=440Hz and scales 3 octaves at X-MOD=5 per Service Notes p.33', () => {
  const a4 = calculateVcoFrequency(69, 8, 0, 0, 0);
  assert.equal(Math.round(a4), 440);

  // At X-MOD=5 and modulator=+1.0, frequency shifts up by 3 octaves (8x)
  const xModShifted = calculateVcoFrequency(69, 8, 0, 5, 1.0);
  assert.equal(Math.round(xModShifted), 440 * 8);
});

test('calculateCompuTuneCalibration reproduces Service Notes Page 50 equation (W = 0.084V, VKn24 = 2.985V)', () => {
  // Page 50 example: +20 cents at 3V (Kn24), -30 cents at 8V (Kn84)
  const res = calculateCompuTuneCalibration(20, -30, 24);
  assert.equal(res.measuredSpanCents, 5950);
  assert.ok(Math.abs(res.scaleFactorW - 0.08403) < 0.0005);
  assert.ok(Math.abs(res.kcvVoltage - 2.985) < 0.005);
  assert.ok(res.dac14BitStepMv < res.dac12BitStepMv);
});

test('computeIr3109MagnitudeDb attenuates steeper in 24dB mode than 12dB mode above cutoff', () => {
  const mag12 = computeIr3109MagnitudeDb(8000, 20, 1000, 2, 12);
  const mag24 = computeIr3109MagnitudeDb(8000, 20, 1000, 2, 24);
  assert.ok(mag24 < mag12, `Expected 24dB mode (${mag24} dB) to attenuate more than 12dB mode (${mag12} dB)`);
});

test('calculateTeensy41DspBudget stays well within 600MHz Cortex-M7 limits for 8-voice 2x oversampled ZDF', () => {
  const budget = calculateTeensy41DspBudget(8, 2, true, true);
  assert.equal(budget.canRunAt600MHz, true);
  assert.ok(budget.cpuLoadPercentAt44k1 > 10 && budget.cpuLoadPercentAt44k1 < 60);
  assert.ok(budget.sramPercentOfDTCM < 25);
});

test('synthesizeSingleCyclePreview generates bounded waveform samples', () => {
  const samples = synthesizeSingleCyclePreview(defaultPatch, 128);
  assert.equal(samples.length, 128);
  for (const s of samples) {
    assert.ok(s >= -1 && s <= 1);
  }
});
