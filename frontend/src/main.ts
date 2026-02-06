// frontend/src/main.ts
import './style.css';
import { initRouter } from './router';
import { getProfileReq } from './services/auth.service';
// DÜZELTME: Artık Service dosyasını kullanıyoruz
import { socketService } from './services/socket.service'; 

// Router Başlat
initRouter();

// Boot Check
const token = localStorage.getItem('token');
if (token) {
    getProfileReq()
        .then(user => {
            localStorage.setItem('user', JSON.stringify(user));
            
            // --- GÜNCEL KULLANIM ---
            console.log(`Hoşgeldin ${user.username}, Socket bağlanıyor...`);
            socketService.connect(); // Artık Class methodunu çağırıyoruz
            // -----------------------
        })
        .catch(err => {
            // ... (Hata işlemleri aynı kalsın) ...
            console.warn("Session expired", err);
            // ...
        });
}