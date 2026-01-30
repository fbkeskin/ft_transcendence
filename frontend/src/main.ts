// frontend/src/main.ts
import './style.css'; // Tailwind stillerini yükle
import { initRouter } from './router'; // Bizim yazdığımız router'ı çağır
import { getProfileReq } from './services/auth.service';

// VE MOTORU ÇALIŞTIR! 🚀
initRouter();

// BAŞLANGIÇ KONTROLÜ (Boot Check)
// Uygulama açıldığında token var ama backend sıfırlandıysa (make down/up),
// Navbar yanlışlıkla "Giriş Yapmış" gibi görünmesin diye token'ı doğruluyoruz.
const token = localStorage.getItem('token');
if (token) {
    getProfileReq()
        .then(user => {
            // Başarılıysa kullanıcı verisini güncelle
            localStorage.setItem('user', JSON.stringify(user));
        })
        .catch(err => {
            console.warn("Oturum geçersiz, çıkış yapılıyor...", err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Navbar'ı ve sayfayı sıfırlamak için sayfayı yenile veya yönlendir
            // Eğer zaten login sayfasındaysak sorun yok, değilsek login'e at
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            } else {
                // Eğer zaten login sayfasındaysak ama token bozuksa, sadece silmek yeterli,
                // Navbar güncellensin diye sayfayı yenileyelim
                window.location.reload();
            }
        });
}