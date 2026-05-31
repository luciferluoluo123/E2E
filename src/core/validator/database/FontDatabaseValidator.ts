import { DatabaseEnvelopeValidator } from './DatabaseEnvelopeValidator';
import type { DatabaseValidationIssue } from './DatabaseValidationReport';

export class FontDatabaseValidator extends DatabaseEnvelopeValidator {
  validateRecord(filePath: string, record: unknown, recordIndex: number, expectedPlatform: 'windows' | 'browser'): DatabaseValidationIssue[] {
    const issues = this.validateTraceableRecord(filePath, record, recordIndex);
    if (!this.isObject(record)) return issues;

    if (!this.readString(record, 'fontName')) {
      issues.push({
        level: 'error',
        filePath,
        field: 'fontName',
        recordIndex,
        reason: 'fontName must be present.',
      });
    }

    if (record.platform !== expectedPlatform) {
      issues.push({
        level: 'error',
        filePath,
        field: 'platform',
        recordIndex,
        reason: `platform must be ${expectedPlatform}.`,
        value: record.platform,
      });
    }

    return issues;
  }
}

