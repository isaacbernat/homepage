# Technical Decisions & Project Roadmap

This document provides a deeper look into the engineering philosophy behind this project and outlines a strategic roadmap for potential future enhancements. While the `README.md` covers *what* was built and its key features, this file explores the *why* behind certain architectural choices and details a path for continuous improvement.

The goal is to demonstrate that this project is not merely a static artifact, but a living example of a disciplined, quality-focused engineering process.

---

### 1. Architectural Choices & Trade-offs

The development of this homepage was guided by a few core principles that influenced every decision, from the choice of technology to the structure of the CI/CD pipeline. This section details the rationale behind key technical choices.

#### 1.1. AI-Assisted, Human-Directed Development

A core principle of this project was to leverage modern Large Language Models (LLMs) as a development accelerator and a "pair programmer." This is a deliberate choice reflecting a modern engineering workflow where efficiency and quality are paramount.

*   **The Role of the LLM:** The AI was used to generate boilerplate code, write initial drafts of documentation (like this one), suggest modern tooling (e.g. specific Lighthouse CI actions) and rapidly explore alternative implementations. This dramatically reduced the time spent on commodity tasks.
*   **The Role of the Human (My Role):** As the senior engineer and architect, every final decision was mine. I was responsible for:
    *   **Prompt Engineering & Direction:** Guiding the AI with precise, well-scoped prompts.
    *   **Critical Evaluation:** Reviewing every line of generated code and text for correctness, performance and alignment with the project's principles.
    *   **Strategic Decisions:** Making all final architectural choices (e.g. rejecting client-side rendering, choosing Nunjucks over Pug), even when the AI suggested alternatives. I checked every tool suggested by the AI to ensure it was the right fit.
*   **Conclusion:** This project demonstrates a powerful, modern workflow where a senior engineer directs AI tooling to produce high-quality, professional-grade work faster than would be possible alone. It is a testament to using the right tool for the job to maximize impact.

#### 1.2. Core Philosophy: Static-First, Performance by Design

*   **Static Site Generation (SSG) over a Dynamic Application:** The project deliberately avoids server-side rendering (SSR) frameworks (like Next.js) or client-side applications (like React/Vue).
    *   **Rationale:** For a content-focused portfolio, an SSG architecture provides superior performance, enhanced security (no server-side vulnerabilities) and simplified deployment. The build process generates highly optimized, static HTML files that can be served directly from a CDN with minimal latency.
    *   **Trade-off:** This approach is not suitable for sites requiring real-time data or user-specific dynamic content, but it is the ideal choice for this project's requirements.

*   **Custom Build Script over a "Black Box" Framework:**
    *   **Rationale:** While frameworks like Eleventy or Astro are excellent, using a custom Node.js script provides absolute transparency and control over the entire asset pipeline. This allows for fine-tuned optimizations, such as parallelized tasks and per-page CSS loading, without framework-imposed constraints or abstractions. It also demonstrates a deep understanding of the web development toolchain.
    *   **Trade-off:** Requires more initial setup and maintenance than an off-the-shelf solution, but the trade-off is accepted for the benefit of full control and educational value.

#### 1.3. Content & Rendering Strategy

*   **Content as Data (Headless Approach):**
    *   **Rationale:** All long-form content is authored in Markdown (`.md`) files and stored separately from the presentation templates. This decouples content from layout, making it trivial to update a case study or project description without touching any HTML or logic. The build script ingests this Markdown, parses it to HTML and injects it into the appropriate templates.
    *   **Benefit:** This approach enforces a clean separation of concerns and dramatically improves the site's maintainability.

*   **Considered and Rejected: Asynchronous Client-Side Content Loading**
    *   **What:** An architecture where the initial HTML is minimal and all main content (case studies, etc.) is fetched via JavaScript (`fetch` API) after the initial page load.
    *   **Why it was considered:** Potential for a faster Time to First Byte (TTFB) and First Contentful Paint (FCP), as most content is below the fold or hidden in `<details>` elements.
    *   **Why it was rejected:** The trade-offs were overwhelmingly negative for this project's goals.
        1.  **SEO Degradation:** It would make the site's rich, keyword-heavy content significantly harder for search engine crawlers to index reliably, undermining a key purpose of a public portfolio.
        2.  **Accessibility Failure:** It would render the site completely unusable for clients with JavaScript disabled, violating a core project principle. The current static approach with native `<details>` elements works perfectly without JS.
        3.  **Unnecessary Complexity:** It would introduce significant client-side complexity (state management, error handling) to solve a performance problem that doesn't exist, as the current static build is already exceptionally fast.
    *   **Conclusion:** The current static generation approach is the superior architecture, offering the best possible balance of performance, SEO and accessibility. This decision is a prime example of pragmatic engineering.

#### 1.4. Tooling and Language Choices

*   **Templating Engine (Nunjucks vs. Pug/Others):**
    *   **Why Nunjucks was chosen:** Its syntax is a superset of HTML and is very similar to Jinja2, making it intuitive and easy to work with. It's powerful enough for this project's needs (layouts, macros, includes) without imposing a restrictive new syntax. This prioritizes clarity and reduces the learning curve.
    *   **Why not Pug?** Pug's whitespace-sensitive, abstracted syntax can be less transparent and adds a higher cognitive load for what is fundamentally simple HTML generation.

