# Workflow

This repo should use a branch-and-PR workflow instead of pushing directly to `main`.

## Branch Strategy

- Treat `main` as the stable branch.
- Start each task from the latest `main`.
- Use short-lived feature branches.
- Preferred branch naming:
  - `codex/<task-name>`
  - `feature/<task-name>`
  - `fix/<task-name>`

Example:

```bash
git checkout main
git pull origin main
git checkout -b codex/exercise-swaps
```

## Daily Flow

Start new work:

```bash
git checkout main
git pull origin main
git checkout -b codex/<task-name>
```

Check your changes while working:

```bash
git status
git diff
```

Run a basic validation step before committing:

```bash
cd client
npm run build
```

Commit and push:

```bash
git add .
git commit -m "Add exercise swap support"
git push -u origin $(git branch --show-current)
```

Open a pull request from your branch into `main`.

## Pull Request Checklist

- Branch created from the latest `main`
- Only related files are included
- `npm run build` passes
- Manual UI behavior is tested
- PR description explains:
  - what changed
  - why it changed
  - how it was validated

## Commit Guidance

Use short, outcome-based commit messages.

Examples:

- `Add onboarding draft persistence`
- `Render workout preview alternatives`
- `Fix boolean validation in onboarding`

## GitHub Settings

Recommended protection rules for `main`:

- Require a pull request before merging
- Restrict direct pushes to `main`
- Require branches to be up to date before merging
- Optionally require 1 approval
- Optionally require status checks once CI is added

## Notes

- Avoid working directly on `main` unless you are fixing something trivial and intentional.
- Prefer one branch per focused task.
- Keep PRs small enough to review comfortably.
