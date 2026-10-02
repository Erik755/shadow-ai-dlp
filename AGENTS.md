# Shadow AI DLP — Agent Instructions

This repository follows an ECC-style engineering workflow adapted to a security-sensitive Chrome Manifest V3 extension.

Reference project: https://github.com/affaan-m/ECC

## Operating loop

Use this sequence for non-trivial work:

1. Plan
2. Write or extend tests
3. Implement the smallest correct change
4. Review the diff from a fresh context
5. Run verification
6. Update relevant project documentation
7. Summarize residual risk

Do not skip directly from a bug report to a code change when the behavior is security-sensitive or affects request interception/redaction.

## Project priorities

1. Prevent original sensitive values from leaving the browser through covered request paths.
2. Avoid false claims of coverage. If a transport or platform path is not verified, document the limitation.
3. Keep redaction and restoration deterministic.
4. Preserve compatibility with Chrome Manifest V3.
5. Minimize permissions and host access.
6. Prefer local processing; do not introduce a backend or telemetry unless explicitly requested.

## Security rules

Before accepting a change, check:

- No secrets, API keys, credentials, personal data, or test identities are committed.
- No new network destination is introduced without explicit justification.
- Extension permissions remain no broader than required.
- Page-context injection does not expose additional privileged capability.
- User-controlled values are treated as untrusted.
- Regex or parsing changes are checked for catastrophic backtracking and excessive CPU usage.
- Token generation cannot collide with ordinary user text in a way that restores the wrong value.
- Restoration never reveals a value to a context that did not originally contain it.
- Logs do not contain original sensitive values.

If a change modifies interception, serialization, tokenization, restoration, platform matching, or permissions, treat it as a security-sensitive change and perform an explicit review.

## Existing verification

Run the repository's current automated checks after relevant changes:

```bash
node scripts/test-engine.mjs
node scripts/test-transport.mjs
```

When changing browser behavior, also perform a real-browser verification on at least one supported AI site and inspect Network traffic to confirm that the original test value is absent from the request path being tested.

Do not use real secrets or real payment card data. Use synthetic values such as documented Luhn-valid test numbers.

## Test-driven changes

For bug fixes and new detection/redaction behavior:

1. Add a failing regression test first when practical.
2. Confirm the test fails for the expected reason.
3. Implement the minimum change.
4. Run all existing tests.
5. Add edge cases for both false negatives and false positives.

Changes to `redact-core.js` should normally include tests in `scripts/test-engine.mjs`.
Changes to request/body handling in `injected.js` should normally include tests in `scripts/test-transport.mjs`.

## Review checklist

Review modified code for:

- correctness;
- regressions on currently supported platforms;
- request paths that still carry the original value;
- accidental broadening of extension permissions;
- unsafe DOM assumptions;
- service-worker / iframe / binary-body limitations;
- false positives that make normal chat text unusable;
- false negatives in Mexican identifiers and common secrets;
- stale documentation.

Prefer concrete findings over style-only comments.

## Scope boundaries

The README is intentionally explicit that this is not enterprise DLP and does not guarantee protection across every browser or transport path. Preserve that honesty.

Do not claim complete protection for:
- service-worker-only paths;
- protobuf/binary bodies;
- URL/query-string exfiltration unless specifically covered and tested;
- desktop apps or native apps;
- IDE integrations;
- direct API clients.

## Git workflow

Use focused commits with conventional prefixes such as:

- `fix:`
- `feat:`
- `test:`
- `docs:`
- `refactor:`
- `chore:`
- `security:`

For pull requests, include:
- what changed;
- why;
- tests run;
- browser verification performed;
- known limitations or remaining risks.

## Multi-agent roles

When Codex multi-agent support is available, use:

- `explorer` for read-only execution-path tracing;
- `reviewer` for correctness/security review;
- `docs_researcher` to verify Chrome / Manifest V3 / browser API behavior against primary documentation.

Project role configuration lives in `.codex/agents/`.
