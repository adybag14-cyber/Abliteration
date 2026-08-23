# Security policy

## Supported versions

Security fixes are applied to the current `main` branch and the rolling `cxx-nightly` release. Versioned releases are supported until a newer versioned release is published.

## Report a vulnerability privately

Please use [GitHub private vulnerability reporting](https://github.com/adybag14-cyber/Abliteration/security/advisories/new). Do not open a public issue for a suspected memory-safety flaw, archive-verification bypass, workflow injection, secret exposure, or dependency compromise.

Include the affected commit or release asset, platform/compiler, the smallest safe reproducer, impact, and any sanitizer output. Remove credentials, private model data, harmful payloads, and third-party personal information.

You should receive an acknowledgement within 7 days. No fixed remediation deadline is promised; severity, reproducibility, and downstream exposure determine priority. A coordinated disclosure and credit will be offered when appropriate.

## Scope boundary

The handbook discusses model-behavior interventions and authorized security-research evaluation. Reports about a third-party model's policy behavior, a paper's methodology, or misuse of an external tool are not vulnerabilities in this repository. Report those to the relevant vendor or maintainer. Repository bugs that turn documented safe boundaries into exploitable behavior are in scope.

Release users should verify `SHA256SUMS` and the GitHub artifact attestation before extraction. See [cxx/GETTING-STARTED.md](cxx/GETTING-STARTED.md).
