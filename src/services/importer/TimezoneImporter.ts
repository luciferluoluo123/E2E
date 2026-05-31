import type { ImportReport } from './ImportReport';

export interface ImportedTimezone {
  timezone: string;
  gmtOffset: string;
  source: string;
  confidence: number;
  ruleVersion?: string;
  databaseVersion?: string;
}

export class TimezoneImporter {
  parse(sourcePath: string, text: string, report: ImportReport): ImportedTimezone[] {
    return text.split(/\r?\n/).flatMap((line, index) => {
      const raw = line.trim();
      if (!raw) return [];

      const match = raw.match(/^tz:\s*'([^']+)'\s*,\s*gmt:\s*'([^']+)'\s*[,]?$/i);
      if (!match) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Unable to parse timezone line.',
          raw,
        }, 'error');
        return [];
      }

      const originalTimezone = match[2].trim();
      const timezone = this.normalizeTimezone(originalTimezone);

      if (timezone !== originalTimezone) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: `Normalized timezone from ${originalTimezone} to ${timezone}.`,
          raw,
        }, 'warning');
      }

      const record: ImportedTimezone = {
        timezone,
        gmtOffset: match[1].trim().toUpperCase(),
        source: sourcePath,
        confidence: 0.95,
      };

      report.addValidRecord(sourcePath);
      return [record];
    });
  }

  private normalizeTimezone(timezone: string): string {
    return timezone
      .split('/')
      .map((part) => part.replace(/\s+/g, '_'))
      .join('/');
  }
}
