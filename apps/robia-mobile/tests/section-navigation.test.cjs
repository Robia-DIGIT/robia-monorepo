/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
const sections = load('../src/navigation/sections.ts');
test('subsection URLs restore a valid selection and recover from unknown values', () => {
  assert.equal(sections.resolveSection(sections.WORK_SECTIONS, 'programs'), 'programs');
  assert.equal(sections.resolveSection(sections.WORK_SECTIONS, ['documents']), 'documents');
  assert.equal(sections.resolveSection(sections.WORK_SECTIONS, 'removed'), 'actions');
  assert.equal(sections.resolveSection(sections.VISIBILITY_SECTIONS), 'audits');
});
test('subsection presses and swipes update the route and share the same page motion', () => {
  const visits = []; let requested = 'documents'; let gestureConfig;
  const motion = {};
  const { SectionPager } = load('../components/section-pager.tsx', {
    'expo-router': { useLocalSearchParams: () => ({ section: requested }), router: { setParams: p => visits.push(p) } },
    '@/components/robia-ui': { RobiaScreen: 'Screen', RobiaFixedHeader: 'Header', FilterChips: 'Chips', FilterTransition: 'Pager' },
    '@/components/workspace-header': { WorkspaceHeader: 'WorkspaceHeader' },
    '@/hooks/use-filter-motion': { useFilterMotion: () => ({ motion, reduceMotion: false }) },
    '@/hooks/use-filter-swipe': { useFilterSwipe: config => { gestureConfig = config; return 'gesture'; } },
    '@/src/navigation/sections': sections,
    '@/src/navigation/section-gesture-context': { SectionGestureContext: { Provider: 'GestureContext' } },
  });
  const render = () => SectionPager({ title: 'Activité', sections: sections.WORK_SECTIONS, children: id => id });
  let screen = render();
  const chips = screen.props.children[0].props.children[1];
  const pager = screen.props.children[1];
  assert.equal(pager.props.filterKey, 'documents');
  assert.equal(chips.props.motion, pager.props.motion);
  assert.equal(chips.props.scrollGesture, 'gesture');
  assert.equal(screen.props.swipeGesture, 'gesture');
  chips.props.onChange('programs');
  gestureConfig.onChange('automations');
  assert.deepEqual(visits, [{ section: 'programs' }, { section: 'automations' }]);
  requested = 'programs'; screen = render();
  assert.equal(screen.props.children[1].props.filterKey, 'programs');
});
test('shared headers retain support and assistant without a profile shortcut', () => {
  const visits = [];
  const { WorkspaceHeader } = load('../components/workspace-header.tsx', {
    '@/components/ui/app-icon': { AppIcon: 'Icon' },
    'expo-router': { router: { push: href => visits.push(href), canGoBack: () => true, back: () => visits.push('back') } },
    'react-native': { Pressable: 'Button', Text: 'Text', View: 'View', StyleSheet: { create: s => s } },
    '@/constants/theme': { Brand: {} },
  });
  const header = WorkspaceHeader({ title: 'Accueil' });
  const buttons = header.props.children.filter(child => child?.type === 'Button');
  assert.equal(buttons.length, 2);
  buttons.forEach(button => { assert.ok(button.props.accessibilityLabel); button.props.onPress(); });
  assert.deepEqual(visits, ['/support', '/chat']);
  const secondary = WorkspaceHeader({ title: 'Documents', back: true });
  const secondaryButtons = secondary.props.children.filter(child => child?.type === 'Button');
  assert.equal(secondaryButtons.length, 3);
  secondaryButtons.forEach(button => button.props.onPress());
  assert.deepEqual(visits, ['/support', '/chat', 'back', '/support', '/chat']);
});
