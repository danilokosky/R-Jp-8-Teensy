import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JP8_FACTORY_PATCHES } from './jp8SchematicData';
import { generateTeensy41ProjectFiles } from './jp8TeensyFirmwareGen';
import { buildZipArchive, computeCrc32 } from './zipBuilder';

test('computeCrc32 matches standard IEEE 802.3 CRC-32 test vector "123456789"', () => {
  const bytes = new TextEncoder().encode('123456789');
  assert.equal(computeCrc32(bytes), 0xcbf43926);
});

test('buildZipArchive produces valid PKZIP binary with local header and EOCD', () => {
  const zip = buildZipArchive([
    { path: 'platformio.ini', content: '[env:teensy41]\n' },
    { path: '.github/workflows/build-teensy41.yml', content: 'name: CI\n' },
  ]);
  // Local file header signature: 0x04034b50 -> 'PK\x03\x04'
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  assert.equal(zip[2], 0x03);
  assert.equal(zip[3], 0x04);

  // End of Central Directory signature at length - 22: 0x06054b50 -> 'PK\x05\x06'
  const eocdOffset = zip.length - 22;
  assert.equal(zip[eocdOffset], 0x50);
  assert.equal(zip[eocdOffset + 1], 0x4b);
  assert.equal(zip[eocdOffset + 2], 0x05);
  assert.equal(zip[eocdOffset + 3], 0x06);
});

test('generateTeensy41ProjectFiles emits full PlatformIO + GitHub Actions project and compiles cleanly with g++ -Werror', () => {
  const patch = JP8_FACTORY_PATCHES[1]; // Hard-Sync Lead
  const files = generateTeensy41ProjectFiles(patch, 8, 2, true, true);

  const paths = files.map((f) => f.path);
  assert.ok(paths.includes('.github/workflows/build-teensy41.yml'));
  assert.ok(paths.includes('platformio.ini'));
  assert.ok(paths.includes('include/JP8Parameters.h'));
  assert.ok(paths.includes('include/JP8DspCore.h'));
  assert.ok(paths.includes('include/AudioSynthJupiter8.h'));
  assert.ok(paths.includes('src/AudioSynthJupiter8.cpp'));
  assert.ok(paths.includes('src/main.cpp'));
  assert.ok(paths.includes('test/test_jp8_dsp_native.cpp'));

  // Materialize in a temp dir and compile + execute with g++ -std=c++17 -Wall -Wextra -Werror
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jp8-dsp-verify-'));
  try {
    for (const file of files) {
      const target = path.join(tmpDir, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.content, 'utf8');
    }

    const outBin = path.join(tmpDir, 'test_jp8_dsp');
    execFileSync(
      'g++',
      [
        '-std=c++17',
        '-O2',
        '-Wall',
        '-Wextra',
        '-Werror',
        '-I',
        path.join(tmpDir, 'include'),
        path.join(tmpDir, 'test/test_jp8_dsp_native.cpp'),
        '-lm',
        '-o',
        outBin,
      ],
      { stdio: 'pipe' }
    );

    const runOutput = execFileSync(outBin, [], { encoding: 'utf8' });
    assert.ok(runOutput.includes('[OK] JP-8 C++17 DSP Engine'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
