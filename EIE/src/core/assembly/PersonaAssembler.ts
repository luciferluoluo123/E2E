import type {
  CrossDomainValidator,
  CrossValidationResult,
  HardwareLike,
  Tier,
} from '../validator/cross-domain/CrossDomainValidator.ts';
import type { PersonaAssemblyInput } from '../../types/PersonaAssemblyInput.ts';
import type { PersonaAssemblyResult } from '../../types/PersonaAssemblyResult.ts';
import type { RuntimePersona } from '../../types/RuntimePersona.ts';

export interface PersonaAssemblerOptions {
  seed: string;
  schemaVersion: string;
  ruleVersion: string;
  databaseVersion: string;
  crossDomainValidator: CrossDomainValidator;
  generatedAtProvider?: () => string;
}

export class PersonaAssembler {
  private readonly options: PersonaAssemblerOptions;

  constructor(options: PersonaAssemblerOptions) {
    this.options = options;
  }

  assemble(input: PersonaAssemblyInput): PersonaAssemblyResult {
    const crossValidationResult = this.options.crossDomainValidator.validate({
      locale: input.locale,
      hardware: this.toCrossDomainHardware(input.hardware),
      browser: input.browser,
      ruleVersion: this.options.ruleVersion,
      databaseVersion: this.options.databaseVersion,
    });

    const persona: RuntimePersona = {
      id: this.createPersonaId(input),
      seed: this.options.seed,
      generatedAt: this.generatedAt(),
      schemaVersion: this.options.schemaVersion,
      databaseVersion: this.options.databaseVersion,
      ruleVersion: this.options.ruleVersion,
      locale: input.locale,
      hardware: input.hardware,
      browser: input.browser,
      validation: crossValidationResult,
      sourceSummary: {
        localeSource: input.locale.source,
        hardwareSource: input.hardware.source,
        browserSource: input.browser.source,
      },
    };

    return {
      persona,
      crossValidationResult,
    };
  }

  private createPersonaId(input: PersonaAssemblyInput): string {
    const hashInput = this.stableStringify({
      seed: this.options.seed,
      locale: input.locale,
      hardware: input.hardware,
      browser: input.browser,
    });
    const digest = this.hashString(hashInput);
    return `persona_${digest}`;
  }

  private toCrossDomainHardware(hardware: PersonaAssemblyInput['hardware']): HardwareLike {
    return {
      cpu: {
        tier: hardware.cpu.tier as Tier,
      },
      gpu: {
        tier: hardware.gpu.tier,
      },
      ram: {
        tier: hardware.ram.tier as Tier,
      },
      os: {
        osName: hardware.os.osName,
        architecture: hardware.os.architecture,
      },
    };
  }

  private generatedAt(): string {
    if (this.options.generatedAtProvider) {
      return this.options.generatedAtProvider();
    }

    return new Date().toISOString();
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableStringify(entry)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`)
        .join(',')}}`;
    }

    return JSON.stringify(value);
  }

  private hashString(value: string): string {
    let first = 0x811c9dc5;
    let second = 0x01000193;

    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      first ^= code;
      first = Math.imul(first, 0x01000193) >>> 0;
      second ^= code + index;
      second = Math.imul(second, 0x811c9dc5) >>> 0;
    }

    return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`;
  }
}
