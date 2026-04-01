# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

We take the security of Localcode seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@thealxlabs.com**.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Preferred Languages

We prefer all communications to be in English.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions
5. Publicly disclose the issue after patches are available

## Security Best Practices for Users

- **API Keys**: Never commit API keys to version control. Use environment variables or the settings file.
- **Local Models**: Use Ollama for fully local operation — your code never leaves your machine.
- **Permissions**: Configure tool permissions appropriately. Use `ask` mode for sensitive operations.
- **Safe Mode**: Enable `safeMode` in settings to auto-stash before edits and revert on test failure.
- **Budget Limits**: Set `budgetLimit` to prevent unexpected cloud provider charges.
