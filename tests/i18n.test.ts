import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { isUiLanguage, translate } from '../src/i18n/core';
import { messages } from '../src/i18n/messages';

test('all interface translations preserve interpolation fields and cover rendered literal keys', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
  for (const [source, translations] of Object.entries(messages)) {
    for (const language of ['en', 'zh', 'ta'] as const) {
      assert.ok(translations[language].trim(), `${source}: missing ${language}`);
      assert.deepEqual(placeholders(translations[language]), placeholders(source), `${source}: ${language} placeholders`);
    }
  }
  const files = ['src/App.tsx', ...readdirSync('src/components').filter(name => name.endsWith('.tsx')).map(name => `src/components/${name}`)];
  for (const file of files) {
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && ts.isStringLiteral(node.arguments[0])) {
        assert.ok(Object.hasOwn(messages, node.arguments[0].text), `${file}: missing translation for ${node.arguments[0].text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});

test('language validation, Malay fallback and interpolation do not alter answers or values', () => {
  for (const language of ['ms', 'en', 'zh', 'ta']) assert.equal(isUiLanguage(language), true);
  for (const value of ['fr', '', 'zh-CN', null, {}, '__proto__']) assert.equal(isUiLanguage(value), false);
  assert.equal(translate('ms', 'Jawapan saya'), 'Jawapan saya');
  assert.equal(translate('zh', 'Jawapan saya'), '我的答案');
  assert.equal(translate('ta', 'Jawapan saya'), 'எனது பதில்');
  assert.equal(translate('en', 'Tuntut +{xp} XP Hari Ini!', { xp: 20 }), 'Claim +20 XP today!');
  const answer = 'Saya bermain badminton bersama keluarga.';
  assert.equal(translate('zh', answer), answer);
  assert.equal(translate('en', 'Unknown {value}', { value: '$& <b>தமிழ்</b>' }), 'Unknown $& <b>தமிழ்</b>');
});
