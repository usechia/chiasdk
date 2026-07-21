---
sidebar_position: 1
title: "Claude Code Skill"
description: "Teach Claude to integrate Chia correctly"
---

# Claude Code Skill

`chia-integration` is a [Claude Code](https://claude.com/claude-code) skill that teaches Claude how Chia actually works, so it writes correct integration code instead of guessing at endpoint shapes and auth modes.

It is distributed as a Claude Code plugin from the [chiasdk repository](https://github.com/usechia/chiasdk).

## Install

```bash
/plugin marketplace add usechia/chiasdk
/plugin install chia-integration@chia
```

Both commands run inside a Claude Code session. The first registers Chia's plugin marketplace, the second installs the skill.

Verify it is available:

```bash
/plugin list
```

## What it covers

Claude loads the skill automatically when it detects you are working on a Chia integration. You can also invoke it directly with `/chia-integration`.

| Topic | Why it matters |
|---|---|
| Auth mode selection | Picking wrong is the most common integration mistake, and one wrong choice ships a secret key to the browser |
| Money as strings | Amounts are `numeric(12,2)` returned as JSON strings; parsing them as floats silently corrupts balances |
| The asynchronous model | Starting a subscription sends a prompt to a phone. The API returns a next action, not an outcome |
| Subscriber state machine | The legal transitions, so Claude does not write code for states that cannot occur |
| Webhook verification | The exact HMAC scheme, including the constant-time compare and the length check that a naive implementation gets wrong |
| Idempotency | How to retry a request that timed out without charging twice |
| Metadata correlation | Passing your own identifiers through Chia and reading them back on events |

## Why a skill and not just documentation

Documentation is written for people reading in order. A skill is written for a model that needs the right constraint at the moment it is about to write the wrong line. The skill is deliberately opinionated about failure modes: it leads with what breaks rather than what is possible.

It complements the [MCP server](../mcp/overview.md), which gives Claude live access to your Chia account. The skill teaches Claude how Chia works; the MCP server lets it act on your data. They are useful independently.

## Updating

```bash
/plugin marketplace update chia
```

## Uninstall

```bash
/plugin uninstall chia-integration@chia
```
