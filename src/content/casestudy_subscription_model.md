### **The Challenge: Unpredictable Revenue and High User Friction**

The company's business model was based on selling prepaid packages of hours (6, 12, or 20). This created two major problems:

- **For the Business:** It led to unpredictable, lumpy revenue streams, making financial forecasting difficult.
- **For the User:** The manual renewal process created significant friction. Students would often run out of hours unexpectedly, disrupting their learning cadence.

Our proposal, "Subscribe to a Tutor", aimed to solve this by introducing auto-renewing subscriptions, based on the hypothesis that predictable lessons would align user goals with a more stable, recurring revenue foundation for the business.

### **Defining Success: An MVP-First, Data-Driven Approach**

Because this was a fundamental change to the financial model, our strategy was not to build a fully-featured system, but to launch a Minimum Viable Product (MVP) within a controlled A/B test.

We defined success criteria for two distinct phases:

- **Short-Term (MVP Launch):** The immediate goal was successful validation. This required achieving statistical significance in user adoption, ensuring technical stability and generating the clean data needed to inform our decision to scale.
- **Long-Term (Post-Scale):** Success would be measured by a sustainable increase in key business metrics, including User Retention, Customer Lifetime Value (LTV) and Gross Merchandise Value (GMV).

### **The Solution: Pragmatic Scoping and Product Decisions**

My approach was centered on one goal: **speed-to-learning.** This involved several critical product and delivery decisions that I championed.

#### **1. Strategic Billing Cycle**

I advocated for a **4-week billing cycle** over a standard monthly one. This was a crucial, non-obvious decision with multiple benefits:

- **User Alignment:** It perfectly matched the weekly lesson cadence of our students.
- **Predictability:** It created fixed-size packages every single time.
- **Business Velocity:** It provided the business with customer insights ~8% faster and resulted in **13 billing cycles per year instead of 12**, compounding revenue.

We anticipated a small increase in customer support queries from users accustomed to monthly billing, but we judged the significant benefits to be a worthwhile trade-off, which proved to be correct.

#### **2. Aggressive MVP Feature Scoping**

We deferred all non-essential features. For example, we launched without dedicated "upgrade/downgrade" functionality, knowing that users could achieve the same outcome through the existing workflow of canceling and re-subscribing. This kept the initial build lean and focused.

#### **3. Strategic Plan Sizing**

We limited the MVP to three distinct plans (1, 2, or 4 weekly hours). This was a deliberate choice to ensure direct comparability with the three tiers of the existing package model, eliminating "decision fatigue" or plan size as a confounding variable in our A/B test results.

#### **4. A Carefully Restricted Audience**

To accelerate delivery and minimize the "blast radius" of any potential issues, we launched to a very specific audience segment:

- **New users only (without referrals):** To avoid bias from prior experience with the package model.
- **English-UI users only:** To simplify the initial copy, design work and avoid localization overhead.
- **Web-only users:** To bypass the slower, more complex release cycles of our mobile applications.
- **Single Payment Provider (Braintree):** To avoid the significant effort of building recurring payment support for other (marginal) providers like Stripe or PayPal at the MVP stage.

### **Delivery & Iteration: Parallel Cohorts**

Our most significant time-saving decision was to launch with a partial backend implementation. We went live with the user-facing sign-up flow while the auto-renewal logic and emails were still being built, allowing us to gather behavioral data weeks earlier.

This rapid approach enabled a sophisticated testing strategy. Instead of a single A/B test, we launched **several experimental cohorts in parallel**, each with an incrementally richer feature set (e.g. adding plan upgrades, more plan sizes). This had never been done before at the company and it provided the rich, long-term data needed to confidently scale the full subscription model.

### **Deep Dive: The Critical Architectural Decision**

The most critical technical decision was how to safely integrate this high-risk system into our large, existing Python/Django monolith. I evaluated three options: deep integration (fast but risky), an isolated microservice (safe but slow) and the chosen hybrid path: a **logically isolated module**.

This approach offered the best balance of speed and safety. To de-risk it, I implemented several safeguards:

- **Centralized "Kill Switch":** All subscription entry points were guarded by a single, dynamically controlled feature flag. This allowed us to instantly disable the entire feature for all users without a new deployment.
- **Data Isolation:** We created new, dedicated tables for subscription data instead of adding columns to critical core tables, ensuring clean separation and preventing performance degradation for non-subscribers.
- **Code Isolation:** All new code was developed within a distinct `subscriptions` module/directory, making it clear to other teams that this code was experimental and should not be depended upon.

The modular design proved its worth, allowing for both rapid validation and sustainable scalability. After the successful MVP, we were able to easily add major new features like plan upgrades/downgrades, pauses, hour top-ups and our "breakage" policy for unused hours.

### **The Results: A Company-Defining Success**

The project became the most impactful experiment in the company's history. Within four months of scaling the model to all new users, we achieved:

- A **+41% year-over-year increase in LTV** directly attributable to the project.
- An LTV-to-CAC ratio that improved from **1.4x to 3.0x**.
- The successful close of a **Series C investment round**, larger than all previous rounds combined.

Within a year, the subscription model accounted for **64.4% of the company's total lesson revenue**, fundamentally transforming its financial foundation.

### **Key Personal Learnings**

- **Observability is a Feature, Not an Afterthought:** We initially deprioritized building robust monitoring due to deadline pressure. This decision directly led to a **[SEV-2 incident that went undetected for 16 hours](#casestudy-incident-74)**. I now consider comprehensive monitoring and alerting to be a non-negotiable part of the initial delivery of any critical system.
- **Lead with a Proposal, Not just Options:** As the Directly Responsible Individual (DRI), I learned my role wasn't just to analyze trade-offs, but to lead with an assertive, well-reasoned recommendation. Embracing this mindset accelerated key architectural decisions.
- **The Power of Pragmatism (YAGNI):** This project succeeded because we kept the MVP minimal. A later, failed attempt to launch "yearly subscriptions" was over-engineered for future flexibility that we never needed. It was a powerful lesson in the "You Ain't Gonna Need It" principle. I now challenge complexity much more forcefully, always advocating for the simplest solution that can validate the core hypothesis. ([Read the full retrospective on that project](#casestudy-yearly-subscriptions)).
