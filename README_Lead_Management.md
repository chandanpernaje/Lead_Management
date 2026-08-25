# Project Catalyst

This is a task given by one company for me so ananlyse and requirements based on that create if it's simple also okay it shud be work 100% do all frontend they said in pdf do like

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/037cacd5-d68a-43a5-ad0e-b2bd6dc3fb94).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Tech Stack

Here is the complete breakdown of all the technologies, frameworks, libraries, and tools utilized in this repository:

### Core Technologies
- **React (v19)**: The foundational UI library for building component-based interfaces.
- **TypeScript**: Used extensively for strong static typing, ensuring fewer runtime errors and better developer experience.
- **Vite (v8.1.5)**: A blazing fast frontend build tool and development server.

### Full-Stack & Routing (TanStack Ecosystem)
- **TanStack Start**: A full-stack React framework powered by TanStack Router. It handles server-side rendering (SSR), API routes, and full-stack data fetching.
- **TanStack Router**: Used for type-safe routing across the application.
- **TanStack Query (React Query)**: Powerful asynchronous state management used for data fetching, caching, synchronizing, and updating server state.

### Styling & UI Framework
- **Tailwind CSS (v4)**: Utility-first CSS framework for rapid UI styling directly in the markup.
- **shadcn/ui**: Reusable component architecture. Components are built on top of Radix UI primitives and styled with Tailwind CSS (configured in `components.json`).
- **Radix UI**: Headless, accessible UI primitives (dialogs, popovers, accordions, tabs, etc.) that power the `shadcn/ui` components.
- **Lucide React**: The icon library used throughout the application.

### State, Forms, and Validation
- **React Hook Form**: Performant, flexible, and extensible forms with easy-to-use validation.
- **Zod**: TypeScript-first schema declaration and validation. Used extensively alongside React Hook Form for validating form inputs.
- **@hookform/resolvers**: Bridges Zod schemas directly into React Hook Form.

### Backend / BaaS (Backend-as-a-Service)
- **Supabase (`@supabase/supabase-js`)**: An open-source Firebase alternative. Used for PostgreSQL database access, authentication, real-time subscriptions, and storage.

### Specialized UI Libraries
- **Recharts**: A composable charting library built on React components for data visualization.
- **Embla Carousel**: A lightweight carousel library for React.
- **React Day Picker** & **date-fns**: Used for handling calendars and date manipulation.
- **Sonner**: An opinionated toast component for React, providing beautiful and responsive notifications.
- **Vaul**: A drawer component for React used typically for mobile-friendly bottom sheets.
- **React Resizable Panels**: Used to create resizable split-pane layouts.

### Tooling & Quality Assurance
- **ESLint**: Linter for identifying and reporting on patterns found in ECMAScript/JavaScript code.
- **Prettier**: Code formatter ensuring consistent style across the codebase.

## Architecture and Design Decisions

- **Frontend & Backend Architecture**: The application uses **TanStack Start**, which allows us to write full-stack React applications securely. The server functions (like `apiListLeads`) act as our backend APIs, validating inputs server-side with Zod before communicating with the database.
- **Database Choice & Mobile Compatibility**: **Supabase (PostgreSQL)** was chosen for the database. By utilizing Supabase, the backend inherently provides a REST API (PostgREST) which can be consumed by any future mobile application easily.
- **Authentication**: Handled via Supabase Auth. Only authenticated users can access the system. The application defaults the `admin` username to an internal email so standard auth patterns work flawlessly.
- **Duplicate Lead Handling**: Handled at the database level using `UNIQUE INDEX` on `email` and `mobile` fields. If a user tries to create a duplicate lead, the backend catches the constraint violation and gracefully returns a user-friendly error to the frontend.
- **Error Reporting**: Handled securely via `try/catch` and UI-friendly toast notifications via Sonner.

## Assumptions

- **Lead Status Pipeline**: Assumed a flexible pipeline: `New -> Contacted -> Proposal Sent -> Negotiation -> Won | Lost`.
- **Admin Assignment**: Assumed leads are assigned to internal team members. A mock team member table is pre-populated in the database.
- **Estimated Value Currency**: Assumed generic numeric values (stored as `NUMERIC(12,2)`) and formatted dynamically on the frontend.
