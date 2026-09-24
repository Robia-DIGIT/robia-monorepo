/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createHarness({ stalled = false } = {}) {
  const slots = [];
  const timers = new Map();
  let cursor = 0;
  let clock = 0;
  let nextTimer = 0;
  let pendingEffect;
  let cleanup;
  let hidden = 0;
  let sequences = 0;
  const schedule = (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { at: clock + delay, callback });
    return id;
  };
  const cancel = id => timers.delete(id);
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    stopAnimation() {}
  }
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback: callback => callback,
    useEffect: callback => { pendingEffect = callback; },
  };
  const mocks = {
    react,
    'expo-splash-screen': { hideAsync: () => { hidden++; return Promise.resolve(); } },
    'react-native': {
      Easing: { bezier: () => 'entrance-easing', linear: 'linear' },
      Animated: {
        Value,
        timing: (value, options) => ({ value, ...options }),
        sequence(steps) {
          sequences++;
          let currentTimer;
          let done;
          const step = index => {
            if (index === steps.length) { done({ finished: true }); return; }
            if (stalled) return;
            currentTimer = schedule(() => {
              steps[index].value.setValue(steps[index].toValue);
              step(index + 1);
            }, steps[index].duration);
          };
          return {
            start(callback) { done = callback; step(0); },
            stop() { cancel(currentTimer); done?.({ finished: false }); },
          };
        },
      },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../hooks/use-launch-animation.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', compiled)(
    name => mocks[name], module, module.exports, schedule, cancel,
  );
  return {
    render(reduceMotion = false) {
      cursor = 0;
      const result = module.exports.useLaunchAnimation(reduceMotion);
      cleanup?.();
      cleanup = pendingEffect();
      return result;
    },
    advance(duration) {
      const until = clock + duration;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        clock = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      clock = until;
    },
    get visible() { return slots[0]; },
    get hidden() { return hidden; },
    get sequences() { return sequences; },
    get pendingTimers() { return timers.size; },
    unmount() { cleanup?.(); },
  };
}

test('the logo and background are removed within 220ms of the final resting pose', () => {
  const app = createHarness();
  const overlay = app.render();
  overlay.reveal();
  assert.equal(app.hidden, 1);
  app.advance(1800);
  assert.equal(overlay.progress.value, 0.72);
  assert.equal(app.visible, true);
  app.advance(220);
  assert.equal(overlay.opacity.value, 0);
  assert.equal(app.visible, false);
  app.advance(5000);
  assert.equal(app.hidden, 2); // Fallback cannot finish a second time.
  app.render();
  assert.equal(app.sequences, 1);
});

test('reduced motion removes the entire overlay immediately and cannot restart it', () => {
  const app = createHarness();
  const overlay = app.render(true);
  assert.equal(app.visible, false);
  assert.equal(overlay.opacity.value, 0);
  assert.equal(app.sequences, 0);
  app.render(false);
  assert.equal(app.sequences, 0);
  assert.equal(app.visible, false);
});

test('enabling reduced motion during the entrance removes the overlay', () => {
  const app = createHarness();
  app.render();
  app.advance(500);
  const overlay = app.render(true);
  assert.equal(app.visible, false);
  assert.equal(overlay.opacity.value, 0);
  app.advance(5000);
  assert.equal(app.hidden, 1);
});

test('missing animation completion still clears both opacity and the mounted overlay', () => {
  const app = createHarness({ stalled: true });
  const overlay = app.render();
  app.advance(3020);
  assert.equal(app.visible, false);
  assert.equal(overlay.opacity.value, 0);
  assert.equal(app.hidden, 1);
});

test('unmount cancels the animation and fallback without late state updates', () => {
  const app = createHarness();
  app.render();
  app.advance(200);
  app.unmount();
  assert.equal(app.pendingTimers, 0);
  app.advance(5000);
  assert.equal(app.hidden, 0);
});
