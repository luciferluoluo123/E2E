export type BrowserConfidence = 'low' | 'medium' | 'high';

export interface BrowserRecord {
  id: string;
  name: string;
  majorVersion: number;
  weight: number;
  source: string;
  confidence: BrowserConfidence;
}

export interface BrowserCompatibilityRecord {
  id: string;
  browser: string;
  supportedOs: string[];
  supportedArchitecture: string[];
  source: string;
  confidence: BrowserConfidence;
}

export interface BrowserRuleSet {
  browsers: BrowserRecord[];
  compatibility: BrowserCompatibilityRecord[];
}

export interface BrowserCombination {
  browser: string;
  os: string;
  architecture: string;
}

export interface BrowserValidationIssue {
  field: string;
  reason: string;
  recordId?: string;
}

export interface BrowserValidationResult {
  passed: boolean;
  errors: BrowserValidationIssue[];
  warnings: BrowserValidationIssue[];
}

export class BrowserRuleValidator {
  validateRuleSet(ruleSet: BrowserRuleSet): BrowserValidationResult {
    const errors: BrowserValidationIssue[] = [];
    const warnings: BrowserValidationIssue[] = [];

    for (const record of ruleSet.browsers) {
      errors.push(...this.validateBrowserRecord(record));
    }

    for (const record of ruleSet.compatibility) {
      errors.push(...this.validateCompatibilityRecord(record));
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateCombination(ruleSet: BrowserRuleSet, combination: BrowserCombination): BrowserValidationResult {
    const errors: BrowserValidationIssue[] = [];
    const warnings: BrowserValidationIssue[] = [];
    const browserName = this.normalize(combination.browser);
    const compatibility = ruleSet.compatibility.find((record) => this.normalize(record.browser) === browserName);

    if (!compatibility) {
      errors.push({
        field: 'browser',
        reason: `No browser compatibility rule found for ${combination.browser}.`,
      });
      return { passed: false, errors, warnings };
    }

    if (!compatibility.supportedOs.includes(combination.os)) {
      errors.push({
        field: 'os',
        recordId: compatibility.id,
        reason: `${combination.browser} does not support OS ${combination.os}.`,
      });
    }

    if (!compatibility.supportedArchitecture.includes(combination.architecture)) {
      errors.push({
        field: 'architecture',
        recordId: compatibility.id,
        reason: `${combination.browser} does not support architecture ${combination.architecture}.`,
      });
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateBrowserRecord(record: BrowserRecord): BrowserValidationIssue[] {
    const errors: BrowserValidationIssue[] = [];

    for (const field of ['id', 'name', 'source', 'confidence'] as const) {
      if (!record[field]) {
        errors.push({
          field,
          recordId: record.id,
          reason: `${field} is required.`,
        });
      }
    }

    if (!Number.isInteger(record.majorVersion) || record.majorVersion < 1) {
      errors.push({
        field: 'majorVersion',
        recordId: record.id,
        reason: 'majorVersion must be a positive integer.',
      });
    }

    if (typeof record.weight !== 'number' || record.weight <= 0) {
      errors.push({
        field: 'weight',
        recordId: record.id,
        reason: 'weight must be a positive number.',
      });
    }

    if (!this.isConfidence(record.confidence)) {
      errors.push({
        field: 'confidence',
        recordId: record.id,
        reason: 'confidence must be low, medium, or high.',
      });
    }

    return errors;
  }

  private validateCompatibilityRecord(record: BrowserCompatibilityRecord): BrowserValidationIssue[] {
    const errors: BrowserValidationIssue[] = [];

    for (const field of ['id', 'browser', 'source', 'confidence'] as const) {
      if (!record[field]) {
        errors.push({
          field,
          recordId: record.id,
          reason: `${field} is required.`,
        });
      }
    }

    if (!Array.isArray(record.supportedOs) || record.supportedOs.length === 0) {
      errors.push({
        field: 'supportedOs',
        recordId: record.id,
        reason: 'supportedOs must contain at least one OS.',
      });
    }

    if (!Array.isArray(record.supportedArchitecture) || record.supportedArchitecture.length === 0) {
      errors.push({
        field: 'supportedArchitecture',
        recordId: record.id,
        reason: 'supportedArchitecture must contain at least one architecture.',
      });
    }

    if (!this.isConfidence(record.confidence)) {
      errors.push({
        field: 'confidence',
        recordId: record.id,
        reason: 'confidence must be low, medium, or high.',
      });
    }

    return errors;
  }

  private isConfidence(value: unknown): value is BrowserConfidence {
    return value === 'low' || value === 'medium' || value === 'high';
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
