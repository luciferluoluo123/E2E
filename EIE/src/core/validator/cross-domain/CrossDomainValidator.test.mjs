import assert from 'node:assert/strict';
import { CrossDomainValidator } from './CrossDomainValidator.ts';

const ruleVersion = 'phase-4.5-cross-domain-validator';
const databaseVersion = 'db-v1';

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
    {
      browser: 'Firefox',
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
  browserHardwareRules: [
    {
      browser: 'Chrome',
      minMajorVersion: 138,
      minCpuTier: 'mid',
      minRamTier: 'mid',
      severity: 'warning',
    },
  ],
};

const validator = new CrossDomainValidator(rules, () => '2026-05-30T00:00:00.000Z');

const validLocale = {
  language: {
    code: 'ja-JP',
    prefix: 'ja',
  },
  acceptLanguage: 'ja-JP,ja;q=0.9',
  fonts: [
    { fontName: 'Yu Gothic' },
    { fontName: 'Arial' },
  ],
};

const validHardware = {
  cpu: { tier: 'mid' },
  gpu: { tier: 'mid' },
  ram: { tier: 'mid' },
  os: {
    osName: 'Windows11',
    architecture: 'x64',
  },
};

const validBrowser = {
  name: 'Chrome',
  majorVersion: 138,
};

const baseInput = {
  locale: validLocale,
  hardware: validHardware,
  browser: validBrowser,
  ruleVersion,
  databaseVersion,
};

const passResult = validator.validate(baseInput);
assert.equal(passResult.passed, true, 'Locale <-> Fonts pass');
assert.equal(passResult.errors.length, 0);
assert.equal(passResult.checkedAt, '2026-05-30T00:00:00.000Z');

const fontFail = validator.validate({
  ...baseInput,
  locale: {
    ...validLocale,
    fonts: [{ fontName: 'Arial' }],
  },
});
assert.equal(fontFail.passed, false, 'Locale <-> Fonts fail');
assert.equal(fontFail.errors.some((error) => error.startsWith('locale_fonts_mismatch')), true);

const acceptLanguageFail = validator.validate({
  ...baseInput,
  locale: {
    ...validLocale,
    language: {
      code: 'zh-TW',
      prefix: 'zh',
    },
    acceptLanguage: 'en-US,en;q=0.9',
  },
});
assert.equal(acceptLanguageFail.passed, false, 'Locale <-> Accept-Language fail');
assert.equal(acceptLanguageFail.errors.some((error) => error.startsWith('accept_language_mismatch')), true);

assert.equal(
  validator.validate({
    ...baseInput,
    browser: {
      name: 'Chrome',
      majorVersion: 138,
    },
  }).passed,
  true,
  'Browser <-> OS pass',
);

const browserOsFail = validator.validate({
  ...baseInput,
  hardware: {
    ...validHardware,
    os: {
      osName: 'Windows7',
      architecture: 'x64',
    },
  },
});
assert.equal(browserOsFail.passed, false, 'Browser <-> OS fail');
assert.equal(browserOsFail.errors.some((error) => error.startsWith('browser_os_incompatible')), true);

const architectureFail = validator.validate({
  ...baseInput,
  hardware: {
    ...validHardware,
    os: {
      osName: 'Windows11',
      architecture: 'x86',
    },
  },
});
assert.equal(architectureFail.passed, false, 'Browser <-> Architecture fail');
assert.equal(architectureFail.errors.some((error) => error.startsWith('browser_architecture_incompatible')), true);

const hardwareOsFail = validator.validate({
  ...baseInput,
  hardware: {
    ...validHardware,
    cpu: { tier: 'low' },
    ram: { tier: 'low' },
  },
  browser: {
    name: 'Firefox',
    majorVersion: 128,
  },
});
assert.equal(hardwareOsFail.passed, false, 'Hardware <-> OS fail');
assert.equal(hardwareOsFail.errors.some((error) => error.startsWith('hardware_os_cpu_tier_too_low')), true);

const hardwareBrowserWarning = validator.validate({
  ...baseInput,
  hardware: {
    ...validHardware,
    os: {
      osName: 'Windows10',
      architecture: 'x64',
    },
    cpu: { tier: 'low' },
    ram: { tier: 'low' },
  },
  browser: {
    name: 'Chrome',
    majorVersion: 138,
  },
});
assert.equal(hardwareBrowserWarning.passed, true, 'Hardware <-> Browser warning should not fail');
assert.equal(hardwareBrowserWarning.warnings.some((warning) => warning.startsWith('hardware_browser_cpu_tier_low')), true);

console.log('CrossDomainValidator tests passed');
