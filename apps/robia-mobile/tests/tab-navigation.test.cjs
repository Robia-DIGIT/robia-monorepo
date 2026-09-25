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
function renderBar(index, { prevent = false, fontScale = 1, width = 390, insets = { top: 0, bottom: 0, left: 0, right: 0 }, keyboard = false } = {}) {
  const events = [];
  const visits = [];
  const navigator = Object.assign(() => null, { Screen: () => null });
  const mocks = {
    '@/src/navigation/responsive-layout': loadTypeScript('../src/navigation/responsive-layout.ts'),
    '@/hooks/use-keyboard-visible': { useKeyboardVisible: () => keyboard },
    react: { ...React, useEffect() {}, useRef: value => ({ current: value }) },
    'react-native': {
      ScrollView: 'ScrollView', View: 'View', Text: 'Text',
      StyleSheet: { create: styles => styles },
      useWindowDimensions: () => ({ width, height: 844, fontScale }),
    },
    '@/components/ui/icon-symbol': { IconSymbol: 'IconSymbol' },
    '@/constants/theme': { Brand: { tealDark: '#0F766E', slate500: '#526174' }, Fonts: { sans: 'normal' } },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    '@react-navigation/elements': { PlatformPressable: 'PlatformPressable' },
    '@/components/swipe-tab-navigator': { SwipeTabNavigator: navigator },
    '@react-navigation/native': { useLinkBuilder: () => ({ buildHref: name => '/' + name }) },
    'expo-haptics': { selectionAsync: () => Promise.reject(new Error('Unavailable')) },
    'expo-router': { withLayoutContext: () => navigator },
    'react-native-safe-area-context': { useSafeAreaInsets: () => insets },
  };
  const filename = path.resolve(__dirname, '../app/(tabs)/_layout.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    name => mocks[name] ?? require(name), module, module.exports,
  );
  const names = ['dashboard', 'visibility', 'work'];
  const routes = names.map(name => ({ name, key: name + '-key' }));
  const tree = module.exports.RobiaTabBar({
    state: { index, routes },
    descriptors: Object.fromEntries(routes.map(route => [route.key, { options: { title: route.name } }])),
    navigation: {
      emit: event => { events.push(event); return { defaultPrevented: prevent }; },
      navigate: (...args) => visits.push(args),
    },
  });
  if (!tree) return { hidden: true };
  return { tree, buttons: tree.props.children.props.children, scroll: tree.props.children, events, visits, layout: module.exports.default };
}

