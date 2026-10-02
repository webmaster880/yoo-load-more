((blocks, blockEditor, components, element, i18n) => {
    'use strict';

    const { registerBlockType } = blocks;
    const { InspectorControls, useBlockProps } = blockEditor;
    const { PanelBody, SelectControl, TextControl, ToggleControl, RangeControl } = components;
    const { createElement: el, Fragment } = element;
    const { __ } = i18n;

    registerBlockType('yoo-load-more/load-more', {
        edit: ({ attributes, setAttributes }) => {
            const blockProps = useBlockProps({ className: 'yoo-load-more-editor' });
            const set = (key) => (value) => setAttributes({ [key]: value });

            return el(Fragment, {},
                el(InspectorControls, {},
                    el(PanelBody, { title: __('Loading', 'yoo-load-more'), initialOpen: true },
                        el(SelectControl, {
                            label: __('Trigger mode', 'yoo-load-more'),
                            value: attributes.mode,
                            options: [
                                { label: __('Button', 'yoo-load-more'), value: 'button' },
                                { label: __('Infinite scroll', 'yoo-load-more'), value: 'infinite' },
                                { label: __('Hybrid', 'yoo-load-more'), value: 'hybrid' },
                            ],
                            onChange: set('mode'),
                        }),
                        el(TextControl, { label: __('Default text', 'yoo-load-more'), value: attributes.defaultText, onChange: set('defaultText') }),
                        el(TextControl, { label: __('Loading text', 'yoo-load-more'), value: attributes.loadingText, onChange: set('loadingText') }),
                        el(TextControl, { label: __('No more posts text', 'yoo-load-more'), value: attributes.noMoreText, onChange: set('noMoreText') }),
                        el(SelectControl, {
                            label: __('Button style', 'yoo-load-more'),
                            value: attributes.buttonStyle,
                            options: [
                                { label: __('Default', 'yoo-load-more'), value: 'uk-button-default' },
                                { label: __('Primary', 'yoo-load-more'), value: 'uk-button-primary' },
                                { label: __('Secondary', 'yoo-load-more'), value: 'uk-button-secondary' },
                                { label: __('Text', 'yoo-load-more'), value: 'uk-button-text' },
                            ],
                            onChange: set('buttonStyle'),
                        }),
                        el(SelectControl, {
                            label: __('Button size', 'yoo-load-more'),
                            value: attributes.buttonSize,
                            options: [
                                { label: __('Default', 'yoo-load-more'), value: '' },
                                { label: __('Small', 'yoo-load-more'), value: 'uk-button-small' },
                                { label: __('Large', 'yoo-load-more'), value: 'uk-button-large' },
                            ],
                            onChange: set('buttonSize'),
                        }),
                        el(TextControl, { label: __('Observer root margin', 'yoo-load-more'), value: attributes.rootMargin, onChange: set('rootMargin') }),
                        el(RangeControl, { label: __('Debounce (ms)', 'yoo-load-more'), value: attributes.debounce, min: 0, max: 2000, step: 50, onChange: set('debounce') }),
                        el(ToggleControl, { label: __('Update browser URL', 'yoo-load-more'), checked: attributes.updateBrowserUrl, onChange: set('updateBrowserUrl') }),
                        el(ToggleControl, { label: __('Hide semantic pagination after initialization', 'yoo-load-more'), checked: attributes.hidePagination, onChange: set('hidePagination') })
                    ),
                    el(PanelBody, { title: __('Advanced selectors', 'yoo-load-more'), initialOpen: false },
                        el(TextControl, { label: __('Target container selector', 'yoo-load-more'), value: attributes.targetSelector, onChange: set('targetSelector') }),
                        el(TextControl, { label: __('Item selector', 'yoo-load-more'), value: attributes.itemSelector, onChange: set('itemSelector') }),
                        el(TextControl, { label: __('Pagination selector', 'yoo-load-more'), value: attributes.paginationSelector, onChange: set('paginationSelector') }),
                        el(TextControl, { label: __('Next link selector', 'yoo-load-more'), value: attributes.nextSelector, onChange: set('nextSelector') }),
                        el(TextControl, { label: __('Initial next-page URL (optional)', 'yoo-load-more'), value: attributes.initialUrl, onChange: set('initialUrl') })
                    )
                ),
                el('div', blockProps,
                    el('button', { type: 'button', className: `uk-button ${attributes.buttonStyle} ${attributes.buttonSize}`.trim(), disabled: true }, attributes.defaultText),
                    el('p', { className: 'components-base-control__help' }, __('Place this block immediately after a Query Loop that contains a Next pagination link.', 'yoo-load-more'))
                )
            );
        },
        save: () => null,
    });
})(window.wp.blocks, window.wp.blockEditor, window.wp.components, window.wp.element, window.wp.i18n);

