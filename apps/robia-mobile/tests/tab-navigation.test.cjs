/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

// Exercise the tab bar's real press handlers and selected state without a
// native runtime. Device swipes and TalkBack still require an Android device.
function renderBar(index, { prevent = false, fontScale = 1 } = {}) {
  const events = [];
  const visits = [];
  const navigator = Object.assign(() => null, { Screen: () => null });
  const mocks = {
    react: { ...React, useEffect() {}, useRef: value => ({ current: value }) },
    'react-native': {
      ScrollView: 'ScrollView', View: 'View', Text: 'Text',
      StyleSheet: { create: styles => styles },
      useWindowDimensions: () => ({ width: 390, height: 844, fontScale }),
    },
    '@/components/ui/icon-symbol': { IconSymbol: 'IconSymbol' },
    '@/constants/theme': { Brand: { tealDark: '#0F766E', slate500: '#526174' }, Fonts: { sans: 'normal' } },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    '@react-navigation/elements': { PlatformPressable: 'PlatformPressable' },
    '@react-navigation/material-top-tabs': { createMaterialTopTabNavigator: () => ({ Navigator: navigator }) },
    '@react-navigation/native': { useLinkBuilder: () => ({ buildHref: name => '/' + name }) },
    'expo-haptics': { selectionAsync: () => Promise.reject(new Error('Unavailable')) },
    'expo-router': { withLayoutContext: () => navigator },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
  };
  const filename = path.resolve(__dirname, '../app/(tabs)/_layout.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    name => mocks[name] ?? require(name), module, module.exports,
  );
  const names = ['dashboard', 'opportunities', 'execution-pack', 'progress', 'profile'];
  const routes = names.map(name => ({ name, key: name + '-key' }));
  const tree = module.exports.RobiaTabBar({
    state: { index, routes },
    descriptors: Object.fromEntries(routes.map(route => [route.key, { options: { title: route.name } }])),
    navigation: {
      emit: event => { events.push(event); return { defaultPrevented: prevent }; },
      navigate: (...args) => visits.push(args),
    },
  });
  return { buttons: tree.props.children.props.children, scroll: tree.props.children, events, visits, layout: module.exports.default };
}

test('exactly the displayed page has a selected icon after each navigation update', () => {
  for (const index of [0, 4, 1, 3, 2, 0]) {
    const { buttons } = renderBar(index);
    assert.deepEqual(buttons.map(button => button.props.accessibilityState.selected),
      buttons.map((_, position) => position === index));
    for (const button of buttons) {
      assert.equal(button.props.children[0].props.children.type, 'IconSymbol');
      assert.equal(button.props.accessibilityRole, 'tab');
    }
  }
});

test('pressing another tab navigates to its route and handles unavailable haptics', async () => {
  const { buttons, visits, events } = renderBar(0);
  buttons[4].props.onPress();
  await Promise.resolve();
  assert.deepEqual(visits, [['profile', undefined]]);
  assert.deepEqual(events, [{ type: 'tabPress', target: 'profile-key', canPreventDefault: true }]);
});

test('pressing the active tab or a prevented tab does not navigate again', () => {
  const active = renderBar(2);
  active.buttons[2].props.onPress();
  assert.equal(active.visits.length, 0);
  const prevented = renderBar(0, { prevent: true });
  prevented.buttons[4].props.onPress();
  assert.equal(prevented.visits.length, 0);
});

test('large text keeps tabs reachable by scrolling and preserves long-press events', () => {
  const normal = renderBar(0);
  const large = renderBar(4, { fontScale: 2 });
  assert.equal(normal.scroll.props.scrollEnabled, false);
  assert.equal(large.scroll.props.scrollEnabled, true);
  large.buttons[4].props.onLongPress();
  assert.deepEqual(large.events, [{ type: 'tabLongPress', target: 'profile-key' }]);
});

test('a swipe visits each filter before crossing to the adjacent tab', () => {
  const filename = path.resolve(__dirname, '../src/navigation/filter-swipe.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
  const { getFilterSwipeTarget } = module.exports;
  const cases = [
    { filters: ['Toutes', 'Prioritaires', 'Faible effort'], previous: '/dashboard', next: '/execution-pack' },
    { filters: ['Tous', 'À valider', 'Validés'], previous: '/opportunities', next: '/progress' },
    { filters: ['Toutes', 'À faire', 'En cours', 'Terminées'], previous: '/execution-pack', next: '/profile' },
  ];

  for (const { filters, previous, next } of cases) {
    for (let index = 0; index < filters.length - 1; index++) {
      assert.deepEqual(getFilterSwipeTarget(filters, filters[index], 'next', previous, next),
        { kind: 'filter', value: filters[index + 1] });
      assert.deepEqual(getFilterSwipeTarget(filters, filters[index + 1], 'previous', previous, next),
        { kind: 'filter', value: filters[index] });
    }
    assert.deepEqual(getFilterSwipeTarget(filters, filters[0], 'previous', previous, next),
      { kind: 'tab', route: previous });
    assert.deepEqual(getFilterSwipeTarget(filters, filters.at(-1), 'next', previous, next),
      { kind: 'tab', route: next });
  }
  assert.equal(getFilterSwipeTarget(['Toutes'], 'Inconnu', 'next', '/a', '/b'), null);
});

test('the pager delegates swipes to filtered pages and keeps other pages swipeable', () => {
  const screens = renderBar(0).layout().props.children;
  const swipeByPage = Object.fromEntries(screens.map(screen => [
    screen.props.name, screen.props.options.swipeEnabled,
  ]));
  assert.deepEqual(swipeByPage, {
    dashboard: true,
    opportunities: false,
    'execution-pack': false,
    progress: false,
    profile: true,
  });
});
