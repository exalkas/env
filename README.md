# Green Energy Trading Marketplace

A development platform for environmental-asset trading, market information and education. The repository contains a FastAPI backend and three Next.js applications: a marketing site, a client marketplace and an administration dashboard.

Features under development include buy/sell orders, matching, market and news views, subscriptions, KYC workflows, learning paths, interactive lessons and certificates. It is intended for developers exploring green-energy marketplace and education workflows. Sample asset prices are demonstration data, not live market quotes. This repository does not establish a licensed exchange, verified pricing feed or production-ready compliance system.

## Run locally

Prerequisites: Python 3.10+, Node.js 18+, PostgreSQL and, for features that use it, Redis.

1. In `backend`, create a virtual environment and install `requirements.txt`.
2. Copy `backend/.env.example` to `backend/.env`. Supply your own PostgreSQL password and a persistent `SECRET_KEY` of at least 32 characters. Alternatively supply `SQLALCHEMY_DATABASE_URI` as a full connection URL. The backend URL-encodes credentials when assembling a URL from individual fields.
3. From `backend`, run `python -m alembic upgrade head`, then `python run.py`. Review migrations and use a separate development database. The API defaults to port 8000.
4. In each desired frontend (`landing-page`, `clients-app`, `admin-app`), run `npm install`, then `npm run dev`. Choose distinct ports when running them together, for example `npm run dev -- --port 3001`. Configure the frontend API URL and backend CORS origins for your local setup.
5. To create an administrator, export `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the process environment before explicitly running `python create_admin.py` from `backend`.

Email is disabled by default. Configure SMTP locally before enabling it. Stripe and AI features also require independently configured local credentials; add provider keys only to the ignored `.env` or process environment. No credential values or database exports are distributed. Credentials must never be placed in browser-visible `NEXT_PUBLIC_` variables.

Database utilities and deployment scripts are administrative tools: review them before use. Resetting a database requires `ADMIN_DATABASE_URL` and the explicit `--reset` option. Deployment workflows are manual; deployment helpers require an existing private environment file through `GREEN_ENERGY_ENV_FILE`. Publishing source does not deploy a service.

## Validation

Run `python -m unittest discover -s backend/tests -v` for configuration checks. These checks do not contact databases or external providers. End-to-end operation, migrations and live integrations require a separately configured development environment.

## License

MIT. See [LICENSE](LICENSE).
