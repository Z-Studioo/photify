# Conventional Commits Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification for
commit messages. This provides a consistent format that enables automated changelog generation and
semantic versioning.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
feat(auth): add user authentication system
fix(api): resolve database connection timeout
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(utils): simplify date formatting function
test(auth): add unit tests for login flow
chore(deps): update react to version 18.2.0
```

## Commit Types

| Type       | Description                           | Example                                     |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `feat`     | A new feature                         | `feat(auth): add OAuth integration`         |
| `fix`      | A bug fix                             | `fix(api): handle null response data`       |
| `docs`     | Documentation changes                 | `docs(api): update endpoint documentation`  |
| `style`    | Code style changes (formatting, etc.) | `style(components): fix indentation`        |
| `refactor` | Code refactoring                      | `refactor(hooks): simplify useAuth hook`    |
| `perf`     | Performance improvements              | `perf(api): optimize database queries`      |
| `test`     | Adding or updating tests              | `test(utils): add validation tests`         |
| `build`    | Build system changes                  | `build(webpack): update configuration`      |
| `ci`       | CI/CD changes                         | `ci(github): add automated testing`         |
| `chore`    | Maintenance tasks                     | `chore(deps): update dependencies`          |
| `revert`   | Revert previous commit                | `revert: feat(auth): add OAuth integration` |

## Scopes (Optional)

Scopes help identify the area of the codebase affected:

### Frontend (app/)

- `ui` - User interface components
- `components` - React components
- `hooks` - Custom React hooks
- `utils` - Utility functions
- `styles` - CSS/styling changes
- `types` - TypeScript type definitions
- `assets` - Images, fonts, static files

### Backend (server/)

- `api` - API endpoints
- `auth` - Authentication/authorization
- `middleware` - Express middleware
- `routes` - API routes
- `database` - Database related changes
- `config` - Configuration files

### General

- `deps` - Dependencies
- `docs` - Documentation
- `tests` - Testing
- `build` - Build system
- `ci` - Continuous integration

## Rules

### Required

1. **Type**: Must be one of the allowed types
2. **Description**: Must be present and descriptive
3. **Length**: Header must be 15-100 characters
4. **Case**: Type and scope must be lowercase
5. **Format**: No period at the end of description

### Optional

- **Scope**: Helps identify the affected area
- **Body**: Detailed explanation of the change
- **Footer**: Breaking changes, issue references

## Using Commitizen

This project includes Commitizen for interactive commit messages:

```bash
# Instead of git commit
npm run commit

# Follow the interactive prompts
```

## Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```bash
feat(api): update user endpoint response format

BREAKING CHANGE: The user endpoint now returns an object instead of an array.
Users should update their client code to handle the new response format.
```

Or use `!` after the type/scope:

```bash
feat(api)!: update user endpoint response format
```

## Examples with Body and Footer

```bash
feat(auth): add password reset functionality

Implement password reset feature with email verification.
Users can now request a password reset link via email.

Closes #123
```

```bash
fix(api): resolve memory leak in user sessions

- Clear session data properly on logout
- Add garbage collection for expired sessions
- Implement session cleanup job

Fixes #456, #789
```

## Validation

Commit messages are automatically validated using:

- **commitlint**: Enforces conventional commit format
- **Husky**: Runs validation on commit
- **lint-staged**: Runs linting and formatting before commit

## Tools and Commands

```bash
# Lint commit message manually
npx commitlint --from HEAD~1 --to HEAD --verbose

# Interactive commit with Commitizen
npm run commit

# Generate changelog
npm run release

# Check commit message format
git log --oneline -10
```

## Integration with Tools

### Automatic Changelog

Conventional commits enable automatic changelog generation:

- `feat` → Features section
- `fix` → Bug Fixes section
- `BREAKING CHANGE` → Breaking Changes section

### Semantic Versioning

Commits automatically determine version bumps:

- `fix` → Patch version (1.0.1)
- `feat` → Minor version (1.1.0)
- `BREAKING CHANGE` → Major version (2.0.0)

### IDE Integration

Many IDEs support conventional commits:

- VS Code: Conventional Commits extension
- WebStorm: Built-in support
- Vim: Various plugins available

## Common Mistakes

❌ **Don't:**

```bash
git commit -m "fixed bug"
git commit -m "Update README.md"
git commit -m "WIP: working on auth"
```

✅ **Do:**

```bash
git commit -m "fix(auth): resolve login timeout issue"
git commit -m "docs(readme): update installation guide"
git commit -m "feat(auth): implement JWT authentication"
```

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [Commitlint](https://commitlint.js.org/)