test('exactly the displayed page has a selected icon after each navigation update', () => {
  for (const index of [0, 2, 1, 2, 0]) {
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
  buttons[2].props.onPress();
  await Promise.resolve();
  assert.deepEqual(visits, [['work', undefined]]);
  assert.deepEqual(events, [{ type: 'tabPress', target: 'work-key', canPreventDefault: true }]);
});

test('pressing the active tab or a prevented tab does not navigate again', () => {
  const active = renderBar(2);
  active.buttons[2].props.onPress();
  assert.equal(active.visits.length, 0);
  const prevented = renderBar(0, { prevent: true });
  prevented.buttons[2].props.onPress();
  assert.equal(prevented.visits.length, 0);
});

test('large text keeps tabs reachable by scrolling and preserves long-press events', () => {
  const normal = renderBar(0);
  const large = renderBar(2, { fontScale: 2 });
  assert.equal(normal.scroll.props.scrollEnabled, false);
  assert.equal(large.scroll.props.scrollEnabled, true);
  large.buttons[2].props.onLongPress();
  assert.deepEqual(large.events, [{ type: 'tabLongPress', target: 'work-key' }]);
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
    { filters: ['Toutes', 'Prioritaires', 'Faible effort'], previous: '/dashboard', next: '/work' },
    { filters: ['Tous', 'À valider', 'Validés'], previous: '/visibility', next: '/programs' },
    { filters: ['Toutes', 'À faire', 'En cours', 'Terminées'], previous: '/work', next: '/profile' },
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

test('all navbar routes use the common swipe navigator', () => {
  const layout = renderBar(0).layout();
  assert.equal(layout.props.backBehavior, 'history');
  assert.deepEqual(layout.props.children.map(screen => screen.props.name),
    ['dashboard', 'visibility', 'work']);
  assert.ok(layout.props.children.every(screen => screen.props.options.swipeEnabled !== false));
});

test('the native filter gesture covers the header and content before vertical scrolling can activate', () => {
  let chipLayouts = {};
  let responsive = { gutter: 12, containerWidth: 744, headerMaxHeight: 240, short: false, fontScale: 1 };
  const { RobiaScreen, FilterChips, FilterTransition } = loadTypeScript('../components/robia-ui.tsx', {
    '@/components/workspace-header': { ProfileShortcut: 'ProfileShortcut' },
    '@/hooks/use-responsive-layout': { useResponsiveLayout: () => responsive },
    react: {
      ...React, useMemo: callback => callback(), useCallback: callback => callback,
      useEffect() {}, useLayoutEffect() {}, useState: initial => [typeof initial === 'number' ? 320 : chipLayouts, () => {}], useRef: value => ({ current: value }),
    },
    'react-native': {
      KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'ios' },
      Animated: { View: 'AnimatedView', Text: 'AnimatedText' },
      ScrollView: 'ScrollView', View: 'View', Text: 'Text', Pressable: 'Pressable', RefreshControl: 'RefreshControl',
      StyleSheet: { create: styles => styles, hairlineWidth: 1 },
    },
    '@expo/vector-icons/MaterialIcons': 'MaterialIcons',
    'expo-image': { Image: 'Image' },
    'expo-router': { router: {} },
    '@/constants/theme': { Brand: {}, Fonts: {} },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    '@/hooks/use-filter-swipe': { useFilterSwipe: () => ({ defaultTabGesture: true }) },
    '@/src/navigation/tab-swipe-context': { useTabSwipe: () => ({}) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-gesture-handler': {
      GestureDetector: 'GestureDetector',
      Gesture: { Native: () => ({
        requireExternalGestureToFail(gesture) { this.waitFor = gesture; return this; },
        blocksExternalGesture(gesture) { this.blocks = gesture; return this; },
      }) },
    },
  });
  const swipeGesture = {};
  let refreshes = 0;
  const transition = FilterTransition({
    options: ['All', 'Priority', 'Low effort'], filterKey: 'All',
    motion: { offset: -160 }, swipeGesture, reduceMotion: false,
    onRefresh: async () => { refreshes++; },
    children: filter => React.createElement('Page', { filter }),
  });
  const track = transition.props.children;
  const pages = track.props.children;
  assert.deepEqual(pages.map(page => page.props.children.props.filter), ['All', 'Priority', 'Low effort']);
  assert.equal(track.props.style[0].flexDirection, 'row');
  assert.equal(track.props.style[1].width, 960);
  assert.equal(track.props.style[1].transform[0].translateX, -160);
  assert.ok(pages.every(page => page.props.width === 320));
  // Both pages are inside the translated track, with 160 pixels of each visible.
  assert.equal(pages[0].props.width + track.props.style[1].transform[0].translateX, 160);
  const renderedPages = pages.map(page => page.type(page.props));
  assert.equal(renderedPages[0].props.pointerEvents, 'auto');
  assert.equal(renderedPages[1].props.pointerEvents, 'none');
  assert.equal(renderedPages[1].props.accessibilityElementsHidden, true);
  for (const page of renderedPages) {
    assert.equal(page.props.style[0].height, '100%');
    assert.equal(page.props.style[0].position, undefined);
    const detector = page.props.children;
    assert.equal(detector.props.gesture.waitFor, swipeGesture);
    assert.equal(detector.props.children.type, 'ScrollView');
    assert.equal(detector.props.children.props.removeClippedSubviews, false);
  }
  renderedPages[0].props.children.props.children.props.refreshControl.props.onRefresh();
  assert.equal(refreshes, 1);
  const header = React.createElement('Header', { key: 'header' });
  const content = React.createElement('Content', { key: 'content' });
  const screen = RobiaScreen({ fixedHeader: true, swipeGesture, children: [header, content] });
  assert.equal(screen.type, 'GestureDetector');
  assert.equal(screen.props.gesture, swipeGesture);
  const keyboardContainer = screen.props.children.props.children;
  assert.equal(keyboardContainer.props.behavior, 'padding');
  const [fixedHeader, scrollDetector] = keyboardContainer.props.children;
  assert.equal(fixedHeader.props.gesture.waitFor, swipeGesture);
  assert.equal(fixedHeader.props.children.props.children.props.children.type, 'Header');
  assert.equal(scrollDetector.props.gesture.waitFor, swipeGesture);
  assert.equal(scrollDetector.props.children.type, 'ScrollView');

  const pagedScreen = RobiaScreen({
    fixedHeader: true, scroll: false, swipeGesture, children: [header, transition],
    contentStyle: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 },
  });
  assert.equal(pagedScreen.props.children.props.children.props.children[1].type, 'View');

  responsive = { ...responsive, short: true, fontScale: 2 };
  const shortScreen = RobiaScreen({ fixedHeader: true, swipeGesture, children: [header, content] });
  const [shortHeader, shortBody] = shortScreen.props.children.props.children.props.children;
  assert.equal(shortHeader, null);
  assert.deepEqual(shortBody.props.children.props.children.props.children.map(child => child.type), ['Header', 'Content']);
  const shortPaged = RobiaScreen({ fixedHeader: true, scroll: false, swipeGesture, children: [header, transition] });
  assert.equal(shortPaged.props.children.props.children.props.children[0].props.children.props.style[1].maxHeight, 240);

  const plainTabScreen = RobiaScreen({ children: content });
  assert.equal(plainTabScreen.type, 'GestureDetector');
  assert.equal(plainTabScreen.props.gesture.defaultTabGesture, true);

  const chips = FilterChips({
    options: ['Toutes', 'Prioritaires'], selected: 'Prioritaires',
    onChange() {}, swipeToSelect: true,
  });
  assert.equal(chips.props.scrollEnabled, false);
  const subsectionBar = FilterChips({ options: ['actions', 'documents'], labels: { actions: 'Actions', documents: 'Documents' }, selected: 'actions', onChange() {}, scrollGesture: swipeGesture });
  assert.equal(subsectionBar.type, 'GestureDetector');
  assert.equal(subsectionBar.props.gesture.blocks, swipeGesture);
  assert.equal(subsectionBar.props.children.props.scrollEnabled, true);
  assert.equal(subsectionBar.props.children.props.children.props.children[2][0].props.children.props.children, 'Actions');
  const scrolls = [];
  chips.props.ref.current = { scrollTo: value => scrolls.push(value) };
  chips.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  chips.props.children.props.children[2][1].props.onLayout({ nativeEvent: { layout: { x: 150, width: 100 } } });
  assert.deepEqual(scrolls, [{ x: 100, animated: false }]);

  chipLayouts = {
    All: { x: 0, y: 0, width: 80, height: 36 },
    Priority: { x: 88, y: 0, width: 120, height: 36 },
    Easy: { x: 216, y: 0, width: 90, height: 36 },
  };
  const animatedChips = FilterChips({
    options: ['All', 'Priority', 'Easy'], selected: 'Priority', onChange() {},
    motion: { position: { interpolate: config => config } },
  });
  const [surfaces, indicator, buttons] = animatedChips.props.children.props.children;
  assert.equal(surfaces.length, 3);
  assert.equal(indicator.props.pointerEvents, 'none');
  const transforms = indicator.props.style[1].transform;
  assert.deepEqual(transforms[0].translateX.outputRange, [0, 108, 221]);
  assert.deepEqual(transforms[1].scaleX.outputRange, [1, 1.5, 1.125]);
  assert.equal(transforms[0].translateX.extrapolate, 'clamp');
  // At halfway, both the indicator centre and its width are halfway too.
  const halfCentre = (0 + 108) / 2 + 40;
  assert.equal(halfCentre, 94);
  assert.equal(80 * (1 + 1.5) / 2, 100);
  assert.equal(buttons[1].props.style[2].backgroundColor, 'transparent');
  assert.deepEqual(buttons[1].props.children.props.style[2].color.inputRange, [0, 1, 2]);

  const singleChip = FilterChips({
    options: ['All'], selected: 'All', onChange() {},
    motion: { position: { interpolate: config => config } },
  });
  const singleTransform = singleChip.props.children.props.children[1].props.style[1].transform;
  assert.deepEqual(singleTransform[0].translateX.inputRange, [0, 1]);
  assert.deepEqual(singleTransform[1].scaleX.outputRange, [1, 1]);
});

// Drive the real motion controller with a controllable native animation clock.
function createMotionHarness() {
  const animations = [];
  const cleanups = [];
  class Value {
    constructor(value) { this.value = value; this.pendingStops = []; this.deferStops = false; }
    setValue(value) { this.value = value; }
    stopAnimation(callback) {
      if (!callback) return;
      if (this.deferStops) this.pendingStops.push(callback);
      else callback(this.value);
    }
  }
  const { useFilterMotion: createMotion } = loadTypeScript('../hooks/use-filter-motion.ts', {
    react: {
      useRef: value => ({ current: value }), useMemo: callback => callback(),
      useEffect: callback => cleanups.push(callback()),
    },
    'react-native': { Animated: {
      Value,
      multiply: (value, factor) => ({ get value() { return value.value * factor; } }),
      divide: (value, divisor) => ({ get value() { return value.value / divisor.value; }, interpolate: config => config }),
      spring: (value, config) => ({ start() { animations.push({ value, ...config }); } }),
    } },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => false },
  });
  const { motion } = createMotion();
  motion.configure(0, 320, false);
  return { motion, animations, unmount: () => cleanups.forEach(cleanup => cleanup?.()) };
}

