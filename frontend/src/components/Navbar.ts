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
  
      const isGamePage = path.startsWith('/game') || path === '/tournament/bracket';
  
      return `
        <div class="w-full px-4 lg:px-12 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-[100]">
          
          <div class="flex items-center justify-between h-20">
            
            <a href="/" data-link class="flex-shrink-0 cursor-pointer flex items-center gap-2 group">
                <img src="/logo.png" alt="42 Istanbul" class="h-8 md:h-10 w-auto filter invert opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            </a>
  
            <div class="flex items-center gap-2 md:gap-6"> 
                ${isLoggedIn ? `
                  <div class="flex items-center space-x-2 md:space-x-4">
                    <a href="/dashboard" class="text-gray-300 hover:text-white px-2 py-1 rounded-md text-[10px] md:text-sm font-medium transition-all" data-link>${lang.t('nav_game')}</a>
                    <a href="/profile" class="text-gray-300 hover:text-white px-2 py-1 rounded-md text-[10px] md:text-sm font-medium transition-all" data-link>${lang.t('nav_profile')}</a>
                  </div>
                  <button id="nav-logout" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-2 md:px-6 py-1 md:py-2 rounded-md text-[10px] md:text-sm font-bold transition-all">
                    ${lang.t('nav_logout')}
                  </button>
                ` : `
                  <a href="/login" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all" data-link>${lang.t('nav_login')}</a>
                  <a href="/register" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-6 py-1.5 md:py-2 rounded-md text-[10px] md:text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all" data-link>
                    ${lang.t('nav_register')}
                  </a>
                `}
                
                <div class="relative group border-l border-gray-700 pl-2 md:pl-6 ml-2 md:ml-0" 
                     title="${isGamePage ? lang.t('nav_lang_disabled') : ''}">
                    <select id="lang-select" ${isGamePage ? 'disabled' : ''} 
                            class="appearance-none bg-gray-900/80 hover:bg-gray-800 text-white border border-gray-700 hover:border-indigo-500 rounded-md py-1 pl-2 md:pl-3 pr-8 text-[10px] md:text-sm focus:outline-none transition-colors cursor-pointer font-bold ${isGamePage ? 'opacity-50 cursor-not-allowed' : ''}">
                        <option value="tr" ${lang.getCurrentLang() === 'tr' ? 'selected' : ''}>TR 🇹🇷</option>
                        <option value="en" ${lang.getCurrentLang() === 'en' ? 'selected' : ''}>EN 🇬🇧</option>
                        <option value="fr" ${lang.getCurrentLang() === 'fr' ? 'selected' : ''}>FR 🇫🇷</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 md:px-2 text-gray-400">
                        <svg class="h-3 w-3 md:h-4 md:w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
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
          socketService.disconnect();
          sessionStorage.removeItem('pending_2fa');
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