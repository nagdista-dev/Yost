# Yost - Local YouTube Posts Dashboard

Yost is a locally-hosted dashboard that allows you to cleanly view the latest community posts from your favorite YouTube channels in one place.

## Architecture

Yost is split into two distinct parts:

1. **Frontend:** A React application built with Vite and Tailwind CSS.
2. **Backend:** A Node.js Express server that uses Puppeteer (with Stealth plugin) to scrape the YouTube Community tabs.

## Prerequisites

- Node.js (v18+ recommended)
- Chromium or Google Chrome (Puppeteer will automatically download a compatible version of Chromium, but you need standard OS dependencies to run it)

## Getting Started

Because Yost is designed to run locally, we use `concurrently` to spin up both the backend and frontend simultaneously with a single command from the root directory.

### 1. Install Dependencies

First, install the dependencies for the root, frontend, and backend folders:

```bash
npm run install:all
```

*This command will run `npm install` in the root directory, `frontend`, and `backend` respectively.*

### 2. Run the Application

To start the application locally, run the following command from the root directory:

```bash
npm run dev
```

This single command will:
- Start the Vite development server for the frontend (typically on `http://localhost:5173`)
- Start the Express backend on port `3000`

### 3. Usage

1. Navigate to the frontend URL provided in your terminal (usually `http://localhost:5173`).
2. Click **Add Channel** to add a new YouTube handle (e.g., `@MKBHD` or `@MrBeast`).
3. The backend will use headless Chrome to visit the channel's `/community` tab and extract recent posts.
4. Posts will display in a clean, ad-free UI. You can also organize channels into categories, export/import your feeds, and switch between Light/Dark/OLED modes!

## Why Local?

Yost relies on scraping YouTube via Headless Chrome (`puppeteer`). Web scraping tools of this scale often hit CAPTCHAs, bot protections, or IP blocks when hosted on cloud servers (like Vercel, Render, AWS, etc.). Running it locally from your own IP address heavily mitigates these issues and is perfectly suited for a private feed dashboard!
