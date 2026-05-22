# Agent Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: would a senior engineer say this is overcomplicated? If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't improve adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it. Don't delete it.

When your changes create orphans:

- Remove imports, variables, and functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" -> write tests for invalid inputs, then make them pass.
- "Fix the bug" -> write a test that reproduces it, then make it pass.
- "Refactor X" -> ensure tests pass before and after.

For multi-step tasks, state a brief plan:

1. Step -> verify: check.
2. Step -> verify: check.
3. Step -> verify: check.

Strong success criteria let you loop independently. Weak criteria such as "make it work" require clarification.

## 5. Project Maintainability

This website is designed around easy maintenance, fast navigation, and incremental feature expansion.

- Keep user-editable content in `src/data.ts`.
- Keep shared data shapes in `src/types.ts`.
- Keep external API and fallback logic in `src/services/`.
- Keep page section composition in `src/App.tsx`.
- Keep responsive visual rules in `src/styles.css`.
- Before adding a feature, decide whether it belongs to UI, data, service, backend, or PWA infrastructure.
- Do not hide API response parsing inside UI components. Normalize external data in a service first.
- Prefer names that make search easy, such as `BlogSection`, `ContactSection`, `BlogPortfolioService`, and `BusinessProfile`.
- After changes, run `npm run build` unless the change is documentation-only.
- At the end of every task, update `WORK_LOG.md` with the changed files, implemented behavior, verification result, and any remaining follow-up. Keep it short so future agents can understand the project state without re-reading the whole codebase.

For a fuller project map, read `README.md`.
