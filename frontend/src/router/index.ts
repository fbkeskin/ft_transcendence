// frontend/src/router/index.ts
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Register } from '../pages/Register';
import { Profile } from '../pages/Profile';
import { Home } from '../pages/Home'; // Eğer Home yoksa yukarıdaki kodu kullan
import { Navbar } from '../components/Navbar';
import { Game } from '../pages/Game';
import { GameAI } from '../pages/GameAI';

// Rota Tanımı: Artık sadece string değil, { render, init } objesi dönebilir
const routes: Record<string, any> = {
  '/': Home,
  '/login': Login, // Login bileşenini bağladık
  '/dashboard': Dashboard, // YENİ ROTA
  '/register': Register, // YENİ ROTA
  '/profile': Profile, // YENİ
  '/game/local': Game, // <-- YENİ ROTAMIZ
  '/game/ai': GameAI, // <-- YENİ
  
  '/404': {
    render: () => `<h1>404</h1>`,
    init: () => {}
  }
};

export const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  render();
};

const render = () => {
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
	  if (component.init) component.init();
	}
  }
  
// Linklere tıklandığında sayfa yenilenmesini engelle
export const initRouter = () => {
    window.addEventListener('popstate', render);
    render();
  
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      
      // DEĞİŞİKLİK BURADA: .matches yerine .closest kullandık!
      // Tıklanan eleman VEYA onun bir üst ebeveyni 'data-link' içeriyor mu?
      const link = target.matches('[data-link]') ? target : target.closest('[data-link]');
      
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) navigate(href);
      }
    });
};