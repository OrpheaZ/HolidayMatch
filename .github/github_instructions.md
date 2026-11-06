# Holiday Match— GitHub Copilot Instructions

## Project Overview
Holiday Match is a responsive web application that helps parents find other families vacationing in the same destination during overlapping dates, so their children can meet peers who speak a shared language and are of a similar age.

The application is for parents only. Children do not create accounts or communicate directly through the application.

## MVP Scope
Implement only the following features unless explicitly requested otherwise:
- Parent registration, login, logout, and authenticated sessions.
- A family profile with a display name, optional short description, and children's age groups and languages.
- Create, view, edit, and delete family trips with destination, start date, and end date.
- Search for families whose trips overlap in destination and dates; filter by shared child language and similar age group.
- Send, accept, decline, and view parent-to-parent contact requests.
- A responsive dashboard and navigation.

Out of scope for the MVP: integrated chat, real-time notifications, child accounts, payments, and public child profiles.

## Architecture and Tech Stack
Use a classical client-server architecture:
- Frontend: HTML, CSS, Vanilla JavaScript (ES modules), Bootstrap 5.
- Backend: Supabase.
- Database: PostgreSQL.
- Authentication: Supabase Auth.
- Data access: Supabase JavaScript client and Supabase APIs.
- Build tools: Vite and npm.
- Hosting: Netlify.
- Version control: Git and GitHub.

Do not use React, TypeScript, another backend, or additional frameworks without an explicit request.

## Modular Design
- Organize code into small ES modules by responsibility (pages, components, services, utilities).
- Separate UI rendering, validation, authentication, and database access.
- Reuse components and avoid duplicated logic.
- Prefer clear, readable code over clever abstractions; add short comments for non-obvious decisions.
- Implement features incrementally and explain important changes in plain language.

## UI Guidelines
- Use semantic HTML, Bootstrap components and utilities, and minimal custom CSS.
- Build mobile-first, responsive and accessible interfaces with labeled forms, visible focus states, and useful error and loading states.
- Use a consistent color palette, typography, and icon style.
- Write user-facing text in German; keep code identifiers in English.
- Do not show private information in search cards.

## Pages and Navigation
Use reusable page modules and client-side routing with meaningful URLs:
- `/` — landing page.
- `/login` — login.
- `/register` — registration.
- `/dashboard` — authenticated overview.
- `/family` — edit family profile and child age groups/languages.
- `/trips` — list and manage own trips.
- `/trips/new` — create trip.
- `/search` — search matching families.
- `/requests` — manage contact requests.

Use Vite/Netlify history fallback configuration so direct navigation and page reloads work. Protect authenticated routes. Do not rely on client-side route protection as a substitute for database authorization.

## Database and Migrations
- Use Supabase as the backend and database for the app.
- Use PostgreSQL as the database, with tables for users, projects, tasks, etc.
- Use Supabase Storage for file uploads (e.g. task attachments).
- When changing the DB schema, always use migrations to keep track of changes.
- After applying a migration in Supabase, keep a copy of the migration SQL file in the code.
- Never edit existing migrations after they have been applied --> create a new migration for any changes to the DB schema.


## Authentication, Authorization, and Privacy

- Use Supabase Auth for user authentication and authorization.
- Implement RLS policies to restrict access to data based on user roles and permissions.


## Development Workflow
- Test empty states, invalid input, unauthorized access, overlapping date edge cases, and mobile layouts.
- Ask before making architectural changes or adding dependencies.
- When generating code, state which files change and how to run or verify the result.
