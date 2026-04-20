const AI_ACTION_TIMERS = {};

export function canUseAI(key = "default", cooldown = 2500) {
  const now = Date.now();
  const last = AI_ACTION_TIMERS[key] || 0;

  if (now - last < cooldown) {
    return false;
  }

  AI_ACTION_TIMERS[key] = now;
  return true;
}