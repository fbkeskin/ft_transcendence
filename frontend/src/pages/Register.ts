// frontend/src/pages/Register.ts
import { registerReq } from '../services/auth.service';
import { navigate } from '../router';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';

export const Register = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-slate-800 p-10 rounded-xl shadow-xl w-96 font-sans border border-slate-700">
            <h2 class="text-2xl font-bold mb-6 text-indigo-400 text-center uppercase tracking-widest">${lang.t('register_title')}</h2>
            
            <form id="registerForm" class="flex flex-col gap-4" novalidate>
                
                <!-- USERNAME -->
                <div class="flex flex-col">
                    <input type="text" id="username" placeholder="${lang.t('username_placeholder')}" 
                        class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
                    <span id="username-error" class="text-red-400 text-xs mt-1 ml-1 hidden"></span>
                </div>
                
                <!-- EMAIL -->
                <div class="flex flex-col">
                    <input type="email" id="email" placeholder="${lang.t('email_placeholder')}" 
                        class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
                    <span id="email-error" class="text-red-400 text-xs mt-1 ml-1 hidden"></span>
                </div>
                
                <!-- PASSWORD -->
                <div class="flex flex-col">
                    <input type="password" id="password" placeholder="${lang.t('password_placeholder')}" 
                        class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
                    <span id="password-error" class="text-red-400 text-xs mt-1 ml-1 hidden"></span>
                </div>

                <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 p-3 rounded font-bold transition text-white mt-2 shadow-lg shadow-emerald-500/20">
                    ${lang.t('register_btn')}
                </button>
                
                <button type="button" class="text-slate-400 text-sm hover:underline mt-2 text-center" data-link href="/">
                    ${lang.t('back_to_home')}
                </button>
            </form>
            
            <div id="global-error" class="mt-4 text-center text-red-400 text-sm hidden bg-red-400/10 p-2 rounded border border-red-400/20"></div>
        </div>
    </div>
  `,

  init: () => {
    const form = document.getElementById('registerForm') as HTMLFormElement;
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const globalError = document.getElementById('global-error') as HTMLDivElement;

    // --- YARDIMCI FONKSİYONLAR ---
    const showFieldError = (fieldId: string, msgKey: string) => {
        const el = document.getElementById(`${fieldId}-error`);
        if (el) {
            el.innerText = lang.t(msgKey);
            el.classList.remove('hidden');
        }
    };

    const hideFieldError = (fieldId: string) => {
        const el = document.getElementById(`${fieldId}-error`);
        if (el) el.classList.add('hidden');
    };

    // --- VALIDASYON MANTIĞI ---
    const validateUsername = () => {
        hideFieldError('username');
        const val = usernameInput.value.trim();
        if (!val) { showFieldError('username', 'common_fill_field'); return false; }
        if (val.length < 3) { showFieldError('username', 'error_min_length'); return false; }
        return true;
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
        const val = passwordInput.value.trim();
        if (!val) { showFieldError('password', 'common_fill_field'); return false; }
        if (val.length < 6) { showFieldError('password', 'error_min_length_pass'); return false; }
        return true;
    };

    // --- INPUT EVENTLERI (YAZARKEN HATAYI TEMİZLE) ---
    usernameInput.addEventListener('input', () => hideFieldError('username'));
    emailInput.addEventListener('input', () => hideFieldError('email'));
    passwordInput.addEventListener('input', () => hideFieldError('password'));

    // --- ENTER İLE KONTROLLÜ GEÇİŞ ---
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateUsername()) emailInput.focus();
        }
    });

    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateEmail()) passwordInput.focus();
        }
    });

    // --- FORM SUBMIT ---
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      globalError.classList.add('hidden');

      const isUserValid = validateUsername();
      const isEmailValid = validateEmail();
      const isPassValid = validatePassword();

      if (!isUserValid || !isEmailValid || !isPassValid) return;

      try {
          await registerReq(emailInput.value.trim(), usernameInput.value.trim(), passwordInput.value.trim());
          await Modal.alert(lang.t('common_success'), lang.t('register_success'));
          navigate('/login');
      } catch (err: any) {
          const translatedError = lang.t(err.message);
          globalError.innerText = translatedError !== err.message ? translatedError : (err.message || 'Error'); 
          globalError.classList.remove('hidden');
      }
    });
  }
};