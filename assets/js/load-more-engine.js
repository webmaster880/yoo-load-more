(() => {
    'use strict';

    const SELECTOR = '[data-yoo-load-more]';
    const instances = new WeakMap();

    class YooLoadMore {
        constructor(root) {
            this.root = root;
            this.button = root.querySelector('[data-yoo-load-more-button]');
            this.label = root.querySelector('[data-yoo-load-more-label]');
            this.spinner = root.querySelector('[data-yoo-load-more-spinner]');
            this.status = root.querySelector('[data-yoo-load-more-status]');
            this.sentinel = root.querySelector('[data-yoo-load-more-sentinel]');
            this.config = this.readConfig();
            this.target = this.findTarget(document);
            this.targetIndex = this.getTargetIndex(document, this.target);
            this.paginationIndex = this.getPaginationIndex(document, this.getPagination(document, this.target));
            this.nextUrl = this.config.initialUrl || this.findNextUrl(document, this.target);
            this.seenUrls = new Set();
            this.loading = false;
            this.complete = false;
            this.hybridActivated = this.config.mode !== 'hybrid';
            this.observer = null;
            this.observerTimer = 0;
            this.abortController = null;

            if (!this.button || !this.target || !this.sentinel) {
                this.root.hidden = true;
                return;
            }

            this.ensureTargetId();
            this.placeSentinelAfterTarget();
            this.bind();
            this.hideSemanticPagination();

            if (!this.nextUrl) {
                this.finish();
                return;
            }

            if (this.config.mode === 'infinite') {
                this.startObserver();
            }

            this.root.classList.add('yoo-load-more--ready');
        }

        readConfig() {
            const defaults = {
                context: 'generic',
                mode: 'button',
                targetSelector: '.uk-grid',
                itemSelector: ':scope > *',
                paginationSelector: '.uk-pagination',
                nextSelector: 'a[rel="next"], a.next, .next.page-numbers, .uk-pagination-next a',
                defaultText: 'Load more',
                loadingText: 'Loading…',
                noMoreText: 'No more posts',
                rootMargin: '300px 0px',
                debounce: 200,
                updateBrowserUrl: false,
                hidePagination: true,
                initialUrl: '',
            };

            try {
                const parsed = JSON.parse(this.root.dataset.yooLoadMoreConfig || '{}');
                return { ...defaults, ...parsed };
            } catch (error) {
                this.emit('error', { error });
                return defaults;
            }
        }

        bind() {
            this.onButtonClick = () => {
                if (this.config.mode === 'hybrid' && !this.hybridActivated) {
                    this.hybridActivated = true;
                    this.startObserver();
                }
                this.load();
            };
            this.button.addEventListener('click', this.onButtonClick);
        }

        findTarget(doc) {
            let matches;
            try {
                matches = Array.from(doc.querySelectorAll(this.config.targetSelector));
            } catch (error) {
                this.showError(error);
                return null;
            }

            if (!matches.length) {
                return null;
            }

            if (doc === document && this.config.context === 'wordpress-query') {
                const precedingQuery = this.findPrecedingQueryBlock();
                const localTarget = precedingQuery && precedingQuery.querySelector(this.config.targetSelector.replace(/^\.wp-block-query\s+/, ''));
                if (localTarget) {
                    return localTarget;
                }
            }

            if (doc === document) {
                const precedingElement = this.root.previousElementSibling;
                if (precedingElement) {
                    if (precedingElement.matches(this.config.targetSelector)) {
                        return precedingElement;
                    }
                    const nestedTarget = precedingElement.querySelector(this.config.targetSelector);
                    if (nestedTarget) {
                        return nestedTarget;
                    }
                }

                const rootPosition = this.root.compareDocumentPosition(matches[0]);
                const beforeRoot = matches.filter((element) =>
                    Boolean(element.compareDocumentPosition(this.root) & Node.DOCUMENT_POSITION_FOLLOWING)
                );
                if (beforeRoot.length || rootPosition) {
                    return beforeRoot.pop() || matches[0];
                }
            }

            return matches[this.targetIndex] || matches[0];
        }

        findPrecedingQueryBlock() {
            let element = this.root.previousElementSibling;
            while (element) {
                if (element.matches('.wp-block-query')) {
                    return element;
                }
                element = element.previousElementSibling;
            }
            return null;
        }

        getTargetIndex(doc, target) {
            if (!target) {
                return 0;
            }
            try {
                return Math.max(0, Array.from(doc.querySelectorAll(this.config.targetSelector)).indexOf(target));
            } catch (error) {
                return 0;
            }
        }

        ensureTargetId() {
            if (!this.target.id) {
                this.target.id = `yoo-load-more-target-${Math.random().toString(36).slice(2, 10)}`;
            }
            this.button.setAttribute('aria-controls', this.target.id);
        }

        placeSentinelAfterTarget() {
            if (this.target.parentNode) {
                this.target.insertAdjacentElement('afterend', this.sentinel);
            }
        }

        getPagination(doc, target) {
            if (!this.config.paginationSelector) {
                return null;
            }

            const queryScope = target && target.closest('.wp-block-query');
            if (queryScope) {
                const pagination = queryScope.querySelector(this.config.paginationSelector);
                if (pagination) {
                    return pagination;
                }
            }

            let parentScope = target && target.parentElement;
            let depth = 0;
            while (parentScope && depth < 4) {
                const paginations = parentScope.querySelectorAll(this.config.paginationSelector);
                if (paginations.length === 1) {
                    return paginations[0];
                }
                parentScope = parentScope.parentElement;
                depth += 1;
            }

            try {
                const paginations = Array.from(doc.querySelectorAll(this.config.paginationSelector));
                if (doc === document) {
                    const betweenTargetAndControl = paginations.filter((pagination) =>
                        Boolean(target.compareDocumentPosition(pagination) & Node.DOCUMENT_POSITION_FOLLOWING) &&
                        Boolean(pagination.compareDocumentPosition(this.root) & Node.DOCUMENT_POSITION_FOLLOWING)
                    );
                    if (betweenTargetAndControl.length) {
                        return betweenTargetAndControl[betweenTargetAndControl.length - 1];
                    }
                }
                const index = Number.isInteger(this.paginationIndex) ? this.paginationIndex : this.targetIndex;
                return paginations[index] || paginations[0] || null;
            } catch (error) {
                return null;
            }
        }

        getPaginationIndex(doc, pagination) {
            if (!pagination || !this.config.paginationSelector) {
                return 0;
            }
            try {
                return Math.max(0, Array.from(doc.querySelectorAll(this.config.paginationSelector)).indexOf(pagination));
            } catch (error) {
                return 0;
            }
        }

        findNextUrl(doc, target) {
            const pagination = this.getPagination(doc, target);
            const scopes = [pagination, target && target.closest('.wp-block-query'), doc].filter(Boolean);
            let link = null;

            for (const scope of scopes) {
                try {
                    link = scope.querySelector(this.config.nextSelector);
                } catch (error) {
                    this.showError(error);
                    return '';
                }
                if (link) {
                    break;
                }

                const icon = scope.querySelector('[uk-pagination-next], [data-uk-pagination-next]');
                if (icon) {
                    link = icon.closest('a');
                    if (link) {
                        break;
                    }
                }
            }

            if (link && link.tagName !== 'A') {
                link = link.closest('a') || link.querySelector('a');
            }

            // Some UIkit pagination templates only render numbered links. In that
            // case, the list item immediately after the active page is the next page.
            if (!link && pagination) {
                const numericNext = pagination.querySelector('li.uk-active + li a, li.active + li a, [aria-current="page"] + a');
                if (numericNext) {
                    link = numericNext;
                }
            }

            if (!link && doc.head) {
                link = doc.head.querySelector('link[rel="next"]');
            }

            return link && link.href ? link.href : '';
        }

        hideSemanticPagination() {
            if (!this.config.hidePagination) {
                return;
            }
            const pagination = this.getPagination(document, this.target);
            if (pagination) {
                pagination.hidden = true;
                pagination.dataset.yooLoadMorePagination = 'true';
            }
        }

        startObserver() {
            if (this.observer) {
                return;
            }

            if (!('IntersectionObserver' in window)) {
                this.root.dataset.mode = 'button';
                return;
            }

            this.observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }
                window.clearTimeout(this.observerTimer);
                this.observerTimer = window.setTimeout(() => this.load(), Number(this.config.debounce) || 0);
            }, {
                root: null,
                rootMargin: this.config.rootMargin,
                threshold: 0,
            });
            this.observer.observe(this.sentinel);
        }

        async load() {
            if (this.loading || this.complete || !this.nextUrl) {
                return;
            }

            let requestUrl;
            try {
                requestUrl = new URL(this.nextUrl, window.location.href);
                if (requestUrl.origin !== window.location.origin) {
                    throw new Error('The next-page URL must use the same origin.');
                }
            } catch (error) {
                this.showError(error);
                return;
            }

            const normalizedUrl = requestUrl.href;
            if (this.seenUrls.has(normalizedUrl)) {
                this.finish();
                return;
            }

            const beforeEvent = this.emit('beforeload', { url: normalizedUrl }, true);
            if (beforeEvent.defaultPrevented) {
                return;
            }

            this.seenUrls.add(normalizedUrl);
            this.clearError();
            this.setLoading(true);
            this.abortController = new AbortController();

            try {
                const response = await fetch(normalizedUrl, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-YOO-LoadMore': '1',
                    },
                    signal: this.abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`Page request failed with HTTP ${response.status}.`);
                }

                const contentType = response.headers.get('content-type') || '';
                if (contentType && !contentType.includes('text/html')) {
                    throw new Error('The next-page response was not HTML.');
                }

                const html = await response.text();
                const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
                const parsedTarget = this.findTarget(parsedDocument);
                if (!parsedTarget) {
                    throw new Error(`Target container not found on ${response.url || normalizedUrl}.`);
                }

                const items = this.getItems(parsedTarget);
                const nextUrl = this.findNextUrl(parsedDocument, parsedTarget);

                if (!items.length) {
                    this.finish();
                    return;
                }

                const fragment = document.createDocumentFragment();
                const insertedItems = items.map((item) => {
                    const imported = document.importNode(item, true);
                    fragment.appendChild(imported);
                    return imported;
                });
                this.target.appendChild(fragment);

                this.nextUrl = nextUrl;
                this.syncUIkit(insertedItems);

                if (this.config.updateBrowserUrl) {
                    const historyUrl = new URL(response.url || normalizedUrl);
                    history.pushState({ yooLoadMore: true }, '', `${historyUrl.pathname}${historyUrl.search}${historyUrl.hash}`);
                }

                this.emit('afterload', {
                    items: insertedItems,
                    url: response.url || normalizedUrl,
                    nextUrl: this.nextUrl,
                });
                this.emitCompatibilityEvent(insertedItems, response.url || normalizedUrl);

                if (!this.nextUrl || this.seenUrls.has(new URL(this.nextUrl, window.location.href).href)) {
                    this.finish();
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.seenUrls.delete(normalizedUrl);
                    this.showError(error);
                }
            } finally {
                this.abortController = null;
                this.setLoading(false);
            }
        }

        getItems(target) {
            try {
                return Array.from(target.querySelectorAll(this.config.itemSelector));
            } catch (error) {
                this.showError(error);
                return [];
            }
        }

        syncUIkit(insertedItems) {
            const UIkit = window.UIkit;
            if (!UIkit) {
                return;
            }

            window.requestAnimationFrame(() => {
                try {
                    UIkit.update(this.target);

                    const filterRoot = this.target.closest('[uk-filter], [data-uk-filter]') ||
                        (this.target.matches('[uk-filter], [data-uk-filter]') ? this.target : null);
                    if (filterRoot && typeof UIkit.filter === 'function') {
                        const filter = UIkit.filter(filterRoot);
                        if (filter && typeof filter.apply === 'function') {
                            filter.apply();
                        }
                    }

                    this.refreshComponent(UIkit, 'scrollspy', '[uk-scrollspy], [data-uk-scrollspy]', insertedItems);
                    this.refreshComponent(UIkit, 'lightbox', '[uk-lightbox], [data-uk-lightbox]', insertedItems);
                } catch (error) {
                    this.emit('uikiterror', { error });
                }
            });
        }

        refreshComponent(UIkit, componentName, selector, items) {
            if (typeof UIkit[componentName] !== 'function') {
                return;
            }

            const roots = new Set();
            const ancestor = this.target.closest(selector);
            if (ancestor) {
                roots.add(ancestor);
            }
            if (this.target.matches(selector)) {
                roots.add(this.target);
            }
            items.forEach((item) => {
                if (item.matches && item.matches(selector)) {
                    roots.add(item);
                }
                item.querySelectorAll(selector).forEach((element) => roots.add(element));
            });
            roots.forEach((element) => UIkit[componentName](element));
        }

        setLoading(isLoading) {
            this.loading = isLoading;
            this.target.setAttribute('aria-busy', String(isLoading));
            this.button.setAttribute('aria-busy', String(isLoading));
            this.button.disabled = isLoading;
            this.spinner.hidden = !isLoading;
            this.label.textContent = isLoading ? this.config.loadingText : this.config.defaultText;
            this.root.classList.toggle('yoo-load-more--loading', isLoading);
        }

        finish() {
            if (this.complete) {
                return;
            }
            this.complete = true;
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.button.hidden = true;
            this.sentinel.hidden = true;
            this.status.textContent = this.config.noMoreText || '';
            this.root.classList.add('yoo-load-more--complete');
            if (!this.config.noMoreText) {
                this.root.hidden = true;
            }
            this.emit('complete', {});
        }

        showError(error) {
            const fallback = window.YooLoadMoreSettings && window.YooLoadMoreSettings.errorText;
            this.status.textContent = fallback || 'Unable to load more posts. Please try again.';
            this.root.classList.add('yoo-load-more--error');
            console.error('[YOO Load More]', error);
            this.emit('error', { error });
        }

        clearError() {
            this.root.classList.remove('yoo-load-more--error');
            if (!this.complete) {
                this.status.textContent = '';
            }
        }

        emitCompatibilityEvent(items, url) {
            this.root.dispatchEvent(new CustomEvent('yoo:loadmore:loaded', {
                bubbles: true,
                detail: {
                    instance: this,
                    items,
                    url,
                    nextUrl: this.nextUrl,
                },
            }));
        }

        emit(name, detail, cancelable = false) {
            const event = new CustomEvent(`yoo-load-more:${name}`, {
                bubbles: true,
                cancelable,
                detail: { instance: this, ...detail },
            });
            this.root.dispatchEvent(event);
            return event;
        }
    }

    const init = (scope = document) => {
        const roots = [];
        if (scope.matches && scope.matches(SELECTOR)) {
            roots.push(scope);
        }
        if (scope.querySelectorAll) {
            roots.push(...scope.querySelectorAll(SELECTOR));
        }
        roots.forEach((root) => {
            if (!instances.has(root)) {
                instances.set(root, new YooLoadMore(root));
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init(), { once: true });
    } else {
        init();
    }

    new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                init(node);
            }
        }));
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('yoo-load-more:init', (event) => init(event.detail && event.detail.scope || document));
    window.YooLoadMore = {
        init,
        instances,
        Instance: YooLoadMore,
        getInstance: (element) => instances.get(element),
    };
})();
