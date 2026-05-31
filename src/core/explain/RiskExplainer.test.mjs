import assert from 'node:assert/strict';
import { RiskExplainer } from './RiskExplainer.ts';

const checkedAt = '2026-05-30T00:00:00.000Z';
const ruleVersion = 'phase-6.5-risk-explainability';
const databaseVersion = 'db-v1';

function createPersona() {
  return {
    id: 'persona_risk_explain',
    seed: 'risk-explain-seed',
    generatedAt: checkedAt,
    schemaVersion: 'schema-v1',
    databaseVersion,
    ruleVersion,
    locale: {
      countryCode: 'US',
      language: {
        code: 'en-US',
        prefix: 'en',
        englishName: 'English',
        localName: 'English',
        weight: 5,
        source: 'locale-language-source',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: {
        timezone: 'America/New_York',
        gmtOffset: 'GMT-05:00',
        source: 'timezone-source',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      fonts: [],
      source: 'locale-source',
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
        source: 'cpu-source',
        confidence: 'high',
      },
      gpu: {
        id: 'gpu-mid-001',
        name: 'MVP Mid GPU',
        tier: 'mid',
        weight: 4,
        source: 'gpu-source',
        confidence: 'high',
      },
      ram: {
        id: 'ram-8gb',
        name: '8 GB RAM',
        tier: 'mid',
        weight: 5,
        source: 'ram-source',
        confidence: 'high',
      },
      os: {
        osName: 'Windows11',
        version: 'mvp',
        build: 'mvp',
        architecture: 'x64',
        source: 'os-source',
        confidence: 'high',
        ruleVersion,
        databaseVersion,
      },
      source: 'hardware-source',
      confidence: 'high',
      reasons: [],
      ruleVersion,
      databaseVersion,
    },
    browser: {
      id: 'chrome-138',
      name: 'Chrome',
      majorVersion: 138,
      source: 'browser-source',
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
      localeSource: 'locale-source',
      hardwareSource: 'hardware-source',
      browserSource: 'browser-source',
    },
  };
}

function createRisk(score, level, overrides = {}) {
  return {
    score,
    level,
    reasons: ['cross_validation_passed'],
    warnings: [],
    checkedAt,
    ruleVersion,
    databaseVersion,
    ...overrides,
  };
}

const explainer = new RiskExplainer();

const low = explainer.explain({
  persona: createPersona(),
  risk: createRisk(10, 'low'),
});
assert.match(low.summary, /level=low/, 'low risk explanation');
assert.equal(low.score, 10, 'explanation must contain score');
assert.equal(low.level, 'low', 'explanation must contain level');

const medium = explainer.explain({
  persona: createPersona(),
  risk: createRisk(45, 'medium', {
    reasons: ['validation_warnings_present'],
    warnings: ['validation_warning:hardware_browser_cpu_tier_low'],
  }),
});
assert.match(medium.summary, /level=medium/, 'medium risk explanation');

const high = explainer.explain({
  persona: {
    ...createPersona(),
    validation: {
      ...createPersona().validation,
      passed: false,
      errors: ['browser_os_incompatible:Chrome:Windows7'],
    },
  },
  risk: createRisk(85, 'high', {
    reasons: ['cross_validation_failed', 'validation_error:browser_os_incompatible:Chrome:Windows7'],
    warnings: ['manual_rule_source:browser:manual-rule-v1',
    ],
  }),
});
assert.match(high.summary, /level=high/, 'high risk explanation');

assert.equal(high.reasons.length > 0, true, 'explanation must contain reasons');
assert.equal(high.warnings.length > 0, true, 'explanation must contain warnings');
assert.equal(
  high.evidence.some((entry) => entry.includes('localeSource=locale-source') && entry.includes('browserSource=browser-source')),
  true,
  'explanation must contain sourceSummary evidence',
);
assert.deepEqual(
  high.metadata,
  {
    ruleVersion,
    databaseVersion,
    checkedAt,
  },
  'metadata should come from RiskAssessment',
);

const persona = createPersona();
const risk = createRisk(61, 'high', {
  reasons: ['fixed_score_from_risk_assessment'],
  warnings: ['fixed_warning_from_risk_assessment'],
});
const frozenPersona = JSON.stringify(persona);
const frozenRisk = JSON.stringify(risk);
const explained = explainer.explain({ persona, risk });
assert.equal(JSON.stringify(persona), frozenPersona, 'RiskExplainer must not modify persona');
assert.equal(JSON.stringify(risk), frozenRisk, 'RiskExplainer must not modify risk');
assert.equal(explained.score, 61, 'RiskExplainer must not recalculate score');
assert.equal(explained.level, 'high', 'RiskExplainer must preserve risk level');

console.log('RiskExplainer tests passed');
