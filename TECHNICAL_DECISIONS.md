# Technical Decisions & Roadmap

This document provides a deeper look into the engineering philosophy behind this project and outlines a strategic roadmap for potential future enhancements. While the `README.md` covers _what_ was built and its key features, this file explores the _why_.

---

### 1. Key Decisions

#### 1.1. AI-Assisted Development

A core principle of this project was to leverage modern Large Language Models (LLMs) as a development accelerator. This is a deliberate choice reflecting a modern engineering workflow where efficiency and quality are paramount.

- **The Role of the LLM:** The AI was used to generate boilerplate code, write initial drafts of documentation (like this one), suggest modern tooling and rapidly explore alternative implementations. This dramatically reduced the time spent on commodity tasks.
- **The Role of the Human (My Role):** As the senior engineer and architect, every final decision was mine. I was responsible for:
  - **Direction:** Guiding the AI with precise, well-scoped prompts.
  - **Critical Evaluation:** Reviewing every line of generated code and text for correctness, performance and alignment with the project's principles.
  - **Strategic Decisions:** Making all final architectural choices (examples below), even when the AI suggested alternatives did not align. I checked every tool suggested by the AI to ensure it was the right fit for the project's specific goals.
- **Conclusion:** This project demonstrates a powerful, modern workflow where a senior engineer directs AI tooling to produce high quality work faster than would be possible alone. It is a testament to using the right tool for the job to maximize impact.

#### 1.2. Performance by Design

- **Static Site Generation (SSG) over a Dynamic Application:** The project deliberately avoids server-side rendering (SSR) frameworks (like Next.js) or client-side applications (like React/Vue).
  - **Rationale:** For a content-focused portfolio, an SSG architecture provides superior performance, enhanced security (no server-side vulnerabilities) and simplified deployment. The build process generates highly optimized, static HTML files that can be served directly from a CDN with minimal latency.
  - **Trade-off:** This approach is not suitable for sites requiring real-time data or user-specific dynamic content, but it is the ideal choice for this project's requirements.

- **Custom Build Script over a "Black Box" Framework:**
  - **Rationale:** While frameworks (like Eleventy or Astro) are excellent, using a custom Node.js script provides absolute transparency and control over the entire asset pipeline. This allows for fine-tuned optimizations, such as parallelized tasks and per-page CSS loading, without framework-imposed constraints or abstractions. It also demonstrates a deep understanding of the web development toolchain.
  - **Trade-off:** Requires more initial setup and maintenance than an off-the-shelf solution, but the trade-off is accepted for the benefit of full control and educational value.

#### 1.3. Content & Rendering Strategy

- **Content as Data (Headless Approach):**
  - **Rationale:** All long-form content is authored in Markdown (`.md`) files and stored separately from the presentation templates. This decouples content from layout, making it trivial to update a case study or project description without touching any HTML or logic. The build script ingests this Markdown, parses it to HTML and injects it into the appropriate templates.
  - **Benefit:** This approach enforces a clean separation of concerns and dramatically improves the site's maintainability.

- **Considered and Rejected: Asynchronous Client-Side Content Loading**
  - **What:** An architecture where the initial HTML is minimal and all main content (e.g. case studies) is fetched via JavaScript after the initial page load.
  - **Why it was considered:** Potential for a faster Time to First Byte (TTFB) and First Contentful Paint (FCP), as most content is below the fold or hidden in `<details>` elements.
  - **Why it was rejected:** The trade-offs were overwhelmingly negative for this project's goals.
    1.  **SEO Degradation:** It would make the site's rich content significantly harder for search engine crawlers to index reliably, undermining a key purpose of a public portfolio.
    2.  **Accessibility Failure:** It would render the site completely unusable for clients with JavaScript disabled, violating a core project principle. The current static approach with native `<details>` elements works perfectly without JS.
    3.  **Unnecessary Complexity:** It would introduce significant client-side complexity (e.g. state management, error handling) to solve a performance problem that doesn't exist, as the current static build is already fast.
  - **Conclusion:** The current static generation approach is the superior architecture, offering the best possible balance of performance, SEO and accessibility. This decision is a prime example of pragmatic engineering.

#### 1.4. Technology Stack

- **Templating Engine (Nunjucks vs. Pug/Others):**
  - **Why Nunjucks was chosen:** Its syntax is a superset of HTML and is very similar to Jinja2, making it intuitive and easy to work with. It's powerful enough for this project's needs (layouts, macros, includes) without imposing a restrictive new syntax. This prioritizes clarity and reduces the learning curve.
  - **Why not Pug?** Pug's whitespace-sensitive, abstracted syntax can be less transparent and adds a higher cognitive load for what is fundamentally simple HTML generation.

