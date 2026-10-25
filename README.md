# Photopik

A self-hosted, provider-agnostic text-to-image playground.

Photopik is a single-process web app for generating images from text prompts. You pick a model, write a prompt, tune the parameters that model actually supports, and generate. Images are saved to disk on your machine, and every attempt — success or failure — is recorded in a local SQLite database.

## Philosophy

1. **Providers are interchangeable.**  
   Every provider follows the same `GenerationProvider` contract, accepting a shared `GenerationRequest` and returning a shared `GenerationResult`. Providers are accessed through a registry, so adding or replacing one requires minimal changes.

2. **Only send supported parameters.**  
   Each model declares its `supported_parameters`. The UI and API requests adapt to those declarations, ensuring unsupported parameters are disabled, filtered out, and validated against the model's allowed values and ranges.

3. **Every generation is tracked.**  
   The generation service manages the entire lifecycle: creating a record, calling the provider, saving the image, and recording success or failure. Metadata and logs are stored in SQLite, while image files remain on disk for traceability.

4. **Handle errors at the correct layer.**  
   Providers raise exceptions instead of returning error objects. The generation service records failures and re-raises them, while the HTTP layer maps each exception to the appropriate status code. Errors are never silently swallowed or unnecessarily generalized.

## Who is it for?

**For you, if you:**

- Have an OpenRouter API key and want one clean UI over many image models, instead of a different playground per vendor.
- Want to run image generation on your own machine, with your images and history staying on your disk.
- Are building or learning about provider abstractions, and want a small, layered codebase where each boundary is explicit and tested.
- Plan to add your own provider — a local model, another API — without rewriting the app around it.

**Not for you, if you need:**

- A multi-user product. Photopik has no accounts, no auth, and no billing. It assumes a single trusted user.
- A public hosted service. There is no job queue, no rate limiting, and generation is synchronous per request.
- Persistent, shared history. The UI history is session-only by design; the database keeps an audit log, not a gallery.

Photopik is a personal tool built to stay personal: easy to run, easy to read, easy to extend.

## Features

- **Live model catalogue** — models are fetched from OpenRouter at runtime and cached for 10 minutes, so new models appear without code changes.
- **Capability-driven controls** — aspect ratio, resolution, output format, quality, seed, and negative prompt appear or enable only when the selected model declares support for them.
- **Reproducible results** — set a seed to recreate an image, or let Photopik pick a fresh one per run. The seed actually used is stored with every generation.
- **Variants in one run** — generate multiple images per prompt (up to each model's declared limit).
- **Custom dimensions** — override aspect ratio and resolution with explicit width and height (256–4096 px).
- **Session history** — the last 12 generations stay one click away; restoring one brings back its prompt, model, seed, and size.
- **Full audit trail** — every attempt is a row in SQLite with status, duration, error, and output path; app logs are stored alongside it.
- **Light and dark themes**, responsive layout for mobile, and settings that persist in the browser.

## Quickstart

**Prerequisites:** Python 3.14 and [uv](https://docs.astral.sh/uv/). An [OpenRouter API key](https://openrouter.ai/keys) is required to generate images — the UI loads without one, but generation will report the provider as unavailable.

```bash
# 1. Install dependencies
uv sync

# 2. Configure your key (server-side only — never exposed to the browser)
#    Create a .env file in the project root containing:
# OPENROUTER_API_KEY=sk-or-...

# 3. Run the dev server
.venv/bin/python commands/run.py
```

Then open **`http://localhost:8000/`** in your browser.

That is the whole setup. The database (`db.sqlite3`) and output directory (`output/`) are created automatically on first use. Generated images land in `output/YYYY-MM-DD/`.

To check the database is healthy at any time:

```bash
.venv/bin/python commands/health_check.py
# OK: database reachable, tables present: app_logs, generations
```

## Configuration

Everything is configured through environment variables (loaded from `.env`). No config files to edit.

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | _(empty)_ | OpenRouter key. Required to generate; without it the provider reports itself unavailable with the reason. |
| `FLASK_ENV` | `prod` | Selects `dev` / `prod` / `test` config. `commands/run.py` pins this to `dev` for you. |
| `DATABASE_PATH` | `db.sqlite3` in the project root | SQLite file location. `DATABASE_URL` is also honoured by the DB layer. |
| `OUTPUT_DIR` | `output/` in the project root | Where generated images are written. |
| `SECRET_KEY` | random per process | Flask secret. Set it explicitly anywhere the value must survive restarts. |
| `CORS_ORIGINS` | `*` in dev, empty in prod | Allowed CORS origins (prod: comma-separated). |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Bind address for `commands/run.py` (`--host`/`--port` flags win). |
| `ENABLE_LOCAL_MODELS` | `false` | Reserved for the planned local provider. Currently read by config but not yet acted on. |

## Development

```bash
# Run the test suite
.venv/bin/python -m pytest tests/ -q

# Start the dev server (with reloader) on a different port
.venv/bin/python commands/run.py --port 8123

# Verify the database from scripts or CI (exit 0 = healthy, 1 = not)
.venv/bin/python commands/health_check.py
```

`commands/run.py` is a local development server only — it always uses the `dev` config and the Flask dev server. Do not deploy with it. For production, serve the app factory with Gunicorn (already a dependency), for example `gunicorn --bind 0.0.0.0:8000 'app:create_app()'`, behind your reverse proxy of choice.

Tests are small and focused on purpose: app-factory wiring and the end-to-end generation path with a fake provider (`tests/test_backend_wiring.py`), the health-check command (`tests/test_db_health.py`), and the run command (`tests/test_run.py`). No test calls OpenRouter.

## License

The Photopik project itself — its source code, templates, and documentation — is licensed under the Apache License 2.0 — see [LICENSE](LICENSE).

That license covers Photopik only. It does not extend to the models you use through it, or to the images and other data they generate:

- **Models** remain subject to their own licenses and terms, set by each model's provider (for OpenRouter models, the model author's license and OpenRouter's terms). A model being reachable through Photopik does not make it Apache-licensed.
- **Generated output** — images and any other data produced by a model — is subject to that model's license and the provider's terms of use, which may restrict commercial use, redistribution, or other uses. Those terms, not this project's license, govern what you may do with generated content.
- **Your inputs** (prompts and parameters) are sent to the provider you select, under that provider's terms and privacy policy.

Check the applicable model license and provider terms before using generated content, especially commercially. Photopik's authors take no rights over your inputs or outputs and give no warranty that any model's terms permit a particular use.
