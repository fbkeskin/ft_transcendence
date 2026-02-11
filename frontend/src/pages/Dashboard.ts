// frontend/src/pages/Dashboard.ts
import { getProfileReq, uploadAvatarReq } from '../services/auth.service';
import { getTournamentHistoryReq } from '../services/tournament.service';
import { getFriendsReq, getPendingReq, sendFriendReq, acceptFriendReq, removeFriendReq } from '../services/friend.service';
import { navigate } from '../router';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';
import { socketService } from '../services/socket.service';

export const Dashboard = {
  render: () => `
    <div class="min-h-screen bg-gray-900 text-white p-8">
      
      <div class="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
        <div class="flex items-center gap-4 group">
            <div class="flex flex-col">
                <h1 class="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
                    FT_TRANSCENDENCE
                </h1>
                <span class="text-xs text-gray-500 font-mono tracking-widest uppercase ml-1">
                    The Pong Game
                </span>
            </div>
        </div>
        <div class="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 shadow-sm">
            <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
            <span class="text-xs font-bold text-gray-400">System Online</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="space-y-6">
            
            <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
                <div class="flex flex-col items-center">
                    <div class="relative group cursor-pointer mb-4">
                        <img id="user-avatar" src="" alt="Avatar" class="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-lg bg-gray-700 object-top">
                        <label for="avatar-input" class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"><span class="text-xs font-bold text-center px-2">${lang.t('dash_change_avatar')}</span></label>
                        <input type="file" id="avatar-input" class="hidden" accept="image/*">
                    </div>
                    <h2 id="user-name" class="text-2xl font-bold mb-1">...</h2>
                    <span id="user-level" class="text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full mb-6">${lang.t('dash_level')} 0</span>
                    <div class="grid grid-cols-3 gap-2 w-full text-center">
                        <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 flex flex-col justify-center"><span class="block text-lg font-bold text-green-400" id="user-wins">0</span><span class="text-[10px] text-gray-400 uppercase tracking-tighter">${lang.t('dash_wins')}</span></div>
                        <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 flex flex-col justify-center"><span class="block text-lg font-bold text-red-400" id="user-losses">0</span><span class="text-[10px] text-gray-400 uppercase tracking-tighter">${lang.t('dash_losses')}</span></div>
                        <div class="bg-slate-900 p-2 rounded-lg border border-yellow-600/30 flex flex-col justify-center relative overflow-hidden"><div class="absolute inset-0 bg-yellow-500/10"></div><span class="block text-lg font-bold text-yellow-400 z-10" id="user-cups">0</span><span class="text-[10px] text-yellow-200/70 uppercase tracking-tighter z-10">${lang.t('dash_cups')}</span></div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 min-h-[300px] flex flex-col">
                
                <div class="flex border-b border-gray-700 mb-2">
                    <button id="tab-lobby" class="flex-1 py-2 text-xs font-bold text-white border-b-2 border-green-500 transition">${lang.t('dash_tab_lobby')}</button>
                    <button id="tab-friends" class="flex-1 py-2 text-xs font-bold text-gray-400 border-b-2 border-transparent hover:text-white transition relative">
                        ${lang.t('dash_tab_friends')}
                        <span id="friend-req-badge" class="hidden absolute top-0 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </button>
                </div>

                <div id="view-lobby" class="flex-1 overflow-y-auto pr-1">
                    <div id="online-users-list" class="space-y-2"></div>
                </div>

                <div id="view-friends" class="flex-1 overflow-y-auto pr-1 hidden">
                    <div id="pending-requests" class="mb-2 hidden">
                        <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">${lang.t('dash_req_title')}</p>
                        <div id="pending-list" class="space-y-1"></div>
                    </div>
                    <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">${lang.t('dash_my_list')}</p>
                    <div id="friends-list" class="space-y-2">
                        <p class="text-gray-500 text-xs text-center py-2">${lang.t('dash_no_friend')}</p>
                    </div>
                </div>

            </div>
        </div>

        <div class="md:col-span-2 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button class="game-btn h-32 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden"><span class="text-4xl mb-2 group-hover:rotate-12 transition">🏓</span><span class="font-bold text-xl">${lang.t('dash_game_1v1')}</span></button>
                <button class="game-btn h-32 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden"><span class="text-4xl mb-2 group-hover:rotate-12 transition">🤖</span><span class="font-bold text-xl">${lang.t('dash_game_ai')}</span></button>
                <button class="game-btn h-32 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden"><span class="text-4xl mb-2 group-hover:rotate-12 transition">🏆</span><span class="font-bold text-xl">${lang.t('dash_game_tour')}</span></button>
            </div>

            <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col h-96 relative overflow-hidden">
                <div class="flex border-b border-gray-700 bg-slate-900/50">
                    <button id="tab-hist-matches" class="flex-1 py-4 text-sm font-bold text-white border-b-2 border-indigo-500 bg-slate-800 transition hover:bg-slate-700">${lang.t('dash_tab_matches')}</button>
                    <button id="tab-hist-tournaments" class="flex-1 py-4 text-sm font-bold text-gray-400 border-b-2 border-transparent hover:text-white hover:bg-slate-700 transition">${lang.t('dash_tab_tournaments')}</button>
                </div>
                <div class="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent p-1">
                    <table id="table-matches" class="w-full text-sm text-left text-gray-400"><thead class="text-xs text-gray-300 uppercase bg-slate-900/50 sticky top-0"><tr><th class="px-4 py-3 text-center">#</th><th class="px-4 py-3">${lang.t('dash_table_opponent')}</th><th class="px-4 py-3">${lang.t('dash_table_score')}</th><th class="px-4 py-3">${lang.t('dash_table_result')}</th><th class="px-4 py-3 text-right">${lang.t('dash_table_date')}</th></tr></thead><tbody id="match-history-body" class="divide-y divide-slate-700"></tbody></table>
                    <table id="table-tournaments" class="w-full text-sm text-left text-gray-400 hidden"><thead class="text-xs text-gray-300 uppercase bg-slate-900/50 sticky top-0"><tr><th class="px-4 py-3 text-center">#</th><th class="px-4 py-3">${lang.t('dash_tour_participants')}</th><th class="px-4 py-3 text-center">${lang.t('dash_tour_champion')}</th><th class="px-4 py-3 text-center">${lang.t('dash_tour_status')}</th><th class="px-4 py-3 text-right">${lang.t('dash_table_date')}</th></tr></thead><tbody id="tournament-history-body" class="divide-y divide-slate-700"></tbody></table>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,

  init: async () => {
    try {
        const user = await getProfileReq();
        let friends: any[] = [];
        let pendingRequests: any[] = [];
        
        // YENİ: Gönderilen istekleri yerel hafızada tut (Butonu disabled yapmak için)
        // Backend 'sentRequests' endpoint'i vermediği için geçici çözüm.
        // Sayfa yenilenince sıfırlanır ama kullanıcı deneyimi için yeterli.
        const sentRequestsLocal = new Set<number>();

        // --- VERİLERİ ÇEKME FONKSİYONU ---
        const refreshData = async () => {
            try {
                const [tData, fData, pData] = await Promise.all([
                    getTournamentHistoryReq(),
                    getFriendsReq(),
                    getPendingReq()
                ]);
                friends = fData;
                pendingRequests = pData;
                renderTournamentStats(tData, user);
                renderMatchHistory(user);
                renderTournamentHistory(tData, user);
                renderFriendsList(); 
                renderLobby(); // Lobby'i de güncelle
            } catch (e) { console.log("Veri çekme hatası (Refresh)", e); }
        };

        // İlk Yükleme
        await refreshData();
        socketService.connect();

        // --- PROFİL RENDER ---
        renderProfile(user, friends, pendingRequests);

        // --- SEKME MANTIĞI ---
        const tabLobby = document.getElementById('tab-lobby')!;
        const tabFriends = document.getElementById('tab-friends')!;
        const viewLobby = document.getElementById('view-lobby')!;
        const viewFriends = document.getElementById('view-friends')!;
        const badge = document.getElementById('friend-req-badge')!;

        if (pendingRequests.length > 0) badge.classList.remove('hidden');

        tabLobby.addEventListener('click', () => {
            tabLobby.className = "flex-1 py-2 text-xs font-bold text-white border-b-2 border-green-500 transition";
            tabFriends.className = "flex-1 py-2 text-xs font-bold text-gray-400 border-b-2 border-transparent hover:text-white transition relative";
            viewLobby.classList.remove('hidden');
            viewFriends.classList.add('hidden');
        });

        tabFriends.addEventListener('click', () => {
            tabFriends.className = "flex-1 py-2 text-xs font-bold text-white border-b-2 border-pink-500 transition relative";
            tabLobby.className = "flex-1 py-2 text-xs font-bold text-gray-400 border-b-2 border-transparent hover:text-white transition";
            viewFriends.classList.remove('hidden');
            viewLobby.classList.add('hidden');
            badge.classList.add('hidden'); 
        });

        // --- RENDER FONKSİYONLARI ---
        function renderFriendsList() { 
            const pendingContainer = document.getElementById('pending-requests');
            const pendingList = document.getElementById('pending-list');
            const friendsContainer = document.getElementById('friends-list');
            if(!pendingContainer || !pendingList || !friendsContainer) return;

            // Bekleyenler
            if (pendingRequests.length > 0) {
                pendingContainer.classList.remove('hidden');
                pendingList.innerHTML = pendingRequests.map((req: any) => `
                    <div class="flex items-center justify-between bg-slate-700/50 p-2 rounded border border-indigo-500/30">
                        <span class="text-xs font-bold">${req.username}</span>
                        <div class="flex gap-1">
                            <button class="accept-btn bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-[10px]" data-id="${req.id}">✓</button>
                            <button class="reject-btn bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-[10px]" data-id="${req.id}">✗</button>
                        </div>
                    </div>
                `).join('');
            } else {
                pendingContainer.classList.add('hidden');
            }

            // Arkadaşlar
            const onlineUsers = socketService.getOnlineUsers(); 
            if (friends.length === 0) {
                friendsContainer.innerHTML = `<p class="text-gray-500 text-xs text-center py-2">${lang.t('dash_no_friend')}</p>`;
            } else {
                friendsContainer.innerHTML = friends.map((f: any) => {
                    const isOnline = onlineUsers.some(u => u.id === f.id);
                    const statusColor = isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-gray-500';
                    const statusText = isOnline ? lang.t('dash_online') : lang.t('dash_offline');
                    const avatarSrc = f.avatar ? (f.avatar.startsWith('http') ? f.avatar : `http://localhost:3000/uploads/${f.avatar}`) : 'https://via.placeholder.com/30';

                    return `
                    <div class="flex items-center justify-between bg-slate-700/30 p-2 rounded border border-slate-600 hover:bg-slate-700 transition group">
                        <div class="flex items-center gap-2">
                            <div class="relative">
                                <img src="${avatarSrc}" class="w-8 h-8 rounded-full object-cover">
                                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${statusColor} border-2 border-slate-800"></span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xs font-bold text-gray-200">${f.username}</span>
                                <span class="text-[9px] text-gray-500">${statusText}</span>
                            </div>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            ${isOnline ? `<button class="invite-btn text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white" data-id="${f.id}">${lang.t('dash_invite')}</button>` : ''}
                            <button class="remove-friend-btn text-[10px] bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1 rounded" data-id="${f.id}">${lang.t('dash_remove')}</button>
                        </div>
                    </div>
                    `;
                }).join('');
            }
        };

        function renderLobby() {
            const listContainer = document.getElementById('online-users-list');
            if (!listContainer) return;
            const onlineList = socketService.getOnlineUsers().filter(u => u.id !== user.id);
            
            if (onlineList.length === 0) {
                listContainer.innerHTML = `<p class="text-gray-500 text-xs text-center py-2">${lang.t('dash_no_user')}</p>`;
                return;
            }

            listContainer.innerHTML = onlineList.map(u => {
                const isFriend = friends.some(f => f.id === u.id);
                // DÜZELTME: Daha önce istek attıysak butonu pasif çiz
                const isSent = sentRequestsLocal.has(u.id);

                let actionBtn = '';
                if (!isFriend) {
                    if (isSent) {
                        actionBtn = `<button class="text-[10px] bg-gray-600 px-2 py-1 rounded text-gray-300 cursor-not-allowed" disabled>${lang.t('dash_req_sent')}</button>`;
                    } else {
                        actionBtn = `<button class="add-friend-btn text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded text-white" data-id="${u.id}">${lang.t('dash_add_friend')}</button>`;
                    }
                }

                return `
                <li class="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500 shadow-green-glow"></span>
                        <span class="text-xs font-bold text-gray-200">${u.username}</span>
                    </div>
                    <div class="flex gap-1">
                        ${actionBtn}
                        <button class="invite-btn text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white" data-id="${u.id}">${lang.t('dash_invite')}</button>
                    </div>
                </li>`;
            }).join('');
        };

        // --- SOCKET BİLDİRİMLERİ ---
        // 1. Genel Liste (Her saniye gelmez, biri girince gelir)
        socketService.subscribe(() => {
            renderLobby();
            renderFriendsList(); 
        });

        // 2. Özel Bildirimler
        if (socketService.subscribeToEvent) {
            
            // Arkadaşlık İsteği Geldiğinde (Karşı taraf için)
            socketService.subscribeToEvent('friend_request', async (data: any) => {
                console.log("🔔 Yeni Arkadaş İsteği!", data);
                badge.classList.remove('hidden');
                await refreshData(); // Listeyi güncelle
            });

            // Arkadaşlık Kabul Edildiğinde
            socketService.subscribeToEvent('friend_accepted', async (data: any) => {
                console.log("✅ Arkadaşlık Kabul Edildi!", data);
                // Eğer istek gönderdiğim kişi kabul ettiyse, listeden "İstek Yollandı"yı silebiliriz (zaten arkadaş olacak)
                sentRequestsLocal.delete(data.accepterId);
                await refreshData();
            });

            // YENİ: Genel Liste Güncelleme Bildirimi (Silme veya Diğer İşlemler)
            socketService.subscribeToEvent('friend_list_update', async () => {
                console.log("🔄 Arkadaş listesi güncelleme bildirimi alındı.");
                await refreshData();
            });
        }

        // --- EVENT LISTENERLAR ---
        document.body.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            
            // ARKADAŞ EKLEME (BUTON YÖNETİMİ DÜZELTİLDİ)
            if (target.classList.contains('add-friend-btn')) {
                const id = Number(target.getAttribute('data-id'));
                
                // 1. Hemen UI'yı güncelle (Beklemeden)
                sentRequestsLocal.add(id);
                renderLobby(); // Listeyi tekrar çizince buton disabled olarak gelecek

                try {
                    await sendFriendReq(id);
                    // Başarılı olursa zaten renderLobby() disabled bırakacak
                } catch (err: any) { 
                    // Hata olursa geri al
                    sentRequestsLocal.delete(id);
                    renderLobby();
                    
                    if (err.message && err.message.includes('Zaten')) {
                         Modal.alert(lang.t('dash_friend_req_success'), lang.t('dash_friend_req_exists'));
                         // Yine de listede kalsın
                         sentRequestsLocal.add(id);
                         renderLobby();
                    } else {
                         Modal.alert(lang.t('common_error'), err.message); 
                    }
                }
            }

            if (target.classList.contains('accept-btn')) {
                const id = Number(target.getAttribute('data-id'));
                try {
                    await acceptFriendReq(id);
                    await refreshData(); 
                } catch (err: any) { console.error(err); }
            }

            if (target.classList.contains('remove-friend-btn') || target.classList.contains('reject-btn')) {
                const id = Number(target.getAttribute('data-id'));
                const isConfirm = await Modal.confirm(lang.t('dash_remove_confirm_title'), lang.t('dash_remove_confirm_desc'));
                if (isConfirm) {
                    try {
                        await removeFriendReq(id);
                        await refreshData(); 
                    } catch (err: any) { console.error(err); }
                }
            }
        });

    } catch (err) {
        console.error("Dash Error", err);
        localStorage.removeItem('token');
        navigate('/login');
    }
    
    // Alt Butonlar
    const buttons = document.querySelectorAll('.game-btn');
    if (buttons[0]) buttons[0].addEventListener('click', () => navigate('/game/local'));
    if (buttons[1]) buttons[1].addEventListener('click', () => navigate('/game/ai'));
    if (buttons[2]) buttons[2].addEventListener('click', () => navigate('/tournament/new'));

    // Davetler
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('.invite-btn');
        if (btn && !btn.hasAttribute('disabled')) {
             const targetId = parseInt(btn.getAttribute('data-id') || '0', 10);
             if(targetId) { socketService.sendGameInvite(targetId); Modal.alert(lang.t('dash_invite_sent_title'), lang.t('dash_invite_sent_desc')); }
        }
    });

    socketService.onIncomingInvite(async (data) => {
        Modal.closeAll();
        const accepted = await Modal.confirm(lang.t('dash_invite_received_title'), `<strong>${data.senderName}</strong> ${lang.t('dash_invite_received_desc')}`);
        socketService.respondToInvite(data.senderId, accepted);
    });
    socketService.onInviteRejected((data) => { Modal.closeAll(); Modal.alert(lang.t('dash_invite_rejected_title'), `${data.rejecterName} ${lang.t('dash_invite_rejected_desc')}`); });
    socketService.onGameStart((data) => {
        Modal.closeAll();
        socketService.currentGameRole = data.role; socketService.currentOpponentName = data.opponent; socketService.currentOpponentId = data.opponentId;
        Modal.alert(lang.t('dash_game_starting'), `${lang.t('dash_game_starting_desc')} ${data.opponent}`).then(() => navigate('/game/online'));
    });
  }
};

