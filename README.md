# Budget Basket

Budget Basket is a Vite + React website for college students who want a clearer way to plan groceries around real budget limits.

## Features

- A landing page that explains the product and routes users into the two main flows.
- A grocery list generator that creates an affordable weekly list based on income, budget, and preferences.
- An interactive grocery list builder with real-time budget tracking and manual item controls.
- CSV-backed grocery data loading so both calculators can use file-based pricing and item metadata.

## CSV data

The app now builds its grocery pricing catalog from these runtime CSV files in public/data:

- fruit-prices-2023.csv
- vegetable-prices-2023.csv
- beef.csv
- cuts.csv

The calculators use those files for fruit, vegetable, and beef pricing, then keep a small set of pantry staples and non-beef basics from the built-in sample catalog so the generated lists remain practical.

Current data rules:

- Fruit pricing uses fresh entries from fruit-prices-2023.csv.
- Vegetable pricing uses fresh, frozen, canned, and dried entries from vegetable-prices-2023.csv.
- Beef pricing uses the latest available retail values from beef.csv and the latest specific cut prices from cuts.csv.
- If any required CSV file is missing or invalid, the app falls back to the sample catalog.

## Scripts

- `npm install` to install dependencies.
- `npm run dev` to start the local development server.
- `npm run build` to create a production build.
- `npm run preview` to preview the production build locally.

## AI chat setup

The floating AI chat box uses the OpenAI Chat Completions API.

1. Create a `.env` file in the project root.
2. Add `VITE_OPENAI_API_KEY=your_key_here`.
3. Optional: set `VITE_OPENAI_MODEL=gpt-4o-mini` (or another supported chat model).

Note: This demo calls the API directly from the browser for simplicity. For production, route requests through a backend so your API key is not exposed to clients.