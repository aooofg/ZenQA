import { browser } from '$app/environment';

class UIState {
    // Инициализируем из localStorage, если мы в браузере
    isSidebarOpen = $state(
        browser ? localStorage.getItem('tms_sidebar') !== 'closed' : true
    );

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        if (browser) {
            localStorage.setItem('tms_sidebar', this.isSidebarOpen ? 'open' : 'closed');
        }
    }
}

export const ui = new UIState();