// --- YARDIMCI FONKSİYONLAR ---
function renderProfile(user: any, friends: any[], pending: any[]) {
    const avatarEl = document.getElementById('user-avatar') as HTMLImageElement;
    const avatarSrc = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:3000/uploads/${user.avatar}`) : 'https://via.placeholder.com/150';
    avatarEl.src = avatarSrc;
    
    document.getElementById('user-name')!.innerText = user.username;
    document.getElementById('user-wins')!.innerText = user.wins.toString();
    document.getElementById('user-losses')!.innerText = user.losses.toString();
    document.getElementById('user-level')!.innerText = `${lang.t('dash_level')} ${user.level}`;
    
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    fileInput?.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files[0]) {
            try {
                const result = await uploadAvatarReq(fileInput.files[0]);
                avatarEl.src = `http://localhost:3000${result.url}?t=${new Date().getTime()}`;
                await Modal.alert(lang.t('common_success'), lang.t('prof_avatar_updated'));
            } catch (err: any) { await Modal.alert(lang.t('common_error'), lang.t(err.message)); }
        }
    });
}

function renderTournamentStats(tournaments: any[], user: any) {
    const cupCount = tournaments.filter((t: any) => t.winner === user.username).length;
    document.getElementById('user-cups')!.innerText = cupCount.toString();
}

