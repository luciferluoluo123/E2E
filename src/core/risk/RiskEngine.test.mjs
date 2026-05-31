import assert from 'node:assert/strict';
import { RiskEngine } from './RiskEngine.ts';

const ruleVersion = 'phase-6-risk-engine';
const databaseVersion = 'db-v1';
const checkedAt = '2026-05-30T00:00:00.000Z';

function createPersona(overrides = {}) {
  return {
    id: 'persona_risk_test',
    seed: 'risk-seed',
    generatedAt: checkedAt,
    schemaVersion: 'schema-v1',
    databaseVersion,
    ruleVersion,
    locale: {
      countryCode: 'US',
      language: trace({
        code: 'en-US',
        prefix: 'en',
        englishName: 'English',
        localName: 'English',
        weight: 5,
        source: 'database/locale/country-languages.json',
        confidence: 0.95,
      }),
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: trace({
        timezone: 'America/New_York',
        gmtOffset: 'GMT-05:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
      }),
      fonts: [
        trace({
          fontName: 'Arial',
          platform: 'windows',
          source: 'database/fonts/windows-fonts.json',
          confidence: 0.95,
        }),
      ],
      source: 'database/locale/country-languages.json|database/timezone/timezones.json|database/fonts/windows-fonts.json',
      confidence: 0.95,
      reasons: [],
      ruleVersion,
      databaseVersion,
    },
    hardware: {
      cpu: {
        id: 'cpu-mid-001',
        name: 'MVP Mid CPU',
        tier: 'mid',
        weight: 5,
        source: 'hardware-rule-v1',
        confidence: 'high',
      },
      gpu: {
        id: 'gpu-mid-001',
        name: 'MVP Mid GPU',
        tier: 'mid',
        weight: 4,
        source: 'hardware-rule-v1',
        confidence: 'high',
      },
      ram: {
        id: 'ram-8gb',
        name: '8 GB RAM',
        tier: 'mid',
        weight: 5,
        source: 'hardware-rule-v1',
        confidence: 'high',
      },
      os: {
        osName: 'Windows11',
        version: 'mvp',
        build: 'mvp',
        architecture: 'x64',
        source: 'database/os/windows.json',
        confidence: 'high',
        ruleVersion,
        databaseVersion,
      },
      source: 'hardware-rule-v1|database/os/windows.json',
      confidence: 'high',
      reasons: [],
      ruleVersion,
      databaseVersion,
    },
    browser: {
      id: 'chrome-138',
      name: 'Chrome',
      majorVersion: 138,
      source: 'browser-rule-v1',
      confidence: 'high',
      ruleVersion,
      databaseVersion,
    },
    validation: {
      passed: true,
      score: 100,
      warnings: [],
      errors: [],
      checkedAt,
      ruleVersion,
      databaseVersion,
    },
    sourceSummary: {
      localeSource: 'database/locale/country-languages.json',
      hardwareSource: 'hardware-rule-v1',
      browserSource: 'browser-rule-v1',
    },
    ...overrides,
  };
}

const engine = new RiskEngine({ checkedAtProvider: () => checkedAt });

const lowRisk = engine.assess(createPersona());
assert.equal(lowRisk.level, 'low', 'legal RuntimePersona should be low risk');
assert.equal(lowRisk.score >= 0 && lowRisk.score <= 100, true, 'score must be within 0-100');
assert.equal(lowRisk.reasons.length > 0, true, 'RiskAssessment must include reasons');

const warningRisk = engine.assess(createPersona({
  validation: {
    passed: true,
    score: 90,
    warnings: ['hardware_browser_cpu_tier_low:Chrome:138:low:mid'],
    errors: [],
    checkedAt,
    ruleVersion,
    databaseVersion,
  },
}));
assert.equal(warningRisk.score > lowRisk.score, true, 'validation warning should increase risk');
assert.equal(warningRisk.warnings.length > 0, true, 'validation warning should be surfaced');

const errorRisk = engine.assess(createPersona({
  validation: {
    passed: false,
    score: 10,
    warnings: [],
    errors: ['browser_os_incompatible:Chrome:Windows7'],
    checkedAt,
    ruleVersion,
    databaseVersion,
  },
}));
assert.equal(errorRisk.level, 'high', 'validation error should be high risk');

const missingSourcePersona = createPersona();
missingSourcePersona.browser = {
  ...missingSourcePersona.browser,
  source: '',
};
const missingSourceRisk = engine.assess(missingSourcePersona);
assert.equal(missingSourceRisk.level, 'high', 'missing source should be high risk');
assert.equal(missingSourceRisk.reasons.some((reason) => reason.startsWith('missing_source:browser')), true);

const missingConfidencePersona = createPersona();
delete missingConfidencePersona.browser.confidence;
const missingConfidenceRisk = engine.assess(missingConfidencePersona);
assert.equal(missingConfidenceRisk.level, 'high', 'missing confidence should be high risk');
assert.equal(missingConfidenceRisk.reasons.some((reason) => reason.startsWith('missing_confidence:browser')), true);

const manualPersona = createPersona();
manualPersona.browser = {
  ...manualPersona.browser,
  source: 'manual-rule-v1',
};
const manualRisk = engine.assess(manualPersona);
assert.notEqual(manualRisk.level, 'high', 'manual-rule-v1 should not directly fail risk assessment');
assert.equal(manualRisk.warnings.some((warning) => warning.includes('manual_rule_source:browser')), true);

const frozen = JSON.stringify(createPersona());
const input = createPersona();
engine.assess(input);
assert.equal(JSON.stringify(input), frozen, 'RiskEngine must not modify RuntimePersona input');

for (const assessment of [lowRisk, warningRisk, errorRisk, missingSourceRisk, missingConfidenceRisk, manualRisk]) {
  assert.equal(assessment.reasons.length > 0, true, 'RiskAssessment must include reasons');
  assert.equal(assessment.score >= 0 && assessment.score <= 100, true, 'score must be within 0-100');
  if (assessment.score <= 30) assert.equal(assessment.level, 'low');
  if (assessment.score >= 31 && assessment.score <= 60) assert.equal(assessment.level, 'medium');
  if (assessment.score >= 61) assert.equal(assessment.level, 'high');
}

console.log('RiskEngine tests passed');

function trace(record) {
  return {
    ...record,
    ruleVersion,
    databaseVersion,
  };
}
