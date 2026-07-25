# Personal Finance Tracker — Frontend

A simple, no-framework web client for the Personal Finance Tracker app. Built with plain HTML, CSS, and vanilla JavaScript (fetch API, async/await) — no build step required.

Live app: https://clinquant-bubblegum-a0389d.netlify.app *(update with your stable Netlify URL)*
Backend repo: [link to backend repo]

## What this app does

Most personal finance apps tell you your balance. This one tells you what's actually **free to spend** — by subtracting money you've already committed elsewhere (EMI, rent, subscriptions) from your current balance. Before you log a spend, it checks whether that spend would eat into money reserved for a pending commitment, and warns you before you confirm it.

## Tech Stack

- HTML5 (semantic structure, no framework)
- CSS3 (custom properties / variables, no framework)
- Vanilla JavaScript (ES6+, `fetch`, `async/await`, DOM manipulation)
- No build tools, no bundler — open `index.html` directly or serve with any static file server

## Project Structure

```
frontend/
├── index.html      # Single-page app shell — login, signup, and dashboard sections
├── script.js        # All application logic (API calls, state, rendering, event listeners)
└── style.css        # Styling — layout, colors, responsive design
```

## Features

- **Auth** — signup, login, JWT-based session (persisted via `localStorage`, survives page refresh)
- **Balance** — view and manually update current balance
- **Free-to-Spend** — live calculated figure: current balance minus all pending commitments
- **Commitments** — add recurring/one-time obligations (name, amount, due date, frequency), mark as paid, view list
- **Transactions** — log spends and income; transaction history (most recent first, scrollable)
- **Risk Check** — before saving a spend, the app checks if it would push you below zero on committed funds. If so, a warning modal shows exactly how much it would eat into, letting you proceed or cancel before anything is saved

## Configuration

The backend API URL is set in `script.js`:

```javascript
const API_BASE_URL = "http://<your-backend-host>:8080/api";
```

Update this line to point at your backend:
- Local development: `http://localhost:8080/api`
- Deployed backend (EC2): `http://<EC2-public-IP>:8080/api`

## Running Locally

1. Make sure the backend is running (see backend repo README) and `API_BASE_URL` in `script.js` matches its address.
2. Open `index.html` with a local static server — e.g. VS Code's **Live Server** extension (don't open via `file://`, `fetch` behaves inconsistently with it).
3. Sign up, verify your email (if verification is enabled on the backend), log in, and start using the dashboard.

## Deployment

Deployed as a static site on **Netlify**:
- Build command: none
- Publish directory: `.` (repo root)

Any push to `main` triggers an automatic redeploy.

**Note:** if the backend's public IP changes (e.g. after stopping/restarting the EC2 instance without an Elastic IP), update `API_BASE_URL` in `script.js`, commit, and push to redeploy the frontend with the new address. Also ensure the backend's CORS configuration allows this frontend's deployed origin.

## API Endpoints Used

All protected endpoints require an `Authorization: Bearer <token>` header, set after login.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/save` | POST | Signup |
| `/api/auth/login` | POST | Login, returns JWT |
| `/api/auth/verify` | GET | Email verification |
| `/api/balance` | PUT | Set/update current balance |
| `/api/balance/free-to-spend` | GET | Get free-to-spend figure |
| `/api/balance/check-risk` | POST | Preview whether a proposed spend is risky |
| `/api/commitments` | GET / POST | List / create commitments |
| `/api/commitments/{id}/pay` | PATCH | Mark a commitment as paid |
| `/api/transactions` | GET / POST | List / log transactions |

## Known Limitations (by design, for hackathon scope)

- Marking a commitment "Paid" updates its status only — it does not automatically log a corresponding transaction or adjust the balance. These are intentionally separate actions.
- Email verification (if enabled on the backend) requires working SMTP; disable the login gate on the backend if this isn't reliable in your deployment environment.
- JWT is stored in `localStorage` for session persistence — acceptable for a demo/hackathon context, not hardened against XSS for production use.
