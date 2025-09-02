03_placeholder_tracking.md
Placeholder Tracking Prompt

Agents must track all stubs, mocks, placeholders, and samples in a central log.

Detection

Look for tags: TODO, FIXME, TEMP, STUB, MOCK, PLACEHOLDER, SAMPLE

Hardcoded demo values, dummy secrets, fake APIs, lorem ipsum text

Documentation

Maintain /docs/placeholders.md and /docs/placeholders.json

Each entry includes: ID, file/line, type, description, resolution plan, owner, status, timestamps

Reporting

Weekly summary of unresolved placeholders

Counts by type, top 10 critical, new vs resolved

Code Practice
// STUB[PH-001]: fake API response until OCR wired
Acceptance Criteria

/docs/placeholders.md empty or all resolved

No placeholder tags in production code

Automated lint/check enforces tracking