test('release and rapid filter presses continue from the displayed position without rebasing pages', () => {
  const { motion, animations } = createMotionHarness();
  motion.begin();
  motion.move(-160);
  assert.equal(motion.offset.value, -160);
  motion.configure(1, 320, false);
  assert.equal(motion.offset.value, -160);
  assert.equal(animations.at(-1).toValue, -320);
  motion.offset.value = -220; // A frame in the native slide.
  motion.configure(2, 320, false);
  assert.equal(motion.offset.value, -220);
  assert.equal(animations.at(-1).toValue, -640);
  motion.configure(0, 320, false);
  assert.equal(motion.offset.value, -220);
  assert.equal(animations.at(-1).toValue, -0);
  const count = animations.length;
  motion.configure(0, 320, false); // A content update must not restart motion.
  motion.cancel(); // A failed vertical pan must not stop the slide either.
  assert.equal(animations.length, count);
});

test('a drag interrupts at the actual native position and cancellation returns to the selected filter', () => {
  const { motion, animations } = createMotionHarness();
  motion.configure(1, 320, false);
  motion.offset.value = -210;
  motion.begin();
  motion.move(30);
  assert.equal(motion.offset.value, -180);
  motion.cancel();
  assert.equal(motion.offset.value, -180);
  assert.equal(animations.at(-1).toValue, -320);
  motion.cancel();
  assert.equal(animations.length, 2);
});

