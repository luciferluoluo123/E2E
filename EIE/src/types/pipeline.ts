import type {
  DatabaseFile,
  GeneratorInput,
  GeneratorOutput,
  ImportReportData,
  RawTextSource,
  StandardJsonRecord,
  TraceableRecord,
  ValidationResult,
} from './domain';

export interface ImporterContract<TRecord extends TraceableRecord = StandardJsonRecord> {
  role: 'importer';
  importTxt(source: RawTextSource): Promise<DatabaseFile<TRecord>>;
  report(): ImportReportData;
}

export interface ValidatorContract<TInput> {
  role: 'validator';
  validate(input: TInput): Promise<ValidationResult>;
}

export interface GeneratorContract {
  role: 'generator';
  generate(input: GeneratorInput): Promise<GeneratorOutput>;
}

export interface PipelineDraft {
  source: RawTextSource;
  imported?: DatabaseFile<StandardJsonRecord>;
  importReport?: ImportReportData;
  importValidation?: ValidationResult;
  generatorInput?: GeneratorInput;
  generated?: GeneratorOutput;
  outputValidation?: ValidationResult;
}
