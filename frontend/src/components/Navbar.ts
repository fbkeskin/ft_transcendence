// frontend/src/components/Navbar.ts
import { lang } from '../services/language.service';
import { navigate } from '../router';
import { socketService } from '../services/socket.service';

export const Navbar = {
    render: () => {
      const token = localStorage.getItem('token');
      const path = window.location.pathname;
      
      let isLoggedIn = !!token;
      
      if (path === '/login' || path === '/register') {
          isLoggedIn = false;
      }
  
      let user = { username: 'Misafir' };
      try {
          const storedUser = localStorage.getItem('user');
          if (storedUser && storedUser !== 'undefined') {
              user = JSON.parse(storedUser);
          }
      } catch (e) {
          localStorage.removeItem('user');
      }
  
      return `
        <div class="w-full px-6 lg:px-12 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
          
          <div class="flex items-center justify-between h-20">
            
            <a href="/" data-link class="flex-shrink-0 cursor-pointer flex items-center gap-2 group">
                <img src="/logo.png" alt="42 Istanbul" class="h-10 w-auto filter invert opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            </a>
  
            <div class="hidden md:block">
              <div class="ml-10 flex items-baseline space-x-6"> ${isLoggedIn ? `
                  <a href="/dashboard" class="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-all" data-link>${lang.t('nav_game')}</a>
                  <a href="/profile" class="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-all" data-link>
                    ${lang.t('nav_profile')} <span class="text-xs opacity-70">(${user.username || 'Oyuncu'})</span>
                  </a>
                  <button id="nav-logout" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-6 py-2 rounded-md text-sm font-bold transition-all ml-4">
                    ${lang.t('nav_logout')}
                  </button>
                ` : `
                  <a href="/login" class="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-all" data-link>${lang.t('nav_login')}</a>
                  <a href="/register" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5" data-link>
                    ${lang.t('nav_register')}
                  </a>
                `}
                
                <div class="relative ml-6 group border-l border-gray-700 pl-6">
                    <select id="lang-select" class="appearance-none bg-gray-900/80 hover:bg-gray-800 text-white border border-gray-700 hover:border-indigo-500 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer">
                        <option value="tr" ${lang.getCurrentLang() === 'tr' ? 'selected' : ''}>TR 🇹🇷</option>
                        <option value="en" ${lang.getCurrentLang() === 'en' ? 'selected' : ''}>EN 🇬🇧</option>
                        <option value="fr" ${lang.getCurrentLang() === 'fr' ? 'selected' : ''}>FR 🇫🇷</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      `;
    },
  
    afterRender: () => {
      const logoutBtn = document.getElementById('nav-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          // --- ÖNEMLİ: Çıkış yaparken socket bağlantısını kes ---
          socketService.disconnect();
          // -----------------------------------------------------
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        });
      }

      const langSelect = document.getElementById('lang-select');
      if (langSelect) {
        langSelect.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            lang.setLanguage(target.value);
            navigate(window.location.pathname);
        });
      }
    }
};