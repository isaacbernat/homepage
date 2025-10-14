### **The Challenge: The "Obvious" Next Step**

Following the immense success of our initial **[4-week subscription model](#casestudy-subscription-model)**, the next logical step seemed to be launching a yearly subscription option. The hypothesis had several layers: we could increase long-term user commitment, create a more predictable annual revenue stream and further reduce churn by offering a compelling discount for a year-long commitment.

While we had qualitative data from user research teams suggesting this was a desired feature, the team, myself included, moved into the implementation phase with a high degree of optimism, without fully scrutinizing the underlying business and logistical assumptions.

### **The Technical Approach: A Mistake in Foresight**

Anticipating that the business would eventually want other billing periods (e.g. quarterly for academic terms or summer programs), I made a critical technical error: I over-engineered the solution.

Instead of building a simple extension to support `period=yearly`, I designed a highly flexible system capable of handling any arbitrary billing duration. This added significant complexity to the codebase, testing and deployment process. My intention was to be proactive and save future development time, but it was a classic case of premature optimization.

### **The Outcome: A Failed Experiment and Valuable Lessons**

We launched the A/B test, but the results were clear and disappointing: the adoption rate for the yearly plan was negligible. The discount we could realistically offer, after accounting for tutor payouts and our own margins, was simply not compelling enough for users to make a year-long financial commitment.

The feature was quickly shelved. The complex, flexible backend system I had built became dead code. This failure was a powerful learning experience that fundamentally improved my approach as an engineer and technical lead.

#### **Learning 1: Validate the Business Case Before Building**

The project's failure could have been predicted and avoided with a more rigorous pre-mortem and discovery phase. We jumped into building without asking the hard questions first.

- **Tutor Viability:** The entire premise rested on offering a discount. We never validated if enough tutors were willing to absorb a significant portion of that discount. The handful who agreed to the pilot did so only after heavy negotiation, with the company subsidizing most of the cost, a model that was completely unscalable.
- **Logistical Complexity:** We hadn't solved the critical operational questions. What happens if a student's tutor leaves the platform six months into a yearly plan? The processes for refunds, tutor reassignment and the accounting implications were undefined, creating massive downstream risk for our Customer Support and Finance teams.
- **Relying on Overly Optimistic Data:** I learned to be more critical of qualitative user research that isn't backed by a solid business case. I took the initial presentations at face value, without questioning the difficult financial and operational realities.

This taught me to insist on a clear, data-backed validation of the **entire value chain**, not just user desire, before committing engineering resources.

#### **Learning 2: The True Meaning of YAGNI**

My attempt to build a "future-proof" system was a direct violation of the "You Ain't Gonna Need It" principle. The extra effort and complexity I added not only went unused but also made the initial build slower and riskier. This experience gave me a deep, practical appreciation for building the absolute simplest thing that can test a hypothesis. It's not about being lazy; it's about being efficient and focusing all engineering effort on delivering immediate, measurable value.

This project, more than any success, shaped my pragmatic engineering philosophy and my focus on rigorous, upfront validation.
