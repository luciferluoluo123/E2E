export type HardwareTier = 'low' | 'mid' | 'high' | 'extreme';
export type GpuTier = 'integrated' | HardwareTier;
export type Confidence = 'low' | 'medium' | 'high';

export interface HardwareRecord {
  id: string;
  name: string;
  tier: string;
  weight: number;
  source: string;
  confidence: Confidence;
}

export interface HardwareCompatibilityRecord {
  id: string;
  name: string;
  type: 'cpuGpu' | 'cpuRam' | 'osHardware';
  source: string;
  confidence: Confidence;
  matrix: Record<string, unknown>;
}

export interface HardwareValidationIssue {
  field: string;
  reason: string;
  recordId?: string;
}

export interface HardwareValidationResult {
  passed: boolean;
  errors: HardwareValidationIssue[];
  warnings: HardwareValidationIssue[];
}

export interface HardwareCombination {
  cpuTier: HardwareTier;
  gpuTier: GpuTier;
  ramTier: HardwareTier;
  osName?: string;
}

export interface HardwareRuleSet {
  cpus: HardwareRecord[];
  gpus: HardwareRecord[];
  ram: HardwareRecord[];
  compatibility: HardwareCompatibilityRecord[];
}

export class HardwareRuleValidator {
  validateRuleSet(ruleSet: HardwareRuleSet): HardwareValidationResult {
    const errors: HardwareValidationIssue[] = [];
    const warnings: HardwareValidationIssue[] = [];

    for (const record of [...ruleSet.cpus, ...ruleSet.gpus, ...ruleSet.ram]) {
      errors.push(...this.validateHardwareRecord(record));
      if (record.weight === 0) {
        warnings.push({
          field: 'weight',
          recordId: record.id,
          reason: 'weight=0 records are allowed as disabled records but must not be default selectable.',
        });
      }
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

  validateCombination(ruleSet: HardwareRuleSet, combination: HardwareCombination): HardwareValidationResult {
    const errors: HardwareValidationIssue[] = [];
    const warnings: HardwareValidationIssue[] = [];
    const cpuGpu = this.findCompatibility(ruleSet, 'cpuGpu');
    const cpuRam = this.findCompatibility(ruleSet, 'cpuRam');
    const osHardware = this.findCompatibility(ruleSet, 'osHardware');

    if (!cpuGpu) {
      errors.push({ field: 'compatibility.cpuGpu', reason: 'Missing CPU/GPU compatibility matrix.' });
    } else if (!this.includesTier(cpuGpu, combination.cpuTier, combination.gpuTier)) {
      errors.push({
        field: 'gpuTier',
        reason: `GPU tier ${combination.gpuTier} is not compatible with CPU tier ${combination.cpuTier}.`,
      });
    }

    if (!cpuRam) {
      errors.push({ field: 'compatibility.cpuRam', reason: 'Missing CPU/RAM compatibility matrix.' });
    } else if (!this.includesTier(cpuRam, combination.cpuTier, combination.ramTier)) {
      errors.push({
        field: 'ramTier',
        reason: `RAM tier ${combination.ramTier} is not compatible with CPU tier ${combination.cpuTier}.`,
      });
    }

    if (osHardware && combination.osName) {
      const osRule = osHardware.matrix[combination.osName.toLowerCase()];
      if (this.isObject(osRule)) {
        for (const [field, tier] of [
          ['cpu', combination.cpuTier],
          ['gpu', combination.gpuTier],
          ['ram', combination.ramTier],
        ] as const) {
          const allowed = osRule[field];
          if (Array.isArray(allowed) && !allowed.includes(tier)) {
            errors.push({
              field: `${field}Tier`,
              reason: `${field} tier ${tier} is not supported by OS ${combination.osName}.`,
            });
          }
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateHardwareRecord(record: HardwareRecord): HardwareValidationIssue[] {
    const errors: HardwareValidationIssue[] = [];

    for (const field of ['id', 'name', 'tier', 'source', 'confidence'] as const) {
      if (!record[field]) {
        errors.push({
          field,
          recordId: record.id,
          reason: `${field} is required.`,
        });
      }
    }

    if (typeof record.weight !== 'number' || record.weight < 0) {
      errors.push({
        field: 'weight',
        recordId: record.id,
        reason: 'weight must be a non-negative number.',
      });
    }

    if (!['low', 'medium', 'high'].includes(record.confidence)) {
      errors.push({
        field: 'confidence',
        recordId: record.id,
        reason: 'confidence must be low, medium, or high.',
      });
    }

    return errors;
  }

  private validateCompatibilityRecord(record: HardwareCompatibilityRecord): HardwareValidationIssue[] {
    const errors: HardwareValidationIssue[] = [];

    for (const field of ['id', 'name', 'type', 'source', 'confidence'] as const) {
      if (!record[field]) {
        errors.push({
          field,
          recordId: record.id,
          reason: `${field} is required.`,
        });
      }
    }

    if (!this.isObject(record.matrix)) {
      errors.push({
        field: 'matrix',
        recordId: record.id,
        reason: 'matrix is required.',
      });
    }

    return errors;
  }

  private findCompatibility(ruleSet: HardwareRuleSet, type: HardwareCompatibilityRecord['type']): HardwareCompatibilityRecord | undefined {
    return ruleSet.compatibility.find((record) => record.type === type);
  }

  private includesTier(record: HardwareCompatibilityRecord, sourceTier: string, targetTier: string): boolean {
    const allowed = record.matrix[sourceTier];
    return Array.isArray(allowed) && allowed.includes(targetTier);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

