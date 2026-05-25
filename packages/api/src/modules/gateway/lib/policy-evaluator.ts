import type { PolicyEvaluation, PolicyLimits } from '../types';

export function evaluatePolicy(
  policyLimits: PolicyLimits,
  context: Record<string, unknown>,
  nowUtcHour: number
): PolicyEvaluation {
  const violations: string[] = [];

  if (policyLimits.max_amount !== undefined) {
    const amount = context.amount;
    if (typeof amount !== 'number') {
      violations.push('context.amount must be a number');
    } else if (amount > policyLimits.max_amount) {
      violations.push(`amount ${amount} exceeds max_amount ${policyLimits.max_amount}`);
    }
  }

  if (policyLimits.allowed_hours !== undefined) {
    const { start, end } = policyLimits.allowed_hours;
    let outside: boolean;
    if (start === end) {
      outside = true;
    } else if (start < end) {
      outside = nowUtcHour < start || nowUtcHour >= end;
    } else {
      outside = nowUtcHour < start && nowUtcHour >= end;
    }
    if (outside) {
      violations.push(`current hour ${nowUtcHour} is outside allowed window [${start}, ${end})`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
