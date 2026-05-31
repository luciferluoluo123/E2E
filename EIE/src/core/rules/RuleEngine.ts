import type {
  CountryLanguagesRecord,
  CountryRecord,
  FontRecord,
  TimezoneRecord,
  TraceableRecord,
  UiLanguageRecord,
  WindowsOsRecord,
} from '../../types/index.ts';
import { RuleSource } from './RuleSource.ts';

export interface RuleQueryResult<TRecord extends TraceableRecord> {
  records: TRecord[];
  source: string;
  confidence: number;
  weight: number;
  ruleVersion: string;
  databaseVersion: string;
}

export class RuleEngine {
  private readonly source: RuleSource;

  constructor(source: RuleSource) {
    this.source = source;
  }

  getCountries(): RuleQueryResult<CountryRecord> {
    return this.fromRecords(this.source.getFile<CountryRecord>('country').records);
  }

  getLanguagesForCountry(countryCode: string): RuleQueryResult<CountryLanguagesRecord> {
    const normalized = countryCode.toUpperCase();
    const records = this.source
      .getFile<CountryLanguagesRecord>('countryLanguages')
      .records
      .filter((record) => record.countryCode === normalized);

    return this.fromRecords(records);
  }

  getUiLanguages(): RuleQueryResult<UiLanguageRecord> {
    return this.fromRecords(this.source.getFile<UiLanguageRecord>('uiLanguages').records);
  }

  getTimezones(): RuleQueryResult<TimezoneRecord> {
    return this.fromRecords(this.source.getFile<TimezoneRecord>('timezones').records);
  }

  getFonts(platform: 'windows' | 'browser'): RuleQueryResult<FontRecord> {
    const collection = platform === 'windows' ? 'windowsFonts' : 'browserFonts';
    const records = this.source.getFile<FontRecord>(collection).records;
    return this.fromRecords(records);
  }

  getWindowsOs(): RuleQueryResult<WindowsOsRecord> {
    return this.fromRecords(this.source.getFile<WindowsOsRecord>('windowsOs').records);
  }

  private fromRecords<TRecord extends TraceableRecord>(records: TRecord[]): RuleQueryResult<TRecord> {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('RuleEngine query returned no records.');
    }

    const first = records[0];
    return {
      records,
      source: first.source,
      confidence: Math.min(...records.map((record) => record.confidence)),
      weight: this.readWeight(first),
      ruleVersion: first.ruleVersion,
      databaseVersion: first.databaseVersion,
    };
  }

  private readWeight(record: TraceableRecord): number {
    if ('weight' in record && typeof record.weight === 'number') {
      return record.weight;
    }
    return 1;
  }
}
