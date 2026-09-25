/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/navigation/responsive-layout.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { responsiveLayout } = loaded.exports;

test('content and card grids fit safe bounds from small phones to landscape and foldables', () => {
  for (const [width, height] of [[280, 568], [320, 568], [360, 640], [390, 844], [430, 932], [844, 390], [600, 720], [1024, 768]]) {
    for (const fontScale of [1, 1.3, 2, 3]) {
      const insets = { left: 24, right: 44, top: 24, bottom: 34 };
      const layout = responsiveLayout(width, height, fontScale, insets);
      assert.ok(layout.contentWidth > 0 && layout.contentWidth <= 720);
      assert.ok(layout.contentWidth + 2 * layout.gutter <= width - insets.left - insets.right);
      for (const columns of [layout.metricColumns, layout.toolColumns]) {
        const cardWidth = (layout.contentWidth - (columns - 1) * 9) / columns;
        assert.ok(cardWidth > 0);
        assert.ok(Math.abs(columns * cardWidth + (columns - 1) * 9 - layout.contentWidth) < 0.01);
      }
      assert.ok(layout.headerMaxHeight < layout.safeHeight / 2);
    }
  }
});

test('large text reduces columns instead of shrinking the text', () => {
  const regular = responsiveLayout(430, 932, 1);
  const large = responsiveLayout(430, 932, 2);
  assert.equal(regular.metricColumns, 3);
  assert.equal(large.metricColumns, 1);
  assert.equal(large.toolColumns, 1);
  assert.equal(large.contentWidth, regular.contentWidth);
  assert.equal(responsiveLayout(844, 390, 1).short, true);
  assert.equal(responsiveLayout(1024, 768, 1).toolColumns, 2);
});
