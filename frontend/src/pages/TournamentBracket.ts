// frontend/src/pages/TournamentBracket.ts
import { navigate } from '../router';
import { lang } from '../services/language.service';

export const TournamentBracket = {
  render: () => {
    // LocalStorage'dan turnuva verisini çek
    const data = localStorage.getItem('active_tournament');
    if (!data) return `<div class="text-white text-center mt-20">Turnuva bulunamadı!</div>`;

    const tournament = JSON.parse(data);
    const matches = tournament.matches;
    const currentMatch = matches[tournament.currentMatchIndex];
    const isFinished = tournament.currentMatchIndex >= 3; // 3 maç bitti mi?

    // Kazanan (Şampiyon)
    const champion = isFinished ? matches[2].winner : null;

    return `
      <div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        
        <h1 class="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            ${isFinished ? '🏆 ŞAMPİYON BELLİ OLDU!' : '⚔️ TURNUVA TABLOSU'}
        </h1>

        <div class="flex flex-col gap-8 w-full max-w-4xl">
            
            <div class="flex justify-between gap-10">
                <div class="flex-1 bg-slate-800 p-4 rounded-xl border ${matches[0].winner ? 'border-green-500/50' : 'border-slate-700'} text-center relative">
                    <span class="text-xs text-gray-500 uppercase">Yarı Final 1</span>
                    <div class="font-bold text-xl my-2">${matches[0].p1} vs ${matches[0].p2}</div>
                    ${matches[0].winner ? `<div class="text-green-400 text-sm">Kazanan: ${matches[0].winner}</div>` : '<div class="text-yellow-500 text-sm">Bekleniyor...</div>'}
                </div>

                <div class="flex-1 bg-slate-800 p-4 rounded-xl border ${matches[1].winner ? 'border-green-500/50' : 'border-slate-700'} text-center relative">
                    <span class="text-xs text-gray-500 uppercase">Yarı Final 2</span>
                    <div class="font-bold text-xl my-2">${matches[1].p1} vs ${matches[1].p2}</div>
                    ${matches[1].winner ? `<div class="text-green-400 text-sm">Kazanan: ${matches[1].winner}</div>` : '<div class="text-yellow-500 text-sm">Bekleniyor...</div>'}
                </div>
            </div>

            <div class="flex justify-center">
                <div class="w-1/2 bg-slate-800 p-6 rounded-xl border-2 ${matches[2].winner ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-indigo-500'} text-center relative">
                    <span class="text-xs text-indigo-400 uppercase font-bold tracking-widest">👑 FİNAL 👑</span>
                    <div class="font-bold text-2xl my-4">
                        ${matches[2].p1 || '?'} vs ${matches[2].p2 || '?'}
                    </div>
                    ${champion ? `
                        <div class="text-4xl mt-2 animate-bounce">🏆 ${champion} 🏆</div>
                    ` : '<div class="text-gray-500 text-sm">Finalistler bekleniyor...</div>'}
                </div>
            </div>

        </div>

        <div class="mt-12">
            ${isFinished ? `
                <button id="finish-tournament" class="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-bold transition">
                    Ana Menüye Dön
                </button>
            ` : `
                <div class="text-center">
                    <p class="text-gray-400 mb-2 text-sm">Sıradaki Maç:</p>
                    <button id="start-match-btn" class="bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-105 px-10 py-4 rounded-xl font-bold text-xl transition shadow-lg">
                        ▶️ ${currentMatch.p1} vs ${currentMatch.p2} MAÇINI BAŞLAT
                    </button>
                </div>
            `}
        </div>

      </div>
    `;
  },

  init: () => {
    const startBtn = document.getElementById('start-match-btn');
    const finishBtn = document.getElementById('finish-tournament');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // Oyuna yönlendir (Fakat turnuva modu olduğunu belirtmeliyiz)
            // URL parametresi ile turnuva modu olduğunu iletiyoruz
            navigate('/game/local?tournament=true');
        });
    }

    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            localStorage.removeItem('active_tournament');
            navigate('/dashboard');
        });
    }
  }
};