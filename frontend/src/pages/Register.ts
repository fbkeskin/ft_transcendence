import { registerReq } from '../services/auth.service';
import { navigate } from '../router';

export const Register = {
  render: () => `
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-slate-800 p-10 rounded-xl shadow-xl w-96 font-sans border border-slate-700">
            <h2 class="text-2xl font-bold mb-6 text-indigo-400 text-center uppercase tracking-widest">Hesap Oluştur</h2>
            <form id="registerForm" class="flex flex-col gap-4">
                
                <div>
                    <input type="text" id="username" placeholder="Kullanıcı Adı" class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition" required>
                </div>
                
                <div>
                    <input type="email" id="email" placeholder="Email" class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition" required>
                </div>
                
                <div>
                    <input type="password" id="password" placeholder="Şifre" class="w-full bg-slate-700 p-3 rounded border border-slate-600 outline-none text-white focus:border-indigo-500 transition" required>
                </div>

                <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 p-3 rounded font-bold transition text-white mt-2 shadow-lg shadow-emerald-500/20">KAYIT OL</button>
                
                <button type="button" class="text-slate-400 text-sm hover:underline mt-2" data-link href="/login">Giriş Ekranına Dön</button>
            </form>
            <div id="errorMsg" class="mt-4 text-center text-red-400 text-sm hidden"></div>
        </div>
    </div>
  `,

  init: () => {
    const form = document.getElementById('registerForm') as HTMLFormElement;
    const errorDiv = document.getElementById('errorMsg') as HTMLDivElement;
    const loginLink = document.querySelector('[data-link][href="/login"]');

    // Link yönlendirmesi (Router kullanır)
    loginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('/login');
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        try {
            await registerReq(email, username, password);
            alert("Kayıt Başarılı! 🎉 Giriş ekranına yönlendiriliyorsunuz.");
            navigate('/login');
        } catch (err: any) {
            errorDiv.innerText = err.message;
            errorDiv.classList.remove('hidden');
        }
    });
  }
};
/*
// frontend/src/pages/Register.ts
import { registerReq } from '../services/auth.service';
import { navigate } from '../router';

export const Register = {
  render: () => `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="text-center mb-4">Kayıt Ol 📝</h2>
              <form id="registerForm">
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email Adresi</label>
                  <input type="email" class="form-control" id="email" required placeholder="ornek@42.fr">
                </div>

                <div class="mb-3">
                  <label for="username" class="form-label">Kullanıcı Adı (Nickname)</label>
                  <input type="text" class="form-control" id="username" required placeholder="sistemci_kiz">
                  <div class="form-text">Oyunlarda bu isim gözükecek.</div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Şifre</label>
                  <input type="password" class="form-control" id="password" required minlength="6" placeholder="******">
                </div>

                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-success">Kayıt Ol</button>
                  <a href="/login" class="btn btn-link" data-link>Zaten hesabın var mı? Giriş Yap</a>
                </div>
              </form>
              <div id="errorMsg" class="alert alert-danger mt-3 d-none"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  init: () => {
    const form = document.getElementById('registerForm') as HTMLFormElement;
    const errorDiv = document.getElementById('errorMsg') as HTMLDivElement;

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = (document.getElementById('email') as HTMLInputElement).value;
      const username = (document.getElementById('username') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;

      try {
        // Servisi Çağır
        await registerReq(email, username, password);
        
        // Başarılıysa kullanıcıya haber ver ve Login'e yönlendir
        alert('Kayıt Başarılı! 🎉 Lütfen giriş yapın.');
        navigate('/login');
      } catch (err: any) {
        // Hata varsa (örn: Bu email zaten kayıtlı) göster
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('d-none');
      }
    });
  }
};
*/