test('late native position callbacks cannot undo release, rotation or unmount', () => {
  for (const action of ['release', 'resize', 'unmount']) {
    const { motion, unmount } = createMotionHarness();
    motion.offset.deferStops = true;
    motion.begin();
    motion.move(-80);
    const reply = motion.offset.pendingStops.shift();
    if (action === 'release') motion.configure(1, 320, false);
    if (action === 'resize') motion.configure(1, 480, false);
    if (action === 'unmount') unmount();
    const value = motion.offset.value;
    reply(-20);
    assert.equal(motion.offset.value, value);
  }
});

test('movement received before native position capture is retained', () => {
  const { motion } = createMotionHarness();
  motion.offset.deferStops = true;
  motion.begin();
  motion.move(-80);
  motion.offset.pendingStops.shift()(-40);
  assert.equal(motion.offset.value, -120);
});

test('rotation and reduced motion align the selected page without leaving an intermediate frame', () => {
  const { motion, animations } = createMotionHarness();
  motion.configure(2, 480, false);
  assert.equal(motion.offset.value, -960);
  motion.configure(1, 480, true);
  assert.equal(motion.offset.value, -480);
  motion.begin();
  motion.move(-100);
  assert.equal(motion.offset.value, -480);
  motion.configure(2, 480, true);
  assert.equal(motion.offset.value, -960);
  assert.equal(animations.length, 0);
});


