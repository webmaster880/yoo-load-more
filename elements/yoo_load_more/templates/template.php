<?php

$mode = in_array($props['mode'], ['button', 'infinite', 'hybrid'], true) ? $props['mode'] : 'button';
$style = in_array($props['button_style'], ['uk-button-default', 'uk-button-primary', 'uk-button-secondary', 'uk-button-text'], true)
    ? $props['button_style']
    : 'uk-button-default';
$size = in_array($props['button_size'], ['', 'uk-button-small', 'uk-button-large'], true) ? $props['button_size'] : '';
$config = [
    'context' => 'yootheme',
    'mode' => $mode,
    'targetSelector' => (string) $props['target_selector'],
    'itemSelector' => (string) $props['item_selector'],
    'paginationSelector' => (string) $props['pagination_selector'],
    'nextSelector' => (string) $props['next_selector'],
    'defaultText' => (string) $props['default_text'],
    'loadingText' => (string) $props['loading_text'],
    'noMoreText' => (string) $props['no_more_text'],
    'rootMargin' => (string) $props['root_margin'],
    'debounce' => max(0, min(2000, (int) $props['debounce'])),
    'hidePagination' => !empty($props['hide_pagination']),
    'updateBrowserUrl' => !empty($props['update_browser_url']),
    'initialUrl' => esc_url_raw((string) ($props['initial_url'] ?? '')),
];

$el = $this->el('div', [
    'class' => ['yoo-load-more', 'uk-text-center'],
    'data-yoo-load-more' => '',
    'data-yoo-load-more-config' => wp_json_encode($config),
    'data-mode' => $mode,
]);
$button = $this->el('button', [
    'class' => ['uk-button', $style, $size],
    'type' => 'button',
    'data-yoo-load-more-button' => '',
    'aria-controls' => '',
    'aria-busy' => 'false',
]);
$initial_url = esc_url((string) ($props['initial_url'] ?? ''));

?>
<?= $el($props, $attrs) ?>
    <?= $button($props) ?>
        <span data-yoo-load-more-spinner uk-spinner="ratio: 0.6" hidden></span>
        <span data-yoo-load-more-label><?= esc_html((string) $props['default_text']) ?></span>
    <?= $button->end() ?>
    <span class="yoo-load-more__status" data-yoo-load-more-status role="status" aria-live="polite"></span>
    <span class="yoo-load-more__sentinel" data-yoo-load-more-sentinel aria-hidden="true"></span>
    <?php if ($initial_url): ?>
        <noscript><p><a href="<?= $initial_url ?>"><?= esc_html((string) $props['default_text']) ?></a></p></noscript>
    <?php endif ?>
<?= $el->end() ?>

