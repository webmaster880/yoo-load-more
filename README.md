# YOOtheme Pro Dynamic Load More & Infinite Scroll

Production-oriented WordPress plugin that progressively enhances existing pagination. It never runs a replacement `WP_Query` and does not use a custom REST endpoint. Every request fetches the next public page, parses its HTML, and appends the already-rendered grid children to the current grid.

## Requirements

- WordPress 6.2 or newer.
- PHP 7.4 or newer.
- YOOtheme Pro for the native Builder element and UIkit integration.
- A standard WordPress Query Loop can use the Gutenberg block without the YOOtheme Builder element.

## Installation

1. Put this directory in `wp-content/plugins/yoo-load-more` (the directory name may differ).
2. Activate **YOOtheme Pro Dynamic Load More & Infinite Scroll**.
3. Keep a real Next pagination link in the rendered page. The plugin hides the pagination only after JavaScript has initialized, so links remain available to crawlers and no-JavaScript visitors.

The WordPress.org-style installation and FAQ documentation is available in [`readme.txt`](readme.txt). Release history is maintained in [`CHANGELOG.md`](CHANGELOG.md).

## YOOtheme Pro Builder

The plugin follows YOOtheme's native module pattern. The plugin orchestrator loads `bootstrap.php` through `YOOtheme\Application`; the module registers `elements/yoo_load_more/element.php` with `YOOtheme\Builder`.

1. Give the target Grid or Panel Slider a unique CSS class in **Advanced → CSS Classes**, for example `news-grid`.
2. Ensure the template/archive renders semantic pagination containing a Next link.
3. Add **Dynamic Load More** immediately below the grid/pagination.
4. Set **Target Grid Selector** to `.news-grid .uk-grid` if the custom class wraps the UIkit grid, or `.news-grid` if it is on the grid node itself.
5. Leave **Grid Item Selector** at `:scope > *` unless the component needs a more specific direct-child selector.
6. Set the pagination and Next selectors to match the markup. Defaults cover `rel="next"` and common UIkit pagination-next markup.

This dedicated element is intentional: it adds controls without replacing or filtering YOOtheme's Grid/Slider schema, transforms, dynamic source query, or render templates. It therefore survives normal YOOtheme updates more reliably than copied core elements.

## Gutenberg Query Loop

1. Add a standard Query Loop block with a Query Pagination block and its **Next** link enabled.
2. Add **Dynamic Load More** immediately after the Query Loop.
3. Choose Button, Infinite Scroll, or Hybrid in the block sidebar.

The defaults target `.wp-block-post-template` list items and discover the next URL from `.wp-block-query-pagination-next`.

## Selector and markup contract

The engine needs four values:

- `targetSelector`: the same grid/container on the current and paginated pages.
- `itemSelector`: items inside that container, normally `:scope > *`.
- `paginationSelector`: the semantic pagination associated with the grid.
- `nextSelector`: the anchor (or an element inside the anchor) for the next page.

When more than one matching grid exists, use a unique class. The engine otherwise pairs grids and paginations by their document order.

## JavaScript lifecycle events

All events bubble from the control element:

- `yoo-load-more:beforeload` — cancelable; detail includes `url` and `instance`.
- `yoo-load-more:afterload` — includes inserted `items`, loaded `url`, and `nextUrl`.
- `yoo-load-more:complete` — no next page remains.
- `yoo-load-more:error` — includes the caught `error`.
- `yoo-load-more:uikiterror` — insertion succeeded but a UIkit refresh failed.

After insertion the engine runs `UIkit.update()` on the target, reapplies a surrounding UIkit Filter, and refreshes Scrollspy and Lightbox roots when present.

## Optional direct markup

Third-party templates can use the engine without either editor. Render a wrapper with `data-yoo-load-more`, a JSON `data-yoo-load-more-config` attribute, and children carrying `data-yoo-load-more-button`, `data-yoo-load-more-label`, `data-yoo-load-more-spinner`, `data-yoo-load-more-status`, and `data-yoo-load-more-sentinel`.

## Project structure

```text
yoo-load-more/
├── assets/
│   ├── css/load-more.css
│   └── js/
│       ├── block-editor.js
│       └── load-more-engine.js
├── blocks/load-more/block.json
├── elements/yoo_load_more/
│   ├── images/
│   ├── templates/
│   └── element.php
├── includes/
│   ├── class-block-renderer.php
│   └── class-plugin.php
├── bin/
│   ├── bump-version.php
│   └── check-version.php
├── bootstrap.php
├── build.sh
├── yoo-load-more.php
├── readme.txt
├── CHANGELOG.md
└── LICENSE.md
```

`yoo-load-more.php` is intentionally small: it defines plugin constants, loads the PHP classes, and starts the orchestrator. `bootstrap.php` remains at the plugin root because it is the YOOtheme module entry point.

## Development checks

The plugin has no Composer, npm, runtime framework, jQuery, or build-step dependency. Source assets are shipped directly.

```bash
php -l yoo-load-more.php
php -l includes/class-plugin.php
php -l includes/class-block-renderer.php
php -l bootstrap.php
node --check assets/js/load-more-engine.js
node --check assets/js/block-editor.js
```

Before a release, ensure Git and the `origin` remote are configured. Build the current version without changing Git history:

```bash
./build.sh
```

Create a versioned release commit and push it:

```bash
./build.sh patch --comment "Short release summary"
```

Create the commit, push it, tag it, create a GitHub Release, and upload the ZIP:

```bash
./build.sh minor --comment "Feature release" --publish-release
```

The resulting archive is written to:

```text
/Users/yuraw/Documents/Clients/NoblesMedia/EBRD/develope plugins/Releases/yoo-load-more-vX.Y.Z.zip
```

Release checklist:

1. Update `CHANGELOG.md`; the bump script synchronizes the other version declarations.
2. Test Button, Infinite, and Hybrid modes on a paginated archive.
3. Test both the YOOtheme Builder element and Gutenberg Query Loop block.
4. Run `./build.sh patch`, `minor`, or `major` as appropriate.

## License

GPL-2.0-or-later. See [`LICENSE.md`](LICENSE.md).
