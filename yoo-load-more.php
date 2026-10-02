<?php
/**
 * Plugin Name:       YOOtheme Pro Dynamic Load More & Infinite Scroll
 * Description:       Adds progressively enhanced Load More and Infinite Scroll controls for YOOtheme Pro grids and WordPress Query Loop blocks.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Nobles Media
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       yoo-load-more
 */

defined('ABSPATH') || exit;

define('YOO_LOAD_MORE_VERSION', '1.0.0');
define('YOO_LOAD_MORE_FILE', __FILE__);
define('YOO_LOAD_MORE_PATH', plugin_dir_path(__FILE__));
define('YOO_LOAD_MORE_URL', plugin_dir_url(__FILE__));

require_once YOO_LOAD_MORE_PATH . 'includes/class-block-renderer.php';
require_once YOO_LOAD_MORE_PATH . 'includes/class-plugin.php';

\YooLoadMore\Plugin::instance();
