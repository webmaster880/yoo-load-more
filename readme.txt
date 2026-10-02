=== YOOtheme Pro Dynamic Load More & Infinite Scroll ===
Contributors: noblesmedia
Tags: yootheme, load more, infinite scroll, query loop, uikit
Requires at least: 6.2
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AJAX-style Load More and Infinite Scroll for YOOtheme Pro grids and WordPress Query Loop blocks, without replacing the original rendering pipeline.

== Description ==

YOOtheme Pro Dynamic Load More & Infinite Scroll progressively enhances existing semantic pagination.

The plugin fetches the next public paginated URL with the browser Fetch API, parses the returned HTML, extracts the rendered grid children, and appends them to the current grid. It does not create a replacement WP_Query and does not expose a custom REST or admin-AJAX endpoint.

Features:

* Button, Infinite Scroll, and Hybrid trigger modes.
* Native YOOtheme Pro Builder element.
* Gutenberg block for the standard Query Loop.
* UIkit Grid, masonry, Height Match, Filter, Scrollspy, and Lightbox refresh.
* UIkit button styles, sizes, spinner, and customizable labels.
* Optional browser URL updates with history.pushState.
* Existing pagination remains in the server-rendered HTML for crawlers and no-JavaScript visitors.
* No jQuery dependency.

== Installation ==

1. Upload the plugin directory to `/wp-content/plugins/yoo-load-more`, or install its ZIP archive from Plugins > Add New > Upload Plugin.
2. Activate the plugin.
3. Keep a real Next pagination link in the page markup.
4. For YOOtheme Pro, add the Dynamic Load More element after the target grid and configure its selectors.
5. For Gutenberg, place the Dynamic Load More block immediately after a Query Loop containing a Query Pagination Next block.

== Frequently Asked Questions ==

= Does the plugin execute a separate post query? =

No. It requests the next normal frontend page and reuses the HTML already rendered by WordPress and YOOtheme Pro.

= Is normal pagination still available for SEO? =

Yes. Pagination is present in the original HTML and is only hidden after the JavaScript engine initializes. An optional initial URL is also rendered as a noscript fallback.

= What selector should I use for a YOOtheme grid? =

Give the target element a unique class, such as `news-grid`. Use `.news-grid .uk-grid` when that class wraps the UIkit grid, or `.news-grid` when it is applied directly to the grid node.

= Does Infinite Scroll work without IntersectionObserver? =

The control automatically falls back to the Load More button.

== Changelog ==

= 1.0.0 =

* Initial production release.
* Added YOOtheme Pro native Builder element.
* Added Gutenberg Query Loop companion block.
* Added Fetch and DOMParser loading engine with three trigger modes.
* Added UIkit component synchronization and semantic pagination fallback.
