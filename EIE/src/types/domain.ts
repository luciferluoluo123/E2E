export type SourceKind = 'txt';

export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ValidationStatus = 'pending' | 'passed' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DatabaseCollection =
  | 'country'
  | 'countryLanguages'
  | 'uiLanguages'
  | 'timezones'
  | 'windowsFonts'
  | 'browserFonts'
  | 'windowsOs';

export interface SourceReference {
  sourceId: string;
  kind: SourceKind;
  path: string;
  checksum?: string;
  importedAt?: string;
}

export interface RawTextSource {
  sourceId: string;
  kind: 'txt';
  path: string;
  encoding?: string;
  checksum?: string;
}

export interface TraceableRecord {
  source: string;
  confidence: number;
  ruleVersion: string;
  databaseVersion: string;
}

export interface DatabaseFile<TRecord extends TraceableRecord> {
  databaseVersion: string;
  ruleVersion: string;
  collection: DatabaseCollection;
  generatedBy: 'Importer';
  generatedAt: string;
  records: TRecord[];
}

export interface CountryRecord extends TraceableRecord {
  countryCode: string;
  countryName: string;
}

export interface LanguageRecord extends TraceableRecord {
  code: string;
  prefix: string;
  englishName: string;
  localName: string;
  weight: number;
}

export interface CountryLanguagesRecord extends TraceableRecord {
  countryCode: string;
  languages: LanguageRecord[];
}

export interface UiLanguageRecord extends TraceableRecord {
  code: string;
  prefix: string;
  englishName: string;
  localName: string;
}

export interface TimezoneRecord extends TraceableRecord {
  timezone: string;
  gmtOffset: string;
}

export type FontPlatform = 'windows' | 'browser';

export interface FontRecord extends TraceableRecord {
  fontName: string;
  platform: FontPlatform;
}

export interface WindowsOsRecord extends TraceableRecord {
  osName: string;
  version: string;
  build: string;
  architecture: string;
}

export interface StandardJsonRecord extends TraceableRecord {
  recordId: string;
  sourceRef: SourceReference;
  schemaVersion: string;
  payload: Record<string, unknown>;
  importedAt: string;
}

export interface ImportIssue {
  level: 'warning' | 'error';
  sourceFile: string;
  line?: number;
  message: string;
  raw?: string;
}

export interface SourceFileReport {
  path: string;
  records: number;
  validRecords: number;
  invalidRecords: number;
}

export interface ImportReportData {
  importedAt: string;
  ruleVersion: string;
  databaseVersion: string;
  sourceFiles: SourceFileReport[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: ImportIssue[];
  errors: ImportIssue[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
  source?: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  score: number;
  checkedAt: string;
  ruleVersion: string;
  databaseVersion: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
  ruleVersion: string;
  databaseVersion: string;
}

export interface RuntimePersonaReason {
  field: string;
  reason: string;
  source: string;
  confidence: number;
  weight?: number;
}

/**
 * @deprecated Legacy draft kept only for historical type compatibility.
 * RuntimePersona must be imported from src/types/RuntimePersona.ts.
 */
export interface LegacyRuntimePersonaDraft {
  personaId: string;
  seed: string;
  ruleVersion: string;
  databaseVersion: string;
  generatedAt: string;
  country: CountryRecord;
  locale: CountryLanguagesRecord;
  timezone: TimezoneRecord;
  fontSet: FontRecord[];
  os?: WindowsOsRecord;
  reasons: RuntimePersonaReason[];
}

export interface GeneratorInput {
  inputId: string;
  seed: string;
  ruleVersion: string;
  databaseVersion: string;
  country: DatabaseFile<CountryRecord>;
  countryLanguages: DatabaseFile<CountryLanguagesRecord>;
  timezones: DatabaseFile<TimezoneRecord>;
  fonts: DatabaseFile<FontRecord>;
}

export interface GeneratorOutput {
  outputId: string;
  persona: LegacyRuntimePersonaDraft;
  validation: ValidationResult;
  riskAssessment?: RiskAssessment;
}
