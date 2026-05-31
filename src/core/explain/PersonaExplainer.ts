import type { RuntimePersona } from '../../types/RuntimePersona.ts';

export interface PersonaExplanation {
  locale: string[];
  hardware: string[];
  browser: string[];
  validation: string[];
  metadata: {
    schemaVersion: string;
    databaseVersion: string;
    ruleVersion: string;
  };
}

export class PersonaExplainer {
  explain(persona: RuntimePersona): PersonaExplanation {
    return {
      locale: this.explainLocale(persona),
      hardware: this.explainHardware(persona),
      browser: this.explainBrowser(persona),
      validation: this.explainValidation(persona),
      metadata: {
        schemaVersion: persona.schemaVersion,
        databaseVersion: persona.databaseVersion,
        ruleVersion: persona.ruleVersion,
      },
    };
  }

  private explainLocale(persona: RuntimePersona): string[] {
    const locale = persona.locale;
    const languageReason = this.findReason(locale.reasons, 'language');
    const timezoneReason = this.findReason(locale.reasons, 'timezone');
    const fontReasons = locale.reasons.filter((reason) => reason.field === 'fonts');

    return [
      `countryCode=${locale.countryCode}; source=${locale.source}; confidence=${locale.confidence}; ruleVersion=${locale.ruleVersion}; databaseVersion=${locale.databaseVersion}`,
      `language=${locale.language.code}; prefix=${locale.language.prefix}; source=${locale.language.source}; confidence=${locale.language.confidence}; weight=${locale.language.weight}; reason=${languageReason}`,
      `acceptLanguage=${locale.acceptLanguage}; derivedFromLanguage=${locale.language.code}`,
      `timezone=${locale.timezone.timezone}; gmtOffset=${locale.timezone.gmtOffset}; source=${locale.timezone.source}; confidence=${locale.timezone.confidence}; reason=${timezoneReason}`,
      ...locale.fonts.map((font, index) => {
        const reason = fontReasons[index] ?? fontReasons[0];
        return `font=${font.fontName}; platform=${font.platform}; source=${font.source}; confidence=${font.confidence}; weight=${this.readWeight(reason)}; reason=${this.readReason(reason)}`;
      }),
    ];
  }

  private explainHardware(persona: RuntimePersona): string[] {
    const hardware = persona.hardware;
    return [
      this.explainHardwarePart('cpu', hardware.cpu, hardware.reasons),
      this.explainHardwarePart('gpu', hardware.gpu, hardware.reasons),
      this.explainHardwarePart('ram', hardware.ram, hardware.reasons),
      `os=${hardware.os.osName}; version=${hardware.os.version}; build=${hardware.os.build}; architecture=${hardware.os.architecture}; source=${hardware.os.source}; confidence=${hardware.os.confidence}; reason=${this.findReason(hardware.reasons, 'os')}`,
      `hardwareSource=${hardware.source}; confidence=${hardware.confidence}; ruleVersion=${hardware.ruleVersion}; databaseVersion=${hardware.databaseVersion}`,
    ];
  }

  private explainBrowser(persona: RuntimePersona): string[] {
    const browser = persona.browser;
    const weight = 'weight' in browser ? String(browser.weight) : 'not_provided';
    return [
      `browser=${browser.name}; majorVersion=${browser.majorVersion}; id=${browser.id}; source=${browser.source}; confidence=${browser.confidence}; weight=${weight}; ruleVersion=${browser.ruleVersion}; databaseVersion=${browser.databaseVersion}`,
    ];
  }

  private explainValidation(persona: RuntimePersona): string[] {
    const validation = persona.validation;
    return [
      `crossValidationPassed=${validation.passed}; score=${validation.score}; checkedAt=${validation.checkedAt}; ruleVersion=${validation.ruleVersion}; databaseVersion=${validation.databaseVersion}`,
      `warnings=${validation.warnings.length > 0 ? validation.warnings.join('|') : 'none'}`,
      `errors=${validation.errors.length > 0 ? validation.errors.join('|') : 'none'}`,
    ];
  }

  private explainHardwarePart(
    field: 'cpu' | 'gpu' | 'ram',
    record: { id: string; name: string; tier: string; weight: number; source: string; confidence: string },
    reasons: RuntimePersona['hardware']['reasons'],
  ): string {
    return `${field}=${record.name}; id=${record.id}; tier=${record.tier}; source=${record.source}; confidence=${record.confidence}; weight=${record.weight}; reason=${this.findReason(reasons, field)}`;
  }

  private findReason(
    reasons: Array<{ field: string; reason: string; source: string; confidence: unknown; weight?: number }>,
    field: string,
  ): string {
    const reason = reasons.find((entry) => entry.field === field);
    return this.readReason(reason);
  }

  private readReason(reason: { reason: string; source: string; confidence: unknown; weight?: number } | undefined): string {
    if (!reason) {
      return 'not_provided';
    }

    return `${reason.reason}; source=${reason.source}; confidence=${reason.confidence}; weight=${this.readWeight(reason)}`;
  }

  private readWeight(reason: { weight?: number } | undefined): string {
    if (!reason || typeof reason.weight !== 'number') {
      return 'not_provided';
    }

    return String(reason.weight);
  }
}
