### **The Challenge: A Pre-Launch SEV-2 Incident (Feb 2021)**

Days before the planned launch of the company-defining **[Subscriptions MVP](#casestudy-subscription-model)**, we needed to conduct final Quality Assurance on our CRM email flows. This testing had to be done in the production environment to validate the integration with our email provider.

Due to a critical misunderstanding of our internal A/B testing framework's UI, I incorrectly configured the experiment. I believed I was targeting a small whitelist of test users, but I had inadvertently set the experiment live for **100% of eligible users**.

The immediate impact was that thousands of customers were exposed to an incomplete, unlaunched feature. The partial experience consisted of incorrect copy promising auto-renewal and a different set of purchase plan sizes.

### **My Role: Incident Owner and Scribe**

As the owner of the feature and the person who made the mistake, I took immediate and full responsibility. My role during the incident was twofold:
*   As the **Incident Owner**, I was responsible for coordinating the response, assessing the impact and driving the technical resolution.
*   As the designated **Scribe**, I was responsible for maintaining a clear, timestamped log of all actions and communications, ensuring we would have a precise record for the post-mortem.

### **The Response: A Methodical Approach Under Pressure**

The incident went undetected for **16 hours** overnight simply because we had no specific monitoring in place for this new flow. Once it was flagged the next morning, my response followed a clear hierarchy:

1.  **Immediate Mitigation:** The first action was to stop the user impact. I immediately disabled the experiment in our admin tool, which instantly reverted the experience to normal for all users and stopped the "bleeding."

2.  **Diagnosing the Blast Radius:** With the immediate crisis averted, I began the diagnosis myself. I queried our database's `SubscriptionExperiment` table and quickly identified that ~250 users had been incorrectly enrolled, far more than the handful of test accounts we expected.

3.  **Resolution and Cleanup:** I wrote and deployed a data migration script to correct the state for all affected accounts. This ensured that no user would be incorrectly billed or enrolled in a subscription and that our A/B test data for the upcoming launch would be clean.

The incident was fully resolved in **under an hour** from the time it was formally declared.

### **The Outcome: Systemic Improvement from a Personal Mistake**

While we successfully corrected the immediate issue, the true value of this incident came from the blameless post-mortem process that I led. The 16-hour detection delay became the central exhibit for a crucial change in our engineering culture.

The post-mortem produced several critical, long-lasting improvements:
*   **Improved Tooling:** We filed and prioritized tickets to add clearer copy, UX warnings and a "confirmation" step to our internal experimentation framework to prevent this specific type of misconfiguration from ever happening again.
*   **A New Engineering Rule:** We established a new, mandatory process: any high-risk feature being tested in the production environment **must** have a dedicated monitoring dashboard built and active *before* the test begins.
*   **A Foundational Personal Learning:** I had personally made the trade-off to deprioritize the monitoring and observability tickets for the MVP to meet a tight deadline. This incident was a powerful, firsthand lesson that **observability is not a "nice-to-have" feature; it is a core, non-negotiable requirement** for any critical system. This principle has fundamentally shaped how I approach every project I've led since.

This incident, born from a personal mistake, became a catalyst for improving our tools, our processes and my own engineering philosophy.
