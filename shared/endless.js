// [MOD] Owner-requested extended ABYSS matches (2026-10-14).
// [ASSUMED] Default growth: HP +20%, ATK +10% each round from R15, compounded.
export const ENDLESS_DEFAULTS = Object.freeze({ rounds: 20, growthStart: 15, hpGrowth: 20, atkGrowth: 10 });
export const ENDLESS_PRESETS = Object.freeze([20, 30, 40, 50]);
export const PERSONNEL_DEPLOY_MAX = 13;

/** @param {any} value */
export function validEndlessOptions(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 4
    && Number.isInteger(value.rounds) && value.rounds >= 20 && value.rounds <= 100
    && Number.isInteger(value.growthStart) && value.growthStart >= 2 && value.growthStart <= 100
    && ['hpGrowth', 'atkGrowth'].every(k => typeof value[k] === 'number' && Number.isFinite(value[k]) && value[k] >= 0 && value[k] <= 100);
}

/** @param {any} value */
export function endlessOptions(value) {
  return validEndlessOptions(value)
    ? { rounds: value.rounds, growthStart: value.growthStart, hpGrowth: value.hpGrowth, atkGrowth: value.atkGrowth }
    : { ...ENDLESS_DEFAULTS };
}
