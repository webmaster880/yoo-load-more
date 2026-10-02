# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added broader Next-link discovery for WordPress and UIkit pagination markup.
- Added a safe numbered-pagination fallback when no explicit Next link exists.
- Added the `X-YOO-LoadMore` diagnostic request header.
- Added `YooLoadMore.Instance` and `YooLoadMore.getInstance()` to the public JavaScript API.
- Added the `yoo:loadmore:loaded` compatibility event for analytics integrations.

### Fixed

- Clear a previous request error when the visitor retries loading.
- Emit prefixed console diagnostics while preserving the accessible error status.

## [1.0.0] - 2026-10-02

### Added

- Native YOOtheme Pro addon registered through `YOOtheme\Application` and `YOOtheme\Builder`.
- Dedicated Dynamic Load More Builder element with per-instance selectors and trigger settings.
- Gutenberg companion block for WordPress Query Loop blocks.
- Fetch and DOMParser engine that reuses the normal paginated frontend response.
- Button, Infinite Scroll, and Hybrid modes.
- IntersectionObserver debouncing and configurable root margin.
- UIkit Grid, masonry, Height Match, Filter, Scrollspy, and Lightbox synchronization.
- UIkit button styles, sizes, spinner, and configurable status labels.
- Optional `history.pushState()` URL updates.
- Semantic pagination preservation and `noscript` fallback support.
- Same-origin request enforcement, duplicate-page prevention, accessible busy states, and lifecycle events.
- Automatic button fallback when IntersectionObserver is unavailable.
