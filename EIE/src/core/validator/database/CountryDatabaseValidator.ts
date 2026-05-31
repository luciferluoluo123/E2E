import { DatabaseEnvelopeValidator } from './DatabaseEnvelopeValidator';
import type { DatabaseValidationIssue } from './DatabaseValidationReport';

export class CountryDatabaseValidator extends DatabaseEnvelopeValidator {
  validateRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
    const issues = this.validateTraceableRecord(filePath, record, recordIndex);
    if (!this.isObject(record)) return issues;

    const countryCode = this.readString(record, 'countryCode');
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      issues.push({
        level: 'error',
        filePath,
        field: 'countryCode',
        recordIndex,
        reason: 'countryCode must be exactly two uppercase letters.',
        value: record.countryCode,
      });
    }

    if (!this.readString(record, 'countryName')) {
      issues.push({
        level: 'error',
        filePath,
        field: 'countryName',
        recordIndex,
        reason: 'countryName must be present.',
      });
    }

    return issues;
  }
}

