/* =========================================================
   MFC YOUTH AREA MANAGEMENT SYSTEM
   Application Shell
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeSidebar();
    initializeUserMenu();

});


/* =========================
   SIDEBAR
   ========================= */

function initializeSidebar() {

    const menuButton = document.getElementById("menu-button");
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (!menuButton || !sidebar) {
        return;
    }

    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle("sidebar-open");

        if (overlay) {
            overlay.classList.toggle("overlay-visible");
        }

    });


    if (overlay) {

        overlay.addEventListener("click", () => {

            sidebar.classList.remove("sidebar-open");
            overlay.classList.remove("overlay-visible");

        });

    }

}


/* =========================
   USER MENU
   ========================= */

function initializeUserMenu() {

    const userButton = document.getElementById("user-menu-button");
    const userMenu = document.getElementById("user-menu");

    if (!userButton || !userMenu) {
        return;
    }

    userButton.addEventListener("click", (event) => {

        event.stopPropagation();

        userMenu.classList.toggle("user-menu-visible");

    });


    document.addEventListener("click", () => {

        userMenu.classList.remove("user-menu-visible");

    });

}