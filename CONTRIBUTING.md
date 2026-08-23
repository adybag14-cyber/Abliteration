# Contributing

Thanks for improving the Abliteration Field Guide. Keep changes evidence-led, reproducible, and inside the responsible-use boundary in [docs/risks-and-ethics.md](docs/risks-and-ethics.md).

## Before opening a pull request

1. Create a focused branch from current `main`.
2. Link primary sources for technical claims. Label unreplicated or inferred results explicitly.
3. Do not commit checkpoints, credentials, access tokens, private prompts, or generated build directories.
4. Run the relevant gates below.
5. Explain the user-visible change, evidence, limitations, and exact commands you ran.

## Required gates

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run validate
npm run test:site
npm run build
npm run test:e2e
```

For C++ changes, also run:

```text
npm run cxx:build
npm run cxx:test
npm run cxx:self-check
npm run cxx:sanitize
```

The sanitizer gate requires Clang with AddressSanitizer and UndefinedBehaviorSanitizer support. CI certifies the release matrix on GCC 16.2, LLVM/Clang 22, and MSVC 14.51.

## Documentation and research changes

- Prefer the paper, official project documentation, or standards body over summaries.
- Use canonical HTTPS links and stable paper identifiers.
- Separate a paper's claim from this repository's independent verification.
- Keep the machine catalog and human research map synchronized.
- Preserve the no-GPU Hour 0 order: `guide` → `doctor` → `limits` → `self-check` → `demo`.

## Code style

Keep C++ ownership explicit, validate shapes and sizes before allocation, reject non-finite numeric input, and add a hostile-input regression for every parser or arithmetic boundary. UI changes must use semantic theme tokens, keyboard-visible focus, appropriate `data-slot` markers, reduced-motion behavior, and accessible names.

By contributing, you agree that your contribution is licensed under Apache-2.0.
