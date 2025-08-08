### **The Challenge: An Inefficient and Expensive CI Pipeline**

In a May 2022 engineering all-hands meeting, a presentation on our infrastructure costs revealed a surprising fact: 18% of our entire AWS EC2 spend was dedicated to CI/CD. This sparked an idea. Our process ran a comprehensive, 15-minute unit test suite on every single commit, including those in **Draft Pull Requests**.

This created two clear problems:
1.  **Financial Waste:** We were spending thousands of dollars every month running tests on code that developers knew was not yet ready for review.
2.  **Developer Friction:** The Jenkins queue was frequently congested with these unnecessary test runs, increasing wait times for developers who actually needed to merge critical changes.

### **My Role: From Idea to Impact**

As the originator of the idea, my role was to validate the problem, build consensus for a solution, and coordinate its rapid implementation.

### **The Solution: A Data-Driven, Consensus-First Approach**

My hypothesis was that developers rarely need the full CI suite on draft PRs, as they typically run a faster, local subset of tests. A simple change to make the CI run on-demand would have a huge impact with minimal disruption.

My approach was fast and transparent:
1.  **The Proposal:** I framed the solution in a simple poll in our main developer Slack channel. The message was clear: "POLL: wdyt about only running tests on demand for Draft PRs? ... This could help reduce [our AWS costs]. ... We could type `/test` instead." I also credited the engineer who had already prototyped an implementation, building on existing team momentum.
2.  **Building Consensus:** The response was immediate and overwhelmingly positive. Within a day, the poll stood at **20 in favor and only 2 against**. With this clear mandate, we moved forward.
3.  **Rapid, Collaborative Implementation:** I coordinated with the engineer from the Infrastructure team who had built the prototype. We ensured the new workflow was non-disruptive: developers could still get a full test run anytime by typing the `/test` command. We had the change fully implemented and ready for review the **same day**.

### **The Results: Immediate and Measurable Savings**

The impact of this simple change, validated by data after three months of operation, was significant:
*   **Drastic Reduction in Waste:** We saw an **80% reduction** in test runs on draft PRs (3,990 PRs without a command vs. 1,060 with one).
*   **Verified Financial Savings:** With a calculated cost of **$1.95 per test run**, this translated to immediate savings of over **$2,600 USD per month**, or an annualized saving of over **$31,000 USD**.
*   **Improved Developer Productivity:** The Jenkins queue became significantly less congested, saving **hundreds of collective engineering hours** per month that were previously lost to waiting. This directly translated to faster feedback loops and a more agile development cycle.

This project was a powerful demonstration of how a single, data-backed idea, when socialized effectively, can be implemented rapidly to deliver a massive, measurable return on investment by removing friction and eliminating waste.
