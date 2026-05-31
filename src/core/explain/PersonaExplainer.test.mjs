import assert from 'node:assert/strict';
import { PersonaExplainer } from './PersonaExplainer.ts';

const ruleVersion = 'phase-5.8-persona-explainability';
const databaseVersion = 'db-v1';
const schemaVersion = 'schema-v1';

const persona = {
  id: 'persona_test_001',
  seed: 'explain-seed',
  generatedAt: '2026-05-30T00:00:00.000Z',
  schemaVersion,
  databaseVersion,
  ruleVersion,
  locale: {
    countryCode: 'JP',
    language: {
      code: 'ja-JP',
      prefix: 'ja',
      englishName: 'Japanese',
      localName: 'Japanese',
      weight: 7,
      source: 'locale-language-source',
      confidence: 0.91,
      ruleVersion,
      databaseVersion,
    },
    acceptLanguage: 'ja-JP,ja;q=0.9',
    timezone: {
      timezone: 'Asia/Tokyo',
      gmtOffset: 'GMT+09:00',
      source: 'timezone-source',
      confidence: 0.95,
      ruleVersion,
      databaseVersion,
    },
    fonts: [
      {
        fontName: 'Yu Gothic',
        platform: 'windows',
        source: 'font-source',
        confidence: 0.88,
        ruleVersion,
        databaseVersion,
      },
    ],
    source: 'locale-source',
    confidence: 0.88,
    reasons: [
      {
        field: 'language',
        reason: 'Selected language from country JP language records.',
        source: 'locale-reason-source',
        confidence: 0.91,
        weight: 7,
        ruleVersion,
        databaseVersion,
      },
      {
        field: 'timezone',
        reason: 'Selected timezone from explicit country-timezone rule for JP.',
        source: 'timezone-reason-source',
        confidence: 0.75,
        weight: 1,
        ruleVersion,
        databaseVersion,
      },
      {
        field: 'fonts',
        reason: 'Selected font from database font records.',
        source: 'font-reason-source',
        confidence: 0.88,
        weight: 3,
        ruleVersion,
        databaseVersion,
      },
    ],
    ruleVersion,
    databaseVersion,
  },
  hardware: {
    cpu: {
      id: 'cpu-mid-001',
      name: 'MVP Mid CPU',
      tier: 'mid',
      weight: 5,
      source: 'cpu-source',
      confidence: 'medium',
    },
    gpu: {
      id: 'gpu-mid-001',
      name: 'MVP Mid GPU',
      tier: 'mid',
      weight: 4,
      source: 'gpu-source',
      confidence: 'medium',
    },
    ram: {
      id: 'ram-8gb',
      name: '8 GB RAM',
      tier: 'mid',
      weight: 5,
      source: 'ram-source',
      confidence: 'medium',
    },
    os: {
      osName: 'Windows11',
      version: 'mvp',
      build: 'mvp',
      architecture: 'x64',
      source: 'os-source',
      confidence: 'medium',
      ruleVersion,
      databaseVersion,
    },
    source: 'hardware-source',
    confidence: 'medium',
    reasons: [
      {
        field: 'cpu',
        reason: 'Selected cpu from standardized hardware rules.',
        source: 'cpu-reason-source',
        confidence: 'medium',
        weight: 5,
        ruleVersion,
        databaseVersion,
      },
      {
        field: 'gpu',
        reason: 'Selected gpu from standardized hardware rules.',
        source: 'gpu-reason-source',
        confidence: 'medium',
        weight: 4,
        ruleVersion,
        databaseVersion,
      },
      {
        field: 'ram',
        reason: 'Selected ram from standardized hardware rules.',
        source: 'ram-reason-source',
        confidence: 'medium',
        weight: 5,
        ruleVersion,
        databaseVersion,
      },
      {
        field: 'os',
        reason: 'Selected os from standardized hardware rules.',
        source: 'os-reason-source',
        confidence: 'medium',
        weight: 1,
        ruleVersion,
        databaseVersion,
      },
    ],
    ruleVersion,
    databaseVersion,
  },
  browser: {
    id: 'chrome-138',
    name: 'Chrome',
    majorVersion: 138,
    weight: 80,
    source: 'browser-source',
    confidence: 'medium',
    ruleVersion,
    databaseVersion,
  },
  validation: {
    passed: false,
    score: 75,
    warnings: ['hardware_browser_cpu_tier_low:Chrome:138:low:mid'],
    errors: ['accept_language_mismatch:ja-JP:en-US,en;q=0.9'],
    checkedAt: '2026-05-30T00:00:00.000Z',
    ruleVersion,
    databaseVersion,
  },
  sourceSummary: {
    localeSource: 'locale-source',
    hardwareSource: 'hardware-source',
    browserSource: 'browser-source',
  },
};

const explanation = new PersonaExplainer().explain(persona);
assert.equal(Array.isArray(explanation.locale), true, 'RuntimePersona should explain successfully');
assert.equal(explanation.locale.length >= 5, true, 'Locale explanation generated');
assert.equal(explanation.hardware.length >= 5, true, 'Hardware explanation generated');
assert.equal(explanation.browser.length >= 1, true, 'Browser explanation generated');
assert.equal(explanation.validation.length >= 3, true, 'Validation explanation generated');
assert.deepEqual(
  explanation.metadata,
  {
    schemaVersion,
    databaseVersion,
    ruleVersion,
  },
  'Metadata explanation generated',
);

const allText = [
  ...explanation.locale,
  ...explanation.hardware,
  ...explanation.browser,
  ...explanation.validation,
].join('\n');

assert.match(allText, /source=/, 'Explainability should use source');
assert.match(allText, /confidence=/, 'Explainability should use confidence');
assert.match(allText, /reason=/, 'Explainability should use reasons');
assert.match(allText, /weight=80/, 'Explainability should use weight');
assert.match(allText, /Chrome/, 'Browser explanation should use actual browser data');
assert.match(allText, /ja-JP/, 'Locale explanation should use actual locale data');
assert.equal(allText.includes('because it is popular'), false, 'Explainability must not depend on forbidden fixed popularity text');

const changedPersona = {
  ...persona,
  browser: {
    ...persona.browser,
    name: 'Firefox',
    majorVersion: 128,
    source: 'firefox-source',
    weight: 60,
  },
};
const changedText = new PersonaExplainer().explain(changedPersona).browser.join('\n');
assert.match(changedText, /Firefox/, 'Explanation should change with RuntimePersona data');
assert.match(changedText, /majorVersion=128/, 'Explanation should not depend on hardcoded fixed result');
assert.match(changedText, /source=firefox-source/, 'Explanation should use changed source data');

console.log('PersonaExplainer tests passed');