test('the filter background shares page progress during drag, interruption, rotation and reduced motion', () => {
  const { motion } = createMotionHarness();
  motion.begin();
  motion.move(-160);
  assert.equal(motion.position.value, 0.5);
  motion.configure(1, 320, false);
  assert.equal(motion.position.value, 0.5);
  motion.offset.value = -240;
  assert.equal(motion.position.value, 0.75);
  motion.configure(1, 480, false);
  assert.equal(motion.position.value, 1);
  motion.configure(2, 480, true);
  assert.equal(motion.position.value, 2);
});

test('handoff to navbar aligns the filter without a spring and rejects stale native drag callbacks', () => {
  const { motion, animations } = createMotionHarness();
  motion.configure(2, 320, false);
  motion.offset.value = -600;
  motion.offset.deferStops = true;
  motion.begin();
  const reply = motion.offset.pendingStops.shift();
  const beforeHandoff = animations.length;
  motion.resetToSelected();
  assert.equal(motion.offset.value, -640);
  assert.equal(motion.position.value, 2);
  assert.equal(animations.length, beforeHandoff);
  reply(-600);
  motion.move(-30);
  assert.equal(motion.offset.value, -640);
});


function createSwipeHarness({ selected = 'All', filters = ['All', 'Priority', 'Easy'], tabIndex = 1 } = {}) {
  const names = ['dashboard', 'visibility', 'work', 'programs', 'profile'];
  const parent = createMotionHarness();
  parent.motion.configure(tabIndex, 320, false);
  parent.motion.offset.setValue(-tabIndex * 320);
  const local = createMotionHarness();
  local.motion.configure(Math.max(0, filters.indexOf(selected)), 320, false);
  local.motion.offset.setValue(-Math.max(0, filters.indexOf(selected)) * 320);
  const changes = [];
  const visits = [];
  const context = {
    motion: parent.motion,
    previousTab: tabIndex > 0 ? '/(tabs)/' + names[tabIndex - 1] : null,
    nextTab: tabIndex < names.length - 1 ? '/(tabs)/' + names[tabIndex + 1] : null,
  };
  function createPan() {
    const gesture = { config: {} };
    for (const method of ['enabled', 'maxPointers', 'activeOffsetX', 'failOffsetY', 'runOnJS']) {
      gesture[method] = value => { gesture.config[method] = value; return gesture; };
    }
    for (const [method, callbackName] of [['onStart', 'start'], ['onUpdate', 'update'], ['onFinalize', 'finalize'], ['onEnd', 'finish']]) {
      gesture[method] = callback => { gesture[callbackName] = callback; return gesture; };
    }
    return gesture;
  }
  const { useFilterSwipe: createSwipe } = loadTypeScript('../hooks/use-filter-swipe.ts', {
    react: { useMemo: callback => callback(), useRef: value => ({ current: value }) },
    '@react-navigation/native': { useIsFocused: () => true },
    'react-native-gesture-handler': { Gesture: { Pan: createPan } },
    '@/src/navigation/tab-swipe-context': { useTabSwipe: () => context },
    '@/src/navigation/filter-swipe': loadTypeScript('../src/navigation/filter-swipe.ts'),
    'expo-router': { router: { navigate: route => visits.push(route) } },
  });
  const gesture = createSwipe({
    filters, selected, motion: local.motion, onChange: value => changes.push(value),
    previousTab: null, nextTab: null,
  });
  return { gesture, parent, local, changes, visits, context };
}

