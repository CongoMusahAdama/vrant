/**
 * Run work after the response has been sent (emails, SMS).
 * On Vercel the function would otherwise be frozen once it replies, so the task is
 * registered with waitUntil; when running as a normal server it just runs on the next tick.
 */
let waitUntil = null;
if (process.env.VERCEL) {
  try {
    ({ waitUntil } = require('@vercel/functions'));
  } catch {
    waitUntil = null;
  }
}

function runInBackground(task) {
  const run = () =>
    Promise.resolve()
      .then(task)
      .catch((err) => console.error('[background] task failed:', err?.message || err));

  if (waitUntil) {
    waitUntil(run());
    return;
  }
  setImmediate(run);
}

module.exports = { runInBackground };
