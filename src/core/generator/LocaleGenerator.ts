import type {
  CountryLanguagesRecord,
  DatabaseFile,
  FontRecord,
  LanguageRecord,
  TimezoneRecord,
} from '../../types/index.ts';
import { SeededRandom } from '../rules/SeededRandom.ts';
import { WeightEngine } from '../rules/WeightEngine.ts';

export interface LocaleGeneratorInput {
  countryCode: string;
  seed: string;
  ruleVersion: string;
  databaseVersion: string;
}

export interface CountryTimezoneRule {
  countryCode: string;
  source: string;
  confidence: number | 'low' | 'medium' | 'high';
  reasons: string[];
  ruleVersion: string;
  databaseVersion: string;
  timezones: Array<{
    timezone: string;
    weight: number;
  }>;
}

export interface LocaleGeneratorData {
  countryLanguages: DatabaseFile<CountryLanguagesRecord>;
  timezones: DatabaseFile<TimezoneRecord>;
  fonts: DatabaseFile<FontRecord>;
  countryTimezones: CountryTimezoneRule[];
}

export interface LocaleGenerationIssue {
  field: string;
  reason: string;
}

export interface LocaleGenerationReason {
  field: string;
  reason: string;
  source: string;
  confidence: number;
  weight: number;
  ruleVersion: string;
  databaseVersion: string;
}

export interface GeneratedLocale {
  countryCode: string;
  language: LanguageRecord;
  acceptLanguage: string;
  timezone: TimezoneRecord;
  fonts: FontRecord[];
  source: string;
  confidence: number;
  reasons: LocaleGenerationReason[];
  ruleVersion: string;
  databaseVersion: string;
}

export interface LocaleGenerationResult {
  ok: boolean;
  locale?: GeneratedLocale;
  warnings: LocaleGenerationIssue[];
  errors: LocaleGenerationIssue[];
}

export class LocaleGenerator {
  private readonly data: LocaleGeneratorData;

  constructor(data: LocaleGeneratorData) {
    this.data = data;
  }

  generate(input: LocaleGeneratorInput): LocaleGenerationResult {
    const errors: LocaleGenerationIssue[] = [];
    const warnings: LocaleGenerationIssue[] = [];
    const countryCode = input.countryCode.toUpperCase();

    if (!countryCode) {
      return this.fail('countryCode', 'countryCode is required.');
    }

    const countryLanguages = this.data.countryLanguages.records.find((record) => record.countryCode === countryCode);
    if (!countryLanguages || countryLanguages.languages.length === 0) {
      return this.fail('countryCode', `No locale language records found for country ${countryCode}.`);
    }

    const countryTimezoneRule = this.data.countryTimezones.find((record) => record.countryCode === countryCode);
    if (!countryTimezoneRule || countryTimezoneRule.timezones.length === 0) {
      return this.fail('timezone', `No country-timezone rule found for country ${countryCode}.`);
    }

    if (!Array.isArray(this.data.fonts.records) || this.data.fonts.records.length === 0) {
      return this.fail('fonts', 'No font records available.');
    }

    const random = new SeededRandom(`${input.seed}:${countryCode}:${input.ruleVersion}:${input.databaseVersion}`);
    const languageSelection = new WeightEngine(random.fork('language')).pick(
      countryLanguages.languages.map((language) => ({
        item: language,
        weight: language.weight,
      })),
    );

    const timezoneSelection = new WeightEngine(random.fork('timezone')).pick(
      countryTimezoneRule.timezones.map((timezoneRule) => ({
        item: timezoneRule,
        weight: timezoneRule.weight,
      })),
    );

    const timezone = this.data.timezones.records.find((record) => record.timezone === timezoneSelection.item.timezone);
    if (!timezone) {
      return this.fail('timezone', `Mapped timezone ${timezoneSelection.item.timezone} is missing from database/timezone.`);
    }

    const fonts = this.pickFonts(random.fork('fonts'), this.data.fonts.records, 3);
    const confidence = Math.min(
      countryLanguages.confidence,
      languageSelection.item.confidence,
      timezone.confidence,
      this.toNumericConfidence(countryTimezoneRule.confidence),
      ...fonts.map((font) => font.confidence),
    );

    return {
      ok: true,
      locale: {
        countryCode,
        language: languageSelection.item,
        acceptLanguage: this.toAcceptLanguage(languageSelection.item.code),
        timezone,
        fonts,
        source: [
          countryLanguages.source,
          languageSelection.item.source,
          timezone.source,
          countryTimezoneRule.source,
          ...fonts.map((font) => font.source),
        ].join('|'),
        confidence,
        reasons: [
          {
            field: 'language',
            reason: `Selected language from country ${countryCode} language records.`,
            source: languageSelection.item.source,
            confidence: languageSelection.item.confidence,
            weight: languageSelection.weight,
            ruleVersion: languageSelection.item.ruleVersion,
            databaseVersion: languageSelection.item.databaseVersion,
          },
          {
            field: 'timezone',
            reason: `Selected timezone from explicit country-timezone rule for ${countryCode}.`,
            source: countryTimezoneRule.source,
            confidence: this.toNumericConfidence(countryTimezoneRule.confidence),
            weight: timezoneSelection.weight,
            ruleVersion: countryTimezoneRule.ruleVersion,
            databaseVersion: countryTimezoneRule.databaseVersion,
          },
          ...fonts.map((font) => ({
            field: 'fonts',
            reason: 'Selected font from database font records.',
            source: font.source,
            confidence: font.confidence,
            weight: this.readWeight(font),
            ruleVersion: font.ruleVersion,
            databaseVersion: font.databaseVersion,
          })),
        ],
        ruleVersion: input.ruleVersion,
        databaseVersion: input.databaseVersion,
      },
      warnings,
      errors,
    };
  }

  private pickFonts(random: SeededRandom, records: FontRecord[], count: number): FontRecord[] {
    const remaining = [...records];
    const selected: FontRecord[] = [];

    while (remaining.length > 0 && selected.length < count) {
      const selection = new WeightEngine(random.fork(`font-${selected.length}`)).pick(
        remaining.map((font) => ({
          item: font,
          weight: this.readWeight(font),
        })),
      );
      selected.push(selection.item);
      const selectedIndex = remaining.findIndex((font) => font.fontName === selection.item.fontName);
      remaining.splice(selectedIndex, 1);
    }

    return selected;
  }

  private toAcceptLanguage(languageCode: string): string {
    const prefix = languageCode.split('-')[0];
    return `${languageCode},${prefix};q=0.9`;
  }

  private readWeight(record: unknown): number {
    if (typeof record === 'object' && record !== null && 'weight' in record && typeof record.weight === 'number') {
      return record.weight;
    }
    return 1;
  }

  private toNumericConfidence(confidence: number | 'low' | 'medium' | 'high'): number {
    if (typeof confidence === 'number') {
      return confidence;
    }

    if (confidence === 'high') return 0.9;
    if (confidence === 'medium') return 0.75;
    return 0.5;
  }

  private fail(field: string, reason: string): LocaleGenerationResult {
    return {
      ok: false,
      warnings: [],
      errors: [{ field, reason }],
    };
  }
}
