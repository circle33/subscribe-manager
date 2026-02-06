# Implement Subscription Notification App Using Cloudflare Workers

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If PLANS.md file is checked into the repo, reference the path to that file here from the repository root and note that this document must be maintained in accordance with PLANS.md. In this case, assume PLANS.md is at the root as ./PLANS.md, and this ExecPlan follows its guidelines strictly.

## Purpose / Big Picture

This ExecPlan guides the implementation of a simple subscription notification web application using Cloudflare Workers. After completion, users can log in with a default account, change their password in a settings page, add subscriptions via a modal dialog with fields for title, description, reminder time, and notification email selection, view a list of subscriptions on the home page showing title, notification time, and email, and configure notification emails in settings. The app will send notifications (e.g., via email) at the specified times, but for simplicity, we'll simulate notifications in logs or via a basic email integration. To see it working, deploy the Worker, access the app URL in a browser, log in, add a subscription, and verify it appears in the list; test notifications by manually triggering or waiting for scheduled events.

## Progress

- [x] (2026-02-06T14:12+08:00) Set up local development environment with Wrangler CLI.
- [x] (2026-02-06T14:12+08:00) Create and configure Cloudflare Worker project.
- [x] (2026-02-06T14:12+08:00) Implement backend storage using Workers KV for user data and subscriptions. (Namespace created and bound)
- [x] (2026-02-06T14:18+08:00) Build authentication API endpoints for login and password change.
- [ ] (Timestamp) Develop frontend HTML/JS for login, home page, settings, and modal. (Login + subscriptions + email settings implemented; settings modal TBD)
- [x] (2026-02-06T14:26+08:00) Add API endpoints for managing subscriptions and emails. (Subscriptions CRUD implemented; email settings TBD)
- [x] (2026-02-06T14:40+08:00) Integrate scheduled notifications using Cloudflare Cron Triggers.
- [x] (2026-02-06T15:05+08:00) Fix frontend runtime error from invalid innerHTML string interpolation in worker-served JS.
- [x] (2026-02-06T15:20+08:00) Split login, home, and settings into separate routes and scripts.
- [ ] (Timestamp) Deploy and test end-to-end functionality.
- [ ] (Timestamp) Add validation and error handling.

Use timestamps in ISO format like 2026-02-06T12:00Z to track progress.

## Surprises & Discoveries

- Observation: None yet.
  Evidence: N/A.

## Decision Log

- Decision: Use Workers KV for storage instead of D1 database for simplicity, as it's key-value based and sufficient for single-user app with subscriptions.
  Rationale: KV is free-tier friendly, fast for reads/writes, and easier for beginners than setting up a SQL database.
  Date/Author: 2026-02-06 / Initial Plan Author.

- Decision: Implement frontend as static HTML/JS served by the Worker, with API calls for dynamic data.
  Rationale: Workers can handle both static assets and API routes in one script, keeping the app serverless and simple.
  Date/Author: 2026-02-06 / Initial Plan Author.

- Decision: Simulate email notifications initially via console logs; integrate with a service like SendGrid if needed later.
  Rationale: Avoids external dependencies for core MVP; can extend in future milestones.
  Date/Author: 2026-02-06 / Initial Plan Author.

- Decision: Use Resend HTTP API for outbound email instead of IMAP/POP3.
  Rationale: Cloudflare Workers cannot open raw TCP connections required by IMAP/POP3/SMTP; Resend provides a supported HTTPS interface.
  Date/Author: 2026-02-06 / Implementation.

## Outcomes & Retrospective

To be filled at milestones: Summarize achievements, gaps, and lessons.

## Context and Orientation

This repository starts empty, assuming you're a novice with no prior Cloudflare experience. Cloudflare Workers are serverless JavaScript functions that run on Cloudflare's edge network, handling HTTP requests. We'll use Wrangler, Cloudflare's CLI tool, to develop and deploy. Key concepts: A "Worker" is the main script (e.g., worker.js) that responds to fetches; KV is a global key-value store for data persistence; Cron Triggers schedule tasks like notifications.

