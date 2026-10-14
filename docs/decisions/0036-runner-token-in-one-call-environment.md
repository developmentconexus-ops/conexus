# 0036. The runner registration token goes through one call's environment

## Context

Security S31 asks every secret to be read from a file. The GitHub runner reads its registration token only from `--token`, from `ACTIONS_RUNNER_INPUT_TOKEN`, or from a hidden prompt that needs a terminal (actions/runner v2.338.0, `src/Runner.Listener/CommandSettings.cs:48-59,110-138,271-278` and `src/Runner.Common/Terminal.cs:56-62`). No option reads a file.

## Decision

An exception to S31 for the runner registration token only. The setup reads it from a protected file through the one function that refuses a file others can read or an empty one, and sets `ACTIONS_RUNNER_INPUT_TOKEN` only in the environment of the `config.sh` call. The `timeout` and `sudo --preserve-env` wrappers of that call also carry it, as they must to reach `config.sh`. It is never exported to the script and never in a command line. Basis: the evidence above.

Lost: pasting the token at the runner's own prompt over `ssh -t` (an operator step, untried over a real session); a pseudo-terminal wrapper feeding the file to the prompt (a workaround on a prompt the runner may change).

## Consequences

The token is single use, expires in one hour, and the runner clears it from its own environment after reading. The server's only user is root.

## Reopens when

The runner reads the token from a file, or a second secret needs the same exception.

## State

Accepted. Founder, 2026-10-14: "1. A".
