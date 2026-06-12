# Risks & ethics

Abliteration is **dual-use** ML research. Treat modified checkpoints like loaded artifacts.

## Technical risks

- **Capability degradation** — model becomes dumber, not just less censored
- **Unpredictable safety loss** — not only "jailbreak" prompts; hazardous how-to may flow
- **False sense of completeness** — partial abliteration leaves refusal in some domains
- **Distribution shift** — behaves differently across languages / tokenizers

## Responsible practices

1. **Keep pristine base weights** — never overwrite your only copy
2. **Label artifacts** — filename / README must state modified + date + method
3. **Access control** — don't host abliterated weights publicly without review
4. **Document intent** — research vs deployment; deployment needs policy review
5. **Comply with law** — model licenses (Llama, Qwen, etc.) and local regulations apply

## This repo's scope

This repository documents **interpretability and weight-editing techniques** for education and reproducibility. It does **not** ship abliterated model files or harmful prompt corpora.

If you are evaluating safety systems, prefer **isolated environments** and institutional review where required.