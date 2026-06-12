# Domain-specific abliteration

## Motivation

Global refusal direction removal can broaden unsafe outputs across **all** topics. Domain-specific methods estimate `r` using activations **only** when the model processes prompts from one domain (fiction, medical, etc.).

## Outline

1. Filter prompt corpus by topic tag
2. Compute mean-difference **within domain**
3. Abliterate only when input classifier detects domain — or apply weaker global edit + strong local edit

## Trade-offs

- ✅ Preserves more general safety outside target domain
- ❌ Needs larger labeled dataset; classifier may fail OOD