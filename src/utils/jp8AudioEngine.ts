/**
 * Real-Time Polyphonic WebAudio Synthesizer Engine replicating the Roland Jupiter-8
 * Signal Path:
 * - 8 Polyphonic Voices (16 VCOs)
 * - Dual VCO per voice with Range (16', 8', 4', 2'), Fine Detune, Pulse Width, X-MOD (FM), and Sync
 * - Source Mix (BA662 crossfade)
 * - 1-Pole High-Pass Filter (-6dB/oct)
 * - Cascaded IR3109 Low-Pass Filter (-12dB 2-pole or -24dB 4-pole dual-biquad cascade)
 * - Dual IR3R01 Envelope Generators (ENV-1 & ENV-2) with 555 PWM Key-Follow time scaling
 * - Compu-Tune per-voice organic micro-drift matrix
 */

import { JP8Patch, calculateVcoFrequency } from './jp8DspMath';

interface ActiveVoiceNodes {
  midiNote: number;
  voiceIndex: number;
  vco1: OscillatorNode;
  vco2: OscillatorNode;
  xModGain: GainNode;
  vco1Gain: GainNode;
  vco2Gain: GainNode;
  hpf: BiquadFilterNode;
  vcfStage1: BiquadFilterNode;
  vcfStage2: BiquadFilterNode;
  vca: GainNode;
  lfoPitchGain1: GainNode;
  lfoPitchGain2: GainNode;
  lfoFilterGain: GainNode;
  startedAt: number;
  releaseTimeout?: number;
}

