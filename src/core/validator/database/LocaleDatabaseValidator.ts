import { DatabaseEnvelopeValidator } from './DatabaseEnvelopeValidator';
import type { DatabaseValidationIssue } from './DatabaseValidationReport';

const BCP47_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export class LocaleDatabaseValidator extends DatabaseEnvelopeValidator {
  validateCountryLanguageRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
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

    if (!Array.isArray(record.languages)) {
      issues.push({
        level: 'error',
        filePath,
        field: 'languages',
        recordIndex,
        reason: 'languages must be an array.',
        value: record.languages,
      });
      return issues;
    }

    record.languages.forEach((language, languageIndex) => {
      issues.push(...this.validateLanguage(filePath, language, recordIndex, `languages[${languageIndex}]`));
    });

    return issues;
  }

  validateUiLanguageRecord(filePath: string, record: unknown, recordIndex: number): DatabaseValidationIssue[] {
    return this.validateLanguage(filePath, record, recordIndex, '$');
  }

  private validateLanguage(
    filePath: string,
    record: unknown,
    recordIndex: number,
    fieldPrefix: string,
  ): DatabaseValidationIssue[] {
    const issues = this.validateTraceableRecord(filePath, record, recordIndex);
    if (!this.isObject(record)) return issues;

    const code = this.readString(record, 'code');
    if (!BCP47_PATTERN.test(code)) {
      issues.push({
        level: 'error',
        filePath,
        field: `${fieldPrefix}.code`,
        recordIndex,
        reason: 'language code must follow BCP-47-like format.',
        value: record.code,
      });
    }

    const prefix = this.readString(record, 'prefix');
    if (!/^[a-z]{2,3}$/.test(prefix)) {
      issues.push({
        level: 'error',
        filePath,
        field: `${fieldPrefix}.prefix`,
        recordIndex,
        reason: 'language prefix must be two or three lowercase letters.',
        value: record.prefix,
      });
    }

    if ('weight' in record && (typeof record.weight !== 'number' || record.weight < 0)) {
      issues.push({
        level: 'error',
        filePath,
        field: `${fieldPrefix}.weight`,
        recordIndex,
        reason: 'language weight must be a non-negative number.',
        value: record.weight,
      });
    }

    return issues;
  }
}

