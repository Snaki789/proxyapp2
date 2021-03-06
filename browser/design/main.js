
(function(global) {

	const doc     = global.document;
	const webview = doc.querySelector('#main-webview');
	const buttons = {
		history: {
			back:  doc.querySelector('#header-history-back'),
			next:  doc.querySelector('#header-history-next'),
			state: doc.querySelector('#header-history-state')
		},
		mode: Array.from(doc.querySelectorAll('#header-mode button')),
		site: doc.querySelector('#header-settings-site')
	};
	const inputs  = {
		address: doc.querySelector('#header-address input')
	};
	const sidebars = {
		site: doc.querySelector('aside#site')
	};



	const _get_url = function(browser, tab, refresh) {

		refresh = refresh === true;


		let url  = null;
		let ref  = tab.ref;
		let mime = ref.mime || null;

		if (mime !== null && (mime.type === 'audio' || mime.type === 'video')) {

			url = '/browser/internal/media.html?url=' + encodeURIComponent(ref.url);

		} else if (ref.protocol === 'stealth') {

			url = '/browser/internal/' + ref.domain + '.html';

			if (ref.query !== null) {
				url += '?' + ref.query;
			}

		} else if (ref.protocol === 'https' || ref.protocol === 'http') {

			if (refresh === true) {
				url = '/stealth/:' + tab.id + ',refresh,webview:/' + ref.url;
			} else {
				url = '/stealth/:' + tab.id + ',webview:/' + ref.url;
			}

		} else {

			url = '/browser/internal/fix-url.html?url=' + encodeURIComponent(ref.url);

		}

		return url;

	};

	const _init_events = function(browser, scope, webview) {

		scope   = scope !== undefined ? scope : null;
		webview = webview === true;


		if (scope !== null) {

			scope.onkeydown = (e) => {

				let ctrl = e.ctrlKey === true;
				let key  = e.key.toLowerCase();

				if (
					key === 'f2'
					|| key === 'f3'
					|| key === 'f4'
					|| key === 'f5'
					|| key === 'f6'
					|| key === 'f7'
					|| key === 'f8'
				) {
					inputs.address.className = '';
					inputs.address.blur();
				}

				if (ctrl === true && key === 'escape') {

					let tab = browser.tab || null;
					if (tab !== null) {
						browser.kill(tab);
					}

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'escape') {

					buttons.site.className   = '';
					inputs.address.className = '';
					sidebars.site.className   = '';

				} else if (key === 'f1') {

					inputs.address.className = 'active';
					inputs.address.setSelectionRange(0, inputs.address.value.length);
					inputs.address.focus();

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f2') {

					let check = buttons.mode.filter((b) => b.getAttribute('disabled') === 'true');
					if (check.length !== buttons.mode.length) {

						let next = buttons.mode.find((b) => b.getAttribute('data-val') !== 'true') || null;
						if (next !== null) {
							next.click();
						} else {

							buttons.mode.forEach((b) => (b.setAttribute('data-val', 'false')));

							if (browser !== null && browser.tab !== null) {
								browser.set({
									domain: browser.tab.config.domain,
									mode: {
										text:  false,
										image: false,
										audio: false,
										video: false,
										other: false
									}
								});
							}

						}

					}

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f3') {

					buttons.site.click();

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f4') {

					let tab = browser.open('stealth:settings');
					if (tab !== null) {
						browser.show(tab);
					}

				} else if (key === 'f5') {

					let index = browser.tabs.indexOf(browser.tab) - 1;
					if (index < 0) {
						index = browser.tabs.length - 1;
					}

					let tab = browser.tabs[index] || null;
					if (tab !== null) {
						browser.show(tab);
					}

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f6') {

					let index = browser.tabs.indexOf(browser.tab) + 1;
					if (index >= browser.tabs.length) {
						index %= browser.tabs.length;
					}

					let tab = browser.tabs[index] || null;
					if (tab !== null) {
						browser.show(tab);
					}

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f7') {

					if (browser.tabs.length > 0) {

						let tab = browser.tabs[0] || null;
						if (tab !== null) {
							browser.kill(tab);
						}

					}

					e.preventDefault();
					e.stopPropagation();

				} else if (key === 'f8') {

					if (browser.tabs.length > 0) {

						let tab = browser.tabs[browser.tabs.length - 1] || null;
						if (tab !== null) {
							browser.kill(tab);
						}

					}

					e.preventDefault();
					e.stopPropagation();

				} else if (ctrl === true && key === 'r') {

					if (buttons.history.state !== null) {

						let allowed = buttons.history.getAttribute('disabled') !== '';
						if (allowed === true) {
							buttons.history.state.click();
						}

					}

					e.preventDefault();
					e.stopPropagation();

				} else if (
					(ctrl === true && key === 'x')
					|| (ctrl === true && key === 'c')
					|| (ctrl === true && key === 'v')
				) {

					// XXX: Do nothing

				} else if (ctrl === true) {

					// XXX: Stupid Browser be stupid, yo

					e.preventDefault();
					e.stopPropagation();

				}

			};

		}


		if (scope !== null && webview === true) {

			let doc = scope.document || null;
			if (doc !== null) {
				_init_links(browser, Array.from(doc.querySelectorAll('a')));
			}

		}

	};

	const _init_links = function(browser, links) {

		links.forEach((link) => {

			link.onclick = () => {

				let tab = browser.tab || null;
				if (tab !== null) {
					browser.navigate(link.getAttribute('href'));
				}

				return false;

			};

		});

	};


	const _init = function(browser) {

		browser.on('show', (tab) => {

			let url = _get_url(browser, tab, false);
			if (url !== null && webview !== null) {

				if (webview.src !== url) {

					setTimeout(() => {
						webview.src = url;
					}, 0);

				}

			}

		});

		browser.on('refresh', (tab, tabs, refresh) => {

			let url = _get_url(browser, tab, refresh);
			if (url !== null && webview !== null) {

				setTimeout(() => {
					webview.src = url;
				}, 0);

			}

		});

		browser.client.on('session', (session) => {

			try {
				doc.cookie = 'session=' + session + ';path=/stealth';
			} catch (err) {
				// Do nothing
			}

		});


		_init_events(browser, global, false);


		if (webview !== null) {

			(function() {
				_init_events(browser, webview.contentWindow || null, true);
			})();

			webview.onload = () => {
				_init_events(browser, webview.contentWindow || null, true);
			};

		}

	};



	/*
	 * INIT
	 */

	global.browser ? _init(global.browser) : global.BROWSER_BINDINGS.push(_init);

})(typeof window !== 'undefined' ? window : this);

