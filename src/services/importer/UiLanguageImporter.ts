import type { ImportReport } from './ImportReport';

export interface ImportedUiLanguage {
  code: string;
  prefix: string;
  englishName: string;
  localName: string;
  source: string;
  confidence: number;
}

export class UiLanguageImporter {
  parse(sourcePath: string, text: string, report: ImportReport): ImportedUiLanguage[] {
    return text.split(/\r?\n/).flatMap((line, index) => {
      const raw = line.trim().replace(/;$/, '');
      if (!raw) return [];

      const code = this.readField(raw, 'code');
      const englishName = this.readField(raw, 'name');
      const localName = this.readField(raw, 'nativeName');

      if (!code) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'UI language line is missing code.',
          raw,
        }, 'error');
        return [];
      }

      const record: ImportedUiLanguage = {
        code: this.normalizeLocaleCode(code),
        prefix: code.split('-')[0].toLowerCase(),
        englishName,
        localName,
        source: sourcePath,
        confidence: englishName && localName ? 0.8 : 0.55,
      };

      report.addValidRecord(sourcePath);
      return [record];
    });
  }

  private readField(raw: string, key: string): string {
    const quoted = raw.match(new RegExp(`${key}:\\s*'([^']*)'`));
    if (quoted) return quoted[1].trim();

    const unquoted = raw.match(new RegExp(`${key}:\\s*([^,]+)`));
    return unquoted?.[1]?.trim() ?? '';
  }

  private normalizeLocaleCode(code: string): string {
    return code
      .split('-')
      .filter(Boolean)
      .map((part, index) => (index === 0 ? part.toLowerCase() : part.toUpperCase()))
      .join('-');
  }
}

