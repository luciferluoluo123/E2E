import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HardwareGenerator } from '../generator/HardwareGenerator.ts';
import { LocaleGenerator } from '../generator/LocaleGenerator.ts';
import { CrossDomainValidator } from '../validator/cross-domain/CrossDomainValidator.ts';
import { PersonaAssembler } from './PersonaAssembler.ts';

const root = process.cwd();
const schemaVersion = 'schema-v1';
const ruleVersion = 'phase-5.5-end-to-end-assembly-test';
const databaseVersion = 'db-v1';
const generatedAt = '2026-05-30T00:00:00.000Z';

const [
  countryLanguagesDb,
  timezonesDb,
  fontsDb,
  countryTimezonesDb,
  cpuDb,
  gpuDb,
  ramDb,
  hardwareCompatibilityDb,
  chromeDb,
  edgeDb,
  firefoxDb,
  browserCompatibilityDb,
] = await Promise.all([
  readJson('database/locale/country-languages.json'),
  readJson('database/timezone/timezones.json'),
  readJson('database/fonts/windows-fonts.json'),
  readJson('database/timezone/country-timezones.json'),
  readJson('database/hardware/cpu.json'),
  readJson('database/hardware/gpu.json'),
  readJson('database/hardware/ram.json'),
  readJson('database/hardware/hardware-compatibility.json'),
  readJson('database/browser/chrome.json'),
  readJson('database/browser/edge.json'),
  readJson('database/browser/firefox.json'),
  readJson('database/browser/browser-compatibility.json'),
]);

const localeGenerator = new LocaleGenerator({
  countryLanguages: countryLanguagesDb,
  timezones: timezonesDb,
  fonts: fontsDb,
  countryTimezones: countryTimezonesDb.records,
});

const hardwareData = {
  cpus: cpuDb.records,
  gpus: gpuDb.records,
  ram: ramDb.records,
  compatibility: hardwareCompatibilityDb.records,
  os: [
    createOsRecord('Windows10'),
    createOsRecord('Windows11'),
    createOsRecord('Windows7'),
  ],
};

const crossDomainRules = {
  localeFontRules: [],
  browserCompatibility: browserCompatibilityDb.records.map((record) => ({
    browser: record.browser,
    supportedOs: record.supportedOs,
    supportedArchitecture: record.supportedArchitecture,
  })),
  osHardwareRules: [
    {
      os: 'Windows10',
      minCpuTier: 'mid',
      minRamTier: 'mid',
      severity: 'error',
    },
    {
      os: 'Windows11',
      minCpuTier: 'mid',
      minRamTier: 'mid',
      severity: 'error',
    },
    {
      os: 'Windows7',
      minCpuTier: 'low',
      minRamTier: 'low',
      severity: 'error',
    },
  ],
  browserHardwareRules: [],
};

const usChrome = assembleCase({
  countryCode: 'US',
  osName: 'Windows11',
  browserDb: chromeDb,
  seed: 'e2e-us-chrome',
});
assert.equal(usChrome.persona.validation.passed, true, 'US + valid hardware + Chrome/Windows11 should assemble');
assert.equal(usChrome.persona.locale.countryCode, 'US');
assert.equal(usChrome.persona.browser.name, 'Chrome');
assert.equal(usChrome.persona.hardware.os.osName, 'Windows11');

const deFirefox = assembleCase({
  countryCode: 'DE',
  osName: 'Windows10',
  browserDb: firefoxDb,
  seed: 'e2e-de-firefox',
});
assert.equal(deFirefox.persona.validation.passed, true, 'DE + valid hardware + Firefox/Windows10 should assemble');
assert.equal(deFirefox.persona.locale.countryCode, 'DE');
assert.equal(deFirefox.persona.browser.name, 'Firefox');
assert.equal(deFirefox.persona.hardware.os.osName, 'Windows10');

const jpEdge = assembleCase({
  countryCode: 'JP',
  osName: 'Windows11',
  browserDb: edgeDb,
  seed: 'e2e-jp-edge',
});
assert.equal(jpEdge.persona.validation.passed, true, 'JP + valid hardware + Edge/Windows11 should assemble');
assert.equal(jpEdge.persona.locale.countryCode, 'JP');
assert.equal(jpEdge.persona.browser.name, 'Edge');
assert.equal(jpEdge.persona.hardware.os.osName, 'Windows11');

