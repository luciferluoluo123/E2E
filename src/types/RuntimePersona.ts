import type { GeneratedHardware } from '../core/generator/HardwareGenerator.ts';
import type { GeneratedLocale } from '../core/generator/LocaleGenerator.ts';
import type { BrowserLike, CrossValidationResult } from '../core/validator/cross-domain/CrossDomainValidator.ts';

export type LocaleResult = GeneratedLocale;
export type HardwareResult = GeneratedHardware;
export type BrowserResult = BrowserLike & {
  id: string;
  source: string;
  confidence: number | 'low' | 'medium' | 'high';
  ruleVersion: string;
  databaseVersion: string;
};

export interface PersonaSourceSummary {
  localeSource: string;
  hardwareSource: string;
  browserSource: string;
}

export interface RuntimePersona {
  id: string;
  seed: string;
  generatedAt: string;
  schemaVersion: string;
  databaseVersion: string;
  ruleVersion: string;
  locale: LocaleResult;
  hardware: HardwareResult;
  browser: BrowserResult;
  validation: CrossValidationResult;
  sourceSummary: PersonaSourceSummary;
}