- **Styling (Vanilla CSS with Custom Properties vs. SCSS/Sass):**
  - **Why Vanilla CSS was chosen:** Modern CSS, with the advent of custom properties (`var(...)`) and nesting, offers much of the power of pre-processors without requiring an additional compilation step. For a project of this scale, it is simple, fast and sufficient.
  - **Why not SCSS/Sass?** While powerful, the added complexity of a pre-processor toolchain was not justified by the project's styling needs. The decision was made to keep the toolchain as lean as possible.

- **Client-Side Scripting (Vanilla JS vs. TypeScript):**
  - **Why Vanilla JS was chosen:** The client-side logic is minimal and focused on simple DOM manipulation (e.g. theme toggling, image loading).
  - **Why not TypeScript?** TypeScript is an excellent choice for larger and more complex applications, but its benefits (static typing, improved tooling) did not outweigh the cost of added build complexity for this specific project.

#### 1.5. A Programmatically Enforced Quality Standard

This project moves beyond simply _claiming_ quality to _programmatically proving and enforcing_ it through a comprehensive, automated testing suite built with Jest.

- **Unit-Tested Build Pipeline:** The foundation of the testing suite is a robust set of unit tests for the critical build pipeline (`build.js`). This treats the build process as first-class, mission-critical code.
- **Resilient Browser-Testing Infrastructure:** To enable reliable end-to-end and accessibility testing, a **secure, custom-built test server** was created. This is not just a simple file server, it includes critical production-readiness features like **directory traversal protection**, automatic port finding to prevent CI conflicts, and health checks. This robust foundation ensures that browser-based tests are stable and deterministic.
- **A Living Roadmap:** The testing suite is designed to be extensible, with a clear roadmap to incorporate automated accessibility, performance and visual regression testing directly into the CI/CD quality gates. The full plan can be reviewed in the project's [design documents](./.kiro/specs/automated-testing-suite/design.md).

---

### 2. Technical Roadmap: Future Enhancements

This roadmap outlines potential future work, prioritized by impact. The focus is on moving from _claiming_ quality to _programmatically proving and enforcing_ it through automation.

#### Tier 1: Automated Quality Gates

This tier focuses on integrating automated checks into the CI/CD pipeline to guarantee quality and prevent regressions on every commit.

- ✅ **Automated Accessibility (a11y) Testing (Implemented)**
  - **What:** A comprehensive test suite using Jest, Puppeteer, and `axe-core` that runs on every commit to programmatically enforce WCAG compliance.
  - **How:** The suite launches a headless browser, navigates to each page of the site, and runs a full accessibility audit in both light and dark themes. The build will fail if any violations are detected.
  - **Impact:** This moves the project's commitment to accessibility from a claim in a document to a verifiable, automated, and non-negotiable quality gate.

- 🔜 **Automated Performance & Quality Auditing**
  - **What:** Integrate Google Lighthouse audits directly into the CI pipeline to enforce performance budgets.
  - **Why:** To provide objective, verifiable proof of the site's high performance and to automatically prevent any future changes from causing a performance regression.
  - **How:** Implement the **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** GitHub Action. Budgets would be set (e.g. Performance score > 98, Accessibility = 100) and the build would fail if a commit causes a score to drop below these thresholds.

#### Tier 2: Lower prio than those above ;D

- **Implement Automated Cache-Busting**
  - **What:** Modify the build script to generate unique filenames for CSS and JavaScript assets based on their content (e.g. `style.[hash].min.css`).
  - **Why:** To solve the browser caching problem where users might be served stale assets after a new deployment. This ensures that every user immediately receives the latest version of the site, preventing bugs and inconsistent experiences. It's a critical feature for production reliability.
  - **How:** Use a Node.js package (like `md5-file` or Node's built-in `crypto` module) to generate a content hash for each asset. The build script would then rename the output files with this hash and update the references in the final HTML files accordingly. The recent refactoring to decouple templates from build artifacts makes this significantly easier to implement.

- **Visual Regression Testing**
  - **What:** An automated system to detect unintended visual changes in the UI.
  - **Why:** To prevent subtle CSS bugs or layout shifts from ever reaching production, ensuring a polished and consistent user experience. This is a sign of a highly mature frontend workflow.
  - **How:** Use a tool like **[Playwright's screenshot testing](https://playwright.dev/docs/test-snapshots)**. The CI would take screenshots of key pages and compare them against a "golden" baseline set. Any pixel difference would flag the build for manual review.

#### Tier 3: Potential Future Migrations

This tier outlines potential technology migrations that would be considered if the project's complexity were to grow significantly.

- **CSS to SCSS/Sass:** If the site's styling grows to a point where managing variables and nested rules becomes cumbersome, migrating to Sass would be evaluated to improve organization.
- **JavaScript to TypeScript:** Should client-side interactivity expand beyond simple DOM manipulation, migrating to TypeScript would be considered to improve long-term maintainability and code quality through static typing.
