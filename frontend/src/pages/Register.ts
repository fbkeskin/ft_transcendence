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
            <form id="registerForm" class="flex flex-col gap-4">
                
                <div>
                    <input type="text" id="username" placeholder="${lang.t('username_placeholder')}" required
                        oninvalid="this.setCustomValidity('${lang.t('common_fill_field')}')"
                        oninput="this.setCustomValidity('')"
                        class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
                </div>
                
				<div>
				<input type="email" id="email" placeholder="${lang.t('email_placeholder')}" required
					oninvalid="if(this.value === ''){this.setCustomValidity('${lang.t('common_fill_field')}')}else{this.setCustomValidity('Lütfen geçerli bir e-posta adresi girin (örn: kullanici@mail.com)')}"
					oninput="this.setCustomValidity('')"
					class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
				</div>
                
                <div>
                    <input type="password" id="password" placeholder="${lang.t('password_placeholder')}" required
                        oninvalid="this.setCustomValidity('${lang.t('common_fill_field')}')"
                        oninput="this.setCustomValidity('')"
                        class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition">
                </div>

                <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 p-3 rounded font-bold transition text-white mt-2 shadow-lg shadow-emerald-500/20">
                    ${lang.t('register_btn')}
                </button>
                
                <button type="button" class="text-slate-400 text-sm hover:underline mt-2" data-link href="/">
                    ${lang.t('back_to_home')}
                </button>
            </form>
            <div id="errorMsg" class="mt-4 text-center text-red-400 text-sm hidden"></div>
        </div>
    </div>
  `,

  init: () => {
    const form = document.getElementById('registerForm') as HTMLFormElement;
    const errorDiv = document.getElementById('errorMsg') as HTMLDivElement;
    const homeLink = document.querySelector('[data-link][href="/"]');

    homeLink?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('/');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = (document.getElementById('email') as HTMLInputElement).value.trim();
      const username = (document.getElementById('username') as HTMLInputElement).value.trim();
      const password = (document.getElementById('password') as HTMLInputElement).value.trim();

      try {
          await registerReq(email, username, password);
          await Modal.alert(lang.t('common_success'), lang.t('register_success'));
          navigate('/login');
      } catch (err: any) {
          errorDiv.innerText = lang.t(err.message); 
          errorDiv.classList.remove('hidden');
      }
    });
  }
};