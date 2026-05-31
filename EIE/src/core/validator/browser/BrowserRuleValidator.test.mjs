import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BrowserRuleValidator } from './BrowserRuleValidator.ts';

const root = process.cwd();

const [chromeDb, edgeDb, firefoxDb, compatibilityDb] = await Promise.all([
  readJson('database/browser/chrome.json'),
  readJson('database/browser/edge.json'),
  readJson('database/browser/firefox.json'),
  readJson('database/browser/browser-compatibility.json'),
]);

const ruleSet = {
  browsers: [
    ...chromeDb.records,
    ...edgeDb.records,
    ...firefoxDb.records,
  ],
  compatibility: compatibilityDb.records,
};

const validator = new BrowserRuleValidator();
const ruleSetResult = validator.validateRuleSet(ruleSet);
assert.equal(ruleSetResult.passed, true, 'MVP browser rule set should pass validation');

assert.equal(
  validator.validateCombination(ruleSet, {
    browser: 'Chrome',
    os: 'Windows11',
    architecture: 'x64',
  }).passed,
  true,
  'Chrome + Windows11 should pass',
);

assert.equal(
  validator.validateCombination(ruleSet, {
    browser: 'Firefox',
    os: 'Windows10',
    architecture: 'x64',
  }).passed,
  true,
  'Firefox + Windows10 should pass',
);

assert.equal(
  validator.validateCombination(ruleSet, {
    browser: 'Chrome',
    os: 'UnsupportedOS',
    architecture: 'x64',
  }).passed,
  false,
  'unsupported OS should fail',
);

assert.equal(
  validator.validateCombination(ruleSet, {
    browser: 'Firefox',
    os: 'Windows11',
    architecture: 'arm64',
  }).passed,
  false,
  'unsupported Architecture should fail',
);

assert.equal(
  validator.validateRuleSet({
    ...ruleSet,
    browsers: [{ ...ruleSet.browsers[0], weight: 0 }],
  }).passed,
  false,
  'weight=0 should fail',
);

assert.equal(
  validator.validateRuleSet({
    ...ruleSet,
    browsers: [{ ...ruleSet.browsers[0], source: '' }],
  }).passed,
  false,
  'missing source should fail',
);

assert.equal(
  validator.validateRuleSet({
    ...ruleSet,
    browsers: [{ ...ruleSet.browsers[0], confidence: '' }],
  }).passed,
  false,
  'missing confidence should fail',
);

console.log('BrowserRuleValidator tests passed');

async function readJson(filePath) {
  return JSON.parse(await readFile(join(root, filePath), 'utf8'));
}
