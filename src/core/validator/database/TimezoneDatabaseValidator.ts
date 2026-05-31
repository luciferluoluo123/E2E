import { DatabaseEnvelopeValidator } from './DatabaseEnvelopeValidator';
import type { DatabaseValidationIssue } from './DatabaseValidationReport';

const IANA_TIMEZONE_PATTERN = /^(?:[A-Za-z_+-]+\/[A-Za-z0-9_+ -]+(?:\/[A-Za-z0-9_+ -]+)*|UTC|GMT|CET|EET|MET|WET|EST|MST|HST|PST8PDT|MST7MDT|CST6CDT|EST5EDT)$/;

export class TimezoneDatabaseValidator extends DatabaseEnvelopeValidator {
  validateRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
    const issues = this.validateTraceableRecord(filePath, record, recordIndex);
    if (!this.isObject(record)) return issues;

    const timezone = this.readString(record, 'timezone');
    if (!IANA_TIMEZONE_PATTERN.test(timezone)) {
      issues.push({
        level: 'error',
        filePath,
        field: 'timezone',
        recordIndex,
        reason: 'timezone must be an IANA timezone name or recognized IANA alias.',
        value: record.timezone,
      });
    }

    if (!/^GMT[+-]\d{2}:\d{2}$/.test(this.readString(record, 'gmtOffset'))) {
      issues.push({
        level: 'error',
        filePath,
        field: 'gmtOffset',
        recordIndex,
        reason: 'gmtOffset must use GMT+HH:MM or GMT-HH:MM format.',
        value: record.gmtOffset,
      });
    }

    return issues;
  }

  validateCountryTimezoneRecord(
    filePath: string,
    record: unknown,
    recordIndex: number,
    knownTimezones: Set<string>,
  ): DatabaseValidationIssue[] {
    const issues = this.validateManualRuleRecord(filePath, record, recordIndex);
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

    if (!Array.isArray(record.timezones) || record.timezones.length === 0) {
      issues.push({
        level: 'error',
        filePath,
        field: 'timezones',
        recordIndex,
        reason: 'country-timezone record must contain at least one timezone.',
        value: record.timezones,
      });
      return issues;
    }

    record.timezones.forEach((entry, timezoneIndex) => {
      if (!this.isObject(entry)) {
        issues.push({
          level: 'error',
          filePath,
          field: `timezones[${timezoneIndex}]`,
          recordIndex,
          reason: 'timezone entry must be an object.',
          value: entry,
        });
        return;
      }

      const timezone = this.readString(entry, 'timezone');
      if (!knownTimezones.has(timezone)) {
        issues.push({
          level: 'error',
          filePath,
          field: `timezones[${timezoneIndex}].timezone`,
          recordIndex,
          reason: 'timezone must exist in database/timezone/timezones.json.',
          value: entry.timezone,
        });
      }
    });

    if (!Array.isArray(record.reasons) || record.reasons.length === 0) {
      issues.push({
        level: 'error',
        filePath,
        field: 'reasons',
        recordIndex,
        reason: 'country-timezone record must include reasons.',
        value: record.reasons,
      });
    }

    return issues;
  }

  private validateManualRuleRecord(
    filePath: string,
    record: unknown,
    recordIndex: number,
  ): DatabaseValidationIssue[] {
    const issues: DatabaseValidationIssue[] = [];

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
      issues.push({
        level: 'error',
        filePath,
        field: 'source',
        recordIndex,
        reason: 'Record must include source.',
      });
    }

    if (!['low', 'medium', 'high'].includes(String(record.confidence))) {
      issues.push({
        level: 'error',
        filePath,
        field: 'confidence',
        recordIndex,
        reason: 'Manual country-timezone confidence must be low, medium, or high.',
        value: record.confidence,
      });
    }

    if (!this.readString(record, 'ruleVersion')) {
      issues.push({
        level: 'error',
        filePath,
        field: 'ruleVersion',
        recordIndex,
        reason: 'Record must include ruleVersion.',
      });
    }

    if (!this.readString(record, 'databaseVersion')) {
      issues.push({
        level: 'error',
        filePath,
        field: 'databaseVersion',
        recordIndex,
        reason: 'Record must include databaseVersion.',
      });
    }

    return issues;
  }
}
