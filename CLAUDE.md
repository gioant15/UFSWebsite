# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & GitHub Workflow

**Always use git and GitHub for version control.** Every project must have:
- A local git repository initialized from the start
- A corresponding GitHub repository (under `gioant15`) to push all changes to

### Commit discipline
- Write clear, descriptive commit messages that explain *what* changed and *why*
- Commit logical units of work — do not bundle unrelated changes
- Always push commits to GitHub after creating them so the remote stays up to date

### Workflow for every change
1. Make changes locally
2. Stage relevant files (`git add <files>`)
3. Commit with a clear message (`git commit -m "..."`)
4. Push to GitHub (`git push`)

If a GitHub repo does not yet exist for the project, create one with `gh repo create` before the first push.

---

## Project Status

This project is in early/planning stages. Currently the repository contains only:
- `ufslogo.png` — the UFS logo (934×280px)
- `ufsplaceholder.mp4` — a placeholder video
- `assets/` — empty directory for future assets

No framework, build tooling, or source code has been set up yet. When development begins, update this file with build commands, architecture notes, and tech stack details.