*   **Styling (Vanilla CSS with Custom Properties vs. SCSS/Sass):**
    *   **Why Vanilla CSS was chosen:** Modern CSS, with the advent of custom properties (`var(...)`) and nesting, offers much of the power of pre-processors without requiring an additional compilation step. For a project of this scale, it is simple, fast and sufficient.
    *   **Why not SCSS/Sass?** While powerful, the added complexity of a pre-processor toolchain was not justified by the project's styling needs. The decision was made to keep the toolchain as lean as possible.

*   **Client-Side Scripting (Vanilla JS vs. TypeScript):**
    *   **Why Vanilla JS was chosen:** The client-side logic is minimal and focused on simple DOM manipulation (theme toggling, image loading). For this limited scope, the overhead of a TypeScript compilation step was deemed unnecessary.
    *   **Why not TypeScript?** While TypeScript is an excellent choice for larger, more complex applications, its benefits (static typing, improved tooling) did not outweigh the cost of added build complexity for this specific project.

---

### 2. Technical Roadmap: Potential Enhancements

This project is feature-complete for its primary purpose, but a professional engineering project always has a path for improvement. The following enhancements are prioritized based on their ability to **programmatically enforce and prove the quality standards** claimed in the README.

#### Tier 1: Automated Quality & Testing (High Priority)

This tier focuses on integrating automated checks into the CI/CD pipeline to guarantee quality and prevent regressions.

*   **Automated Accessibility (a11y) Testing**
    *   **What:** A test suite that runs on every commit to ensure the site remains WCAG compliant.
    *   **Why:** To move from *claiming* accessibility to *programmatically enforcing* it. This makes compliance a non-negotiable part of the development process.
    *   **How:** Integrate **[axe-core](https://github.com/dequelabs/axe-core)** using a test runner like Jest with Puppeteer. The CI script would launch a headless browser, navigate to the built HTML files (`dist/index.html`, `dist/cv.html`) and fail the build if any accessibility violations are detected.

*   **Automated Performance & Quality Auditing**
    *   **What:** Integrate Google Lighthouse audits directly into the CI pipeline to enforce performance budgets.
    *   **Why:** To provide objective, verifiable proof of the site's high performance and to automatically prevent any future changes from causing a performance regression.
    *   **How:** Implement the **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** GitHub Action. Budgets would be set (e.g. Performance score > 98, Accessibility = 100) and the build would fail if a commit causes a score to drop below these thresholds.

*   **Code Linting & Formatting**
    *   **What:** Enforce a consistent code style across all JavaScript, CSS and Markdown files.
    *   **Why:** To ensure code quality, readability and maintainability, which are hallmarks of a professional software project.
    *   **How:** Implement **[ESLint](https://eslint.org/)** for JavaScript and **[Prettier](https://prettier.io/)** for automated formatting. Add a `lint` script to `package.json` and run it as a required check in the CI pipeline.

#### Tier 2: Deeper Validation & Developer Experience

This tier focuses on more advanced testing methodologies and improving the development workflow.

*   **Unit & Integration Testing for the Build Script**
    *   **What:** A dedicated test suite for the `build.js` script itself.
    *   **Why:** To treat the build process as first-class, mission-critical code. This ensures the reliability and correctness of the asset pipeline, minification process and HTML generation.
    *   **How:** Use a framework like **[Jest](https://jestjs.io/)**. Tests would assert that the `dist` directory is created correctly, that sample files are minified as expected and that the `sitemap.xml` `lastmod` date is properly updated.

*   **Visual Regression Testing**
    *   **What:** An automated system to detect unintended visual changes in the UI.
    *   **Why:** To prevent subtle CSS bugs or layout shifts from ever reaching production, ensuring a polished and consistent user experience. This is a sign of a highly mature frontend workflow.
    *   **How:** Use a tool like **[Playwright's screenshot testing](https://playwright.dev/docs/test-snapshots)**. The CI would take screenshots of key pages and compare them against a "golden" baseline set. Any pixel difference would flag the build for manual review.

#### Tier 3: Future Exploration & Considered Alternatives

This tier includes ideas that were considered but deliberately excluded, as well as potential future experiments.

*   **Considered and Rejected: Asynchronous Client-Side Content Loading**
    *   **What:** An architecture where the initial HTML is minimal and all main content (case studies, etc.) is fetched via JavaScript (`fetch` API) after the initial page load.
    *   **Why it was considered:** Potential for a faster Time to First Byte (TTFB) and First Contentful Paint (FCP).
    *   **Why it was rejected:** The trade-offs were overwhelmingly negative for this project's goals.
        1.  **SEO Degradation:** It would make the site's rich content significantly harder for search engine crawlers to index, undermining a key purpose of a public portfolio.
        2.  **Accessibility Failure:** It would render the site completely unusable for clients with JavaScript disabled, violating a core project principle.
        3.  **Unnecessary Complexity:** It would introduce significant client-side complexity (state management, error handling) to solve a performance problem that doesn't exist, as the current static build is already exceptionally fast.
    *   **Conclusion:** The current static generation approach is the superior architecture, offering the best possible balance of performance, SEO and accessibility. This decision is a prime example of the "Simplicity Over Complexity" philosophy.
