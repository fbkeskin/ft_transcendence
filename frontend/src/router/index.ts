// frontend/src/router/index.ts
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Register } from '../pages/Register';
import { Profile } from '../pages/Profile';
import { Home } from '../pages/Home';
import { Navbar } from '../components/Navbar';
import { Game } from '../pages/Game';
import { GameAI } from '../pages/GameAI';
import { GameOnline } from '../pages/GameOnline'; // <--- YENİ EKLENDİ
import { TournamentBracket } from '../pages/TournamentBracket'; // Import
import { Tournament } from '../pages/Tournament';          // <--- BU IMPORT EKLENDİ

// Rota Tanımı: Artık sadece string değil, { render, init } objesi dönebilir
const routes: Record<string, any> = {
  '/': Home,
  '/login': Login,
  '/dashboard': Dashboard,
  '/register': Register,
  '/profile': Profile,
  '/game/local': Game,
  '/game/ai': GameAI,
  '/game/online': GameOnline, // <--- YENİ ROTAMIZ EKLENDİ
  '/tournament/bracket': TournamentBracket, // <--- YENİ ROTA
  '/tournament/new': Tournament,           // <--- BU SATIR EKSİKTİ, EKLENDİ!
  
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

const render = async () => {
    // 0. ÖNCEKİ SAYFAYI TEMİZLE
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    const path = window.location.pathname;
    
    // 1. NAVBAR'I GÜNCELLE
    const navContainer = document.getElementById('navbar');
    if (navContainer) {
      navContainer.innerHTML = Navbar.render();
      Navbar.afterRender(); // Logout butonunu dinle
    }
  
    // 2. SAYFA İÇERİĞİNİ GÜNCELLE
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
      
      // DEĞİŞİKLİK: .closest kullanarak kapsayıcı linki buluyoruz
      const link = target.matches('[data-link]') ? target : target.closest('[data-link]');
      
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) navigate(href);
      }
    });
};