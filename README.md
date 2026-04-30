# Budget Basket

## STAR Narrative

### Situation
College students often need to stretch limited grocery budgets while still building practical weekly meal plans. Many tools either focus only on tracking spending after the fact or require too much manual effort to build a realistic list.

### Task
Build a Vite + React web app that helps students plan groceries before they shop, with two clear workflows:

- A guided generator for fast, budget-aware weekly lists.
- A hands-on builder for manual list control with live budget feedback.

### Action
Budget Basket was implemented with the following core capabilities:

- Created a landing page that introduces the product and routes users into both planning workflows.
- Added a grocery list generator that creates affordable weekly lists using income, budget, and preference inputs.
- Added an interactive grocery list builder with real-time budget tracking and manual item controls.
- Integrated runtime CSV-based grocery data loading so pricing and item metadata can be sourced from files.

The app builds its grocery pricing catalog from these runtime CSV files in `public/data`:

- `fruit-prices-2023.csv`
- `vegetable-prices-2023.csv`
- `beef.csv`
- `cuts.csv`

Data behavior:

- Fruit pricing uses fresh entries from `fruit-prices-2023.csv`.
- Vegetable pricing uses fresh, frozen, canned, and dried entries from `vegetable-prices-2023.csv`.
- Beef pricing uses the latest available retail values from `beef.csv` and latest specific cut prices from `cuts.csv`.
- Pantry staples and non-beef basics remain available from the built-in sample catalog to keep results practical.
- If any required CSV file is missing or invalid, the app falls back to the sample catalog.

### Result
The final product gives students a clearer way to make grocery decisions before purchase, balancing affordability and flexibility through both generated and manually curated list flows.

## Run The Project

- `npm install` installs dependencies.
- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run preview` previews the production build locally.

## AI Chat Setup

The floating AI chat box uses the OpenAI Chat Completions API.

1. Create a `.env` file in the project root.
2. Add `VITE_OPENAI_API_KEY=your_key_here`.
3. Optional: set `VITE_OPENAI_MODEL=gpt-4o-mini` (or another supported chat model).

Note: This demo calls the API directly from the browser for simplicity. For production, route requests through a backend so your API key is not exposed to clients.
