// frontend/src/pages/Profile.ts
import { getProfileReq, uploadAvatarReq, generate2FAReq, turnOn2FAReq } from '../services/auth.service';
import { navigate } from '../router';
import { getAvatarUrl } from '../utils/imageUrl';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';

export const Profile = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen py-10">
        <div class="bg-slate-800 p-8 rounded-xl shadow-xl w-[600px] border border-slate-700">
            
            <h2 class="text-2xl font-bold mb-6 text-indigo-400 italic uppercase tracking-widest">${lang.t('prof_title')}</h2>
            
            <div class="flex flex-col md:flex-row gap-8 items-start mb-8 font-sans border-b border-slate-700 pb-8">
                <div class="flex flex-col items-center gap-4">
                    <div class="relative group">
                        <img id="avatar-preview" src="/default.png" 
                             class="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-lg">
                        <div id="loading-spinner" class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center hidden">
                            <div class="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <input type="file" id="avatar-input" accept="image/*" class="hidden">
                    
                    <label id="avatar-label" for="avatar-input" class="text-xs bg-slate-700 px-3 py-1 rounded cursor-pointer hover:bg-slate-600 transition text-white border border-slate-600 text-center">
                        ${lang.t('prof_change_avatar_btn')}
                    </label>
                </div>

                <div class="flex-1 w-full space-y-4">
                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-black tracking-widest">${lang.t('prof_display_name')}</label>
                        <input type="text" id="display-name" disabled class="w-full bg-slate-900/50 p-2 rounded border border-slate-700 text-slate-400 cursor-not-allowed">
                    </div> 
                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-black tracking-widest">${lang.t('prof_email')}</label>
                        <input type="text" id="email-display" disabled class="w-full bg-slate-900/50 p-2 rounded border border-slate-700 text-slate-400 cursor-not-allowed">
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <h3 class="text-xl font-bold text-white mb-2">${lang.t('prof_2fa_title')}</h3>
                <p class="text-slate-400 text-sm mb-4">${lang.t('prof_2fa_desc')}</p>

                <div id="2fa-status-on" class="hidden p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-400 flex items-center gap-3">
                    <span class="text-2xl">🛡️</span>
                    <div>
                        <p class="font-bold">${lang.t('prof_2fa_active')}</p>
                        <p class="text-xs opacity-80">${lang.t('prof_2fa_active_desc')}</p>
                    </div>
                </div>

                <div id="2fa-setup-area">
                    <button id="btn-enable-2fa" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold text-sm transition shadow-lg shadow-indigo-500/20">
                        ${lang.t('prof_2fa_enable_btn')}
                    </button>

                    <div id="qr-container" class="hidden mt-4 p-4 bg-slate-900 rounded-lg border border-slate-600 animate-fade-in">
                        <p class="text-xs text-slate-400 mb-2">${lang.t('prof_2fa_step1')}</p>
                        <div class="bg-white p-2 w-fit rounded mx-auto mb-4">
                            <img id="qr-image" class="w-40 h-40" />
                        </div>

                        <p class="text-xs text-slate-400 mb-2">${lang.t('prof_2fa_step2')}</p>
                        <div class="flex gap-2">
                            <input type="text" id="2fa-input" placeholder="123456" maxlength="6" 
                                   class="bg-slate-800 border border-slate-600 text-white text-center tracking-widest text-lg p-2 rounded w-full focus:border-indigo-500 outline-none">
                            <button id="btn-verify-2fa" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold transition">
                                ${lang.t('prof_2fa_verify_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button id="profile-to-menu" class="mt-8 w-full text-slate-500 hover:text-white text-xs uppercase tracking-widest transition font-sans underline">
                ${lang.t('prof_back_dashboard')}
            </button>
        </div>
    </div>
  `,

  init: async () => {
    // DOM Elementlerini Seç
    const avatarImg = document.getElementById('avatar-preview') as HTMLImageElement;
    const nameInput = document.getElementById('display-name') as HTMLInputElement;
    const emailInput = document.getElementById('email-display') as HTMLInputElement;
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    
    // YENİ: Avatar label elementini seç
    const avatarLabel = document.getElementById('avatar-label');
    
    // 2FA Elementleri
    const statusOnDiv = document.getElementById('2fa-status-on');
    const setupAreaDiv = document.getElementById('2fa-setup-area');
    const btnEnable = document.getElementById('btn-enable-2fa');
    const qrContainer = document.getElementById('qr-container');
    const qrImage = document.getElementById('qr-image') as HTMLImageElement;
    const input2fa = document.getElementById('2fa-input') as HTMLInputElement;
    const btnVerify = document.getElementById('btn-verify-2fa');

    try {
        // 1. Kullanıcı Verilerini Çek
        const user = await getProfileReq();
        
        // Formları Doldur
        nameInput.value = user.username;
        emailInput.value = user.email;
        const finalUrl = getAvatarUrl(user.avatar);
        avatarImg.src = finalUrl.startsWith('http') && !finalUrl.includes('localhost') 
            ? finalUrl 
            : `${finalUrl}?t=${new Date().getTime()}`;

        // --- YENİ: 42 Kullanıcısı ise Avatar Butonunu Gizle ---
        if (user.avatar && user.avatar.startsWith('http')) {
            avatarLabel?.classList.add('hidden');
        }
        // ------------------------------------------------------

        // 2. 2FA Durumunu Kontrol Et
        if (user.isTwoFactorEnabled) {
            statusOnDiv?.classList.remove('hidden');
            setupAreaDiv?.classList.add('hidden');
        } else {
            statusOnDiv?.classList.add('hidden');
            setupAreaDiv?.classList.remove('hidden');
        }

    } catch (e) {
        navigate('/login');
        return;
    }

    // --- BUTTON EVENTLERİ ---

    // A) Avatar Yükleme
    fileInput?.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files[0]) {
            try {
                const result = await uploadAvatarReq(fileInput.files[0]);
                avatarImg.src = `${result.url}?t=${new Date().getTime()}`;
                await Modal.alert(lang.t('common_success'), lang.t('prof_avatar_updated'));
            } catch (err: any) { await Modal.alert(lang.t('common_error'), lang.t(err.message)); }
        }
    });

    // B) "2FA Kurulumunu Başlat" Butonu
    btnEnable?.addEventListener('click', async () => {
        try {
            const res = await generate2FAReq(); 
            qrImage.src = res.qrCodeUrl;
            qrContainer?.classList.remove('hidden');
            btnEnable.classList.add('hidden'); 
        } catch (err: any) {
            await Modal.alert(lang.t('common_error'), lang.t(err.message || 'prof_qr_error'));
        }
    });

    // C) "Onayla" Butonu (Kodu girince)
    btnVerify?.addEventListener('click', async () => {
        const code = input2fa.value;
        if (!code) return Modal.alert(lang.t('common_warning'), lang.t('prof_code_missing'));

        try {
            await turnOn2FAReq(code);
            await Modal.alert(lang.t('common_success'), lang.t('prof_2fa_success'));
            
            statusOnDiv?.classList.remove('hidden');
            setupAreaDiv?.classList.add('hidden');
            
        } catch (err: any) {
            await Modal.alert(lang.t('common_error'), lang.t(err.message)); 
        }
    });

    document.getElementById('profile-to-menu')?.addEventListener('click', () => navigate('/dashboard'));
  }
};