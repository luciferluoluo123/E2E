export type CrossSeverity = 'warning' | 'error';
export type Tier = 'low' | 'mid' | 'high' | 'extreme';

export interface LocaleLike {
  language: {
    code: string;
    prefix?: string;
  };
  acceptLanguage: string;
  fonts: Array<{
    fontName: string;
  }>;
}

export interface HardwareLike {
  cpu: {
    tier: Tier;
  };
  gpu: {
    tier: string;
  };
  ram: {
    tier: Tier;
  };
  os: {
    osName: string;
    architecture: string;
  };
}

export interface BrowserLike {
  name: string;
  majorVersion: number;
}

export interface CrossDomainValidationInput {
  locale: LocaleLike;
  hardware: HardwareLike;
  browser: BrowserLike;
  ruleVersion: string;
  databaseVersion: string;
}

export interface LocaleFontRule {
  languageCodes?: string[];
  languagePrefixes?: string[];
  requiredFontPatterns: string[];
  severity: CrossSeverity;
}

export interface BrowserCompatibilityRule {
  browser: string;
  supportedOs: string[];
  supportedArchitecture: string[];
}

export interface OsHardwareRule {
  os: string;
  minCpuTier?: Tier;
  minRamTier?: Tier;
  severity: CrossSeverity;
}

export interface BrowserHardwareRule {
  browser: string;
  minMajorVersion: number;
  minCpuTier?: Tier;
  minRamTier?: Tier;
  severity: CrossSeverity;
}

export interface CrossDomainRuleSet {
  localeFontRules: LocaleFontRule[];
  browserCompatibility: BrowserCompatibilityRule[];
  osHardwareRules: OsHardwareRule[];
  browserHardwareRules: BrowserHardwareRule[];
}

export interface CrossValidationResult {
  passed: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  checkedAt: string;
  ruleVersion: string;
  databaseVersion: string;
}

export class CrossDomainValidator {
  private readonly rules: CrossDomainRuleSet;
  private readonly checkedAtProvider: () => string;

  constructor(rules: CrossDomainRuleSet, checkedAtProvider = () => new Date().toISOString()) {
    this.rules = rules;
    this.checkedAtProvider = checkedAtProvider;
  }

  validate(input: CrossDomainValidationInput): CrossValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    this.validateLocaleFonts(input, warnings, errors);
    this.validateAcceptLanguage(input, errors);
    this.validateBrowserOs(input, errors);
    this.validateBrowserArchitecture(input, errors);
    this.validateHardwareOs(input, warnings, errors);
    this.validateHardwareBrowser(input, warnings, errors);

