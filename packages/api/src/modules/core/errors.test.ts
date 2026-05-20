import { describe, expect, test } from 'bun:test';

import { AppError, forbidden } from './errors';

describe('AppError', () => {
  test('toResponse includes meta when present', () => {
    const err = new AppError(403, 'onboarding_required', 'Onboarding incomplete', {
      meta: { next_step: 'company' },
    });
    const response = err.toResponse();
    expect(response).toEqual({
      error: 'onboarding_required',
      message: 'Onboarding incomplete',
      meta: { next_step: 'company' },
    });
  });

  test('toResponse omits meta when not provided', () => {
    const err = forbidden('forbidden', 'Not allowed');
    const response = err.toResponse();
    expect(response).toEqual({
      error: 'forbidden',
      message: 'Not allowed',
    });
    expect(response).not.toHaveProperty('meta');
  });
});
