import { SeededRandom } from '../rules/SeededRandom.ts';
import { WeightEngine } from '../rules/WeightEngine.ts';
import {
  type GpuTier,
  type HardwareCombination,
  type HardwareRecord,
  type HardwareRuleSet,
  type HardwareTier,
  HardwareRuleValidator,
} from '../validator/hardware/HardwareRuleValidator.ts';

export interface OsRecord {
  osName: string;
  version: string;
  build: string;
  architecture: string;
  source: string;
  confidence: number | 'low' | 'medium' | 'high';
  weight?: number;
  ruleVersion?: string;
  databaseVersion?: string;
}

export interface HardwareGeneratorConstraints {
  cpuTier?: HardwareTier;
  gpuTier?: GpuTier;
  ramTier?: HardwareTier;
  osName?: string;
}

export interface HardwareGeneratorInput {
  seed: string;
  ruleVersion: string;
  databaseVersion: string;
  constraints?: HardwareGeneratorConstraints;
  maxAttempts?: number;
}

export interface HardwareGeneratorData extends HardwareRuleSet {
  os: OsRecord[];
}

export interface HardwareGenerationIssue {
  field: string;
  reason: string;
}

export interface HardwareGenerationReason {
  field: string;
  reason: string;
  source: string;
  confidence: number | 'low' | 'medium' | 'high';
  weight: number;
  ruleVersion: string;
  databaseVersion: string;
}

export interface GeneratedHardware {
  cpu: HardwareRecord;
  gpu: HardwareRecord;
  ram: HardwareRecord;
  os: OsRecord;
  source: string;
  confidence: number | 'low' | 'medium' | 'high';
  reasons: HardwareGenerationReason[];
  ruleVersion: string;
  databaseVersion: string;
}

export interface HardwareGenerationResult {
  ok: boolean;
  hardware?: GeneratedHardware;
  warnings: HardwareGenerationIssue[];
  errors: HardwareGenerationIssue[];
  attempts: number;
}

type WeightedRecord = HardwareRecord | OsRecord;

export class HardwareGenerator {
  private readonly data: HardwareGeneratorData;
  private readonly validator: HardwareRuleValidator;

  constructor(data: HardwareGeneratorData, validator = new HardwareRuleValidator()) {
    this.data = data;
    this.validator = validator;
  }

  generate(input: HardwareGeneratorInput): HardwareGenerationResult {
    const inputError = this.validateInput(input);
    if (inputError) {
      return this.fail(inputError.field, inputError.reason, 0);
    }

    const availabilityError = this.validateAvailability(input.constraints);
    if (availabilityError) {
      return this.fail(availabilityError.field, availabilityError.reason, 0);
    }

    const ruleSetValidation = this.validator.validateRuleSet(this.data);
    if (!ruleSetValidation.passed) {
      return {
        ok: false,
        warnings: ruleSetValidation.warnings,
        errors: ruleSetValidation.errors,
        attempts: 0,
      };
    }

    const maxAttempts = input.maxAttempts ?? 25;
    const random = new SeededRandom(`${input.seed}:${input.ruleVersion}:${input.databaseVersion}:hardware`);
    let lastErrors: HardwareGenerationIssue[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const cpuSelection = this.pickRecord(
        this.filterHardware(this.data.cpus, input.constraints?.cpuTier),
        random.fork(`cpu-${attempt}`),
        'cpu',
      );
      const gpuSelection = this.pickRecord(
        this.filterHardware(this.data.gpus, input.constraints?.gpuTier),
        random.fork(`gpu-${attempt}`),
        'gpu',
      );
      const ramSelection = this.pickRecord(
        this.filterHardware(this.data.ram, input.constraints?.ramTier),
        random.fork(`ram-${attempt}`),
        'ram',
      );
      const osSelection = this.pickRecord(
        this.filterOs(this.data.os, input.constraints?.osName),
        random.fork(`os-${attempt}`),
        'os',
      );

      if (!cpuSelection.ok || !gpuSelection.ok || !ramSelection.ok || !osSelection.ok) {
        const selectionErrors = [
          cpuSelection,
          gpuSelection,
          ramSelection,
          osSelection,
        ].flatMap((selection) => ('error' in selection ? [selection.error] : []));
        return this.fail(
          'records',
          selectionErrors.join(' '),
          attempt,
        );
      }

      const combination: HardwareCombination = {
        cpuTier: cpuSelection.record.tier as HardwareTier,
        gpuTier: gpuSelection.record.tier as GpuTier,
        ramTier: ramSelection.record.tier as HardwareTier,
        osName: this.toCompatibilityOsName(osSelection.record.osName),
      };

      const validation = this.validator.validateCombination(this.data, combination);
      if (!validation.passed) {
        lastErrors = validation.errors;
        continue;
      }

      const reasons = [
        this.toReason('cpu', cpuSelection.record, cpuSelection.weight, input),
        this.toReason('gpu', gpuSelection.record, gpuSelection.weight, input),
        this.toReason('ram', ramSelection.record, ramSelection.weight, input),
        this.toReason('os', osSelection.record, osSelection.weight, input),
      ];

      return {
        ok: true,
        hardware: {
          cpu: cpuSelection.record,
          gpu: gpuSelection.record,
          ram: ramSelection.record,
          os: osSelection.record,
          source: reasons.map((reason) => reason.source).join('|'),
          confidence: this.lowestConfidence([
            cpuSelection.record.confidence,
            gpuSelection.record.confidence,
            ramSelection.record.confidence,
            osSelection.record.confidence,
          ]),
          reasons,
          ruleVersion: input.ruleVersion,
          databaseVersion: input.databaseVersion,
        },
        warnings: validation.warnings,
        errors: [],
        attempts: attempt,
      };
    }

    return {
      ok: false,
      warnings: [],
      errors: lastErrors.length > 0
        ? lastErrors
        : [{ field: 'hardware', reason: `No compatible hardware combination found after ${maxAttempts} attempts.` }],
      attempts: maxAttempts,
    };
  }

