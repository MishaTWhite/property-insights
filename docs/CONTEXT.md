🎯 Purpose of the Project
Automate discovery of real-estate offers (initially from Otodom) and alert investors when an object’s projected rental yield exceeds a defined threshold, saving time and capturing the best deals faster than manual search allows.

🗺️ End-to-End Data Flow
mermaid
Copy
Edit
flowchart LR
    A[Cron Scheduler] --> B(Scraper Service)
    B --> C{Raw<br>Data Store}
    C --> D(Enrichment Layer)
    D --> E{Enriched<br>Store}
    E --> F(GPT Estimator)
    F --> G{Analysis<br>Store}
    G --> H(Filter Engine)
    H -- passes --> I[Telegram Notifier]
    H -- fails --> J[Archive Only]
The Cron Scheduler is implemented inside the project (APScheduler or simple schedule loop) and runs in its own Docker container.

🧩 Module Responsibilities (high-level)
Module	Key Functions	In	Out
scraper	Fetch HTML, parse raw listing data, handle rate limits	Cron trigger	raw_listing JSON
enrichment	Geocode, download Static Map & Street View, district lookup, distance calc	raw_listing	enriched_listing
analysis	Prompt GPT/DeepSeek, compute ROI %, flag low confidence	enriched_listing	analysis_record
storage	Persist raw / enriched / analysis in SQLite (later Supabase)	All stages	N/A
notifier	Filter by ROI & district, rate-limit alerts, send Telegram album	analysis_record	TG messages
infra	Docker & docker-compose, Cron Scheduler, logging	N/A	Running services

🔐 Global Rules & Conventions
Rate limits
Scraper waits ≥ 30 min between hits to the same search URL; exponential back-off on 403/429.

Logging
JSON lines, UTC timestamps; emoji prefix per module (🏠 scraper, 🗺️ enrichment, 💡 analysis, 🗄️ storage, 🔔 notifier, 🚨 critical).

Error handling
After 3 consecutive critical errors in any module, send alert to admin TG chat and pause that module for 6 h.

Environment configuration
All secrets via .env; a .env.sample documents required variables.

Testing fixtures
Scraper unit tests must rely only on offline HTML fixtures stored in scraper/fixtures/.

🔄 Iterative Roadmap
MVP: Otodom only, Wrocław, Telegram bot, ROI filter.

Add OLX source + district allow-list.

Supabase & web dashboard.

User feedback loop (save/skip → model tuning).

Paid tier & multi-city expansion.

🔗 Related Documents
CODING_GUIDE.md — language, style, tooling

TEST_STRATEGY.md — unit, integration & CI policy

MODULE_GUIDE.md — detailed APIs of every subpackage

RISK_REGISTER.md — full risk list & mitigations

ANALYTICS_OVERVIEW.md — business context & planned K