    return {
      passed: errors.length === 0,
      score: this.score(warnings, errors),
      warnings,
      errors,
      checkedAt: this.checkedAtProvider(),
      ruleVersion: input.ruleVersion,
      databaseVersion: input.databaseVersion,
    };
  }

  private validateLocaleFonts(input: CrossDomainValidationInput, warnings: string[], errors: string[]): void {
    const languageCode = this.normalize(input.locale.language.code);
    const prefix = this.normalize(input.locale.language.prefix ?? input.locale.language.code.split('-')[0]);
    const matchedRules = this.rules.localeFontRules.filter((rule) => {
      const codes = rule.languageCodes?.map((code) => this.normalize(code)) ?? [];
      const prefixes = rule.languagePrefixes?.map((value) => this.normalize(value)) ?? [];
      return codes.includes(languageCode) || prefixes.includes(prefix);
    });

    for (const rule of matchedRules) {
      const hasMatchingFont = input.locale.fonts.some((font) => (
        rule.requiredFontPatterns.some((pattern) => this.normalize(font.fontName).includes(this.normalize(pattern)))
      ));

      if (!hasMatchingFont) {
        this.addIssue(
          rule.severity,
          `locale_fonts_mismatch:${input.locale.language.code}`,
          warnings,
          errors,
        );
      }
    }
  }

  private validateAcceptLanguage(input: CrossDomainValidationInput, errors: string[]): void {
    const languageCode = this.normalize(input.locale.language.code);
    const primaryAcceptLanguage = this.normalize(input.locale.acceptLanguage.split(',')[0].trim());

    if (primaryAcceptLanguage !== languageCode) {
      errors.push(`accept_language_mismatch:${input.locale.language.code}:${input.locale.acceptLanguage}`);
    }
  }

  private validateBrowserOs(input: CrossDomainValidationInput, errors: string[]): void {
    const rule = this.findBrowserCompatibility(input.browser.name);
    if (!rule) {
      errors.push(`browser_compatibility_missing:${input.browser.name}`);
      return;
    }

    if (!rule.supportedOs.includes(input.hardware.os.osName)) {
      errors.push(`browser_os_incompatible:${input.browser.name}:${input.hardware.os.osName}`);
    }
  }

  private validateBrowserArchitecture(input: CrossDomainValidationInput, errors: string[]): void {
    const rule = this.findBrowserCompatibility(input.browser.name);
    if (!rule) return;

    if (!rule.supportedArchitecture.includes(input.hardware.os.architecture)) {
      errors.push(`browser_architecture_incompatible:${input.browser.name}:${input.hardware.os.architecture}`);
    }
  }

  private validateHardwareOs(input: CrossDomainValidationInput, warnings: string[], errors: string[]): void {
    const rule = this.rules.osHardwareRules.find((candidate) => candidate.os === input.hardware.os.osName);
    if (!rule) return;

    if (rule.minCpuTier && this.compareTier(input.hardware.cpu.tier, rule.minCpuTier) < 0) {
      this.addIssue(rule.severity, `hardware_os_cpu_tier_too_low:${input.hardware.cpu.tier}:${rule.minCpuTier}`, warnings, errors);
    }

    if (rule.minRamTier && this.compareTier(input.hardware.ram.tier, rule.minRamTier) < 0) {
      this.addIssue(rule.severity, `hardware_os_ram_tier_too_low:${input.hardware.ram.tier}:${rule.minRamTier}`, warnings, errors);
    }
  }

  private validateHardwareBrowser(input: CrossDomainValidationInput, warnings: string[], errors: string[]): void {
    const rules = this.rules.browserHardwareRules.filter((rule) => (
      this.normalize(rule.browser) === this.normalize(input.browser.name)
      && input.browser.majorVersion >= rule.minMajorVersion
    ));

    for (const rule of rules) {
      if (rule.minCpuTier && this.compareTier(input.hardware.cpu.tier, rule.minCpuTier) < 0) {
        this.addIssue(
          rule.severity,
          `hardware_browser_cpu_tier_low:${input.browser.name}:${input.browser.majorVersion}:${input.hardware.cpu.tier}:${rule.minCpuTier}`,
          warnings,
          errors,
        );
      }

      if (rule.minRamTier && this.compareTier(input.hardware.ram.tier, rule.minRamTier) < 0) {
        this.addIssue(
          rule.severity,
          `hardware_browser_ram_tier_low:${input.browser.name}:${input.browser.majorVersion}:${input.hardware.ram.tier}:${rule.minRamTier}`,
          warnings,
          errors,
        );
      }
    }
  }

  private findBrowserCompatibility(browser: string): BrowserCompatibilityRule | undefined {
    return this.rules.browserCompatibility.find((rule) => this.normalize(rule.browser) === this.normalize(browser));
  }

  private compareTier(actual: Tier, required: Tier): number {
    return this.tierRank(actual) - this.tierRank(required);
  }

  private tierRank(tier: Tier): number {
    return ['low', 'mid', 'high', 'extreme'].indexOf(tier);
  }

  private addIssue(severity: CrossSeverity, issue: string, warnings: string[], errors: string[]): void {
    if (severity === 'warning') {
      warnings.push(issue);
      return;
    }

    errors.push(issue);
  }

  private score(warnings: string[], errors: string[]): number {
    return Math.max(0, 100 - errors.length * 25 - warnings.length * 10);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