  private validateInput(input: HardwareGeneratorInput): HardwareGenerationIssue | undefined {
    if (!input.seed) return { field: 'seed', reason: 'seed is required.' };
    if (!input.ruleVersion) return { field: 'ruleVersion', reason: 'ruleVersion is required.' };
    if (!input.databaseVersion) return { field: 'databaseVersion', reason: 'databaseVersion is required.' };
    if (input.maxAttempts !== undefined && input.maxAttempts < 1) {
      return { field: 'maxAttempts', reason: 'maxAttempts must be at least 1.' };
    }
    return undefined;
  }

  private validateAvailability(constraints?: HardwareGeneratorConstraints): HardwareGenerationIssue | undefined {
    const checks: Array<[string, WeightedRecord[]]> = [
      ['cpu', this.filterHardware(this.data.cpus, constraints?.cpuTier)],
      ['gpu', this.filterHardware(this.data.gpus, constraints?.gpuTier)],
      ['ram', this.filterHardware(this.data.ram, constraints?.ramTier)],
      ['os', this.filterOs(this.data.os, constraints?.osName)],
    ];

    for (const [field, records] of checks) {
      if (!Array.isArray(records) || records.length === 0) {
        return { field, reason: `No ${field} records available for hardware generation.` };
      }

      if (!records.some((record) => this.readWeight(record) > 0)) {
        return { field, reason: `No selectable ${field} records with weight > 0.` };
      }
    }

    return undefined;
  }

  private filterHardware<T extends HardwareRecord>(records: T[], tier?: string): T[] {
    if (!tier) return records;
    return records.filter((record) => record.tier === tier);
  }

  private filterOs(records: OsRecord[], osName?: string): OsRecord[] {
    if (!osName) return records;
    return records.filter((record) => this.toCompatibilityOsName(record.osName) === this.toCompatibilityOsName(osName));
  }

  private pickRecord<T extends WeightedRecord>(
    records: T[],
    random: SeededRandom,
    field: string,
  ): { ok: true; record: T; weight: number } | { ok: false; error: string } {
    try {
      const selection = new WeightEngine(random).pick(
        records.map((record) => ({
          item: record,
          weight: this.readWeight(record),
        })),
      );
      return { ok: true, record: selection.item, weight: selection.weight };
    } catch (error) {
      return { ok: false, error: `${field}: ${(error as Error).message}` };
    }
  }

  private readWeight(record: WeightedRecord): number {
    if ('weight' in record && typeof record.weight === 'number') {
      return record.weight;
    }
    return 1;
  }

  private toReason(
    field: HardwareGenerationReason['field'],
    record: WeightedRecord,
    weight: number,
    input: HardwareGeneratorInput,
  ): HardwareGenerationReason {
    return {
      field,
      reason: `Selected ${field} from standardized hardware rules.`,
      source: record.source,
      confidence: record.confidence,
      weight,
      ruleVersion: 'ruleVersion' in record && record.ruleVersion ? record.ruleVersion : input.ruleVersion,
      databaseVersion: 'databaseVersion' in record && record.databaseVersion ? record.databaseVersion : input.databaseVersion,
    };
  }

  private toCompatibilityOsName(osName: string): string {
    return osName.trim().toLowerCase();
  }

  private lowestConfidence(values: Array<number | 'low' | 'medium' | 'high'>): number | 'low' | 'medium' | 'high' {
    const sorted = [...values].sort((left, right) => this.confidenceScore(left) - this.confidenceScore(right));
    return sorted[0];
  }

  private confidenceScore(value: number | 'low' | 'medium' | 'high'): number {
    if (typeof value === 'number') return value;
    if (value === 'high') return 0.9;
    if (value === 'medium') return 0.75;
    return 0.5;
  }

  private fail(field: string, reason: string, attempts: number): HardwareGenerationResult {
    return {
      ok: false,
      warnings: [],
      errors: [{ field, reason }],
      attempts,
    };
  }
}
