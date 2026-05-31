export type ImportIssueLevel = 'warning' | 'error';

export interface ImportIssue {
  level: ImportIssueLevel;
  sourceFile: string;
  line?: number;
  message: string;
  raw?: string;
}

export interface SourceFileReport {
  path: string;
  records: number;
  validRecords: number;
  invalidRecords: number;
}

export interface ImportReportData {
  importedAt: string;
  ruleVersion: string;
  databaseVersion: string;
  sourceFiles: SourceFileReport[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: ImportIssue[];
  errors: ImportIssue[];
}

export class ImportReport {
  private readonly sourceFiles = new Map<string, SourceFileReport>();
  private readonly warnings: ImportIssue[] = [];
  private readonly errors: ImportIssue[] = [];

  constructor(
    private readonly ruleVersion = 'phase-2.5-schema-freeze',
    private readonly databaseVersion = 'db-v1',
  ) {}

  addSourceFile(path: string): void {
    if (!this.sourceFiles.has(path)) {
      this.sourceFiles.set(path, {
        path,
        records: 0,
        validRecords: 0,
        invalidRecords: 0,
      });
    }
  }

  addValidRecord(path: string): void {
    this.addSourceFile(path);
    const report = this.sourceFiles.get(path);
    if (!report) return;
    report.records += 1;
    report.validRecords += 1;
  }

  addInvalidRecord(path: string, issue: Omit<ImportIssue, 'level' | 'sourceFile'>, level: ImportIssueLevel): void {
    this.addSourceFile(path);
    const report = this.sourceFiles.get(path);
    if (!report) return;

    report.records += 1;
    report.invalidRecords += 1;

    const entry: ImportIssue = {
      level,
      sourceFile: path,
      ...issue,
    };

    if (level === 'warning') {
      this.warnings.push(entry);
    } else {
      this.errors.push(entry);
    }
  }

  toJSON(importedAt = new Date().toISOString()): ImportReportData {
    const sourceFiles = Array.from(this.sourceFiles.values());
    return {
      importedAt,
      ruleVersion: this.ruleVersion,
      databaseVersion: this.databaseVersion,
      sourceFiles,
      totalRecords: sourceFiles.reduce((sum, file) => sum + file.records, 0),
      validRecords: sourceFiles.reduce((sum, file) => sum + file.validRecords, 0),
      invalidRecords: sourceFiles.reduce((sum, file) => sum + file.invalidRecords, 0),
      warnings: this.warnings,
      errors: this.errors,
    };
  }
}
