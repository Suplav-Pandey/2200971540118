# URL Shortener – Affordmed Frontend Assignment

## Features
- Shorten up to 5 URLs at once
- Optional shortcode and validity input
- Auto-expiry after 30 minutes if not provided
- Detailed stats with click tracking
- Fully responsive UI using Material UI

## Tech Stack
- React (V0-generated)
- React Router
- TypeScript (if used)
- Material UI
- Custom Logging Middleware

## Screenshots
(see `/screenshots` folder)

## Logging Integration
All actions (validation, errors, user interaction) are logged to the Affordmed evaluation server using the required `log()` middleware. Middleware is located in:
- `/Logging Middleware/log.ts`
- `/Frontend Test Submission/src/utils/logger.ts`

## Run Locally
```bash
cd "Frontend Test Submission"
npm install
npm run dev