test('every first and last filter reveals the actual neighboring tab before release', () => {
  for (const tabIndex of [1, 2, 3]) {
    for (const direction of [-1, 1]) {
      const selected = direction === 1 ? 'All' : 'Easy';
      const { gesture, parent, local, changes, visits, context } = createSwipeHarness({ tabIndex, selected });
      const localStart = local.motion.offset.value;
      gesture.start({ translationX: direction * 20 });
      gesture.update({ translationX: direction * 160 });
      assert.equal(parent.motion.offset.value, -tabIndex * 320 + direction * 160);
      assert.equal(local.motion.offset.value, localStart);
      assert.deepEqual(visits, []);
      assert.deepEqual(changes, []);
      const neighbor = tabIndex - direction;
      const outgoingLeft = tabIndex * 320 + parent.motion.offset.value;
      const incomingLeft = neighbor * 320 + parent.motion.offset.value;
      assert.equal(Math.abs(outgoingLeft), 160);
      assert.equal(Math.abs(incomingLeft), 160);
      gesture.finish({ translationX: direction * 160, velocityX: direction * 400 }, true);
      assert.deepEqual(visits, [direction === 1 ? context.previousTab : context.nextTab]);
      const releasePosition = parent.motion.offset.value;
      parent.motion.configure(neighbor, 320, false); // Router commits the destination.
      assert.equal(parent.motion.offset.value, releasePosition);
      assert.equal(parent.animations.at(-1).toValue, -neighbor * 320);
    }
  }
});

test('internal filter swipes leave the outer pager stationary', () => {
  for (const direction of [-1, 1]) {
    const { gesture, parent, local, changes, visits } = createSwipeHarness({ selected: 'Priority' });
    gesture.start({ translationX: direction * 20 });
    gesture.update({ translationX: direction * 100 });
    assert.equal(local.motion.offset.value, -320 + direction * 100);
    assert.equal(parent.motion.offset.value, -320);
    gesture.finish({ translationX: direction * 100, velocityX: direction * 400 }, true);
    assert.deepEqual(changes, [direction === 1 ? 'All' : 'Easy']);
    assert.deepEqual(visits, []);
  }
});

test('cancelled or short boundary swipes restore the current tab without navigation', () => {
  for (const cancel of [true, false]) {
    const { gesture, parent, visits } = createSwipeHarness();
    gesture.start({ translationX: 20 });
    gesture.update({ translationX: 30 });
    assert.equal(parent.motion.offset.value, -290);
    if (cancel) gesture.finalize({}, false);
    else gesture.finish({ translationX: 30, velocityX: 20 }, true);
    assert.deepEqual(visits, []);
    assert.equal(parent.animations.at(-1).toValue, -320);
  }
});

test('reversing a boundary drag can return to the filter pager without moving both tracks', () => {
  const { gesture, parent, local, changes, visits } = createSwipeHarness();
  gesture.start({ translationX: 30 });
  assert.equal(parent.motion.offset.value, -290);
  gesture.update({ translationX: -90 });
  assert.equal(parent.motion.offset.value, -320);
  assert.equal(local.motion.offset.value, -90);
  gesture.finish({ translationX: -90, velocityX: -200 }, true);
  assert.deepEqual(changes, ['Priority']);
  assert.deepEqual(visits, []);
});

test('first and last routes use the same live pager and cannot swipe outside the route list', () => {
  for (const tabIndex of [0, 4]) {
    const inward = tabIndex === 0 ? -1 : 1;
    const first = createSwipeHarness({ tabIndex, filters: ['page'], selected: 'page' });
    first.gesture.start({ translationX: inward * 20 });
    first.gesture.update({ translationX: inward * 100 });
    assert.equal(first.parent.motion.offset.value, -tabIndex * 320 + inward * 100);
    first.gesture.finish({ translationX: inward * 100, velocityX: inward * 200 }, true);
    assert.equal(first.visits.length, 1);
    const edge = createSwipeHarness({ tabIndex, filters: ['page'], selected: 'page' });
    edge.gesture.start({ translationX: -inward * 30 });
    edge.gesture.finish({ translationX: -inward * 100, velocityX: -inward * 200 }, true);
    assert.equal(edge.parent.motion.offset.value, -tabIndex * 320);
    assert.deepEqual(edge.visits, []);
  }
});

test('a short fast flick commits while a cancelled gesture never commits', () => {
  const flick = createSwipeHarness();
  flick.gesture.start({ translationX: 25 });
  flick.gesture.finish({ translationX: 30, velocityX: 800 }, true);
  assert.deepEqual(flick.visits, ['/(tabs)/dashboard']);
  const cancelled = createSwipeHarness();
  cancelled.gesture.start({ translationX: 120 });
  cancelled.gesture.finish({ translationX: 120, velocityX: 800 }, false);
  assert.deepEqual(cancelled.visits, []);
});

