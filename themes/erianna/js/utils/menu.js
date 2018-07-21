'use strict';

export class Menu {
    constructor() {
        const menu = document.querySelector("#header nav li.menu a");
        menu.addEventListener("click", () => this.showMenu());
    }

    showMenu() {
        document.querySelector("body").classList.add("is-menu-visible");

        const main = document.querySelector("#wrapper");
        main.addEventListener("click", () => {
            document.querySelector("body").classList.remove("is-menu-visible");
        });
    }
}

if (module.hot) {
    module.hot.accept();
}
