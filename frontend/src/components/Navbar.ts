// frontend/src/components/Navbar.ts
import { lang } from '../services/language.service';

export const Navbar = {
	render: () => {
	  // 1. Token kontrolü
	  const token = localStorage.getItem('token');
      const path = window.location.pathname;
      
      // EĞER LOGIN SAYFASINDAYSAK TOKEN OLSA BİLE GÖSTERME
      // (42 dönüşü hariç, ama görsel olarak Navbar'da buton görmek sorun değil)
      let isLoggedIn = !!token;
      
      if (path === '/login' || path === '/register') {
          isLoggedIn = false;
      }
  
	  // 2. Kullanıcı verisini GÜVENLİ şekilde çekme (Hata Sebebi Burasıydı)
	  let user = { username: 'Misafir' };
	  
	  try {
		  const storedUser = localStorage.getItem('user');
		  // Eğer veri varsa ve "undefined" yazısı değilse parse et
		  if (storedUser && storedUser !== 'undefined') {
			  user = JSON.parse(storedUser);
		  }
	  } catch (e) {
		  // Veri bozuksa (örn: "undefined" stringi) sessizce temizle
		  console.error("User verisi bozuk, temizleniyor...", e);
		  localStorage.removeItem('user');
	  }
  
	  // 3. HTML Çıktısı
	  return `
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		  <div class="flex items-center justify-between h-16">
			
		  <a href="/" data-link class="flex-shrink-0 cursor-pointer group">
		  <h1 class="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 group-hover:scale-105 transition-transform duration-300">
			FT_TRANSCENDENCE
		  </h1>
		  </a>
  
			<div class="hidden md:block">
			  <div class="ml-10 flex items-baseline space-x-4">
				
				${isLoggedIn ? `
				  <a href="/dashboard" class="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all" data-link>${lang.t('nav_game')}</a>
				  <a href="/profile" class="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all" data-link>
					${lang.t('nav_profile')} <span class="text-xs opacity-70">(${user.username || 'Oyuncu'})</span>
				  </a>
				  <button id="nav-logout" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-md text-sm font-bold transition-all ml-4">
					${lang.t('nav_logout')}
				  </button>
				` : `
				  <a href="/login" class="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-all" data-link>${lang.t('nav_login')}</a>
				  <a href="/register" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5" data-link>
					${lang.t('nav_register')}
				  </a>
				`}
				
                <div class="relative ml-4 group">
                    <select id="lang-select" class="appearance-none bg-gray-900/80 hover:bg-gray-800 text-white border border-gray-700 hover:border-indigo-500 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer">
                        <option value="tr" ${lang.getCurrentLang() === 'tr' ? 'selected' : ''}>TR 🇹🇷</option>
                        <option value="en" ${lang.getCurrentLang() === 'en' ? 'selected' : ''}>EN 🇺🇸</option>
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
  
	// Navbar yüklendikten sonra çalışacak olaylar
	afterRender: () => {
	  const logoutBtn = document.getElementById('nav-logout');
	  if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
		  // Çıkış işlemleri
		  localStorage.removeItem('token');
		  localStorage.removeItem('user');
		  
		  // Login sayfasına yönlendir ve sayfayı yenile (Navbar güncellensin diye)
		  window.location.href = '/login';
		});
	  }

      const langSelect = document.getElementById('lang-select');
      if (langSelect) {
        langSelect.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            lang.setLanguage(target.value);
        });
      }
	}
  };