test('the shared navigator renders real adjacent screens and keeps all crossed pages mounted on navbar jumps', () => {
  const names = ['dashboard', 'visibility', 'work', 'programs', 'profile'];
  let state = { index: 1, routes: names.map(name => ({ key: name, name })), preloadedRouteKeys: [] };
  const { motion } = createMotionHarness();
  const slots = [];
  let cursor = 0;
  const descriptors = Object.fromEntries(names.map(name => [name, {
    options: {}, render: () => React.createElement('ScreenContent', { name }),
  }]));
  const { SwipeTabNavigator } = loadTypeScript('../components/swipe-tab-navigator.tsx', {
    react: {
      ...React, useMemo: fn => fn(), useLayoutEffect: fn => fn(),
      useState: initial => {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
        return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
      },
    },
    'react-native': {
      Animated: { View: 'AnimatedView' }, View: 'View', StyleSheet: { create: styles => styles },
      useWindowDimensions: () => ({ width: 320, height: 700 }),
    },
    '@react-navigation/native': {
      TabRouter: {}, useNavigationBuilder: () => ({ state, descriptors, navigation: {}, NavigationContent: 'NavigationContent' }),
    },
    '@/hooks/use-filter-motion': { useFilterMotion: () => ({ motion, reduceMotion: false }) },
    '@/src/navigation/tab-swipe-context': { TabSwipeContext: { Provider: 'TabSwipeProvider' } },
  });
  const render = index => {
    state = { ...state, index };
    cursor = 0;
    return SwipeTabNavigator({ tabBar: () => React.createElement('Navbar') });
  };
  let tree = render(1);
  const viewport = tree.props.children.props.children[0];
  const track = viewport.props.children;
  assert.equal(track.props.style[0].flexDirection, 'row');
  assert.equal(track.props.style[1].width, 1600);
  const pages = track.props.children;
  assert.deepEqual(pages.slice(0, 3).map(page => page.props.children.props.children.props.name), names.slice(0, 3));
  assert.equal(pages[1].props.children.props.value.motion, motion);
  assert.equal(pages[1].props.children.props.value.previousTab, '/(tabs)/dashboard');
  assert.equal(pages[1].props.children.props.value.nextTab, '/(tabs)/work');
  assert.equal(tree.props.children.props.children[1].type, 'Navbar');
  motion.offset.setValue(-160); // Halfway toward Home.
  assert.equal(track.props.style[1].transform[0].translateX.value, -160);
  assert.equal(pages[0].props.style.at(-1).width, 320);
  tree = render(4);
  const crossed = tree.props.children.props.children[0].props.children.props.children;
  assert.ok(crossed.every(page => page.props.children.props.children !== null));
  tree = render(0);
  const retained = tree.props.children.props.children[0].props.children.props.children;
  assert.ok(retained.every(page => page.props.children.props.children !== null));
  assert.equal(retained[0].props.pointerEvents, 'auto');
  assert.equal(retained[4].props.pointerEvents, 'none');
});

// These checks exercise the actual tab bar at different logical screen widths.
test('navbar stays inside safe bounds on small phones and large displays', () => {
  for (const width of [280, 320, 360, 390, 430, 600, 768, 1024]) {
    for (const fontScale of [1, 1.3, 2, 3]) {
      const insets = { top: 24, bottom: 34, left: 24, right: 48 };
      const { tree, buttons, scroll } = renderBar(2, { width, fontScale, insets });
      const bar = tree.props.style[1];
      assert.ok(bar.width > 0 && bar.width <= 720);
      assert.ok(bar.marginLeft >= insets.left);
      assert.ok(bar.marginLeft + bar.width <= width - insets.right);
      assert.equal(bar.marginBottom, 34);
      const total = buttons.reduce((sum, b) => sum + b.props.style[1].width, 0);
      if (!scroll.props.scrollEnabled) assert.ok(Math.abs(total - bar.width) < 0.01);
      else assert.ok(buttons.every(b => b.props.style[1].width <= bar.width));
    }
  }
});
test('keyboard releases navbar space for form fields', () => {
  assert.equal(renderBar(0, { keyboard: true }).hidden, true);
  assert.equal(renderBar(0, { keyboard: false }).buttons.length, 3);
});
