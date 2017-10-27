'use strict';
require('style');
require.context('img');

import Menu from './utils/menu';

// Import just the Highlight.js elements we want
import hljs from 'highlight.js/lib/highlight';
import 'highlight.js/styles/railscasts.css';
['bash', 'php', 'dockerfile', 'css', 'nginx', 'makefile', 'javascript', 'yaml'].forEach((langName) => {
    const langModule = require(`highlight.js/lib/languages/${langName}`);
    hljs.registerLanguage(langName, langModule);
});

class Erianna {

    constructor() {
        document.addEventListener('DOMContentLoaded', this.domReady.bind(this));
    }

    domReady(event) {
        if (document.querySelector("nav .menu")) {
            new Menu();
        }

        hljs.initHighlightingOnLoad();
    }
}

export default new Erianna();

if (module.hot) {
    module.hot.accept();
}
