// frontend/src/main.ts
import './style.css';
import { initRouter } from './router';
import { getProfileReq } from './services/auth.service';
// DÜZELTME: Artık Service dosyasını kullanıyoruz
import { socketService } from './services/socket.service'; 

import { navigate } from './router';
import { Modal } from './utils/Modal';
import { lang } from './services/language.service';
import { escapeHTML } from './utils/escape';

// Router Başlat
initRouter();

// --- GLOBAL SOCKET LISTENERS ---
// Bu dinleyiciler tüm sayfalarda (Dashboard, Game, Profile vb.) aktif olacak.
socketService.onIncomingInvite(async (data) => {
    const currentPath = window.location.pathname;
    
    // Eğer kullanıcı bir maçtaysa, ekranı bölme! Sadece küçük bir bilgi ver (veya verme, listede görünecek)
    if (currentPath === '/game/local' || currentPath === '/game/ai' || currentPath === '/game/online') {
        console.log("Yeni davet geldi ama maçtasın:", data.senderName);
        // İstersen burada ekranın köşesinde 2 saniye görünüp kaybolan bir toast yapabiliriz.
        // Ama şimdilik sadece konsola basıyorum ve kullanıcı Dashboard'a dönünce listeyi görecek.
    } else {
        // Dashboard veya başka bir sayfadaysa, bir Modal ile haber verebiliriz (ama zorunlu değil)
        // İstek listesine düştüğü için artık confirm() açmaya gerek yok.
        // Sadece bilgi verelim:
        // Modal.alert(lang.t('dash_invite_received_title'), `<strong>${escapeHTML(data.senderName)}</strong> ${lang.t('dash_invite_received_desc')}`);
    }
});

import { sentRequestsLocal } from './services/friend.service';

// ... (other imports)

socketService.onInviteRejected((data) => {
    // Hafızayı temizle (Hangi sayfada olursak olalım)
    socketService.sentInvitesLocal.delete(data.rejecterId || data.senderId); // İptal eden/edilen
    
    Modal.closeAll();
    Modal.alert(
        lang.t('common_info'),
        `<strong>${escapeHTML(data.rejecterName)}</strong> ${lang.t('dash_invite_rejected')}`
    );
});

// YENİ: Arkadaşlık Kabul Bildirimi
socketService.subscribeToEvent('friend_accepted', (data: any) => {
    // GLOBAL TEMİZLİK
    sentRequestsLocal.delete(data.accepterId);

    const msg = data.isMutual 
        ? lang.t('FRIEND_ACCEPTED_MUTUAL') 
        : `<strong>${escapeHTML(data.accepterName)}</strong> ${lang.t('friend_accepted_standard')}`; 
    
    Modal.alert(lang.t('common_info'), msg);
});

// YENİ: Arkadaşlık Red Bildirimi
socketService.subscribeToEvent('friend_rejected', (data: any) => {
    // GLOBAL TEMİZLİK
    sentRequestsLocal.delete(data.rejecterId);

    Modal.alert(lang.t('common_info'), `<strong>${escapeHTML(data.rejecterName)}</strong> ${lang.t('friend_rejected_standard')}`);
});

// YENİ: İstek İptal Bildirimi
socketService.subscribeToEvent('friend_request_cancelled', (data: any) => {
    sentRequestsLocal.delete(data.senderId);
});

// OYUN BAŞLADIĞINDA TÜM HAFIZAYI SIFIRLA
socketService.onGameStart(() => {
    socketService.sentInvitesLocal.clear();
    sentRequestsLocal.clear();
});

// Maç Hazırlık Handshake
socketService.onMatchReadyCheck(async (data: { opponent: string, opponentId: number, isMutual?: boolean }) => {
    // Karşılıklı davet olup olmadığını kontrol et (Yerel liste veya Backend verisi)
    const isMutual = data.isMutual || socketService.getPendingInvites().some(inv => inv.senderId === data.opponentId);
    
    // Hazırlık aşamasına geçildiği an, bu kullanıcıdan gelen daveti listeden siliyoruz.
    socketService.removeInvite(data.opponentId);
    
    const currentPath = window.location.pathname;
    
    // Mesaj içeriğini duruma göre ayarla
    let title = lang.t('dash_game_starting');
    let message = `${lang.t('dash_game_starting_desc')} <strong>${escapeHTML(data.opponent)}</strong>. ${lang.t('game_ready_confirm_desc') || 'Are you ready?'}`;

    if (isMutual) {
        title = lang.t('dash_mutual_invite_title');
        message = `<strong>${escapeHTML(data.opponent)}</strong> ${lang.t('dash_mutual_invite_desc')}`;
    }
    
    if (currentPath === '/game/local' || currentPath === '/game/ai') {
        message += `<br><br><span class="text-amber-400 text-xs font-bold">⚠️ ${lang.t('game_online_interrupt_warn')}</span>`;
    }

    const ok = await Modal.confirm(title, message);
    
    if (ok) {
        socketService.confirmReady(data.opponentId);
    } else {
        // REDDETME DURUMU: Backend'e bildir ki karşı tarafın ekranı da kapansın
        socketService.respondToInvite(data.opponentId, false);
        socketService.updateStatus('AVAILABLE');
    }
});

socketService.onGameStart(async (data) => {
    Modal.closeAll();
    socketService.currentGameRole = data.role;
    socketService.currentOpponentName = data.opponent;
    socketService.currentOpponentId = data.opponentId;

    // Artık sormuyoruz, çünkü onMatchReadyCheck'te sorduk!
    // Direkt arena'ya gidiyoruz.
    navigate('/game/online');
});

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
            
            // Navbar'ı güncel kullanıcı bilgisiyle tekrar çizmek isteyebiliriz
            const navContainer = document.getElementById('navbar');
            if (navContainer) {
              import('./components/Navbar').then(({ Navbar }) => {
                navContainer.innerHTML = Navbar.render();
                Navbar.afterRender();
              });
            }
        })
        .catch(err => {
            console.warn("Session expired or invalid", err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Router'ı tekrar tetikle ki Auth Guard devreye girsin (e-g Dashboard'daysa Login'e atsın)
            import('./router').then(({ navigate }) => {
                navigate(window.location.pathname);
            });
        });
}