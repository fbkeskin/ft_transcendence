// frontend/src/pages/Dashboard.ts
import { getProfileReq } from '../services/auth.service';
import { navigate } from '../router';

export const Dashboard = {
  render: () => `
    <div class="min-h-screen bg-gray-900 text-white p-8">
      
      <div class="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
        <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          FT_TRANSCENDENCE
        </h1>
        <button id="logout-btn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition">
          ÇIKIŞ YAP
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 h-fit">
            <div class="flex flex-col items-center">
                <div class="relative group cursor-pointer mb-4">
                    <img id="user-avatar" src="" alt="Avatar" class="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-lg bg-gray-700">
                    <label for="avatar-input" class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <span class="text-xs font-bold">Değiştir</span>
                    </label>
                    <input type="file" id="avatar-input" class="hidden" accept="image/*">
                </div>
                
                <h2 id="user-name" class="text-2xl font-bold mb-1">...</h2>
                <span id="user-level" class="text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full mb-6">Lvl 1</span>

                <div class="grid grid-cols-2 gap-4 w-full text-center">
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <span class="block text-xl font-bold text-green-400" id="user-wins">0</span>
                        <span class="text-xs text-gray-400 uppercase">Wins</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <span class="block text-xl font-bold text-red-400" id="user-losses">0</span>
                        <span class="text-xs text-gray-400 uppercase">Losses</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="md:col-span-2 space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button class="game-btn h-32 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden">
                    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
                    <span class="text-4xl mb-2 group-hover:rotate-12 transition">🏓</span>
                    <span class="font-bold text-xl">1 vs 1 (Local)</span>
                </button>

                <button class="game-btn h-32 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden">
                    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
                    <span class="text-4xl mb-2 group-hover:rotate-12 transition">🤖</span>
                    <span class="font-bold text-xl">AI Karşı</span>
                </button>
                
                <button class="game-btn h-32 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden">
                    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
                    <span class="text-4xl mb-2 group-hover:rotate-12 transition">🌍</span>
                    <span class="font-bold text-xl">Online Oyna</span>
                </button>

                <button class="game-btn h-32 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition shadow-lg group relative overflow-hidden">
                    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
                    <span class="text-4xl mb-2 group-hover:rotate-12 transition">🏆</span>
                    <span class="font-bold text-xl">Turnuva</span>
                </button>
            </div>

            <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                <h3 class="text-lg font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                    <span>📜</span> Son Maç Geçmişi
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-400">
                        <thead class="text-xs text-gray-300 uppercase bg-slate-900">
                            <tr>
                                <th class="px-4 py-3 rounded-l-lg">Rakip</th>
                                <th class="px-4 py-3">Skor</th>
                                <th class="px-4 py-3">Sonuç</th>
                                <th class="px-4 py-3 rounded-r-lg">Tarih</th>
                            </tr>
                        </thead>
                        <tbody id="match-history-body">
                            <tr><td colspan="4" class="text-center py-4">Yükleniyor...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  `,

  init: async () => {
    try {
        const user = await getProfileReq();
        
        // --- 1. AVATAR VE PROFİL ---
        const avatarEl = document.getElementById('user-avatar') as HTMLImageElement;
        if (user.avatar) {
            avatarEl.src = (user.avatar.startsWith('http')) 
                ? user.avatar 
                : `http://localhost:3000/uploads/${user.avatar}`;
        } else {
            avatarEl.src = 'https://via.placeholder.com/150';
        }

        document.getElementById('user-name')!.innerText = user.username;
        document.getElementById('user-wins')!.innerText = user.wins.toString();
        document.getElementById('user-losses')!.innerText = user.losses.toString();
        document.getElementById('user-level')!.innerText = `Lvl ${user.level}`;

        // --- 2. MAÇ GEÇMİŞİ TABLOSU ---
        const tbody = document.getElementById('match-history-body')!;
        tbody.innerHTML = ''; // "Yükleniyor" yazısını temizle

        // Backend'den gelen oyunlar: gamesAsPlayer1 ve gamesAsPlayer2
        // Bunları tek bir listede birleştirelim ve tarihe göre sıralayalım
        const allGames = [...(user.gamesAsPlayer1 || []), ...(user.gamesAsPlayer2 || [])];
        
        // Tarihe göre yeniden sırala (En yeni en üstte)
        allGames.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (allGames.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Henüz maç yapmadınız.</td></tr>`;
        } else {
            allGames.forEach((game: any) => {
                // Sen Player 1 misin Player 2 mi?
                const isPlayer1 = game.player1Id === user.id;
                
                // Rakip Kim?
                // Eğer player2 varsa (Online User) onun adını al, yoksa guestName'i al.
                let opponentName = "Bilinmiyor";
                if (isPlayer1) {
                    opponentName = game.player2 ? game.player2.username : (game.guestName || "Misafir");
                } else {
                    opponentName = game.player1 ? game.player1.username : "Rakip";
                }

                // Skorlar (P1 - P2)
                const myScore = isPlayer1 ? game.score1 : game.score2;
                const enemyScore = isPlayer1 ? game.score2 : game.score1;

                // Sonuç (Win/Loss)
                let resultBadges = '';
                if (myScore > enemyScore) {
                    resultBadges = `<span class="bg-green-900 text-green-300 px-2 py-1 rounded text-xs font-bold">VICTORY</span>`;
                } else {
                    resultBadges = `<span class="bg-red-900 text-red-300 px-2 py-1 rounded text-xs font-bold">DEFEAT</span>`;
                }

                // Tarih Formatı
                const date = new Date(game.createdAt).toLocaleDateString('tr-TR', { 
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                });

                // Satırı Ekle
                const row = `
                    <tr class="bg-slate-800 border-b border-slate-700 hover:bg-slate-700 transition">
                        <td class="px-4 py-3 font-medium text-white">${opponentName}</td>
                        <td class="px-4 py-3 font-mono text-indigo-300">${myScore} - ${enemyScore}</td>
                        <td class="px-4 py-3">${resultBadges}</td>
                        <td class="px-4 py-3 text-gray-500 text-xs">${date}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }

    } catch (err) {
        console.error("Dashboard hatası:", err);
        localStorage.removeItem('token');
        navigate('/login');
    }

    // BUTON EVENTLERİ
    const buttons = document.querySelectorAll('.game-btn');
    buttons[0].addEventListener('click', () => navigate('/game/local'));
    buttons[1].addEventListener('click', () => navigate('/game/ai'));
    buttons[2].addEventListener('click', () => alert('Online Modu Yapım Aşamasında 🚧'));
    buttons[3].addEventListener('click', () => alert('Turnuva Modu Yapım Aşamasında 🏆'));

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        navigate('/login');
    });
  }
};