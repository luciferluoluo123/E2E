import type { ImportReport } from './ImportReport';

export interface CountryTimezoneRuleItem {
  timezone: string;
  weight: number;
  source: string;
  confidence: number;
  ruleVersion: string;
  databaseVersion: string;
}

export interface CountryTimezoneRecord {
  countryCode: string;
  timezones: CountryTimezoneRuleItem[];
  source: string;
  confidence: number;
  reasons: string[];
  ruleVersion: string;
  databaseVersion: string;
}

export interface CountryTimezoneImportResult {
  records: CountryTimezoneRecord[];
  unmappedTimezones: Array<{
    timezone: string;
    source: string;
    raw: string;
    line: number;
    reason: string;
  }>;
}

export class CountryTimezoneImporter {
  parse(
    sourcePath: string,
    text: string,
    knownTimezones: Set<string>,
    report: ImportReport,
    ruleVersion: string,
    databaseVersion: string,
    explicitCountryTimezoneMap = new Map<string, string[]>(),
  ): CountryTimezoneImportResult {
    const grouped = new Map<string, CountryTimezoneRuleItem[]>();
    const unmappedTimezones: CountryTimezoneImportResult['unmappedTimezones'] = [];

    text.split(/\r?\n/).forEach((line, index) => {
      const raw = line.trim();
      if (!raw) return;

      const timezone = this.readTimezone(raw);
      if (!timezone) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Country timezone line is missing timezone field.',
          raw,
        }, 'warning');
        return;
      }

      if (!knownTimezones.has(timezone)) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Timezone is not present in database/timezone/timezones.json.',
          raw,
        }, 'warning');
        return;
      }

      const countryCodes = explicitCountryTimezoneMap.get(timezone) ?? [];
      if (countryCodes.length === 0) {
        const reason = 'Unable to determine countryCode from timezone source data.';
        unmappedTimezones.push({
          timezone,
          source: sourcePath,
          raw,
          line: index + 1,
          reason,
        });
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: reason,
          raw,
        }, 'warning');
        return;
      }

      for (const countryCode of countryCodes) {
        const normalizedCountryCode = countryCode.toUpperCase();
        const existing = grouped.get(normalizedCountryCode) ?? [];
        existing.push({
          timezone,
          weight: 1,
          source: sourcePath,
          confidence: 0.9,
          ruleVersion,
          databaseVersion,
        });
        grouped.set(normalizedCountryCode, existing);
        report.addValidRecord(sourcePath);
      }
    });

    return {
      records: Array.from(grouped.entries()).map(([countryCode, timezones]) => ({
        countryCode,
        timezones,
        source: sourcePath,
        confidence: Math.min(...timezones.map((timezone) => timezone.confidence)),
        reasons: ['Mapped by explicit country-timezone source data.'],
        ruleVersion,
        databaseVersion,
      })),
      unmappedTimezones,
    };
  }

  private readTimezone(raw: string): string {
    const match = raw.match(/gmt:\s*'([^']+)'/i);
    return match?.[1]?.trim() ?? '';
  }
}

