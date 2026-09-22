/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

function loadTypeScript(relativePath, mocks = {}) {
  const filename = path.resolve(__dirname, relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    name => mocks[name] ?? require(name), module, module.exports,
  );
  return module.exports;
}

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

test('native swipe completion changes filters first and ignores cancelled or short gestures', () => {
  const visits = [];
  const changes = [];
  const filterLogic = loadTypeScript('../src/navigation/filter-swipe.ts');
  function createPan() {
    const gesture = { config: {} };
    for (const method of ['enabled', 'maxPointers', 'activeOffsetX', 'failOffsetY', 'runOnJS']) {
      gesture[method] = value => { gesture.config[method] = value; return gesture; };
    }
    gesture.onEnd = callback => { gesture.finish = callback; return gesture; };
    return gesture;
  }
  const { useFilterSwipe } = loadTypeScript('../hooks/use-filter-swipe.ts', {
    react: { useMemo: callback => callback(), useRef: value => ({ current: value }) },
    '@react-navigation/native': { useIsFocused: () => true },
    'react-native-gesture-handler': { Gesture: { Pan: createPan } },
    'expo-router': { router: { navigate: route => visits.push(route) } },
    '@/src/navigation/filter-swipe': filterLogic,
  });
  const swipe = selected => useFilterSwipe({
    filters: ['Toutes', 'Prioritaires', 'Faible effort'],
    selected,
    onChange: value => changes.push(value),
    previousTab: '/(tabs)/dashboard',
    nextTab: '/(tabs)/execution-pack',
  });
  const first = swipe('Toutes');
  assert.ok(first.config.activeOffsetX[0] < 0 && first.config.activeOffsetX[1] > 0);
  assert.ok(first.config.failOffsetY[0] < 0 && first.config.failOffsetY[1] > 0);
  first.finish({ translationX: -120, velocityX: -500 }, false);
  first.finish({ translationX: -12, velocityX: -20 }, true);
  assert.deepEqual(changes, []);
  assert.deepEqual(visits, []);

  first.finish({ translationX: -90, velocityX: -250 }, true);
  assert.deepEqual(changes, ['Prioritaires']);
  assert.deepEqual(visits, []);
  swipe('Prioritaires').finish({ translationX: -30, velocityX: -800 }, true);
  assert.deepEqual(changes, ['Prioritaires', 'Faible effort']);
  assert.deepEqual(visits, []);
  swipe('Faible effort').finish({ translationX: 90, velocityX: 250 }, true);
  assert.equal(changes.at(-1), 'Prioritaires');
  assert.deepEqual(visits, []);
  swipe('Faible effort').finish({ translationX: -90, velocityX: -250 }, true);
  swipe('Toutes').finish({ translationX: 90, velocityX: 250 }, true);
  assert.deepEqual(visits, ['/(tabs)/execution-pack', '/(tabs)/dashboard']);
});

test('the native filter gesture covers the header and content before vertical scrolling can activate', () => {
  const { RobiaScreen, FilterChips } = loadTypeScript('../components/robia-ui.tsx', {
    react: {
      ...React, useMemo: callback => callback(), useCallback: callback => callback,
      useEffect() {}, useRef: value => ({ current: value }),
    },
    'react-native': {
      ScrollView: 'ScrollView', View: 'View', Text: 'Text', Pressable: 'Pressable',
      StyleSheet: { create: styles => styles, hairlineWidth: 1 },
    },
    '@expo/vector-icons/MaterialIcons': 'MaterialIcons',
    'expo-image': { Image: 'Image' },
    'expo-router': { router: {} },
    '@/constants/theme': { Brand: {}, Fonts: {} },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-gesture-handler': {
      GestureDetector: 'GestureDetector',
      Gesture: { Native: () => ({
        requireExternalGestureToFail(gesture) { this.waitFor = gesture; return this; },
      }) },
    },
  });
  const swipeGesture = {};
  const header = React.createElement('Header', { key: 'header' });
  const content = React.createElement('Content', { key: 'content' });
  const screen = RobiaScreen({ fixedHeader: true, swipeGesture, children: [header, content] });
  assert.equal(screen.type, 'GestureDetector');
  assert.equal(screen.props.gesture, swipeGesture);
  const [fixedHeader, scrollDetector] = screen.props.children.props.children;
  assert.equal(fixedHeader.props.children.props.children.type, 'Header');
  assert.equal(scrollDetector.props.gesture.waitFor, swipeGesture);
  assert.equal(scrollDetector.props.children.type, 'ScrollView');

  const chips = FilterChips({
    options: ['Toutes', 'Prioritaires'], selected: 'Prioritaires',
    onChange() {}, swipeToSelect: true,
  });
  assert.equal(chips.props.scrollEnabled, false);
  const scrolls = [];
  chips.props.ref.current = { scrollTo: value => scrolls.push(value) };
  chips.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  chips.props.children[1].props.onLayout({ nativeEvent: { layout: { x: 150, width: 100 } } });
  assert.deepEqual(scrolls, [{ x: 100, animated: false }]);
});
