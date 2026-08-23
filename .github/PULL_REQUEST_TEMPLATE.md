## Outcome

<!-- What changes for the reader, researcher, or release user? -->

## Evidence

<!-- Primary sources, exact test commands, screenshots, sanitizer output, or reproducibility notes. -->

## Safety and scope

- [ ] I did not commit secrets, private data, checkpoints, or build output.
- [ ] New claims link to primary sources and distinguish paper claims from local verification.
- [ ] Parser/arithmetic changes validate inputs before allocation and include hostile-input coverage.
- [ ] UI changes remain keyboard accessible, responsive, theme-safe, and reduced-motion safe.

## Gates

- [ ] `npm run validate`
- [ ] `npm run test:site`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] C++ build/test/self-check/sanitizers, if applicable
