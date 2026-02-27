// frontend/src/pages/Login.ts
import { loginReq, verify2FALoginReq, getProfileReq } from '../services/auth.service';
import { navigate } from '../router';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';

export const Login = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div class="bg-slate-800 p-8 rounded-xl shadow-2xl w-[400px] border border-slate-700 relative overflow-hidden">
        
        <h2 class="text-3xl font-bold mb-6 text-center text-indigo-400 tracking-widest">${lang.t('login_title')}</h2>

        <form id="login-form" class="space-y-4 transition-all duration-500">
		<div>
		<label class="block text-xs uppercase text-slate-400 mb-1">${lang.t('email_label')}</label>
		<input type="email" id="email" required
			oninvalid="if(this.value === ''){this.setCustomValidity('${lang.t('common_fill_field')}')}else{this.setCustomValidity('Lütfen geçerli bir e-posta adresi girin (örn: kullanici@mail.com)')}"
			oninput="this.setCustomValidity('')"
			class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white" 
			placeholder="${lang.t('email_placeholder')}">
		</div>
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">${lang.t('password_label')}</label>
                <input type="password" id="password" required
                    oninvalid="this.setCustomValidity('${lang.t('common_fill_field')}')"
                    oninput="this.setCustomValidity('')"
                    class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white" 
                    placeholder="${lang.t('password_placeholder')}">
            </div>
            
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition shadow-lg shadow-indigo-500/30">
                ${lang.t('login_btn')}
            </button>
            
            <div class="text-center mt-8 flex flex-col gap-3">
                <a href="http://localhost:3000/auth/42" class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded transition border border-slate-600 flex items-center justify-center text-sm font-bold shadow-lg active:scale-95">
                    ${lang.t('login_42_btn')} 
                </a>
                <button type="button" id="back-home-btn" class="text-xs text-slate-500 hover:text-indigo-400 transition underline mt-2">
                    ${lang.t('back_to_home')}
                </button>
            </div>
        </form>

        <form id="2fa-form" class="hidden space-y-4 animate-fade-in">
            <div class="text-center mb-4">
                <div class="text-5xl mb-2">🛡️</div>
                <h3 class="text-xl font-bold text-white">${lang.t('twofa_title')}</h3>
                <p class="text-xs text-slate-400">${lang.t('twofa_desc')}</p>
            </div>

            <div>
                <input type="text" id="2fa-code" maxlength="6" required
                    oninvalid="this.setCustomValidity('${lang.t('common_fill_field')}')"
                    oninput="this.setCustomValidity('')"
                    class="w-full bg-slate-900 border border-slate-600 rounded p-4 text-center text-2xl tracking-[10px] focus:border-emerald-500 outline-none text-emerald-400 font-mono" 
                    placeholder="000000">
            </div>

            <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition shadow-lg shadow-emerald-500/30">
                ${lang.t('twofa_verify_btn')}
            </button>
            
            <button type="button" id="back-to-login" class="w-full text-xs text-slate-500 hover:text-white underline mt-2">
                ${lang.t('twofa_back_btn')}
            </button>
        </form>

      </div>
    </div>
  `,
  
  init: async () => {
    const urlCheck = new URLSearchParams(window.location.search);
    if (!urlCheck.get('token') && !urlCheck.get('2fa_required')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const twoFaForm = document.getElementById('2fa-form') as HTMLFormElement;
    
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const codeInput = document.getElementById('2fa-code') as HTMLInputElement;

    document.getElementById('back-home-btn')?.addEventListener('click', () => navigate('/'));

    let tempUserId: number | null = null;

    // --- URL KONTROLÜ (Aynı) ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        localStorage.setItem('token', token);
        try {
            const user = await getProfileReq();
            localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {}
        window.history.replaceState({}, document.title, "/login");
        navigate('/dashboard');
        return;
    }

    const userIdParam = urlParams.get('userId');
    const twoFaRequired = urlParams.get('2fa_required');
    if (userIdParam && twoFaRequired === 'true') {
        tempUserId = parseInt(userIdParam);
        loginForm?.classList.add('hidden');
        twoFaForm?.classList.remove('hidden');
        window.history.replaceState({}, document.title, "/login");
        codeInput.focus();
    }

    const errorParam = urlParams.get('error');
    if (errorParam) {
        Modal.alert(lang.t('login_error'), errorParam);
        window.history.replaceState({}, document.title, "/login");
    }

    // --- 1. LOGIN FORM SUBMIT (YENİLENDİ) ---
    // Artık click değil submit dinliyoruz. Tarayıcı boşlukları kendi engeller.
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        const res = await loginReq(email, password);

        if (res.require2FA) {
            tempUserId = res.userId;
            loginForm?.classList.add('hidden');
            twoFaForm?.classList.remove('hidden');
            codeInput.focus();
            return; 
        }

        if (res.token) {
            localStorage.setItem('token', res.token);
            navigate('/dashboard');
        }
      } catch (err: any) {
        Modal.alert(lang.t('login_error'), lang.t(err.message));
      }
    });

    // --- 2. 2FA FORM SUBMIT (YENİLENDİ) ---
    twoFaForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = codeInput.value.trim();
        if (!tempUserId) return;

        try {
            const res = await verify2FALoginReq(tempUserId, code);
            
            if (res.token) {
                localStorage.setItem('token', res.token);
                try {
                    const user = await getProfileReq();
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (pErr) {}
                navigate('/dashboard');
            }
        } catch (err: any) {
            await Modal.alert(lang.t('common_error'), lang.t(err.message));
            codeInput.value = ''; 
        }
    });

    document.getElementById('back-to-login')?.addEventListener('click', () => {
        twoFaForm?.classList.add('hidden');
        loginForm?.classList.remove('hidden');
        tempUserId = null;
    });
  }
};