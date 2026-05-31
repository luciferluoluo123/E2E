import assert from 'node:assert/strict';
import { LocaleGenerator } from './LocaleGenerator.ts';

const databaseVersion = 'db-test';
const ruleVersion = 'phase-4.1-locale-generator';

const languageUsEn = {
  code: 'en-US',
  prefix: 'en',
  englishName: 'English',
  localName: 'English',
  weight: 1,
  source: 'database/locale/country-languages.json',
  confidence: 0.9,
  ruleVersion,
  databaseVersion,
};

const languageUsEs = {
  code: 'es-US',
  prefix: 'es',
  englishName: 'Spanish',
  localName: 'espanol',
  weight: 1,
  source: 'database/locale/country-languages.json',
  confidence: 0.8,
  ruleVersion,
  databaseVersion,
};

const data = {
  countryLanguages: {
    databaseVersion,
    ruleVersion,
    collection: 'countryLanguages',
    generatedBy: 'Importer',
    generatedAt: '2026-05-30T00:00:00.000Z',
    records: [
      {
        countryCode: 'US',
        languages: [languageUsEn, languageUsEs],
        source: 'database/locale/country-languages.json',
        confidence: 0.8,
        ruleVersion,
        databaseVersion,
      },
      {
        countryCode: 'DE',
        languages: [{
          code: 'de-DE',
          prefix: 'de',
          englishName: 'German',
          localName: 'Deutsch',
          weight: 1,
          source: 'database/locale/country-languages.json',
          confidence: 0.9,
          ruleVersion,
          databaseVersion,
        }],
        source: 'database/locale/country-languages.json',
        confidence: 0.9,
        ruleVersion,
        databaseVersion,
      },
      {
        countryCode: 'JP',
        languages: [{
          code: 'ja-JP',
          prefix: 'ja',
          englishName: 'Japanese',
          localName: 'Japanese',
          weight: 1,
          source: 'database/locale/country-languages.json',
          confidence: 0.9,
          ruleVersion,
          databaseVersion,
        }],
        source: 'database/locale/country-languages.json',
        confidence: 0.9,
        ruleVersion,
        databaseVersion,
      },
      {
        countryCode: 'GB',
        languages: [{
          code: 'en-GB',
          prefix: 'en',
          englishName: 'English',
          localName: 'English',
          weight: 1,
          source: 'database/locale/country-languages.json',
          confidence: 0.9,
          ruleVersion,
          databaseVersion,
        }],
        source: 'database/locale/country-languages.json',
        confidence: 0.9,
        ruleVersion,
        databaseVersion,
      },
      ...[
        ['HK', 'zh-HK', 'Chinese'],
        ['BR', 'pt-BR', 'Portuguese'],
        ['MX', 'es-MX', 'Spanish'],
      ].map(([countryCode, code, englishName]) => ({
        countryCode,
        languages: [{
          code,
          prefix: code.split('-')[0],
          englishName,
          localName: englishName,
          weight: 1,
          source: 'database/locale/country-languages.json',
          confidence: 0.9,
          ruleVersion,
          databaseVersion,
        }],
        source: 'database/locale/country-languages.json',
        confidence: 0.9,
        ruleVersion,
        databaseVersion,
      })),
    ],
  },
  timezones: {
    databaseVersion,
    ruleVersion,
    collection: 'timezones',
    generatedBy: 'Importer',
    generatedAt: '2026-05-30T00:00:00.000Z',
    records: [
      {
        timezone: 'America/New_York',
        gmtOffset: 'GMT-05:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      {
        timezone: 'America/Los_Angeles',
        gmtOffset: 'GMT-08:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      {
        timezone: 'Europe/Berlin',
        gmtOffset: 'GMT+01:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      ...[
        ['Asia/Hong_Kong', 'GMT+08:00'],
        ['America/Sao_Paulo', 'GMT-03:00'],
        ['America/Mexico_City', 'GMT-06:00'],
      ].map(([timezone, gmtOffset]) => ({
        timezone,
        gmtOffset,
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      })),
      {
        timezone: 'Asia/Tokyo',
        gmtOffset: 'GMT+09:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
      {
        timezone: 'Europe/London',
        gmtOffset: 'GMT+00:00',
        source: 'database/timezone/timezones.json',
        confidence: 0.95,
        ruleVersion,
        databaseVersion,
      },
    ],
  },
  fonts: {
    databaseVersion,
    ruleVersion,
    collection: 'windowsFonts',
    generatedBy: 'Importer',
    generatedAt: '2026-05-30T00:00:00.000Z',
    records: ['Arial', 'Segoe UI', 'Calibri', 'Verdana'].map((fontName) => ({
      fontName,
      platform: 'windows',
      source: 'database/fonts/windows-fonts.json',
      confidence: 0.9,
      ruleVersion,
      databaseVersion,
    })),
  },
  countryTimezones: [
    {
      countryCode: 'US',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [
        {
          timezone: 'America/New_York',
          weight: 1,
        },
        {
          timezone: 'America/Los_Angeles',
          weight: 1,
        },
      ],
    },
    {
      countryCode: 'DE',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [
        {
          timezone: 'Europe/Berlin',
          weight: 1,
        },
      ],
    },
    {
      countryCode: 'JP',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [{ timezone: 'Asia/Tokyo', weight: 1 }],
    },
    {
      countryCode: 'GB',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [{ timezone: 'Europe/London', weight: 1 }],
    },
    {
      countryCode: 'HK',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [{ timezone: 'Asia/Hong_Kong', weight: 1 }],
    },
    {
      countryCode: 'BR',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [{ timezone: 'America/Sao_Paulo', weight: 1 }],
    },
    {
      countryCode: 'MX',
      source: 'manual-rule-v1',
      confidence: 'medium',
      reasons: ['manual_seed_for_mvp_locale_generation'],
      ruleVersion,
      databaseVersion,
      timezones: [{ timezone: 'America/Mexico_City', weight: 1 }],
    },
  ],
};

const generator = new LocaleGenerator(data);
const baseInput = {
  countryCode: 'US',
  seed: 'locale-seed',
  ruleVersion,
  databaseVersion,
};

const first = generator.generate(baseInput);
const second = generator.generate(baseInput);
assert.equal(first.ok, true);
assert.deepEqual(first.locale, second.locale, 'same seed + same country produces same locale');

const alternate = generator.generate({ ...baseInput, seed: 'locale-seed-2' });
assert.equal(alternate.ok, true);
assert.notDeepEqual(
  {
    language: first.locale.language.code,
    timezone: first.locale.timezone.timezone,
    fonts: first.locale.fonts.map((font) => font.fontName),
  },
  {
    language: alternate.locale.language.code,
    timezone: alternate.locale.timezone.timezone,
    fonts: alternate.locale.fonts.map((font) => font.fontName),
  },
  'different seed may produce different locale',
);

const availableLanguageCodes = data.countryLanguages.records
  .find((record) => record.countryCode === 'US')
  .languages
  .map((language) => language.code);
assert.equal(availableLanguageCodes.includes(first.locale.language.code), true, 'language comes from country languages');

const allowedTimezones = data.countryTimezones
  .find((record) => record.countryCode === 'US')
  .timezones
  .map((timezone) => timezone.timezone);
assert.equal(allowedTimezones.includes(first.locale.timezone.timezone), true, 'timezone comes from country timezone rule');
assert.notEqual(first.locale.timezone.timezone, 'Europe/Berlin', 'timezone should not conflict with country rule');
assert.equal(allowedTimezones.includes('America/New_York'), true, 'US should expose America/New_York');
assert.equal(allowedTimezones.includes('America/Los_Angeles'), true, 'US should expose America/Los_Angeles');

const missingCountry = generator.generate({
  countryCode: 'ZZ',
  seed: 'locale-seed',
  ruleVersion,
  databaseVersion,
});
assert.equal(missingCountry.ok, false, 'missing country should return an error');
assert.match(missingCountry.errors[0].reason, /No locale language records/);

for (const countryCode of ['US', 'DE', 'JP', 'GB', 'HK', 'BR', 'MX']) {
  const result = generator.generate({
    countryCode,
    seed: `locale-seed-${countryCode}`,
    ruleVersion,
    databaseVersion,
  });
  assert.equal(result.ok, true, `${countryCode} should generate a locale result`);
  assert.equal(result.locale.countryCode, countryCode);
}

assert.equal(generator.generate({ countryCode: 'HK', seed: 'hk', ruleVersion, databaseVersion }).locale.timezone.timezone, 'Asia/Hong_Kong');
assert.equal(generator.generate({ countryCode: 'BR', seed: 'br', ruleVersion, databaseVersion }).locale.timezone.timezone, 'America/Sao_Paulo');
assert.equal(generator.generate({ countryCode: 'MX', seed: 'mx', ruleVersion, databaseVersion }).locale.timezone.timezone, 'America/Mexico_City');

console.log('LocaleGenerator tests passed');
