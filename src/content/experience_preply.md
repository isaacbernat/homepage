### Staff Backend Engineer

_Jun 2022 – Jul 2024_

As a Staff Engineer, I operated beyond my immediate team to shape the technical roadmap and lead complex, cross-functional initiatives. My role was to tackle the most ambiguous business problems, translate them into robust backend architectures, and drive them to completion.

- **Architectural Leadership & Monetization:** Led the company's #1 most impactful A/B test of 2023, driving a **+3% global Gross Margin lift**. Redesigned the core subscription monetization logic, engineering an idempotent, cron-driven state machine with strict database-level locking to guarantee zero double-billing during asynchronous payment gateway failures. ([Read the Full Case Study](#casestudy-postpone-billing))

- **Proactive System Observability:** Consistently identified and mitigated critical production bottlenecks outside my team's direct domain. Engineered a pragmatic rate-limiting circuit breaker to neutralize an automated transaction-fee arbitrage exploit, and traced/mitigated a runaway Celery task executing **>1M times/hour**.

- **Engineering Velocity & Cost Optimization:** Championed an engineering-wide CI/CD optimization initiative. Identified a severe Jenkins queue bottleneck and drove an on-demand testing workflow for Draft PRs, reducing automated-test AWS EC2 infrastructure costs by **80% ($31k/year)** and saving hundreds of collective engineering hours per month in the process. ([Read the Full Case Study](#casestudy-ci-savings))

- **Strategic Foresight & Technical Translation:** Acted as the technical DRI for cross-functional initiatives. Advocated against a high-risk monolithic launch strategy ("Subs Direct"), ultimately guiding a cross-functional pivot to an iterative release model, saving an estimated 6 months of engineering effort.

### Senior Backend Engineer

_Mar 2020 – Jun 2022_

- **Founding the Subscription Platform:** Served as the founding backend architect for the Subscription MVP. Designed the core schema and orchestrated cross-team integrations (Payments, CRM, Finance) that scaled to **200k+ monthly renewals**. This foundation increased LTV-to-CAC from 1.4x to 3.0x and enabled a **Series C funding round**. ([Read the Full Case Study](#casestudy-subscription-model))

- **Incident Leadership & Observability:** Commanded and documented 15+ production incidents. Leveraged a critical SEV-2 post-mortem to champion a mandatory, company-wide pre-launch observability policy, shifting the engineering culture towards monitoring-first deployments. ([Read the Incident Retrospective](#casestudy-incident-74))

- **Team Scaling & Process Improvement:** Played a key role in scaling the dedicated Subscriptions team by interviewing 13 candidates and hiring 2 of its foundational engineers. I also redesigned our sprint retrospective process, which cut meeting time by 50% while increasing actionable outcomes and team engagement.

- **Modernization & Database Performance:** Led the backend migration of the high-traffic (1M+ MAU) Q&A application from legacy Django templates to a GraphQL API. Resolved database query bottlenecks to reduce page load time by **>85%**, unblocking experiments that drove a **+300% lift in New Paying Customers**.
