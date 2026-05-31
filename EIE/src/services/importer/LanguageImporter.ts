import type { ImportReport } from './ImportReport';

export interface ImportedCountryLanguage {
  code: string;
  prefix: string;
  englishName: string;
  localName: string;
  weight: number;
  source: string;
  confidence: number;
}

export interface ImportedCountryLanguages {
  countryCode: string;
  languages: ImportedCountryLanguage[];
  source: string;
  confidence: number;
}

export class LanguageImporter {
  parse(sourcePath: string, text: string, report: ImportReport): ImportedCountryLanguages[] {
    const grouped = new Map<string, ImportedCountryLanguage[]>();

    text.split(/\r?\n/).forEach((line, index) => {
      const raw = line.trim();
      if (!raw) return;

      const cc = this.readField(raw, 'cc');
      const code = this.readField(raw, 'code');
      const prefix = this.readField(raw, 'prefix');
      const englishName = this.readField(raw, 'en');
      const localName = this.readField(raw, 'lang');

      if (!cc) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Language line is missing country code.',
          raw,
        }, 'error');
        return;
      }

      if (!code || !prefix) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Language line has empty language code or prefix.',
          raw,
        }, 'warning');
        return;
      }

      const countryCode = cc.toUpperCase();
      const language: ImportedCountryLanguage = {
        code: this.normalizeLocaleCode(code),
        prefix: prefix.toLowerCase(),
        englishName,
        localName,
        weight: 1,
        source: sourcePath,
        confidence: code && prefix ? 0.85 : 0.45,
      };

      const existing = grouped.get(countryCode) ?? [];
      existing.push(language);
      grouped.set(countryCode, existing);
      report.addValidRecord(sourcePath);
    });

    return Array.from(grouped.entries()).map(([countryCode, languages]) => ({
      countryCode,
      languages,
      source: sourcePath,
      confidence: Math.min(...languages.map((language) => language.confidence)),
    }));
  }

  private readField(raw: string, key: string): string {
    const match = raw.match(new RegExp(`${key}:\\s*'([^']*)'`));
    return match?.[1]?.trim() ?? '';
  }

  private normalizeLocaleCode(code: string): string {
    return code
      .split('-')
      .filter(Boolean)
      .map((part, index) => (index === 0 ? part.toLowerCase() : part.toUpperCase()))
      .join('-');
  }
}
