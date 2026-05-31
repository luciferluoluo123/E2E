import { DatabaseEnvelopeValidator } from './DatabaseEnvelopeValidator';
import type { DatabaseValidationIssue } from './DatabaseValidationReport';

export class OsDatabaseValidator extends DatabaseEnvelopeValidator {
  validateRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
    const issues = this.validateTraceableRecord(filePath, record, recordIndex);
    if (!this.isObject(record)) return issues;

    if (!this.readString(record, 'osName')) {
      issues.push({
        level: 'error',
        filePath,
        field: 'osName',
        recordIndex,
        reason: 'osName must be present.',
      });
    }

    for (const field of ['version', 'build', 'architecture']) {
      if (typeof record[field] !== 'string') {
        issues.push({
          level: 'error',
          filePath,
          field,
          recordIndex,
          reason: `${field} must be a string, even when empty.`,
          value: record[field],
        });
      }
    }

    return issues;
  }
}
