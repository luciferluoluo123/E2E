import type { RuntimePersona } from '../../types/RuntimePersona.ts';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
  warnings: string[];
  checkedAt: string;
  ruleVersion: string;
  databaseVersion: string;
}

export interface RiskEngineOptions {
  checkedAtProvider?: () => string;
}

interface TraceValue {
  path: string;
  value: unknown;
}

export class RiskEngine {
  private readonly checkedAtProvider: () => string;

  constructor(options: RiskEngineOptions = {}) {
    this.checkedAtProvider = options.checkedAtProvider ?? (() => new Date().toISOString());
  }

  assess(persona: RuntimePersona): RiskAssessment {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    if (!persona.validation.passed) {
      score += 40;
      reasons.push('cross_validation_failed');
    } else {
      reasons.push('cross_validation_passed');
    }

    if (persona.validation.errors.length > 0) {
      score += Math.min(60, persona.validation.errors.length * 30);
      reasons.push(...persona.validation.errors.map((error) => `validation_error:${error}`));
    }

    if (persona.validation.warnings.length > 0) {
      score += Math.min(30, persona.validation.warnings.length * 15);
      warnings.push(...persona.validation.warnings.map((warning) => `validation_warning:${warning}`));
      reasons.push('validation_warnings_present');
    }

    for (const trace of this.collectTraceValues(persona)) {
      if (this.isMissingSource(trace.value)) {
        score += 70;
        reasons.push(`missing_source:${trace.path}`);
      }

      if (this.isMissingConfidence(trace.value)) {
        score += 70;
        reasons.push(`missing_confidence:${trace.path}`);
      } else {
        const confidence = this.readConfidence(trace.value);
        if (confidence === 'low') {
          score += 20;
          reasons.push(`low_confidence:${trace.path}`);
        } else if (confidence === 'medium') {
          reasons.push(`medium_confidence:${trace.path}`);
        } else if (confidence === 'high') {
          reasons.push(`high_confidence:${trace.path}`);
        }
      }

      const source = this.readSource(trace.value);
      if (source && source.includes('manual-rule-v1')) {
        score += 5;
        const message = `manual_rule_source:${trace.path}:${source}`;
        warnings.push(message);
        reasons.push(message);
      }
    }

    const boundedScore = Math.max(0, Math.min(100, score));

    return {
      score: boundedScore,
      level: this.levelForScore(boundedScore),
      reasons,
      warnings,
      checkedAt: this.checkedAtProvider(),
      ruleVersion: persona.ruleVersion,
      databaseVersion: persona.databaseVersion,
    };
  }

  private collectTraceValues(persona: RuntimePersona): TraceValue[] {
    return [
      { path: 'locale', value: persona.locale },
      { path: 'locale.language', value: persona.locale.language },
      { path: 'locale.timezone', value: persona.locale.timezone },
      ...persona.locale.fonts.map((font, index) => ({ path: `locale.fonts.${index}`, value: font })),
      { path: 'hardware', value: persona.hardware },
      { path: 'hardware.cpu', value: persona.hardware.cpu },
      { path: 'hardware.gpu', value: persona.hardware.gpu },
      { path: 'hardware.ram', value: persona.hardware.ram },
      { path: 'hardware.os', value: persona.hardware.os },
      { path: 'browser', value: persona.browser },
    ];
  }

  private isMissingSource(value: unknown): boolean {
    const source = this.readSource(value);
    return source === undefined || source.trim() === '';
  }

  private isMissingConfidence(value: unknown): boolean {
    return this.readConfidence(value) === undefined;
  }

  private readSource(value: unknown): string | undefined {
    if (typeof value !== 'object' || value === null || !('source' in value)) {
      return undefined;
    }

    const source = value.source;
    return typeof source === 'string' ? source : undefined;
  }

  private readConfidence(value: unknown): 'low' | 'medium' | 'high' | undefined {
    if (typeof value !== 'object' || value === null || !('confidence' in value)) {
      return undefined;
    }

    const confidence = value.confidence;
    if (typeof confidence === 'number') {
      if (confidence < 0.6) return 'low';
      if (confidence < 0.85) return 'medium';
      return 'high';
    }

    if (confidence === 'low' || confidence === 'medium' || confidence === 'high') {
      return confidence;
    }

    return undefined;
  }

  private levelForScore(score: number): RiskLevel {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    return 'high';
  }
}