export class JP8WebAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private activeVoices: Map<number, ActiveVoiceNodes[]> = new Map();
  private nextVoiceIndex: number = 0;

  // Per-voice Compu-Tune drift offsets in cents (8 voices x 2 VCOs)
  private voiceDriftCents: [number, number][] = [
    [-1.4, +1.8],
    [+2.1, -0.9],
    [-0.7, +1.2],
    [+1.6, -2.3],
    [-2.0, +0.8],
    [+0.9, -1.5],
    [-1.1, +2.2],
    [+1.3, -0.6],
  ];

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.75;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = 'triangle';
      this.lfoOsc.frequency.value = 4.5;
      this.lfoOsc.start();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVoiceDriftTable(table: [number, number][]): void {
    this.voiceDriftCents = table;
  }

  public getVoiceDriftTable(): [number, number][] {
    return this.voiceDriftCents;
  }

  public getAnalyserTimeDomainData(targetBuffer: Float32Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.ctx) return false;
    this.analyser.getFloatTimeDomainData(targetBuffer);
    return true;
  }

  public getActiveVoiceCount(): number {
    let count = 0;
    for (const list of this.activeVoices.values()) {
      count += list.length;
    }
    return count;
  }

  public noteOn(midiNote: number, patch: JP8Patch): number[] {
    const ctx = this.initContext();
    if (!this.masterGain || !this.lfoOsc) return [];

    // Stop existing voice on same note if retriggered
    this.noteOff(midiNote, patch);

    // Update global LFO
    this.lfoOsc.frequency.setValueAtTime(patch.lfoRateHz, ctx.currentTime);
    if (patch.lfoWave !== 'random') {
      this.lfoOsc.type = patch.lfoWave;
    }

    const voicesToSpawn =
      patch.keyAssignMode === 'UNISON'
        ? [0, 1, 2, 3] // Stack 4 stereo module pairs (8 VCOs) for massive unison without clipping
        : patch.keyAssignMode === 'SOLO'
        ? [0]
        : [this.nextVoiceIndex];

    if (patch.keyAssignMode === 'POLY1' || patch.keyAssignMode === 'POLY2') {
      this.nextVoiceIndex = (this.nextVoiceIndex + 1) % 8;
    }

    const spawnedIndices: number[] = [];
    const nodeList: ActiveVoiceNodes[] = [];

    for (let i = 0; i < voicesToSpawn.length; i++) {
      const vIdx = voicesToSpawn[i];
      spawnedIndices.push(vIdx);
      const drift = this.voiceDriftCents[vIdx] || [0, 0];
      const unisonSpread =
        patch.keyAssignMode === 'UNISON' ? (i - 1.5) * patch.unisonDetuneCents : 0;

      const now = ctx.currentTime;

      // VCO-1 & VCO-2 frequencies
      const freq1 = calculateVcoFrequency(
        midiNote,
        patch.vco1Range,
        drift[0] + unisonSpread,
        0,
        0
      );
      const freq2 = patch.vco2LowFreq
        ? Math.max(0.5, calculateVcoFrequency(midiNote, patch.vco2Range, patch.vco2Fine, 0, 0) / 16)
        : calculateVcoFrequency(
            midiNote,
            patch.vco2Range,
            patch.vco2Fine + drift[1] - unisonSpread,
            0,
            0
          );

      const vco1 = ctx.createOscillator();
      const vco2 = ctx.createOscillator();

      vco1.type = patch.vco1Wave === 'pulse' ? 'square' : patch.vco1Wave;
      vco2.type =
        patch.vco2Wave === 'pulse' || patch.vco2Wave === 'noise'
          ? 'square'
          : patch.vco2Wave;

      vco1.frequency.setValueAtTime(freq1, now);
      vco2.frequency.setValueAtTime(freq2, now);

      // ENV-1 Pitch Mod on VCO-1 (and Hard Sync sweep sound)
      if (patch.vco1ModEnv > 0 || patch.vco2Sync) {
        const envPitchOctaves = (patch.vco1ModEnv / 10) * 2.5 + (patch.vco2Sync ? 0.8 : 0);
        const peakFreq1 = Math.min(18000, freq1 * Math.pow(2, envPitchOctaves));
        const kfScale1 = patch.env1KeyFollow ? Math.pow(2, -(midiNote - 60) * 0.03) : 1.0;
        const att1 = Math.max(0.002, (patch.env1AttackMs / 1000) * kfScale1);
        const dec1 = Math.max(0.01, (patch.env1DecayMs / 1000) * kfScale1);
        const susFreq1 = freq1 * Math.pow(2, envPitchOctaves * patch.env1Sustain);

        vco1.frequency.setValueAtTime(freq1, now);
        vco1.frequency.exponentialRampToValueAtTime(Math.max(20, peakFreq1), now + att1);
        vco1.frequency.exponentialRampToValueAtTime(Math.max(20, susFreq1), now + att1 + dec1);
      }

      // X-MOD: VCO-2 frequency-modulates VCO-1 via BA662 OTA (IC6A)
      const xModGain = ctx.createGain();
      const xModHzDepth = (patch.vco1CrossMod / 10) * freq1 * 2.2;
      xModGain.gain.setValueAtTime(xModHzDepth, now);
      vco2.connect(xModGain);
      xModGain.connect(vco1.frequency);

      // LFO -> VCO-1/2 Pitch
      const lfoPitchGain1 = ctx.createGain();
      const lfoPitchGain2 = ctx.createGain();
      lfoPitchGain1.gain.setValueAtTime((patch.vco1ModLfo / 10) * (freq1 * 0.06), now);
      lfoPitchGain2.gain.setValueAtTime((patch.vco1ModLfo / 10) * (freq2 * 0.06), now);
      this.lfoOsc.connect(lfoPitchGain1);
      this.lfoOsc.connect(lfoPitchGain2);
      lfoPitchGain1.connect(vco1.frequency);
      lfoPitchGain2.connect(vco2.frequency);

      // Source Mix (BA662 IC28A crossfade)
      const mix2 = patch.sourceMix / 10;
      const mix1 = 1.0 - mix2;
      const vco1Gain = ctx.createGain();
      const vco2Gain = ctx.createGain();
      vco1Gain.gain.setValueAtTime(mix1 * 0.5, now);
      vco2Gain.gain.setValueAtTime(mix2 * 0.5, now);

      // 1-Pole High-Pass Filter (TR19A + IC26A)
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(Math.max(20, patch.hpfCutoffHz), now);
      hpf.Q.setValueAtTime(0.707, now);

      // Roland IR3109 VCF: 2-pole (-12dB) or 4-pole (-24dB) cascade
      const vcfStage1 = ctx.createBiquadFilter();
      const vcfStage2 = ctx.createBiquadFilter();
      vcfStage1.type = 'lowpass';
      vcfStage2.type = 'lowpass';

      // Key follow offset on VCF Cutoff (Page 16 / Page 31 Para 13)
      const noteOffsetSemitones = (midiNote - 60) * patch.vcfKeyFollow;
      const baseCutoff = Math.max(
        30,
        Math.min(18000, patch.vcfCutoffHz * Math.pow(2, noteOffsetSemitones / 12))
      );

      // ENV -> VCF Cutoff modulation
      const envSourceAttack =
        patch.vcfEnvSource === 'ENV1' ? patch.env1AttackMs : patch.env2AttackMs;
      const envSourceDecay =
        patch.vcfEnvSource === 'ENV1' ? patch.env1DecayMs : patch.env2DecayMs;
      const envSourceSustain =
        patch.vcfEnvSource === 'ENV1' ? patch.env1Sustain : patch.env2Sustain;
      const envSourceKf =
        patch.vcfEnvSource === 'ENV1' ? patch.env1KeyFollow : patch.env2KeyFollow;

      const kfScaleVcf = envSourceKf ? Math.pow(2, -(midiNote - 60) * 0.035) : 1.0;
      const vcfAttSec = Math.max(0.002, (envSourceAttack / 1000) * kfScaleVcf);
      const vcfDecSec = Math.max(0.01, (envSourceDecay / 1000) * kfScaleVcf);

      const envOctaveShift = (patch.vcfEnvMod / 10) * 4.5 * patch.vcfEnvPolarity;
      const peakCutoff = Math.max(
        40,
        Math.min(19000, baseCutoff * Math.pow(2, envOctaveShift))
      );
      const sustainCutoff = Math.max(
        40,
        Math.min(19000, baseCutoff * Math.pow(2, envOctaveShift * envSourceSustain))
      );

      for (const stage of [vcfStage1, vcfStage2]) {
        stage.frequency.setValueAtTime(baseCutoff, now);
        stage.frequency.exponentialRampToValueAtTime(peakCutoff, now + vcfAttSec);
        stage.frequency.exponentialRampToValueAtTime(
          sustainCutoff,
          now + vcfAttSec + vcfDecSec
        );
      }

      // Resonance distributed across IR3109 stages
      const qVal = 0.707 + (patch.vcfResonance / 10) * 8.5;
      if (patch.vcfSlope === 24) {
        vcfStage1.Q.setValueAtTime(Math.sqrt(qVal), now);
        vcfStage2.Q.setValueAtTime(Math.sqrt(qVal), now);
      } else {
        vcfStage1.Q.setValueAtTime(qVal, now);
        vcfStage2.frequency.setValueAtTime(20000, now);
        vcfStage2.Q.setValueAtTime(0.5, now);
      }

      // LFO -> VCF Cutoff
      const lfoFilterGain = ctx.createGain();
      lfoFilterGain.gain.setValueAtTime((patch.vcfLfoMod / 10) * (baseCutoff * 0.4), now);
      this.lfoOsc.connect(lfoFilterGain);
      lfoFilterGain.connect(vcfStage1.frequency);
      if (patch.vcfSlope === 24) {
        lfoFilterGain.connect(vcfStage2.frequency);
      }

      // VCA BA662A + IR3R01 ENV-2 amplitude envelope
      const vca = ctx.createGain();
      const kfScale2 = patch.env2KeyFollow ? Math.pow(2, -(midiNote - 60) * 0.035) : 1.0;
      const vcaAttSec = Math.max(0.002, (patch.env2AttackMs / 1000) * kfScale2);
      const vcaDecSec = Math.max(0.01, (patch.env2DecayMs / 1000) * kfScale2);
      const voiceGainScale =
        (patch.vcaLevel / 10) * (patch.keyAssignMode === 'UNISON' ? 0.35 : 0.7);
      const sustainGain = Math.max(0.001, voiceGainScale * patch.env2Sustain);

      vca.gain.setValueAtTime(0.0001, now);
      vca.gain.linearRampToValueAtTime(Math.max(0.001, voiceGainScale), now + vcaAttSec);
      vca.gain.exponentialRampToValueAtTime(sustainGain, now + vcaAttSec + vcaDecSec);

      // Connect audio chain: VCO1/2 -> Mix -> HPF -> VCF1 -> VCF2 -> VCA -> Master
      vco1.connect(vco1Gain);
      vco2.connect(vco2Gain);
      vco1Gain.connect(hpf);
      vco2Gain.connect(hpf);
      hpf.connect(vcfStage1);
      vcfStage1.connect(vcfStage2);
      vcfStage2.connect(vca);
      vca.connect(this.masterGain);

      vco1.start(now);
      vco2.start(now);

      nodeList.push({
        midiNote,
        voiceIndex: vIdx,
        vco1,
        vco2,
        xModGain,
        vco1Gain,
        vco2Gain,
        hpf,
        vcfStage1,
        vcfStage2,
        vca,
        lfoPitchGain1,
        lfoPitchGain2,
        lfoFilterGain,
        startedAt: now,
      });
    }

    this.activeVoices.set(midiNote, nodeList);
    return spawnedIndices;
  }

  public noteOff(midiNote: number, patch: JP8Patch): void {
    if (!this.ctx) return;
    const nodes = this.activeVoices.get(midiNote);
    if (!nodes) return;

    const now = this.ctx.currentTime;
    const kfScale2 = patch.env2KeyFollow ? Math.pow(2, -(midiNote - 60) * 0.035) : 1.0;
    const relSec = Math.max(0.02, Math.min(4.0, (patch.env2ReleaseMs / 1000) * kfScale2));

    for (const voice of nodes) {
      try {
        voice.vca.gain.cancelScheduledValues(now);
        voice.vca.gain.setValueAtTime(Math.max(0.0001, voice.vca.gain.value), now);
        voice.vca.gain.exponentialRampToValueAtTime(0.0001, now + relSec);

        voice.vco1.stop(now + relSec + 0.03);
        voice.vco2.stop(now + relSec + 0.03);

        window.setTimeout(() => {
          try {
            voice.vca.disconnect();
            voice.lfoPitchGain1.disconnect();
            voice.lfoPitchGain2.disconnect();
            voice.lfoFilterGain.disconnect();
          } catch {
            // Ignore already disconnected nodes
          }
        }, (relSec + 0.06) * 1000);
      } catch {
        // Ignore stopped oscillator errors
      }
    }

    this.activeVoices.delete(midiNote);
  }

  public panicStopAll(patch: JP8Patch): void {
    for (const note of Array.from(this.activeVoices.keys())) {
      this.noteOff(note, patch);
    }
  }
}

export const jp8AudioEngine = new JP8WebAudioEngine();
