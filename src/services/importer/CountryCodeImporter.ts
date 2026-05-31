import type { ImportReport } from './ImportReport';

export interface ImportedCountry {
  countryCode: string;
  countryName: string;
  source: string;
  confidence: number;
}

export class CountryCodeImporter {
  parse(sourcePath: string, text: string, report: ImportReport): ImportedCountry[] {
    return text.split(/\r?\n/).flatMap((line, index) => {
      const raw = line.trim();
      if (!raw) return [];

      const match = raw.match(/^([a-z]{2})\s*:\s*'(.+)'[,]?$/i);
      if (!match) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Unable to parse country code line.',
          raw,
        }, 'error');
        return [];
      }

      const record: ImportedCountry = {
        countryCode: match[1].toUpperCase(),
        countryName: match[2].trim(),
        source: sourcePath,
        confidence: 0.95,
      };

      report.addValidRecord(sourcePath);
      return [record];
    });
  }
}

