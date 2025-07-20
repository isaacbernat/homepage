# Isaac Bernat's Homepage

![Build and Deploy Status](https://github.com/isaacbernat/homepage/actions/workflows/deploy.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the source code for my personal homepage, available at [isaacbernat.com](https://www.isaacbernat.com).

---

### Table of Contents

1.  [Project Overview](#project-overview)
2.  [Guiding Principles](#guiding-principles)
3.  [Key Features & Best Practices](#key-features--best-practices-implemented)
4.  [Tech Stack](#tech-stack--tooling)
5.  [Build & Deployment](#build--deployment)
6.  [Local Development](#local-development)
7.  [Technical Decisions & Roadmap](./TECHNICAL_DECISIONS.md)
8.  [License](#license)

---


### 1. Project Overview

I present this static page to showcase how I approach engineering projects. The goal was to build a simple portfolio that is technically sound, maintainable and demonstrably high-quality while being elegant and visually appealing.

The development of this robust, performant and accessible website, in accordance with the best practices of modern web, was assisted by AI for generating boilerplate and accelerating implementation. Every final decision (in architecture, technology, code, etc.) was a deliberate choice based on my own reflections and senior engineering experience. The most relevant ones are highlighted in the following sections.


### 2. Guiding Principles

The project was built with a focus on pragmatic and long-term value. Therefore the following principles were first-class citizens:

*   **Reproducibility:** Repetitive tasks are automated. A custom Node.js build script handles asset minification, image optimization, HTML templating... The entire build and deployment process (CI/CD) is handled via GitHub Actions.
*   **Performance by Design:** Every decision was weighed against its performance impact. This includes optimizing image formats and delivery, minimizing render-blocking resources and ensuring a responsive user experience.
*   **Deliberate Technology Choices:** Use the right tool for the job.
*   **Accessibility is Non-Negotiable:** A11y is not an afterthought, websites must be usable by everyone. This includes adhering to semantic HTML standards, ensuring WCAG AA contrast ratios, providing proper ARIA attributes and focus management.


### 3. Key Features & Best Practices

#### Development & Maintainability
*   **Transparent Build Process:** Powered by a single extensible Node.js script, it provides full control over the asset pipeline without a framework lock-in.
*   **CI/CD Pipeline:** A GitHub Actions workflow automates testing, building and deploying the site to GitHub Pages on every push to `main` branch.
*   **DRY (Don't Repeat Yourself):** Nunjucks is used to compile reusable layouts and partials (e.g. `<header>`) into static HTML, eliminating code duplication and ensuring consistency. Global site metadata is managed in a single configuration object in the build script.
*   **Modular CSS:** Modern CSS with custom properties (e.g. `var(...)`) makes theming and maintenance straightforward.
*   **Separation of Concerns:** The project structure maintains a clear distinction between source files (`src`), distributable files (`dist`), templates (`_layouts`, `_partials`), pages and other assets.

#### Performance
*   **Asset Minification:** All JS, CSS, and HTML files are minified at build time to reduce file size.
*   **Responsive, Modern Images:** The `<picture>` element serves  with responsive `srcset` attributes providing the correctly-sized version for the user's viewport according to the screen densities. This prevents downloading unnecessarily large files.
*   **Image Optimization:** Uses next-gen `.webp` format, optimized with squoosh.app for minimal file size.
*   **Lazy Loading (Low-Quality Image Placeholders (LQIP)):** A tiny, blurred placeholder is loaded instantly for the main image, improving initial page load time (LCP) and preventing layout shift while the high-resolution version loads in the background.
*   **"No-Flicker" Theme Script:** A critical, render-blocking inline script sets the theme before CSS is applied, preventing a "Flash of Unstyled Content" (FOUC).
*   **Non-Blocking Script Loading:** The main JavaScript file is loaded with the `defer` attribute, ensuring it doesn't block the initial page render.

#### Accessibility (A11y) & UX
*   **Semantic HTML:** Correct use of semantic HTML5 elements (e.g. `<header>`, `<main>`, `<nav>`) to provide clear structure for screen readers and search engines.
*   **Keyboard Navigation & Focus States:** All interactive elements are fully keyboard-accessible with clear, custom `:focus-visible` styles.
*   **`noscript` Fallback:** Provides a functional experience for users with JavaScript disabled.
*   **High-Contrast Themes:** Light/dark themes that use the system's value by default, but that may be easily updated by the user. 
*   **Web Content Accessibility Guidelines (WCAG 2.0):** both light and dark themes meet AAA contrast ratio standards.
*   **Descriptive `alt` Attributes:** All images include descriptive `alt` text.
*   **Robust Favicon Support:** An SVG favicon is provided for modern browsers, with an automatically generated `.ico` fallback for older browsers, ensuring broad compatibility.
*   **Consistent Themed Experience:** The custom 404 page is built from the same Nunjucks template as the main site, ensuring a consistent user experience.
*   **Polished Micro-interactions:** Subtle hover and active states on interactive elements provide clear, responsive feedback.
*   **Comprehensive Meta Tags:** Includes full Open Graph and Twitter Card metadata for rich social media previews.


### 4. Tech Stack & Tooling
*   **Languages:** HTML5, CSS3, JavaScript (ES6+)
*   **Templating:** [Nunjucks](https://mozilla.github.io/nunjucks/)
*   **Build Scripting:** [Node.js](https://nodejs.org/)
*   **JS/CSS/HTML Minification:** [Terser](https://terser.org/), [CleanCSS](https://github.com/clean-css/clean-css), and `html-minifier`
*   **Image Optimization:** [sharp](https://sharp.pixelplumbing.com/) & [SVGO](https://github.com/svg/svgo)
*   **Deployment:** [GitHub Actions](https://github.com/features/actions)
*   **Dependency Management:** [npm](https://www.npmjs.com/)
*   **Automated testing:** coming soon...


### 5. Build & Deployment

The project is automatically built, tested, and deployed via a GitHub Actions workflow. On every push to to the `main` branch, the following steps are executed:
1.  Dependencies are installed.
2.  The site is built using `npm run build`.
3.  Automated test suites (to be expanded soon) are run against the build artifacts in `/dist`.
4.  If successful, the contents of `/dist` are deployed to GitHub Pages.


### 6. Local Development

1.  Clone the repository: `git clone https://github.com/isaacbernat/homepage.git`
2.  Install dependencies: `npm install`
3.  Build the site: `npm run build`

The generated static site will be in the `/dist` directory.


### 7. Technical Decisions & Roadmap

For a detailed discussion of architectural choices (e.g. Nunjucks vs. Pug, CSS vs. SCSS) and a list of potential technical enhancements, see the **[TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)** file (to be added soon).


### 8. Licensing

The content of this repository is licensed under two separate agreements:

*   **Source Code:** All source code (e.g. HTML, CSS, JavaScript, build scripts) is released under the **MIT License**. See the `LICENSE` file for details.
*   **Content & Assets:** All textual content and visual assets, including images in the `/src/images` directory, are the exclusive property of Isaac Bernat and are not licensed for reuse. **All Rights Reserved.**
