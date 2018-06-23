'use strict';

export class Menu {
    constructor() {
        let menu = document.querySelector("#header nav li.menu a");
            menu.addEventListener("click", e => this.showMenu());
    }

    showMenu(e) {
        document.querySelector("body").classList.add("is-menu-visible");

        let main = document.querySelector("#wrapper");
            main.addEventListener("click", function() {
                document.querySelector("body").classList.remove("is-menu-visible");
            });
    }
}

if (module.hot) {
    module.hot.accept();
}