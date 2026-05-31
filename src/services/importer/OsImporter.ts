import type { ImportReport } from './ImportReport';

export interface ImportedWindowsOs {
  osName: string;
  version: string;
  build: string;
  architecture: string;
  source: string;
  confidence: number;
}

export class OsImporter {
  parseWindows(sourcePath: string, text: string, report: ImportReport): ImportedWindowsOs[] {
    return text.split(/\r?\n/).flatMap((line, index) => {
      const raw = line.trim();
      if (!raw) return [];

      const parts = raw.split(/\s{2,}|\t+/).map((part) => part.trim()).filter(Boolean);
      const versionLike = raw.match(/(\d+(?:\.\d+){1,3})/);
      const buildLike = raw.match(/\b(build\s*)?(\d{4,6})\b/i);
      const architectureLike = raw.match(/\b(x64|x86|arm64|amd64)\b/i);

      const osName = parts[0] && !/^\d/.test(parts[0]) ? parts[0] : 'Windows';
      const version = versionLike?.[1] ?? '';
      const build = buildLike?.[2] ?? '';
      const architecture = (architectureLike?.[1] ?? '').toLowerCase().replace('amd64', 'x64');

      if (!version && !build && !architecture && parts.length < 2) {
        report.addInvalidRecord(sourcePath, {
          line: index + 1,
          message: 'Windows OS line could not be fully parsed; retained with low confidence.',
          raw,
        }, 'warning');
      }

      const record: ImportedWindowsOs = {
        osName,
        version,
        build,
        architecture,
        source: sourcePath,
        confidence: version || build || architecture ? 0.8 : 0.45,
      };

      report.addValidRecord(sourcePath);
      return [record];
    });
  }
}

