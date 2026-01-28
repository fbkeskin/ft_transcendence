import { getProfileReq, uploadAvatarReq, generate2FAReq, turnOn2FAReq } from '../services/auth.service';
import { navigate } from '../router';
import { getAvatarUrl } from '../utils/imageUrl';

export const Profile = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen py-10">
        <div class="bg-slate-800 p-8 rounded-xl shadow-xl w-[600px] border border-slate-700">
            
            <h2 class="text-2xl font-bold mb-6 text-indigo-400 italic uppercase tracking-widest">User Profile</h2>
            
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
                    <label for="avatar-input" class="text-xs bg-slate-700 px-3 py-1 rounded cursor-pointer hover:bg-slate-600 transition text-white border border-slate-600">
                        Change Avatar
                    </label>
                </div>

                <div class="flex-1 w-full space-y-4">
                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Display Name</label>
                        <input type="text" id="display-name" disabled class="w-full bg-slate-900/50 p-2 rounded border border-slate-700 text-slate-400 cursor-not-allowed">
                    </div> 
                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Email</label>
                        <input type="text" id="email-display" disabled class="w-full bg-slate-900/50 p-2 rounded border border-slate-700 text-slate-400 cursor-not-allowed">
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <h3 class="text-xl font-bold text-white mb-2">Two-Factor Authentication (2FA)</h3>
                <p class="text-slate-400 text-sm mb-4">Hesabını Google Authenticator ile koru.</p>

                <div id="2fa-status-on" class="hidden p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-400 flex items-center gap-3">
                    <span class="text-2xl">🛡️</span>
                    <div>
                        <p class="font-bold">2FA Aktif</p>
                        <p class="text-xs opacity-80">Hesabın maksimum güvenlik altında.</p>
                    </div>
                </div>

                <div id="2fa-setup-area">
                    <button id="btn-enable-2fa" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold text-sm transition shadow-lg shadow-indigo-500/20">
                        2FA Kurulumunu Başlat
                    </button>

                    <div id="qr-container" class="hidden mt-4 p-4 bg-slate-900 rounded-lg border border-slate-600 animate-fade-in">
                        <p class="text-xs text-slate-400 mb-2">1. Aşağıdaki QR Kodu telefonuna okut:</p>
                        <div class="bg-white p-2 w-fit rounded mx-auto mb-4">
                            <img id="qr-image" class="w-40 h-40" />
                        </div>

                        <p class="text-xs text-slate-400 mb-2">2. Üretilen 6 haneli kodu gir:</p>
                        <div class="flex gap-2">
                            <input type="text" id="2fa-input" placeholder="123456" maxlength="6" 
                                   class="bg-slate-800 border border-slate-600 text-white text-center tracking-widest text-lg p-2 rounded w-full focus:border-indigo-500 outline-none">
                            <button id="btn-verify-2fa" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold transition">
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button id="profile-to-menu" class="mt-8 w-full text-slate-500 hover:text-white text-xs uppercase tracking-widest transition font-sans underline">
                ← Back to Dashboard
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

        // 2. 2FA Durumunu Kontrol Et
        if (user.isTwoFactorEnabled) {
            // Eğer AÇIKSA: Yeşil kutuyu göster, kurulumu gizle
            statusOnDiv?.classList.remove('hidden');
            setupAreaDiv?.classList.add('hidden');
        } else {
            // Eğer KAPALIYSA: Kurulum alanını göster
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
                avatarImg.src = `http://localhost:3000${result.url}?t=${new Date().getTime()}`;
                alert("Avatar güncellendi! 😎");
            } catch (err: any) { alert(err.message); }
        }
    });

    // B) "2FA Kurulumunu Başlat" Butonu
    btnEnable?.addEventListener('click', async () => {
        try {
            // Backend'den QR Kod iste
            const res = await generate2FAReq(); 
            // QR Resmini koy ve alanı aç
            qrImage.src = res.qrCodeUrl;
            qrContainer?.classList.remove('hidden');
            btnEnable.classList.add('hidden'); // Butonu gizle
        } catch (err) {
            alert("QR Kod oluşturulamadı.");
        }
    });

    // C) "Onayla" Butonu (Kodu girince)
    btnVerify?.addEventListener('click', async () => {
        const code = input2fa.value;
        if (!code) return alert("Lütfen kodu girin.");

        try {
            // Kodu doğrula
            await turnOn2FAReq(code);
            
            alert("Tebrikler! 2FA Başarıyla Açıldı! 🛡️");
            
            // Ekranı güncelle (Sayfayı yenilemeye gerek yok, UI değiştir)
            statusOnDiv?.classList.remove('hidden');
            setupAreaDiv?.classList.add('hidden');
            
        } catch (err: any) {
            alert("Hata: " + err.message); // "Hatalı kod" vb.
        }
    });

    document.getElementById('profile-to-menu')?.addEventListener('click', () => navigate('/dashboard'));
  }
};