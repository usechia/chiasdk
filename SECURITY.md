# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |

We apply security patches to the latest release. Older versions are not actively maintained.

## Reporting a Vulnerability

If you discover a security vulnerability in Chia, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use one of the following methods:

1. **GitHub Security Advisories** - Use the "Report a vulnerability" button on the [Security tab](https://github.com/usechia/chiasdk/security/advisories) of the repository.
2. **Email** - Contact the maintainers directly through their GitHub profiles.

### What to Include

- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any relevant logs, screenshots, or proof-of-concept code.
- Your suggested fix, if you have one.

### What to Expect

- We will acknowledge receipt within 48 hours.
- We will provide an initial assessment within 5 business days.
- We will work with you to understand and resolve the issue.
- We will credit you in the security advisory (unless you prefer to remain anonymous).

### Scope

The following are in scope:

- The `@chiahq/sdk` package
- The `@chiahq/mcp` package
- CI/CD workflows and release processes
- Dependencies with known vulnerabilities

The following are out of scope:

- Vulnerabilities in third-party payment provider APIs (PayChangu, PawaPay, OneKhusa) - report these to the respective providers
- Issues that require physical access to a user's machine
- Social engineering attacks

## Security Practices

This project follows these security practices:

- All API communication uses HTTPS.
- No secrets or credentials are stored in source code.
- Dependencies are monitored via GitHub Dependabot.
- Input validation is applied to URLs, phone numbers, emails, and enum values.
- Error responses are sanitized to prevent information leakage.
- Bulk operations are rate-limited to prevent abuse.
