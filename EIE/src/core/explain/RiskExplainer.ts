import type { RuntimePersona } from '../../types/RuntimePersona.ts';
import type { RiskAssessment, RiskLevel } from '../risk/RiskEngine.ts';

export interface RiskExplainerInput {
  persona: RuntimePersona;
  risk: RiskAssessment;
}

export interface RiskExplanation {
  summary: string;
  level: RiskLevel;
  score: number;
  reasons: string[];
  warnings: string[];
  evidence: string[];
  metadata: {
    ruleVersion: string;
    databaseVersion: string;
    checkedAt: string;
  };
}

export class RiskExplainer {
  explain(input: RiskExplainerInput): RiskExplanation {
    const { persona, risk } = input;

    return {
      summary: `Risk level=${risk.level}; score=${risk.score}; validationPassed=${persona.validation.passed}`,
      level: risk.level,
      score: risk.score,
      reasons: [...risk.reasons],
      warnings: [...risk.warnings],
      evidence: [
        `personaValidation:passed=${persona.validation.passed}; score=${persona.validation.score}; warnings=${persona.validation.warnings.length}; errors=${persona.validation.errors.length}`,
        `personaSourceSummary:localeSource=${persona.sourceSummary.localeSource}; hardwareSource=${persona.sourceSummary.hardwareSource}; browserSource=${persona.sourceSummary.browserSource}`,
        `personaVersions:schemaVersion=${persona.schemaVersion}; databaseVersion=${persona.databaseVersion}; ruleVersion=${persona.ruleVersion}`,
        `riskVersions:databaseVersion=${risk.databaseVersion}; ruleVersion=${risk.ruleVersion}; checkedAt=${risk.checkedAt}`,
      ],
      metadata: {
        ruleVersion: risk.ruleVersion,
        databaseVersion: risk.databaseVersion,
        checkedAt: risk.checkedAt,
      },
    };
  }
}
