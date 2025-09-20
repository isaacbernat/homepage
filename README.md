# Isaac Bernat's Homepage

![Build and Deploy Status](https://github.com/isaacbernat/homepage/actions/workflows/deploy.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the source code for my personal homepage and interactive CV, available at **[isaacbernat.com](https://www.isaacbernat.com)**. It serves as a public demonstration of my engineering philosophy, featuring deep-dive case studies, system designs, and a codebase built on modern best practices for performance and accessibility.

---

### Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Guiding Principles](#2-guiding-principles)
3.  [Key Features & Best Practices](#3-key-features--best-practices)
4.  [Tech Stack & Tooling](#4-tech-stack--tooling)
5.  [Build & Deployment](#5-build--deployment)
6.  [Local Development](#6-local-development)
7.  [Technical Decisions & Roadmap](#7-technical-decisions--roadmap)
8.  [License](#8-license)

---

### 1. Project Overview

The goal of this project was to build a portfolio that is not just visually appealing, but also technically sound, maintainable and demonstrably high-quality. The site is hosted on GitHub Pages but served through a custom domain for long-term URL stability.

The development of this robust, performant and accessible website was assisted by AI/LLMs for generating boilerplate and accelerating implementation. Every final decision (e.g. from technology choices like the Jamstack architecture to the individual lines of code) was a deliberate choice based on my own reflections and senior engineering experience. The most relevant aspects are highlighted below.

### 2. Guiding Principles

The project was built with a focus on pragmatic and long-term value. The following principles were first-class citizens:

- **Performance by Design:** Every decision was weighed against its performance impact. This includes optimizing image formats and delivery, minimizing render-blocking resources and ensuring a responsive user experience.
- **Accessibility is Non-Negotiable:** A11y is not an afterthought; websites must be usable by everyone. This is reflected in semantic HTML, ARIA considerations and high-contrast (WCAG-compliant) design.
- **Deliberate Technology Choices:** Use the right tool for the job. Avoids the "Not Invented Here" syndrome by leveraging proven libraries, while also avoiding unnecessary frameworks for a project of this scope.
- **Maintainability & Simplicity (DRY/KISS):** The codebase is kept clean and scalable. Complexity is avoided unless it provides tangible value. Reusable components, single sources of truth and automation are favored over repetition.

### 3. Key Features & Best Practices

#### Development & Maintainability

- **CI/CD Pipeline:** A GitHub Actions workflow automates testing, building and deploying the site to GitHub Pages on every push to `main` branch.
- **Reproducible Builds:** The CI pipeline uses `npm ci` instead of `npm install`. This is a deliberate choice to ensure that the exact dependency versions specified in the `package-lock.json` are used on every run, eliminating "works on my machine" issues and guaranteeing a stable, predictable deployment process.
- **Jamstack Architecture:** It uses a custom Static Site Generator (`build.js`) to pre-build the entire site into highly optimized, static Markup. This approach results in superior performance, security and scalability compared to traditional server-rendered sites, allowing for efficient hosting on a global CDN like GitHub Pages. The architectural benefits [are further explained here](https://jamstack.org/why-jamstack/).
- **Transparent Build Process:** Powered by an extensible Node.js script that provides full control over the asset pipeline without framework lock-in.
- **Component-Based Content with Macros:** Repetitive UI components, like project cards and experience entries, are abstracted into Nunjucks `macros`. This allows content to be rendered consistently with a single line of code, making the site radically easier to maintain and update.
- **Content as Data:** To cleanly separate content from presentation, all narrative sections are authored in Markdown files and processed into HTML by the build script.
- **Disciplined Git History:** All commits follow the Conventional Commits specification for a clear, readable and automated changelog.
- **Centralized Configuration:** Global site metadata is managed in a single configuration object within the build script.
- **Modular CSS:** Modern CSS with custom properties (`var(...)`) makes theming and maintenance straightforward.
- **Modular Build Script:** Following the Single Responsibility Principle, the build script is composed of small, single-purpose functions (e.g. `minifyJs`, `processFavicons`). This makes the build process highly readable, maintainable, and easy to extend, with a main `build()` function that acts as a clean orchestrator.
- **Decoupled Templates for Robustness:** To improve maintainability and adhere to the principle of Separation of Concerns, templates (`.njk` files) reference source assets (`style.css`). The build script is the single source of truth responsible for asset transformation (e.g. to `style.min.css`), making the entire system robust and simplifying future enhancements like cache-busting.
- **Automated Code Quality & Formatting:** A comprehensive quality gate is integrated into the CI/CD pipeline. Prettier enforces a consistent idiomatic code style and ESLint checks for potential bugs and logical errors.
  **Unit-Tested Build Process:** To guarantee reliability and prevent regressions, the custom build script is covered by a comprehensive suite of **30+ unit tests** using Jest. This ensures that the asset pipeline—from minification to template rendering—works flawlessly on every commit. The full testing roadmap includes automated accessibility and performance validation.

#### Performance

- **Parallelized Build Tasks:** Independent asset minification jobs are run in parallel using `Promise.all` to accelerate the build process.
- **Per-Page CSS Loading:** A dedicated stylesheet is loaded only on the content-rich CV page, keeping the homepage's initial render path lean and fast.
- **Asset Minification:** All JS, CSS and HTML files are minified at build time to reduce file size.
- **Responsive, Modern Images:** The `<picture>` element serves next-gen `.webp` images with responsive `srcset` attributes. The standard `<img>` tag is included as a robust fallback for older browsers.
- **Image Optimization:** Initial images were optimized with Squoosh.app to a compressed `.webp` format. The build process uses `sharp` and `svgo` for automated optimization of favicons.
- **Lazy Loading (LQIP):** A tiny, blurred placeholder for the main image is loaded instantly to improve Largest Contentful Paint (LCP) and prevent layout shift (the high-resolution version is loaded in the background).
- **"No-Flicker" Theme Script:** A critical, render-blocking inline script sets the theme before CSS is applied, preventing a "Flash of Unstyled Content" (FOUC).
- **Seamless Theming Transitions:** The above FUOC technique is extended to intermediate redirect pages to eliminate jarring white flashes during navigation, ensuring a polished and seamless user experience from the first click.
- **Polished Overscroll Theming:** To address the jarring white flash often seen during the browser's "rubber-band" overscroll effect, a theme-aware background color is applied directly to the root `<html>` element on a per-page basis. This ensures the visual experience remains seamless, preventing visual artifacts at the viewport edges and maintaining a polished, consistent user experience.
- **Non-Blocking Scripts:** The main JavaScript file is loaded with the `defer` attribute.

#### Accessibility (A11y), SEO & UX

- **Art-Directed Theming:** The site features distinct light and dark themes with purpose-made imagery for each, rather than using CSS filters. The theme defaults to system preference and is persisted in `localStorage`.
- **WCAG 2.0 Compliance:** Both light and dark themes were designed and verified to meet AAA contrast ratio standards. Automated testing is a priority on the roadmap.
- **Robust Deep Linking for Social Media:** Implemented a system of clean, canonical redirect pages to work around limitations in platforms like LinkedIn that do not correctly handle URL hash fragments. This ensures that links to specific case studies (e.g. `.../cv.html#casestudy-x`) can be shared with a clean URL (e.g. `.../case-study/x`) and still resolve correctly, providing a seamless user experience.
- **SEO Best Practices:** The site includes a `robots.txt` and a `sitemap.xml` that is automatically updated with the latest modification date during every build.
- **Progressive Disclosure UI:** Native HTML `<details>` elements create interactive accordions, managing information density without requiring a JavaScript library.
- **Semantic HTML:** Correct use of elements like `<header>`, `<main>` and `<nav>` provides clear structure for screen readers and search engines.
- **Full Keyboard Navigation:** All interactive elements are fully keyboard-accessible with clear, custom `:focus-visible` styles.
- **`noscript` Fallback:** Provides a functional experience for users with JavaScript disabled.
- **Comprehensive Meta Tags:** Includes full Open Graph and Twitter Card metadata for rich social media previews.
- **Consistent Experience:** The custom 404 page is built from the same template as the main site, ensuring brand and UX consistency.
- **Polished Micro-interactions:** Subtle hover and active states on interactive elements provide clear, responsive feedback.
- **Descriptive `alt` Attributes:** All images include descriptive `alt` text.
- **Robust Favicon Support:** An SVG favicon is provided for modern browsers, with an automatically generated `.ico` fallback for older browsers, ensuring broad compatibility.

#### Repository Structure

- **`.gitignore`:** The repository is configured to ignore build artifacts (`/dist`), dependencies (`/node_modules`) and OS-specific files (`.DS_Store`).
- **Clear Licensing:** The `LICENSE` file clearly defines the usage rights for the code (MIT) and explicitly reserves rights for content and assets.
- **Structured Documentation:** This `README.md` serves as the primary entry point, with a `TECHNICAL_DECISIONS.md` file for deeper architectural discussions.

### 4. Tech Stack & Tooling

- **Languages:** HTML5, CSS3, JavaScript (ES6+)
- **Templating:** [Nunjucks](https://mozilla.github.io/nunjucks/)
- **Build Scripting (Custom SSG):** [Node.js](https://nodejs.org/)
- **Asset Pipeline & Optimization:**
  - **JS/CSS/HTML Minification:** [Terser](https://terser.org/), [CleanCSS](https://github.com/clean-css/clean-css), `html-minifier`
  - **Image Optimization:** [sharp](https://sharp.pixelplumbing.com/), [SVGO](https://github.com/svg/svgo) and [Squoosh.app](https://squoosh.app/)
  - **Markdown Parsing:** [Marked](https://marked.js.org/)
- **Code Quality & Formatting:**
  - **JavaScript Linting:** [ESLint](https://eslint.org/)
  - **Automated Formatting:** [Prettier](https://prettier.io/)
- **CI/CD & Deployment:** [GitHub Actions](https://github.com/features/actions)

### 5. Build & Deployment

The project is automatically built and deployed via a GitHub Actions workflow. On every push to the `main` branch, the following steps are executed:

1.  Dependencies are installed using `npm ci`.
2.  The site is built using `npm run build`.
3.  Automated test suites are run against the build artifacts.
4.  If successful, the contents of `/dist` are deployed to GitHub Pages.

### 6. Local Development

1.  Clone the repository: `git clone https://github.com/isaacbernat/homepage.git`
2.  Install dependencies: `npm install`
3.  Build the site: `npm run build`

The generated static site will be in the `/dist` directory.

### 7. Technical Decisions & Roadmap

For a detailed discussion of architectural choices and a list of potential technical enhancements (including the implementation of a full testing suite), see the **[TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)** file.

### 8. License

This project's source code and its content/assets are licensed under separate agreements.

- **Source Code:** All code (e.g. HTML, CSS, JavaScript, build scripts) is released under the **MIT License**. See the `LICENSE` file for details.
- **Content & Assets:** All textual content and visual assets (e.g. images) are the exclusive property of Isaac Bernat and are not licensed for reuse. **All Rights Reserved.**
