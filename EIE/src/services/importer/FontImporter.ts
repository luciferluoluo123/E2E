import type { ImportReport } from './ImportReport';

export interface ImportedFont {
  fontName: string;
  platform: 'windows' | 'browser';
  source: string;
  confidence: number;
}

export class FontImporter {
  parse(sourcePath: string, text: string, platform: ImportedFont['platform'], report: ImportReport): ImportedFont[] {
    const seen = new Set<string>();

    return text.split(/\r?\n/).flatMap((line, index) => {
      const fontName = line.trim();
      if (!fontName) return [];

      const key = fontName.toLowerCase();
      if (seen.has(key)) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Duplicate font name removed from standardized output.',
          raw: fontName,
        }, 'warning');
        return [];
      }

      seen.add(key);
      report.addValidRecord(sourcePath);
      return [{
        fontName,
        platform,
        source: sourcePath,
        confidence: 0.9,
      }];
    });
  }
}

