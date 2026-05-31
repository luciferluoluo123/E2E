import type {
  CountryLanguagesRecord,
  CountryRecord,
  DatabaseCollection,
  DatabaseFile,
  FontRecord,
  TimezoneRecord,
  TraceableRecord,
  UiLanguageRecord,
  WindowsOsRecord,
} from '../../types/index.ts';

export type RuleDatabaseFile =
  | DatabaseFile<CountryRecord>
  | DatabaseFile<CountryLanguagesRecord>
  | DatabaseFile<UiLanguageRecord>
  | DatabaseFile<TimezoneRecord>
  | DatabaseFile<FontRecord>
  | DatabaseFile<WindowsOsRecord>;

export class RuleSource {
  private readonly files = new Map<DatabaseCollection, RuleDatabaseFile>();

  constructor(files: RuleDatabaseFile[]) {
    for (const file of files) {
      this.files.set(file.collection, file);
    }
  }

  getFile<TRecord extends TraceableRecord>(collection: DatabaseCollection): DatabaseFile<TRecord> {
    const file = this.files.get(collection);
    if (!file) {
      throw new Error(`RuleSource missing database collection: ${collection}`);
    }

    if (!Array.isArray(file.records)) {
      throw new Error(`RuleSource collection ${collection} is missing records.`);
    }

    return file as unknown as DatabaseFile<TRecord>;
  }
}
