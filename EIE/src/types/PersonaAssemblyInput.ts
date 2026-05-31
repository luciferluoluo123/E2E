import type {
  BrowserResult,
  HardwareResult,
  LocaleResult,
} from './RuntimePersona.ts';

export interface PersonaAssemblyInput {
  locale: LocaleResult;
  hardware: HardwareResult;
  browser: BrowserResult;
}
