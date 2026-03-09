// frontend/src/router/index.ts
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Register } from '../pages/Register';
import { Profile } from '../pages/Profile';
import { Home } from '../pages/Home';
import { Navbar } from '../components/Navbar';
import { Game } from '../pages/Game';
import { GameAI } from '../pages/GameAI';
import { GameOnline } from '../pages/GameOnline';
import { TournamentBracket } from '../pages/TournamentBracket'; // Import
import { Tournament } from '../pages/Tournament';

const routes: Record<string, any> = {
  '/': Home,
  '/login': Login,
  '/dashboard': Dashboard,
  '/register': Register,
  '/profile': Profile,
  '/game/local': Game,
  '/game/ai': GameAI,
  '/game/online': GameOnline,
  '/tournament/bracket': TournamentBracket, 
  '/tournament/new': Tournament,       
  
  '/404': {
    render: () => `<h1>404</h1>`,
    init: () => {}
  }
};

let currentCleanup: (() => void) | null = null;

export const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  render();
};

const protectedRoutes = ['/dashboard', '/profile', '/game/online', '/tournament/new', '/tournament/bracket'];
const guestRoutes = ['/login', '/register'];

const render = async () => {
    const path = window.location.pathname;
    const token = localStorage.getItem('token');

    // 1. AUTH GUARD: Giriş yapmamış kullanıcıyı korumalı rotalardan at
    if (protectedRoutes.some(pr => path.startsWith(pr)) && !token) {
        window.history.pushState({}, "", "/login");
        return render(); 
    }

    // 2. GUEST GUARD: Giriş yapmış kullanıcıyı login/register'dan at
    if (guestRoutes.includes(path) && token) {
        window.history.pushState({}, "", "/dashboard");
        return render();
    }

    // 3. ÖNCEKİ SAYFAYI TEMİZLE
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }
    
    // 4. NAVBAR'I GÜNCELLE
    const navContainer = document.getElementById('navbar');
    if (navContainer) {
      navContainer.innerHTML = Navbar.render();
      Navbar.afterRender(); // Logout butonunu dinle
    }
  
    // 5. SAYFA İÇERİĞİNİ GÜNCELLE
    const app = document.getElementById('app');
    const component = routes[path] || routes['/404'];
  
    if (app) {
      app.innerHTML = component.render();
      if (component.init) {
          // Init fonksiyonu async olabilir, sonucunu bekle
          const cleanup = await component.init();
          if (typeof cleanup === 'function') {
              currentCleanup = cleanup;
          }
      }
    }
  }
  
// Linklere tıklandığında sayfa yenilenmesini engelle
export const initRouter = () => {
    window.addEventListener('popstate', render);
    window.addEventListener('languageChanged', () => render()); // Dil değişince tekrar çiz
    render();
  
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      
      // .closest kullanarak kapsayıcı linki buluyoruzz
      const link = target.matches('[data-link]') ? target : target.closest('[data-link]');
      
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) navigate(href);
      }
    });
};