import { loginReq, verify2FALoginReq, getProfileReq } from '../services/auth.service';
import { navigate } from '../router';

export const Login = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div class="bg-slate-800 p-8 rounded-xl shadow-2xl w-[400px] border border-slate-700 relative overflow-hidden">
        
        <h2 class="text-3xl font-bold mb-6 text-center text-indigo-400 tracking-widest">GIRIS YAP</h2>

        <div id="login-form" class="space-y-4 transition-all duration-500">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Email</label>
                <input type="email" id="email" class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white" placeholder="mail@ornek.com">
            </div>
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Şifre</label>
                <input type="password" id="password" class="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-indigo-500 outline-none text-white" placeholder="******">
            </div>
            <button id="login-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition shadow-lg shadow-indigo-500/30">
                GİRİŞ YAP
            </button>
            
            <div class="text-center mt-4">
				<a href="http://localhost:3000/auth/42" class="text-sm text-slate-400 hover:text-white underline"> 42 ile Giriş Yap </a>            </div>
        </div>

        <div id="2fa-form" class="hidden space-y-4 animate-fade-in">
            <div class="text-center mb-4">
                <div class="text-5xl mb-2">🛡️</div>
                <h3 class="text-xl font-bold text-white">2FA Doğrulama</h3>
                <p class="text-xs text-slate-400">Google Authenticator kodunu giriniz.</p>
            </div>

            <div>
                <input type="text" id="2fa-code" maxlength="6" 
                    class="w-full bg-slate-900 border border-slate-600 rounded p-4 text-center text-2xl tracking-[10px] focus:border-emerald-500 outline-none text-emerald-400 font-mono" 
                    placeholder="000000">
            </div>

            <button id="verify-2fa-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition shadow-lg shadow-emerald-500/30">
                DOĞRULA
            </button>
            
            <button id="back-to-login" class="w-full text-xs text-slate-500 hover:text-white underline mt-2">
                ← Geri Dön
            </button>
        </div>

      </div>
    </div>
  `,
  
  init: async () => {
    // 0. GÜVENLİK TEMİZLİĞİ
    // Eğer URL'de auth parametresi yoksa, eski oturum temizlenmeli.
    const urlCheck = new URLSearchParams(window.location.search);
    if (!urlCheck.get('token') && !urlCheck.get('2fa_required')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Elementleri Seç
    const loginForm = document.getElementById('login-form');
    const twoFaForm = document.getElementById('2fa-form');
    
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const loginBtn = document.getElementById('login-btn');

    const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
    const verifyBtn = document.getElementById('verify-2fa-btn');
    const backBtn = document.getElementById('back-to-login');

    let tempUserId: number | null = null;

	// ============================================================
    // URL KONTROLÜ (42'den Dönüş)
    // ============================================================
    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. Durum: Başarılı Giriş (Token var)
    const token = urlParams.get('token');

    if (token) {
        localStorage.setItem('token', token);
        
        // --- DÜZELTME BURADA BAŞLIYOR ---
        // Token'ı aldık ama kullanıcı kim bilmiyoruz. Hemen soralım:
        try {
            const user = await getProfileReq();
            // Kullanıcıyı hafızaya kaydet ki Dashboard'da ismi çıksın
            localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {
            console.error("Profil bilgisi çekilemedi:", err);
        }
        // --------------------------------

        window.history.replaceState({}, document.title, "/login");
        navigate('/dashboard');
        return;
    }

    // 2. Durum: 2FA Gerekli (42 kullanıcısı ama 2FA açık)
    const userIdParam = urlParams.get('userId');
    const twoFaRequired = urlParams.get('2fa_required');

    if (userIdParam && twoFaRequired === 'true') {
        tempUserId = parseInt(userIdParam);
        
        // Formları değiştir
        loginForm?.classList.add('hidden');
        twoFaForm?.classList.remove('hidden');
        
        // URL'i temizle
        window.history.replaceState({}, document.title, "/login");
        
        // alert("Lütfen 2FA Kodunuzu Giriniz");
		codeInput.focus();
    }

    // 3. Durum: Hata mesajı var mı?
    const errorParam = urlParams.get('error');
    if (errorParam) {
        alert("Giriş Başarısız: " + errorParam);
        window.history.replaceState({}, document.title, "/login");
    }
    // ============================================================


    // --- 1. LOGIN BUTONU (Backend İsteği) ---
    loginBtn?.addEventListener('click', async () => {
      // ... (Burası aynı kalsın) ...
      const email = emailInput.value;
      const password = passwordInput.value;

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
        alert('Giriş Hatası: ' + err.message);
      }
    });

	// --- 2. 2FA DOĞRULA BUTONU ---
    verifyBtn?.addEventListener('click', async () => {
        const code = codeInput.value;
        if (!code || !tempUserId) return alert("Kod eksik!");

        try {
            // 1. Token'ı al
            const res = await verify2FALoginReq(tempUserId, code);
            localStorage.setItem('token', res.token);

            // --- EKSİK OLAN KISIM BURASIYDI ---
            // Token var ama user bilgisi yok. Hemen çekip kaydedelim:
            try {
                const user = await getProfileReq();
                localStorage.setItem('user', JSON.stringify(user));
            } catch (err) {
                console.warn("Profil bilgisi çekilemedi:", err);
            }
            // ----------------------------------

            navigate('/dashboard'); // Şimdi yönlendir

        } catch (err: any) {
            alert("Hatalı Kod! Lütfen tekrar dene.");
            codeInput.value = ''; // Kutuyu temizle
        }
    });

    // --- Geri Dön Butonu ---
    backBtn?.addEventListener('click', () => {
        twoFaForm?.classList.add('hidden');
        loginForm?.classList.remove('hidden');
        tempUserId = null;
    });
  }
};