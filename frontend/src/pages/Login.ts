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

        <!-- GİRİŞ FORMU - novalidate ve autocomplete off ile Chrome engellendi -->
        <form id="login-form" class="space-y-4 transition-all duration-500" novalidate autocomplete="off">
            <div class="flex flex-col">
                <label class="block text-xs uppercase text-slate-400 mb-1 ml-1">${lang.t('email_label')}</label>
                <!-- Tipi text yaparak Chrome'un email baloncuğunu tamamen devre dışı bıraktık -->
                <input type="text" id="email" 
                    class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white transition" 
                    placeholder="${lang.t('email_placeholder')}">
                <span id="email-error" class="text-red-400 text-xs mt-1 ml-1 hidden"></span>
            </div>
            
            <div class="flex flex-col">
                <label class="block text-xs uppercase text-slate-400 mb-1 ml-1">${lang.t('password_label')}</label>
                <input type="password" id="password"
                    class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white transition" 
                    placeholder="${lang.t('password_placeholder')}">
                <span id="password-error" class="text-red-400 text-xs mt-1 ml-1 hidden"></span>
            </div>

            <button type="submit" id="login-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition shadow-lg shadow-indigo-500/30 active:scale-95">
                ${lang.t('login_btn')}
            </button>
            
            <div class="text-center mt-8 flex flex-col gap-3">
                <button type="button" id="btn-42-login" class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded transition border border-slate-600 flex items-center justify-center text-sm font-bold shadow-lg active:scale-95">
                    ${lang.t('login_42_btn')} 
                </button>
                <button type="button" id="back-home-btn" class="text-xs text-slate-500 hover:text-indigo-400 transition underline mt-2">
                    ${lang.t('back_to_home')}
                </button>
            </div>
            <div id="login-global-error" class="mt-4 text-center text-red-400 text-sm hidden bg-red-400/10 p-2 rounded border border-red-400/20"></div>
        </form>

        <!-- 2FA FORMU -->
        <form id="2fa-form" class="hidden space-y-4 animate-fade-in" novalidate autocomplete="off">
            <div class="text-center mb-4">
                <div class="text-5xl mb-2">🛡️</div>
                <h3 class="text-xl font-bold text-white uppercase tracking-wider">${lang.t('twofa_title')}</h3>
                <p class="text-xs text-slate-400">${lang.t('twofa_desc')}</p>
            </div>

            <div class="flex flex-col items-center">
                <input type="text" id="2fa-code" maxlength="6"
                    class="w-full bg-slate-900 border border-slate-600 rounded p-4 text-center text-2xl tracking-[10px] focus:border-emerald-500 outline-none text-emerald-400 font-mono transition" 
                    placeholder="000000">
                <span id="2fa-error" class="text-red-400 text-xs mt-2 hidden text-center"></span>
            </div>

            <button type="submit" id="verify-2fa-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition shadow-lg shadow-emerald-500/30 active:scale-95">
                ${lang.t('twofa_verify_btn')}
            </button>
            
            <button type="button" id="back-to-login" class="w-full text-xs text-slate-500 hover:text-white underline mt-2 text-center">
                ${lang.t('twofa_back_btn')}
            </button>
        </form>

      </div>
    </div>
  `,
  
  init: async () => {
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const twoFaForm = document.getElementById('2fa-form') as HTMLFormElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
    const loginGlobalError = document.getElementById('login-global-error') as HTMLDivElement;
    const twoFaError = document.getElementById('2fa-error') as HTMLSpanElement;

    const showFieldError = (fieldId: string, msgKey: string) => {
        const el = document.getElementById(`${fieldId}-error`);
        if (el) { el.innerText = lang.t(msgKey); el.classList.remove('hidden'); }
    };
    const hideFieldError = (fieldId: string) => {
        const el = document.getElementById(`${fieldId}-error`);
        if (el) el.classList.add('hidden');
    };

    const validateEmail = () => {
        hideFieldError('email');
        const val = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) { showFieldError('email', 'common_fill_field'); return false; }
        if (!emailRegex.test(val)) { showFieldError('email', 'invalid_email'); return false; }
        return true;
    };

    const validatePassword = () => {
        hideFieldError('password');
        if (!passwordInput.value.trim()) { showFieldError('password', 'common_fill_field'); return false; }
        return true;
    };

    // --- INPUT EVENTLERI ---
    emailInput.addEventListener('input', () => hideFieldError('email'));
    passwordInput.addEventListener('input', () => hideFieldError('password'));
    codeInput.addEventListener('input', () => twoFaError.classList.add('hidden'));

    // --- ENTER İLE KONTROLLÜ GEÇİŞ ---
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateEmail()) passwordInput.focus();
        }
    });

    document.getElementById('back-home-btn')?.addEventListener('click', () => navigate('/'));
    document.getElementById('btn-42-login')?.addEventListener('click', () => window.location.href = '/auth/42');

    let tempUserId: number | null = null;

    // --- URL PARAMETRE KONTROLÜ (42 Auth veya Error) ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem('token', token);
        try {
            const user = await getProfileReq();
            localStorage.setItem('user', JSON.stringify(user));
        } catch (err) { console.error("Profil çekilemedi:", err); }
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
        setTimeout(() => codeInput.focus(), 100);
    }

    const errorParam = urlParams.get('error');
    if (errorParam) {
        Modal.alert(lang.t('login_error'), lang.t(errorParam) || errorParam);
        window.history.replaceState({}, document.title, "/login");
    }

    // --- LOGIN FORM SUBMIT ---
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      loginGlobalError.classList.add('hidden');
      if (!validateEmail() || !validatePassword()) return;

      try {
        const res = await loginReq(emailInput.value.trim(), passwordInput.value.trim());
        if (res.require2FA) {
            tempUserId = res.userId;
            loginForm?.classList.add('hidden');
            twoFaForm?.classList.remove('hidden');
            setTimeout(() => codeInput.focus(), 100);
            return; 
        }
        if (res.token) {
            localStorage.setItem('token', res.token);
            navigate('/dashboard');
        }
      } catch (err: any) {
        const transErr = lang.t(err.message);
        loginGlobalError.innerText = transErr !== err.message ? transErr : (err.message || 'Error');
        loginGlobalError.classList.remove('hidden');
      }
    });

    // --- 2FA FORM SUBMIT ---
    twoFaForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        twoFaError.classList.add('hidden');
        const code = codeInput.value.trim();
        if (!code) { twoFaError.innerText = lang.t('twofa_missing'); twoFaError.classList.remove('hidden'); return; }
        if (!tempUserId) return;

        try {
            const res = await verify2FALoginReq(tempUserId, code);
            if (res.token) {
                localStorage.setItem('token', res.token);
                try {
                    const user = await getProfileReq();
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (pErr) { console.error('Profil alınamadı', pErr); }
                navigate('/dashboard');
            }
        } catch (err: any) {
            const transErr = lang.t(err.message);
            twoFaError.innerText = transErr !== err.message ? transErr : (err.message || 'Invalid Code');
            twoFaError.classList.remove('hidden');
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