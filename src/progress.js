const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'];

/**
 * @param {{ quiet?: boolean, isTTY?: boolean }} opts
 * @returns {{ update(msg: string): void, done(msg?: string): void, clear(): void }}
 */
export function createProgress({ quiet = false, isTTY = false } = {}) {
  if (!isTTY || quiet) {
    return { update() {}, done() {}, clear() {} };
  }

  let frameIdx = 0;
  let currentMsg = '';
  let timer = null;

  function tick() {
    process.stderr.write('\r\x1b[K' + FRAMES[frameIdx % FRAMES.length] + ' ' + currentMsg);
    frameIdx++;
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    process.stderr.write('\r\x1b[K');
  }

  return {
    update(msg) {
      currentMsg = msg;
      if (!timer) timer = setInterval(tick, 80);
    },
    done(msg) {
      stop();
      if (msg) process.stderr.write(msg + '\n');
    },
    clear() {
      stop();
    },
  };
}
