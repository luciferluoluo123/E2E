import type { DatabaseValidationIssue } from './DatabaseValidationReport';

export interface DatabaseEnvelopeValidationResult {
  collection?: string;
  databaseVersion?: string;
  ruleVersion?: string;
  records: unknown[];
  errors: DatabaseValidationIssue[];
}

export class DatabaseEnvelopeValidator {
  validate(filePath: string, data: unknown): DatabaseEnvelopeValidationResult {
    const errors: DatabaseValidationIssue[] = [];

    if (!this.isObject(data)) {
      return {
        records: [],
        errors: [{
          level: 'error',
          filePath,
          field: '$',
          reason: 'Database JSON root must be an object envelope.',
        }],
      };
    }

    const databaseVersion = this.readString(data, 'databaseVersion');
    const ruleVersion = this.readString(data, 'ruleVersion');
    const collection = this.readString(data, 'collection');
    const recordsValue = data.records;
    const records = Array.isArray(recordsValue) ? recordsValue : [];

    if (!databaseVersion) {
      errors.push({
        level: 'error',
        filePath,
        field: 'databaseVersion',
        reason: 'Database envelope must include databaseVersion.',
      });
    }

    if (!ruleVersion) {
      errors.push({
        level: 'error',
        filePath,
        field: 'ruleVersion',
        reason: 'Database envelope must include ruleVersion.',
      });
    }

    if (!collection) {
      errors.push({
        level: 'error',
        filePath,
        field: 'collection',
        reason: 'Database envelope must include collection.',
      });
    }

    if (!Array.isArray(recordsValue)) {
      errors.push({
        level: 'error',
        filePath,
        field: 'records',
        reason: 'Database envelope records field must be an array.',
      });
    }

    return {
      collection,
      databaseVersion,
      ruleVersion,
      records,
      errors,
    };
  }

  validateTraceableRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
    const errors: DatabaseValidationIssue[] = [];

    if (!this.isObject(record)) {
      return [{
        level: 'error',
        filePath,
        field: 'records',
        recordIndex,
        reason: 'Record must be an object.',
        value: record,
      }];
    }

    if (!this.readString(record, 'source')) {
      errors.push({
        level: 'error',
        filePath,
        field: 'source',
        recordIndex,
        reason: 'Record must include source.',
      });
    }

    if (typeof record.confidence !== 'number' || record.confidence < 0 || record.confidence > 1) {
      errors.push({
        level: 'error',
        filePath,
        field: 'confidence',
        recordIndex,
        reason: 'Record confidence must be a number from 0 to 1.',
        value: record.confidence,
      });
    }

    if (!this.readString(record, 'ruleVersion')) {
      errors.push({
        level: 'error',
        filePath,
        field: 'ruleVersion',
        recordIndex,
        reason: 'Record must include ruleVersion.',
      });
    }

    if (!this.readString(record, 'databaseVersion')) {
      errors.push({
        level: 'error',
        filePath,
        field: 'databaseVersion',
        recordIndex,
        reason: 'Record must include databaseVersion.',
      });
    }

    return errors;
  }

  protected isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  protected readString(value: Record<string, unknown>, field: string): string {
    const fieldValue = value[field];
    return typeof fieldValue === 'string' ? fieldValue.trim() : '';
  }
}

