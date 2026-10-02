# ECC + Codex integration

This repository includes a project-local Codex configuration inspired by the official ECC workflow.

Official ECC repository: https://github.com/affaan-m/ECC

Pinned ECC installer version used by this setup: `2.2.3`.

## What is already in this repository

The repository now contains:

- `AGENTS.md` with the engineering workflow and security gates for Shadow AI DLP.
- `.codex/config.toml` with project-local Codex settings.
- Three read-only multi-agent roles:
  - `explorer`
  - `reviewer`
  - `docs_researcher`
- `scripts/setup-ecc-codex.ps1` for installing the official ECC Codex integration on a Windows workstation.

The project-local files work without copying the full ECC repository into this project.

## Install the full ECC Codex integration

ECC itself is a coding-agent harness, not a runtime dependency of the Chrome extension.

From PowerShell at the repository root:

```powershell
.\scripts\setup-ecc-codex.ps1 -DryRun
.\scripts\setup-ecc-codex.ps1
```

The helper checks for:

- Node.js 18 or newer
- `npx`
- Codex CLI

It then calls the official pinned package:

```text
npx --yes ecc-universal@2.2.3 install --guided --harness codex
```

Do not install a second ECC method on top of the same Codex setup. ECC's own documentation warns against stacking installation methods.

## How to use it in this repository

Open the repository in Codex. Codex should read the root `AGENTS.md` and the trusted project configuration under `.codex/`.

For non-trivial changes, use the ECC loop:

```text
plan -> test -> implement -> review -> verify -> document
```

For this project, the minimum automated verification remains:

```bash
node scripts/test-engine.mjs
node scripts/test-transport.mjs
```

Browser/network verification is still required for changes that affect real request interception.

## Why the configuration is intentionally smaller than ECC's reference config

ECC's reference Codex configuration can enable several MCP servers. This repository does not enable them automatically because they may require credentials, external network access, package downloads, or local browser integration.

That keeps this project's default trust surface narrow. Add external servers only when a concrete task requires them.
