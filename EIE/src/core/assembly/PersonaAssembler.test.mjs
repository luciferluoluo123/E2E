import assert from 'node:assert/strict';
import { PersonaAssembler } from './PersonaAssembler.ts';
import { CrossDomainValidator } from '../validator/cross-domain/CrossDomainValidator.ts';

const schemaVersion = 'schema-v1';
const ruleVersion = 'phase-5-persona-assembly';
const databaseVersion = 'db-v1';
const generatedAt = '2026-05-30T00:00:00.000Z';

const rules = {
  localeFontRules: [
    {
      languagePrefixes: ['ja'],
      requiredFontPatterns: ['Yu Gothic', 'MS Gothic'],
      severity: 'error',
    },
  ],
  browserCompatibility: [
    {
      browser: 'Chrome',
      supportedOs: ['Windows10', 'Windows11'],
      supportedArchitecture: ['x64'],
    },
  ],
  osHardwareRules: [
    {
      os: 'Windows11',
      minCpuTier: 'mid',
      minRamTier: 'mid',
      severity: 'error',
    },
  ],
  browserHardwareRules: [],
};

function createAssembler(seed) {
  return new PersonaAssembler({
    seed,
    schemaVersion,
    ruleVersion,
    databaseVersion,
    crossDomainValidator: new CrossDomainValidator(rules, () => generatedAt),
    generatedAtProvider: () => generatedAt,
  });
}

const locale = {
  countryCode: 'JP',
  language: {
    code: 'ja-JP',
    prefix: 'ja',
    englishName: 'Japanese',
    localName: 'Japanese',
    weight: 1,
    source: 'database/locale/country-languages.json',
    confidence: 0.9,
    ruleVersion,
    databaseVersion,
  },
  acceptLanguage: 'ja-JP,ja;q=0.9',
  timezone: {
    timezone: 'Asia/Tokyo',
    gmtOffset: 'GMT+09:00',
    source: 'database/timezone/timezones.json',
    confidence: 0.95,
    ruleVersion,
    databaseVersion,
  },
  fonts: [
    {
      fontName: 'Yu Gothic',
      platform: 'windows',
      source: 'database/fonts/windows-fonts.json',
      confidence: 0.9,
      ruleVersion,
      databaseVersion,
    },
  ],
  source: 'locale-source',
  confidence: 0.9,
  reasons: [],
  ruleVersion,
  databaseVersion,
};

const hardware = {
  cpu: {
    id: 'cpu-mid-001',
    name: 'MVP Mid CPU',
    tier: 'mid',
    weight: 5,
    source: 'manual-hardware-rule-v1',
    confidence: 'medium',
  },
  gpu: {
    id: 'gpu-mid-001',
    name: 'MVP Mid GPU',
    tier: 'mid',
    weight: 4,
    source: 'manual-hardware-rule-v1',
    confidence: 'medium',
  },
  ram: {
    id: 'ram-8gb',
    name: '8 GB RAM',
    tier: 'mid',
    weight: 5,
    source: 'manual-hardware-rule-v1',
    confidence: 'medium',
  },
  os: {
    osName: 'Windows11',
    version: 'mvp',
    build: 'mvp',
    architecture: 'x64',
    source: 'database/os/windows.json',
    confidence: 'medium',
    ruleVersion,
    databaseVersion,
  },
  source: 'hardware-source',
  confidence: 'medium',
  reasons: [],
  ruleVersion,
  databaseVersion,
};

const browser = {
  id: 'chrome-138',
  name: 'Chrome',
  majorVersion: 138,
  source: 'browser-source',
  confidence: 'medium',
  ruleVersion,
  databaseVersion,
};

const validInput = {
  locale,
  hardware,
  browser,
};

const frozenInput = JSON.parse(JSON.stringify(validInput));
const assembly = createAssembler('seed-1').assemble(validInput);
assert.equal(assembly.crossValidationResult.passed, true, 'valid locale + hardware + browser should assemble');
assert.equal(assembly.persona.validation.passed, true, 'passed persona should include passed validation');
assert.equal(assembly.persona.seed, 'seed-1');
assert.equal(assembly.persona.schemaVersion, schemaVersion);
assert.equal(assembly.persona.generatedAt, generatedAt);

const failedAssembly = createAssembler('seed-1').assemble({
  ...validInput,
  locale: {
    ...locale,
    acceptLanguage: 'en-US,en;q=0.9',
  },
});
assert.equal(failedAssembly.crossValidationResult.passed, false, 'cross validation fail should fail assembly validation');
assert.equal(failedAssembly.persona.validation.passed, false, 'failed validation must not return passed persona');

const sameFirst = createAssembler('same-seed').assemble(validInput);
const sameSecond = createAssembler('same-seed').assemble(validInput);
assert.equal(sameFirst.persona.id, sameSecond.persona.id, 'same input + same seed should produce same RuntimePersona.id');

const differentSeed = createAssembler('different-seed').assemble(validInput);
assert.notEqual(sameFirst.persona.id, differentSeed.persona.id, 'different seed should produce different RuntimePersona.id');

assert.deepEqual(
  assembly.persona.sourceSummary,
  {
    localeSource: 'locale-source',
    hardwareSource: 'hardware-source',
    browserSource: 'browser-source',
  },
  'sourceSummary should aggregate locale/hardware/browser sources',
);

assert.deepEqual(validInput, frozenInput, 'PersonaAssembler must not modify input objects');

assert.equal('country' in assembly.persona, false, 'RuntimePersona must not expose CountryRecord');
assert.equal('countryLanguages' in assembly.persona, false, 'RuntimePersona must not expose CountryLanguagesRecord');
assert.equal('timezone' in assembly.persona, false, 'RuntimePersona must not expose TimezoneRecord at top level');
assert.equal('fontSet' in assembly.persona, false, 'RuntimePersona must not expose FontRecord[] at top level');

console.log('PersonaAssembler tests passed');
