import type { CrossValidationResult } from '../core/validator/cross-domain/CrossDomainValidator.ts';
import type { RuntimePersona } from './RuntimePersona.ts';

export interface PersonaAssemblyResult {
  persona: RuntimePersona;
  crossValidationResult: CrossValidationResult;
}
