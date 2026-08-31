# Security Policy

## Supported Versions

The following versions are currently supported with security updates and bug fixes.

| Version | Supported |
| ------- | --------- |
| v2.0.3 | ✅ |
| v2.0.2 | ✅ |
| v2.0.1-fixed | ✅ |
| v2.0.0 | ✅ |
| v1.0.2 Public Beta | ❌ |
| v1.0.1 Public Beta | ❌ |
| v1.0.0 Public Beta | ❌ |

Only the latest major release currently receives updates, bug fixes, and security-related improvements.

Users are strongly encouraged to upgrade to **Version 2.0.3** to receive the latest fixes, improvements, and supported functionality.

Older Public Beta releases are retained for historical purposes but are no longer actively maintained.

---

## Reporting a Vulnerability

If you discover a security vulnerability in the MFC Youth Area Management System, please report it responsibly instead of disclosing it publicly.

### How to Report

Please create a private report by contacting the maintainer through one of the following methods:

- Open a GitHub Security Advisory, if available.
- Email: **miguel7riovaldez@gmail.com**
- Facebook: **Miguel Riovaldez**

Please avoid opening a public GitHub Issue for vulnerabilities that may expose sensitive information or create a security risk for users.

### What to Include

Please include as much information as possible:

- Description of the vulnerability
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or logs, if applicable
- Application version
- Windows version
- Any relevant configuration or environment details

Please avoid including real MFC Youth member information, contact details, addresses, event participant information, or other personal data in reports unless absolutely necessary.

---

## Response Timeline

The following response times are general targets and may vary depending on the severity and complexity of the issue.

- Initial acknowledgment: Within **3–7 days**
- Investigation and status updates: As progress is made
- Security fix: Released as soon as reasonably possible depending on severity
- Public disclosure: After an appropriate fix or mitigation has been made available

---

## Local Data Security

MFC Youth Area Management System is designed as an offline desktop application.

Application data is stored locally using SQLite and may include information such as:

- Member names
- Birth dates
- Contact numbers
- Email addresses
- Addresses
- Chapter assignments
- Service assignments
- Activity Reports
- GIG contributions
- Events
- Event participant information
- Payment status information

The application does not claim that the local SQLite database is encrypted.

Users and administrators are responsible for protecting the Windows account, computer, storage device, backups, and local application data used by the system.

The application database should not be uploaded to public GitHub repositories or shared publicly.

---

## Responsible Disclosure

Please do not publicly disclose security vulnerabilities before a fix or appropriate mitigation has been released.

Responsible disclosure gives the project maintainer time to investigate and address an issue while helping protect users and their locally stored information.

Thank you for helping improve the security, privacy, stability, and reliability of the **MFC Youth Area Management System**.
