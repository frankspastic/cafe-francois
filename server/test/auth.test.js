import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const {
  createSession,
  isValidSession,
  destroySession,
  destroyAllSessions,
  requireBarista,
  checkPinRateLimit,
  recordPinFailure,
  clearPinFailures
} = await import('../auth.js');

// Minimal Express double — just enough for the middleware.
function mockReqRes(token) {
  const req = { get: (h) => (h.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : undefined) };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  return { req, res };
}

describe('Barista sessions', () => {
  test('a fresh token validates, a made-up one does not', () => {
    const token = createSession();
    assert.ok(isValidSession(token));
    assert.ok(!isValidSession('not-a-real-token'));
    assert.ok(!isValidSession(undefined));
    assert.ok(!isValidSession(''));
  });

  test('tokens are long and unpredictable', () => {
    const a = createSession();
    const b = createSession();
    assert.notEqual(a, b);
    assert.ok(a.length >= 32, 'token should be long enough to resist guessing');
  });

  test('destroying a session revokes it', () => {
    const token = createSession();
    destroySession(token);
    assert.ok(!isValidSession(token));
  });

  test('changing the PIN can revoke every session at once', () => {
    const a = createSession();
    const b = createSession();
    destroyAllSessions();
    assert.ok(!isValidSession(a));
    assert.ok(!isValidSession(b));
  });
});

describe('requireBarista middleware', () => {
  test('rejects a request with no token', () => {
    const { req, res } = mockReqRes(null);
    let nextCalled = false;
    requireBarista(req, res, () => { nextCalled = true; });

    assert.ok(!nextCalled, 'should not pass the request through');
    assert.equal(res.statusCode, 401);
  });

  test('rejects a bogus token', () => {
    const { req, res } = mockReqRes('bogus');
    let nextCalled = false;
    requireBarista(req, res, () => { nextCalled = true; });

    assert.ok(!nextCalled);
    assert.equal(res.statusCode, 401);
  });

  test('lets a valid token through', () => {
    const token = createSession();
    const { req, res } = mockReqRes(token);
    let nextCalled = false;
    requireBarista(req, res, () => { nextCalled = true; });

    assert.ok(nextCalled);
    assert.equal(res.statusCode, null);
    assert.equal(req.baristaToken, token);
  });
});

describe('PIN rate limiting', () => {
  test('allows attempts until the threshold, then locks out', () => {
    const ip = '10.0.0.1';
    clearPinFailures(ip);

    for (let i = 0; i < 4; i++) {
      assert.ok(checkPinRateLimit(ip).allowed, `attempt ${i + 1} should be allowed`);
      recordPinFailure(ip);
    }

    // The fifth failure trips the lockout.
    recordPinFailure(ip);
    const result = checkPinRateLimit(ip);
    assert.ok(!result.allowed, 'should be locked out after repeated failures');
    assert.ok(result.retryAfterSeconds > 0);
  });

  test('a correct PIN clears the failure count', () => {
    const ip = '10.0.0.2';
    clearPinFailures(ip);

    for (let i = 0; i < 6; i++) recordPinFailure(ip);
    assert.ok(!checkPinRateLimit(ip).allowed);

    clearPinFailures(ip);
    assert.ok(checkPinRateLimit(ip).allowed);
  });

  test('lockouts are tracked per IP', () => {
    const attacker = '10.0.0.3';
    const barista = '10.0.0.4';
    clearPinFailures(attacker);
    clearPinFailures(barista);

    for (let i = 0; i < 6; i++) recordPinFailure(attacker);

    assert.ok(!checkPinRateLimit(attacker).allowed);
    assert.ok(checkPinRateLimit(barista).allowed, 'one bad actor should not lock out the barista');
  });
});
