# Shoulder Tap 👋

A social network for finding the missing person on your project. Post what you're
building and the roles you need (mechanical engineer, software engineer, designer…),
and let people with those skills tap you on the shoulder.

## Running it

```sh
npm install
npm run dev
```

Then open http://localhost:5173.

## What's inside

- **Discover** — browse projects, search by role or skill, filter by category, or
  flip on "Matches my skills" to see only projects with open roles you can fill.
- **Project pages** — full description, open roles with skill tags (green = you
  match), the current team, and one-click applications with a message.
- **Owner view** — on your own projects you see applicants and can accept or
  decline; accepted people join the team and the role slot fills.
- **People** — browse member profiles, filter by skill.
- **Dashboard** — projects you lead (with pending-applicant badges) and the status
  of every application you've sent.
- **Post a project** — guided form with a dynamic role builder and skill matching.

## Tech notes

Vite + React + TypeScript, no backend: all data lives in `localStorage`, seeded
with demo users and projects on first load. "Reset demo data" in the footer
restores the seed. The signed-in demo user is Emily Adams — edit the profile from
the avatar in the navbar.