Create a new directory for the repo: mkdir subscription-app && cd subscription-app. Install dependencies globally if needed. Files we'll create: wrangler.toml (config), src/worker.js (main Worker code), src/index.html (frontend), src/app.js (client JS), src/styles.css (CSS).

## Plan of Work

Start by setting up the development environment with Node.js and Wrangler. Create a Cloudflare account if none exists, and link it to Wrangler. Initialize a Worker project that serves static frontend files and handles API routes for auth, subscriptions, and settings. Use Workers KV to store user credentials (hashed passwords), subscription lists, and email configs. For the frontend, build a single-page app with HTML/JS that fetches data via API, shows a login form, home page with subscription table, settings for password/email, and a modal for adding subscriptions. Schedule notifications using Cron Triggers in the Worker to check reminder times and "send" emails (log for now). Add basic security like JWT for sessions.

Break into milestones: First, auth and storage; second, frontend structure; third, subscription features; fourth, scheduling.

## Concrete Steps

1. Install Node.js (v18+): Download from nodejs.org if not installed. Verify: node -v.

2. Install Wrangler globally: npm install -g wrangler. Login: wrangler login (opens browser for Cloudflare auth).

3. Create project: wrangler init subscription-app --type=javascript. This generates wrangler.toml and src/index.js (rename to worker.js).

   Expected output in terminal:
   ```
   Initialized project 'subscription-app'
   Created wrangler.toml
   Created src/index.js
   ```

4. In wrangler.toml, add KV binding: Under [kv_namespaces], add binding = "SUBS_KV", id = "<create via dashboard or CLI>". First, create KV: wrangler kv:namespace create SUBS_KV.

   Expected: Outputs namespace ID; paste into wrangler.toml as preview_id and id.

5. In src/worker.js, set up router for static files and API. Use itty-router or basic if/else for routes.

6. Implement auth: Default user 'admin' with password 'default' (hash with crypto.subtle). Store in KV under key 'user:admin'.

7. Frontend: Create src/index.html with login form, then home div for table, settings form, and modal div.

8. Client JS in src/app.js: Use fetch to API endpoints, e.g., /api/login, /api/subscriptions.

9. For notifications: In wrangler.toml, add [[triggers]], crons = ["* * * * *"] for every minute. In worker.js, add scheduled handler to check subscriptions.

10. Deploy: wrangler deploy. Access at <worker-name>.workers.dev.

Update this section as steps are refined.

## Validation and Acceptance

To validate: Run wrangler dev locally; open http://localhost:8787 in browser. Expect login page; enter default creds, see home with empty list. Add subscription via modal: Fill title="Test", desc="Reminder", time="2026-02-07T12:00", email="test@example.com"; save, refresh list, see row with those details. In settings, change password, log out/in with new one. For notifications, manually trigger scheduled event via wrangler or wait; check Worker logs for "Notification sent" message.

Run tests: Add simple unit tests in src/tests.js using Jest (install locally: npm i jest, run npm test). Expect: "All tests passed" with coverage for auth and subscription CRUD.

## Idempotence and Recovery

Steps like wrangler init can be re-run but may overwrite files; back up first. KV writes are idempotent if using put with overwrite. If deploy fails, check wrangler logs; rollback by deploying previous commit. Environment: Assumes macOS/Linux/Windows with Node; for issues, use Cloudflare dashboard to delete/recreate resources.

## Artifacts and Notes

Example diff for worker.js addition:
```
+ const router = Router();
+ router.get('/', () => new Response(HTML, { headers: { 'Content-Type': 'text/html' } }));
+ // Add more routes
```

Example KV put:
```
await SUBS_KV.put('user:admin', JSON.stringify({ password: hashed }));
```

## Interfaces and Dependencies

Use Node.js standard libraries in Worker: fetch, crypto. For router: npm i itty-router, import in worker.js: import { Router } from 'itty-router'.

In src/worker.js, define API interfaces like:
async function handleLogin(request) { /* return JWT if valid */ }

For KV: env.SUBS_KV.get(key), put(key, value).

Note: This plan was created based on Cloudflare Workers docs as of 2026; if APIs change, update in Surprises section.
