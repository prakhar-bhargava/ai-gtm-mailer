# Diagrams

Two views of the build, drawn in Mermaid so GitHub renders them in place. The logic diagram follows one prospect through every check and decision. The architecture diagram shows where each piece runs and what it talks to. Blue marks the run's only model call.

## Logic: one prospect, start to finish

```mermaid
flowchart TD
    input(["Rep enters a prospect<br/>name, company, website, recipient email<br/>optional: role, pasted LinkedIn text, notes"])
    identity["1 Find the website<br/>does it answer? typed site trusted, guess labelled<br/>pasted LinkedIn text becomes cited signals"]
    stopped[/"Stopped<br/>names the step and the error"/]
    site["2 Read the site<br/>headless browser: home and about<br/>robots.txt respected"]
    links["3 Follow its links<br/>up to 8 pages: careers, newsroom, blog<br/>company RSS or Atom feed<br/>job boards, dated posts, social links (never opened)"]
    news["4a Recent news<br/>Google News x2 + Bing News, merged<br/>same-company check in code:<br/>name as a word, not another name,<br/>not another field, not a twin story"]
    jobs["4b Open roles<br/>Greenhouse, Ashby, Lever,<br/>SmartRecruiters, Workable<br/>finance roles apart from sales roles"]
    rank["5 Rank the angles, 0 to 100<br/>relevance from the seller-brief lexicon<br/>recency, verifiability, authorship, seniority from the source<br/>sensitive topics blocked; mentions and questions capped at 49"]
    gate{"Best angle<br/>50 or more?"}
    abstain[/"Abstain<br/>no email; says why and<br/>offers three value-led templates"/]
    write["6 Write: the run's one Gemini call<br/>top 3 angles with sources, a customer story,<br/>approved figures; picks one angle and says why"]
    check["7 Check, in code<br/>each claim: numbers in the source, 60% of its words,<br/>the company is the subject<br/>mail: subject names company and outcome,<br/>50+ words, one question, no unsourced figure"]
    ready{"Every claim backed<br/>and no issues?"}
    ok(["Ready to review"])
    warn(["Check before sending"])
    human["Rep edits, picks a mail design (Letter, Card, Quote),<br/>then Open in Gmail or save to the Outbox.<br/>The rep presses Send. Nothing sends by itself."]

    input --> identity
    identity -- "no answer" --> stopped
    identity --> site --> links
    links --> news & jobs
    news --> rank
    jobs --> rank
    rank --> gate
    gate -- no --> abstain
    gate -- yes --> write --> check --> ready
    ready -- yes --> ok --> human
    ready -- no --> warn --> human

    classDef model fill:#e6edff,stroke:#1a54ff,stroke-width:2px,color:#0b1638
    classDef good fill:#e2f3ef,stroke:#0e7c6b,color:#0b3b33
    classDef caution fill:#fbeedb,stroke:#9a5700,color:#4a2a00
    classDef stop fill:#f8e4df,stroke:#a3341f,color:#4a160c
    class write model
    class ok good
    class warn caution
    class stopped,abstain stop
```

## Architecture: where it runs

```mermaid
flowchart LR
    subgraph browser["Rep's browser"]
        direction TB
        pages["Landing, New run"]
        runview["Run view<br/>steps, findings feed,<br/>writing preview, letter, mail designs"]
        dash["Dashboard, Outbox,<br/>Accounts, Search"]
        gmail["Gmail compose tab<br/>opened by a link; formatted<br/>version pasted from the clipboard"]
    end

    subgraph server["Next.js server, local"]
        direction TB
        api["API routes<br/>POST /api/runs<br/>GET /api/runs/:id/stream (SSE)<br/>POST /api/runs/:id/send<br/>POST /api/runs/recheck, /rerun"]
        pipeline["Pipeline, lib/pipeline<br/>identity, site, links, news + jobs,<br/>rank, write, check<br/>usage meter on every run"]
        config["Rules, config/*.json<br/>seller brief and proof,<br/>angle lexicon, rubric, mail rules"]
        sources["Sources, lib/sources<br/>crawler (Playwright), feeds,<br/>Google News, Bing News, job boards<br/>8 s timeout, one 429 retry, cache"]
        llm["Model client, lib/llm.ts<br/>4 calls a minute at most<br/>retry and model fallback<br/>zod-checked JSON, thinking off"]
        db[("SQLite, data/app.db<br/>runs and events, outbox,<br/>accounts, cache, settings")]
    end

    subgraph outside["Outside, no key unless noted"]
        direction TB
        sites["Company websites<br/>and their feeds"]
        newsfeeds["news.google.com,<br/>bing.com/news RSS"]
        boards["Greenhouse, Ashby, Lever,<br/>SmartRecruiters, Workable"]
        gemini["Gemini API (key)<br/>flash, then flash-lite"]
        linkedin["LinkedIn<br/>never fetched"]
    end

    pages -- HTTP --> api
    runview -- SSE --> api
    dash --> api
    runview -. "Open in Gmail" .-> gmail
    api --> pipeline
    config --> pipeline
    pipeline --> db
    pipeline --> sources
    pipeline --> llm
    sources --> sites
    sources --> newsfeeds
    sources --> boards
    llm --> gemini

    classDef model fill:#e6edff,stroke:#1a54ff,stroke-width:2px,color:#0b1638
    classDef never fill:#ffffff,stroke:#a3341f,stroke-dasharray:4 4,color:#a3341f
    class llm,gemini model
    class linkedin never
```

## Per draft

| | |
|---|---|
| Model calls | 1 |
| Tokens | about 1,300 to 1,800 (in, out; thinking off) |
| Paid sources | none |
| Free requests | about 7 to 20: site pages, its feed, three news feeds, job boards |
| Cache | 24 hours: a repeat run reads pages, feeds and answers locally |

A styled version of the same diagrams is published as a private page: https://claude.ai/artifact/NF2XW3hkjNeVbKuJgWQHGn (open it from your claude.ai account).
