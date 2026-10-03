# How existing AI sales-outreach tools structure "prospect -> research -> hook -> draft -> human review"

Scope: Clay (Claygent), Apollo AI, Lavender, Regie.ai, 11x (Alice), Artisan (Ava), Unify, Smartlead/Instantly, Amplemarket Duo, HubSpot Breeze Prospecting Agent, Salesforce Agentforce SDR, Common Room. Researched 2026-10-03. Several sources are vendor pages or vendor-authored blogs (Instantly, Apollo, Common Room, Octave); some third-party "AI SDR" blogs (leadgen-economy.com, salesmotion.io) are low-provenance and flagged where used.

## 1. Workflow and UI patterns per tool (research sources, personalisation choice, reasoning/citations, run views, confidence, approval queues)

### Takeaway
The market has converged on a pipeline of structured "research columns/fields" feeding a variable inside an email template or sequence, followed by an optional review step. Only a few tools surface the evidence behind a hook: Clay markets "glass box" reasoning traces and Apollo has a "Show citations" toggle. Almost no tool documents a way to choose one hook among candidates, give a confidence-gated abstain, or filter sensitive topics.

### Cited Findings

**Clay / Claygent**
- Positioned as a platform to "build, test, and deploy GTM agents that research the web, execute plays, and orchestrate workflows"; markets "full visibility into every agent's decision" as a "glass box, not black box." — [Clay Claygent page](https://www.clay.com/claygent?rd=1)
- Two agent types: general-purpose Claygents run per row in Tables/Workflows (web research lookups), and Account Agents run in "Audiences" with persistent memory and CRM/warehouse sync. A native "Sequencer" also exists. — [Clay Claygent page](https://www.clay.com/claygent?rd=1)
- Example outputs: picking the best contact from professional history and published content, writing personalised email copy from recent news and job postings, and ranking leads 1-10 on headcount, industry, tech stack and growth signals. — [Clay Claygent page](https://www.clay.com/claygent?rd=1)
- Clay's community forum has threads titled "investigating claygent's confidence levels," "despite the high confidence claygent still shows r[esults]..." and "does claygent hallucinate if I input too many steps." These suggest users see a confidence signal that does not always match accuracy. The thread bodies could not be fetched, so treat this as indicative only. — [Clay community thread list via search](https://community.clay.com/x/support/cczx0bczxqul/despite-the-high-confidence-claygent-still-shows-r); [hallucination thread](https://community.clay.com/x/support/amg4sruei9sl/does-claygent-hallucinate-if-i-input-too-many-step)
- UI pattern: a spreadsheet table where each research step is a column, with waterfall enrichment trying data providers in sequence until one returns a value. Corroborated only by third-party guides. — [Findymail on Clay enrichment](https://www.findymail.com/blog/clay-data-enrichment/); [Databar 2025 guide](https://databar.ai/blog/article/clay-lead-enrichment-complete-2025-guide-top-alternatives)

**Apollo AI Research**
- Three ways to prompt: template prompts from Apollo's library, "assisted" mode (Apollo writes the prompt from a stated goal), or a fully custom prompt. — [Apollo Knowledge Base: Use AI Research](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)
- Outputs land in custom AI research fields typed as single-line text, multi-line text (emails, scripts) or a single-select picklist (yes/no filters). — [Apollo KB](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)
- An "Insert AI variable" option drops the research into sequence emails. A "Show citations" checkbox appends sources to the research output. — [Apollo KB](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)
- Previews are free (up to 3 per prompt) before a credit-consuming full run, a useful "test on a few rows first" pattern. Apollo itself says "You should always proofread and spot-check AI generated emails or messages." — [Apollo KB](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)
- The specific data sources are not listed; one example prompt says "Search only LinkedIn or Facebook posts." — [Apollo KB](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)

**Lavender**
- Core product is an email coach: it scores emails in real time against data from "billions of emails analyzed" and learns from the team's historic emails. Its 2025 agent, "Ora," writes emails "like a top seller" and adds CRM enrichment. The rep keeps control of sending. — [Lavender homepage](https://www.lavender.ai)
- Pattern worth borrowing: a score/coach overlay on the draft that critiques it, rather than only generating text.

**Regie.ai (RegieOne)**
- An "agentic sales workspace with built-in enrichment, emailing, dialing and workflows" driven through one chat interface. It "learns your voice and your company's pitch, finds the why-now on every account." G2's AI-SDR evaluation rates it L3 autonomy, with only partial support for reply/objection handling. — [G2 AI SDR evaluation: RegieOne](https://ai.g2.com/evaluations/categories/ai-sdr/regie-ai-regieone)

**11x (Alice)**
- Alice 2.0 (rebuilt and launched January 2025) uses a supervisor agent with sub-agents: Research, a "Positioning report generator" (how to frame the product for this prospect), a LinkedIn message writer and an Email writer. Audience creation is separate. It is chat-first, built on LangGraph with LangSmith observability, and uses OpenAI and Anthropic models. — [ZenML LLMOps database case study](https://www.zenml.io/llmops-database/rebuilding-an-ai-sdr-agent-with-multi-agent-architecture-for-enterprise-sales-automation)
- The case study does not describe a human approval workflow. — [ZenML](https://www.zenml.io/llmops-database/rebuilding-an-ai-sdr-agent-with-multi-agent-architecture-for-enterprise-sales-automation)

**Artisan (Ava)**
- LinkedIn banned Artisan around 19 Dec 2025, citing its use of LinkedIn's name on its site and data from third-party vendors that had scraped LinkedIn. Artisan was reinstated in early Jan 2026 after removing LinkedIn references and adding vendor-compliance verification. The CEO said "very little of the data Artisan uses comes from the site," and outbound calling was planned. — [TechCrunch, 7 Jan 2026](https://techcrunch.com/2026/01/07/yes-linkedin-banned-ai-agent-startup-artisan-but-now-its-back)
- No primary source on Ava's research or approval UI was retrieved (see Gaps).

**Unify**
- Agents "perform research and take actions," drawing on "public websites and specialized APIs and data sources." They are called inside "Plays" and "Sequences," and their research feeds "smart snippets" for personalisation. Uses include account qualification, lead scoring and personalisation. — [Unify docs: Agents overview](https://docs.unifygtm.com/reference/agents/overview.md)
- There is also an "always-on research" agent type, i.e. continuous monitoring rather than one-shot research. — [Unify docs: always-on research](https://docs.unifygtm.com/reference/agents/always-on-research)
- The overview page does not document citations or a review UI.

**Instantly / Smartlead**
- Instantly's AI Reply Agent drafts replies and flags ambiguous classifications for human review instead of auto-sending. Drafts appear in the "Unibox" with full thread history. Pricing/contract terms, security questionnaires, meeting requests, competitor comparisons and executive contacts force human takeover. Vendor-authored, updated June 2026. — [Instantly blog: AI SDR limitations](https://instantly.ai/blog/ai-sdr-limitations-honest-assessment/)
- Smartlead was not researched (see Gaps).

**Amplemarket Duo**
- A "personal sales assistant" (announced 13 Sep 2024, so older information) built on "more than 24 signal categories, including buying intent, social interactions, G2 reviews, Slack group conversations and recent job changes." It recommends accounts, finds prospects, drafts email/voice/text and handles objections. The CPO frames it as built to "augment the rep." The article does not describe approval flows. — [Demand Gen Report, Sep 2024](https://www.demandgenreport.com/?p=48249)

**HubSpot Breeze Prospecting Agent**
- Researches from HubSpot data plus "company websites, blog posts, and news publications." Personalises using deal history, support tickets and marketing engagement. Setup offers a choice between reviewing each message and automatic sends; guides recommend starting with manual review. — [Octave setup guide (2026)](https://www.octavehq.com/post/hubspot-breeze-prospecting-agent-setup-guide)
- Limits: 1,000 contacts researched/emailed per day; 100 credits per monitored contact per month. Octave reports it was "excluded from HubSpot's GPT-5 migration," that without external context emails "can feel generic," and that reasoning display is barely documented. — [Octave](https://www.octavehq.com/post/hubspot-breeze-prospecting-agent-setup-guide)

**Salesforce Agentforce SDR**
- Grounding: CRM merge fields (name, title, industry, company, lead source), "Data Libraries" (uploaded PDFs/HTML up to 100MB on product, pricing, methodology) and Data Cloud RAG. Prompt guardrails use "must" language, including "Use only the available data." — [Agentforce for Sales Development Implementation Guide (PDF)](https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/guides/Agentforce-for-Sales-Development-Implementation-Guide.pdf)
- Review surfaces: a preview panel in Agent Builder, a Testing Center for batch CSV tests, and scheduled emails shown on the lead's Activity Timeline where reps can "View, Edit, or Reschedule Email." Reps can activate the agent manually per lead. — [Implementation Guide](https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/guides/Agentforce-for-Sales-Development-Implementation-Guide.pdf)
- Limits/controls: up to 1,800 emails per day per agent; no more than 30 records activated at once; the opt-out field is enforced. When the agent doesn't know something it suggests a meeting with the lead owner, who is cc'd. A Control Center and event logs support auditing. — [Implementation Guide](https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/guides/Agentforce-for-Sales-Development-Implementation-Guide.pdf)

**Common Room (RoomieAI)**
- Aggregates first-, second- and third-party signals. "RoomieAI Spark" generates person-level summaries (recent activity, lead score, hiring trends, news, tech stack), and "RoomieAI Activate" drafts messages "based on the prospect's recent activities in real time." Reps get Slack alerts with contact info, engagement history and AI insights, plus one-click jumps to the profile, LinkedIn or a sequence. — [Common Room playbook](https://www.commonroom.io/playbooks/auto-deliver-prospect-intel-to-reps-with-an-ai-agent/)

### Inferences
- There are three dominant UI archetypes. (a) Table/column builders (Clay, Apollo, Unify) where each research step is an inspectable cell. (b) Chat-first autonomous agents (11x, RegieOne, Artisan). (c) CRM-embedded agents with timeline review (Agentforce, Breeze) or alerting (Common Room in Slack). A prototype that pairs a per-prospect "evidence card" with an approval queue sits between (a) and (c).
- "Hook selection" is implicit everywhere. Tools pass the whole research blob to the writer, and none documents ranking candidate hooks or explaining why one was picked. 11x's "positioning report" step comes closest.
- Citations are opt-in (Apollo) or framed as reasoning traces (Clay). Per-sentence claim-to-source linking in the final email was not found in any tool.

### Gaps
- No primary docs retrieved for Artisan Ava's research/approval UI, Smartlead's AI writer, Instantly's AI copywriter for first-touch emails, Amplemarket Duo's current (2025-26) approval UX, or Regie's review queue.
- Could not read the Clay community threads on confidence vs accuracy. Only their titles were visible.
- Clay waterfall details come from third-party guides; Clay University's Claygent page returned 404.

## 2. Criticisms: hallucinated personalisation, generic lines, deliverability, AI SDR churn

### Takeaway
The main criticisms are (1) "Mad Libs" personalisation that buyers spot as templated, (2) hallucinated facts about the prospect or product, (3) high-volume autonomous sending that damages domains, and (4) high early churn. 11x is the best-documented case: TechCrunch (Mar 2025) reported 70-80% early customer loss and disputed customer logos. Many of the specific statistics come from low-provenance blogs and should be treated with caution.

### Cited Findings
- 11x (TechCrunch, 24 Mar 2025): early employees said 70-80% of customers who signed up were lost. Three-month break clauses worked as trials while the company counted full-year "CARR." One employee estimated long-term revenue near $3M against a claimed ~$14M. ZoomInfo (a one-month trial) said the product "performed significantly worse than our SDR employees," and its lawyer threatened legal action over logo use. Airtable said the product "was never used in production." Sources said "the products barely work," customers had to manually verify the work, and there were hallucinations. — [TechCrunch](https://techcrunch.com/2025/03/24/a16z-and-benchmark-backed-11x-has-been-claiming-customers-it-doesnt-have)
- 11x said retention had improved to 79% after product refinements. This is the company's claim. — [TechCrunch](https://techcrunch.com/2025/03/24/a16z-and-benchmark-backed-11x-has-been-claiming-customers-it-doesnt-have)
- Practitioner quotes on generic output: "I expected the AI to research each prospect like a junior rep would. But all I got were Mad Libs with company names filled in." / "We tuned it for weeks. The emails still felt generic." / "It can blast emails all day, but the moment someone says something unexpected, it short-circuits." The same source reports contracts of $35k-$60k/year with limited trials (Apr 2025). — [Tian Pan field report, Apr 2025](https://tianpan.co/blog/2025-04-19-the-promise-and-pain-of-ai-sales-development-representatives-a-field-report)
- Shallow openers ("I noticed your company is doing amazing things in the [industry] space") "perform worse than no personalization." Documented hallucination types include invented product capabilities, fabricated security certifications and misquoted integrations, which create legal exposure. Bounce rate should stay ≤1%, and >5% is a red alert. 2026 average reply rate is 3.43%, top quartile 5.5%. Vendor blog, figures not independently verified. — [Instantly, Jun 2026](https://instantly.ai/blog/ai-sdr-limitations-honest-assessment/)
- LOW-PROVENANCE (unverified aggregator): claims 50-70% of managed AI SDR contracts are cancelled within 90 days, citing UserGems; gross retention below 50% for 11x and below 60% for Artisan and AiSDR; hallucination rates of 12-18% (attributed to "Coldreach 2026") and ">20%" on Alice (attributed to Michael Saruggia); spam complaints >0.3% triggering Gmail/Yahoo filtering; inbox placement falling below 60% by week four; viral screenshots of fabricated fundraising news and invented shared connections. It also proposes a buyer rubric: hallucination ≤5% on a held-out set, transparent data sources, a kill switch, and a manual review queue for the first 1,000 sends. — [leadgen-economy.com](https://leadgen-economy.com/blog/ai-sdr-cancellation-wave-failure-forensics/) (underlying sources not verified; treat figures as directional only)
- Gmail/Yahoo bulk-sender spam threshold of 0.3% is cited above. It is consistent with widely reported 2024 bulk-sender rules, but no primary Google/Yahoo page was fetched here.
- Artisan's LinkedIn ban (Dec 2025 to Jan 2026) shows the platform/legal risk of scraped-data personalisation. — [TechCrunch, Jan 2026](https://techcrunch.com/2026/01/07/yes-linkedin-banned-ai-agent-startup-artisan-but-now-its-back)
- HubSpot Breeze: emails "can feel generic" without data from outside HubSpot. — [Octave](https://www.octavehq.com/post/hubspot-breeze-prospecting-agent-setup-guide)
- RegieOne user complaints: hard initial setup and "AI accuracy issues understanding target audiences." — [G2 evaluation](https://ai.g2.com/evaluations/categories/ai-sdr/regie-ai-regieone)
- Clay users raise high-confidence wrong results and hallucination with long multi-step prompts (forum thread titles only). — [Clay community](https://community.clay.com/x/support/cczx0bczxqul/despite-the-high-confidence-claygent-still-shows-r)

### Inferences
- The consistent failure isn't a lack of personalisation. It's personalisation that can't be trusted. Reviewers can't quickly tell whether a "hook" is real, recent or appropriate, so either reviewing becomes slow (which defeats automation, as in the 11x reports) or nobody reviews and hallucinations ship.
- The market narrative in 2025-26 has moved from "replace SDRs" to "augment reps" (Amplemarket's framing, Instantly's HITL triggers, the hybrid playbooks). A prototype built around human review fits the current direction.

### Gaps
- No primary G2 review excerpts for 11x, Artisan or Smartlead were retrieved.
- No independently verified hallucination-rate benchmark was found. The 12-18% and >20% figures are second-hand.
- No 2026 TechCrunch follow-up on 11x churn was found in this pass.

## 3. Gaps a one-week prototype could address

### Takeaway
The clearest openings are (1) linking each claim in the draft to a source, (2) an explicit hook-ranking step that explains its choice and abstains when no hook clears a quality bar, (3) filtering sensitive or creepy topics, and (4) a review queue built for fast verification. Incumbents either don't document these or treat them as optional.

### Cited Findings
- Citations exist only as an opt-in toggle that appends sources to the end of the research, not linked to individual sentences of the email. — [Apollo KB](https://knowledge.apollo.io/hc/en-us/articles/29436100461837)
- Clay offers reasoning traces, but users report confidence that doesn't match accuracy. — [Clay](https://www.clay.com/claygent?rd=1); [Clay community](https://community.clay.com/x/support/cczx0bczxqul/despite-the-high-confidence-claygent-still-shows-r)
- Agentforce's abstain pattern sits at reply time ("If agent doesn't know the answer, suggests meeting with lead owner"), and its guardrail is a prompt instruction ("Use only the available data"), not a gate on hook quality. — [Agentforce guide](https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/guides/Agentforce-for-Sales-Development-Implementation-Guide.pdf)
- Instantly's escalation list (pricing, security, competitors, executives) is a working example of category-based human routing, applied to replies rather than first-touch hooks. — [Instantly](https://instantly.ai/blog/ai-sdr-limitations-honest-assessment/)
- Breeze shows the pattern of starting in manual-review mode and graduating to auto-send. — [Octave](https://www.octavehq.com/post/hubspot-breeze-prospecting-agent-setup-guide)
- Generic openers do worse than no personalisation, which supports a "no hook, so send a plain relevant email or skip" abstain path. — [Instantly](https://instantly.ai/blog/ai-sdr-limitations-honest-assessment/)
- 11x's sub-agent split (research, then positioning report, then writer) is a structure worth borrowing for hook selection. — [ZenML](https://www.zenml.io/llmops-database/rebuilding-an-ai-sdr-agent-with-multi-agent-architecture-for-enterprise-sales-automation)

### Inferences (design suggestions for the prototype)
- **Patterns worth borrowing:** a table where each research step is a cell (Clay/Apollo); typed outputs (picklists for qualify/disqualify); free preview on 3 rows before a full run (Apollo); per-lead activation and batch caps (Agentforce's 30-record limit); manual mode first, then auto (Breeze); signal alerts with one-click actions (Common Room); a draft score/coach overlay (Lavender).
- **Ways to differentiate:**
  1. *Claim-level traceability:* every factual phrase in the draft links to a source URL with a snippet and date, and claims without a source are highlighted.
  2. *Hook ranking with explanation:* generate N candidate hooks, score each for relevance to the offer, recency, specificity, verifiability and sensitivity, and show why the winner was chosen and why the others were rejected.
  3. *Abstain:* if no hook passes the threshold, output "No strong hook. Recommend a non-personalised value-led email or deprioritise," rather than a generic "I saw you posted..." line.
  4. *Sensitivity filter:* block or flag hooks about layoffs, health, family, politics, personal posts and funding rumours, and anything older than X months.
  5. *Reviewer-speed UX:* an approval queue sorted by confidence, with diff and edit, approve/reject reason codes that feed back into hook scoring, and a kill switch.
- In one week, a narrow version (say 20-50 prospects, 1-2 sources such as the company site/news plus the LinkedIn headline provided by the user, and a review UI) can show 1-4 credibly. Deliverability infrastructure is out of scope and can be acknowledged as such.

### Gaps
- No evidence was found that any listed tool offers claim-level citations in the final email, an explicit abstain on weak hooks, or sensitivity filtering. This may be because docs weren't fully reviewed (Artisan, Smartlead, Regie, Unify UI), so frame it as "not documented" rather than "doesn't exist."
