export type DatabaseValidationLevel = 'warning' | 'error';

export interface DatabaseValidationIssue {
  level: DatabaseValidationLevel;
  filePath: string;
  field: string;
  reason: string;
  recordIndex?: number;
  value?: unknown;
}

export interface DatabaseValidationFileResult {
  filePath: string;
  collection?: string;
  databaseVersion?: string;
  ruleVersion?: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  passed: boolean;
}

export interface DatabaseValidationReportData {
  checkedAt: string;
  ruleVersion: string;
  databaseVersion: string;
  passed: boolean;
  score: number;
  totalFiles: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  files: DatabaseValidationFileResult[];
  warnings: DatabaseValidationIssue[];
  errors: DatabaseValidationIssue[];
}

export class DatabaseValidationReport {
  private readonly files: DatabaseValidationFileResult[] = [];
  private readonly warnings: DatabaseValidationIssue[] = [];
  private readonly errors: DatabaseValidationIssue[] = [];

  constructor(
    private readonly ruleVersion: string,
    private readonly databaseVersion: string,
  ) {}

  addFile(result: DatabaseValidationFileResult): void {
    this.files.push(result);
  }

  addWarning(issue: Omit<DatabaseValidationIssue, 'level'>): void {
    this.warnings.push({ level: 'warning', ...issue });
  }

  addError(issue: Omit<DatabaseValidationIssue, 'level'>): void {
    this.errors.push({ level: 'error', ...issue });
  }

  toJSON(checkedAt = new Date().toISOString()): DatabaseValidationReportData {
    const totalRecords = this.files.reduce((sum, file) => sum + file.totalRecords, 0);
    const validRecords = this.files.reduce((sum, file) => sum + file.validRecords, 0);
    const invalidRecords = this.files.reduce((sum, file) => sum + file.invalidRecords, 0);
    const blockingIssues = this.errors.length;
    const score = totalRecords === 0
      ? 0
      : Math.max(0, Math.floor(((validRecords - blockingIssues) / totalRecords) * 100));

    return {
      checkedAt,
      ruleVersion: this.ruleVersion,
      databaseVersion: this.databaseVersion,
      passed: this.errors.length === 0,
      score,
      totalFiles: this.files.length,
      totalRecords,
      validRecords,
      invalidRecords,
      files: this.files,
      warnings: this.warnings,
      errors: this.errors,
    };
  }
}