const sameFirst = assembleCase({
  countryCode: 'US',
  osName: 'Windows11',
  browserDb: chromeDb,
  seed: 'e2e-same-seed',
});
const sameSecond = assembleCase({
  countryCode: 'US',
  osName: 'Windows11',
  browserDb: chromeDb,
  seed: 'e2e-same-seed',
});
assert.equal(sameFirst.persona.id, sameSecond.persona.id, 'same seed should produce same RuntimePersona.id');

const differentSeed = assembleCase({
  countryCode: 'US',
  osName: 'Windows11',
  browserDb: chromeDb,
  seed: 'e2e-different-seed',
});
assert.notEqual(sameFirst.persona.id, differentSeed.persona.id, 'different seed should produce different RuntimePersona.id');

const incompatibleBrowserOs = assembleCase({
  countryCode: 'US',
  osName: 'Windows7',
  browserDb: chromeDb,
  seed: 'e2e-incompatible-browser-os',
});
assert.equal(incompatibleBrowserOs.crossValidationResult.passed, false, 'incompatible Browser/OS should fail assembly validation');
assert.equal(incompatibleBrowserOs.persona.validation.passed, false, 'RuntimePersona validation should reflect failure');
assert.equal(
  incompatibleBrowserOs.crossValidationResult.errors.some((error) => error.startsWith('browser_os_incompatible')),
  true,
  'Browser/OS failure should be reported',
);

assert.deepEqual(
  usChrome.persona.sourceSummary,
  {
    localeSource: usChrome.persona.locale.source,
    hardwareSource: usChrome.persona.hardware.source,
    browserSource: usChrome.persona.browser.source,
  },
  'RuntimePersona sourceSummary should match component sources',
);

assert.equal(usChrome.crossValidationResult.passed, usChrome.persona.validation.passed, 'RuntimePersona validation should mirror CrossValidationResult');
assert.equal(usChrome.crossValidationResult.score, usChrome.persona.validation.score, 'RuntimePersona validation score should mirror CrossValidationResult');

console.log('PersonaAssembly E2E tests passed');

function assembleCase({ countryCode, osName, browserDb, seed }) {
  const localeResult = localeGenerator.generate({
    countryCode,
    seed,
    ruleVersion,
    databaseVersion,
  });
  assert.equal(localeResult.ok, true, `${countryCode} locale generation should succeed`);

  const hardwareGenerator = new HardwareGenerator(hardwareData);
  const hardwareResult = hardwareGenerator.generate({
    seed,
    ruleVersion,
    databaseVersion,
    constraints: {
      cpuTier: 'mid',
      gpuTier: 'mid',
      ramTier: 'mid',
      osName,
    },
  });
  assert.equal(hardwareResult.ok, true, `${osName} hardware generation should succeed`);

  const assembler = new PersonaAssembler({
    seed,
    schemaVersion,
    ruleVersion,
    databaseVersion,
    crossDomainValidator: new CrossDomainValidator(crossDomainRules, () => generatedAt),
    generatedAtProvider: () => generatedAt,
  });

  return assembler.assemble({
    locale: localeResult.locale,
    hardware: hardwareResult.hardware,
    browser: createBrowserResult(browserDb),
  });
}

function createBrowserResult(browserDb) {
  const record = browserDb.records[0];
  return {
    id: record.id,
    name: record.name,
    majorVersion: record.majorVersion,
    source: record.source,
    confidence: record.confidence,
    ruleVersion: browserDb.ruleVersion,
    databaseVersion: browserDb.databaseVersion,
  };
}

function createOsRecord(osName) {
  return {
    osName,
    version: 'mvp',
    build: 'mvp',
    architecture: 'x64',
    source: 'database/os/windows.json',
    confidence: 'medium',
    weight: 1,
    ruleVersion,
    databaseVersion,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(join(root, filePath), 'utf8'));
}
