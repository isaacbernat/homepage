### **The Challenge: A "Leaky Bucket" in Our Subscription Model**

Our subscription model had a "pause" feature, but it was a blunt instrument. When users paused, they were completely locked out of taking lessons and any lessons they had scheduled were automatically canceled. This created significant user friction.

Data revealed a critical problem: **users were canceling their subscriptions at twice the rate they were using the pause feature.** They were opting for the more drastic "cancel" option simply to gain flexibility, creating a "leaky bucket" that drove high churn. Our hypothesis was that by offering a more user-friendly alternative to pausing and by aligning our cancellation policy with industry standards, we could improve both user retention and key financial metrics.

### Uncovering a Hidden Liability

Digging deeper, I found that our existing system had a significant flaw: when users canceled, their prepaid hours remained on their balance indefinitely. This was not a deliberate product decision but an **implementation artifact** from the initial MVP. It created a growing, multi-million dollar liability on our books, as this money technically still belonged to the users. My proposal to expire hours on cancellation was not just about aligning with industry standards, it also was about resolving this hidden financial risk.

### **My Role: Epic Lead and Backend Architect**

As the epic lead for this company-wide initiative, I was responsible for more than just the code. My role involved:
*   **Coordinating a cross-functional effort of 15+ people from various teams**, including Backend, Frontend, Product, CRM and Financial Data, each with their own different goals and priorities.
*   **Championing the core product strategy**, which I had advocated for across three consecutive quarters.
*   Architecting and **personally implementing 100% of the backend logic.**
*   Driving an **accelerated delivery timeline** by proactively de-risking the project.

### **The Solution: A Two-Part Strategy**

We proposed a bold, two-part solution to be tested in a single A/B experiment:

1.  **A More Flexible "Postpone" Feature:** We replaced the rigid "pause" with a new "Change Renewal Date" feature. This allowed users to postpone their next billing date by up to 20 days, once per cycle, *without* losing access to their lessons or having their scheduled classes canceled.
2.  **A Policy to Expire Hours on Cancellation:** To create a clearer distinction and align with standard subscription practices, we implemented a policy where any unused hours would expire at the end of the billing cycle upon cancellation.

To accelerate the launch, I identified the critical path, which was blocked not just by technical tasks but by dependencies on our CRM, Financial Data and Frontend teams. I personally championed the project with these teams, negotiating to get our dependencies prioritized even when they fell outside their quarterly goals. This cross-functional leadership, combined with developing key backend components in parallel with ongoing user research, was instrumental in launching the full experiment **four weeks ahead of our official schedule** (2 sprints).

### **Ensuring a Scientifically Valid Test**
A crucial part of the experiment design, which I insisted upon, was to ensure the integrity of our results. A significant portion of the "unexpired hours" liability came from users who had canceled months or even years prior. Including the one-time financial gain from expiring these historical hours in the A/B test would have massively inflated our short-term metrics and given us a misleading, irreproducible result. Therefore, I designed the backend logic to **only apply the new expiration policy to users who canceled *after* the experiment start date**, ensuring we were measuring the sustainable, long-term impact of the change.

### **Deep Dive: A High-Stakes Decision Based on Incomplete Data**

Three weeks into the A/B test, the results looked disastrous. Our primary metrics were negative. The data showed a significant drop in immediate Gross Margin (GMV) and there was immense pressure from stakeholders to kill the experiment.

This was the project's critical moment.

I dug into the data and formulated a strong counter-hypothesis: the metrics were negative *because the feature was working*. Users were postponing payments, which naturally created a short-term dip in cash flow. The crucial missing piece of data was the long-term impact on retention. Based on early engagement signals showing "postpone" users were far more active than "pause" users, I made the high-stakes call not to kill the experiment, but to **"freeze" it**. This effectively stopped new users from entering, but allowed us to continue tracking the existing cohorts over a longer time horizon.

### **The Results: The Most Impactful Experiment of the Year**

My hypothesis was proven correct. The long-term data showed a dramatic turnaround. The project was scaled and became the single most impactful initiative of 2023, out of **215 A/B tests** (161 superiority and 54 non-inferiority experiments) launched company-wide.

*   **Financial Impact:** It delivered a **+34% Gross Margin increase** within the experiment group, contributing to a **+3% global GM lift** for the entire company.
*   **Retention Impact:** It drove a **+4.4% increase in the subscription renewal rate** and a **+15% increase in plan upgrades.**
*   **User Trust:** To mitigate the risk of the new policy feeling unfair, I worked with the CRM team to implement clear, proactive email warnings and built a 24-hour "grace period" into the backend logic to give Customer Support a window to easily reverse accidental cancellations. As a result, we saw no significant spike in user complaints related to the new policy.

This project became a new model for the company on how to analyze complex, long-term experiments and reinforced the value of making data-informed decisions, even when the initial signals are noisy and negative.