function renderMatchHistory(user: any) {
    const matchBody = document.getElementById('match-history-body')!;
    matchBody.innerHTML = ''; 
    const allGames = [...(user.gamesAsPlayer1 || []), ...(user.gamesAsPlayer2 || [])];
    allGames.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (allGames.length === 0) matchBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500 italic">${lang.t('dash_no_match')}</td></tr>`;
    else allGames.forEach((game: any, index: number) => {
        const isPlayer1 = game.player1Id === user.id;
        let opponentName = isPlayer1 ? (game.player2 ? game.player2.username : (game.guestName || lang.t('dash_guest'))) : (game.player1 ? game.player1.username : lang.t('dash_opponent'));
        const myScore = isPlayer1 ? game.score1 : game.score2;
        const enemyScore = isPlayer1 ? game.score2 : game.score1;
        let resultBadges = (myScore > enemyScore) ? `<span class="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/20">${lang.t('dash_win')}</span>` : `<span class="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20">${lang.t('dash_loss')}</span>`;
        matchBody.innerHTML += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition"><td class="px-4 py-3 text-center text-gray-600 font-mono text-xs">${index + 1}</td><td class="px-4 py-3 font-medium text-slate-200">${opponentName}</td><td class="px-4 py-3 font-mono text-indigo-300 font-bold tracking-widest">${myScore} - ${enemyScore}</td><td class="px-4 py-3">${resultBadges}</td><td class="px-4 py-3 text-right text-gray-500 text-xs">${new Date(game.createdAt).toLocaleDateString(lang.getCurrentLang())}</td></tr>`;
    });
    const tabMatches = document.getElementById('tab-hist-matches')!;
    const tabTournaments = document.getElementById('tab-hist-tournaments')!;
    const tableMatches = document.getElementById('table-matches')!;
    const tableTournaments = document.getElementById('table-tournaments')!;
    tabMatches.addEventListener('click', () => {
        tabMatches.className = "flex-1 py-4 text-sm font-bold text-white border-b-2 border-indigo-500 bg-slate-800 transition";
        tabTournaments.className = "flex-1 py-4 text-sm font-bold text-gray-400 border-b-2 border-transparent hover:text-white hover:bg-slate-700 transition";
        tableMatches.classList.remove('hidden'); tableTournaments.classList.add('hidden');
    });
    tabTournaments.addEventListener('click', () => {
        tabTournaments.className = "flex-1 py-4 text-sm font-bold text-white border-b-2 border-orange-500 bg-slate-800 transition";
        tabMatches.className = "flex-1 py-4 text-sm font-bold text-gray-400 border-b-2 border-transparent hover:text-white hover:bg-slate-700 transition";
        tableTournaments.classList.remove('hidden'); tableMatches.classList.add('hidden');
    });
}

function renderTournamentHistory(tournaments: any[], user: any) {
    const tournamentBody = document.getElementById('tournament-history-body')!;
    tournamentBody.innerHTML = '';
    if (tournaments.length === 0) tournamentBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500 italic">${lang.t('dash_tour_no_data')}</td></tr>`;
    else tournaments.forEach((t: any, index: number) => {
        const isChampion = t.winner === user.username;
        let statusBadge = isChampion ? `<span class="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">${lang.t('dash_tour_status_win')}</span>` : `<span class="bg-slate-700 text-gray-400 px-2 py-1 rounded text-xs border border-slate-600">${lang.t('dash_tour_status_join')}</span>`;
        tournamentBody.innerHTML += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition"><td class="px-4 py-3 text-center text-gray-600 font-mono text-xs">${index + 1}</td><td class="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">${t.player1}, ${t.player2}...</td><td class="px-4 py-3 text-center font-bold text-indigo-300">${t.winner}</td><td class="px-4 py-3 text-center">${statusBadge}</td><td class="px-4 py-3 text-right text-gray-500 text-xs">${new Date(t.createdAt).toLocaleDateString(lang.getCurrentLang())}</td></tr>`;
    });
}