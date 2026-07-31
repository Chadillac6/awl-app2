# AWL Software Delivery Process

## Branches and environments

- `main` is the production branch and must stay deployable.
- All work begins on a short-lived branch named `feature/*`, `fix/*`, or `chore/*`.
- Each pull request receives a Netlify deploy preview for Chad's review.
- Merging an approved pull request to `main` triggers the production deployment.

## Standard workflow

1. Create or select a GitHub issue describing the requested outcome.
2. Create a branch from the latest `main`.
3. Implement the change with proportionate automated coverage.
   Review `docs/AWL_DOMAIN_RULES.md` before changing scoring or ingestion logic;
   its documented behaviors are intentional and apply to automated reviewers.
4. Run `npm run check` locally.
5. Push the branch and open a pull request linked to the issue.
6. Wait for the GitHub quality gate and Netlify deploy preview.
7. Review the preview on an iPhone and record approval in the pull request.
8. Squash-merge the pull request after all required checks pass.
9. Verify production and roll back through Netlify or Git if verification fails.
10. Tag important releases and record user-visible changes.

## Required pull-request checks

- ESLint
- Node unit and integration tests
- Playwright regressions in Chromium and iPhone-sized WebKit projects
- Vite production build
- Netlify deploy preview review for user-interface changes

## Production controls

- Direct pushes to `main` are prohibited except for an explicitly approved emergency.
- `main` requires a pull request and the `Quality gate` status check.
- Feature flags stay disabled until the associated production launch is approved.
- Production notifications are sent only after the deployed site is verified.

## Secrets and private data

- Service-account files, environment files, private keys, and push credentials must never be committed.
- Production secrets belong in Netlify environment variables or GitHub encrypted secrets.
- Local examples use placeholders only.
- Before the first push of a migration branch, scan the full diff and Git history for credentials.

## Releases and rollback

- Tag major releases using `vYYYY.MM.DD-name`, for example `v2026.08.07-championship`.
- Netlify's previous successful production deployment is the fastest rollback path.
- A Git revert pull request is the permanent source rollback when a release must be undone.
- Championship and other special-event activation remains a manual, Chad-approved step.
