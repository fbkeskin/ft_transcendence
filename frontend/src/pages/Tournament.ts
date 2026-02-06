// frontend/src/pages/Tournament.ts
import { navigate } from '../router';
import { Modal } from '../utils/Modal';

export const Tournament = {
  render: () => `
    <div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div class="z-10 bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full">
        
        <div class="text-center mb-8">
            <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                🏆 TURNUVA MODU
            </h1>
            <p class="text-gray-400 text-sm">4 Oyuncu girin, şampiyonu belirleyelim!</p>
        </div>

        <form id="tournament-form" class="space-y-4">
            
            <div class="space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Yarı Final 1</label>
                <div class="flex gap-4">
                    <input type="text" id="p1" placeholder="Oyuncu 1" maxlength="10" required 
                        class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-gray-600">
                    <div class="flex items-center text-gray-500 font-bold italic">VS</div>
                    <input type="text" id="p2" placeholder="Oyuncu 2" maxlength="10" required 
                        class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-gray-600">
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Yarı Final 2</label>
                <div class="flex gap-4">
                    <input type="text" id="p3" placeholder="Oyuncu 3" maxlength="10" required 
                        class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white placeholder-gray-600">
                    <div class="flex items-center text-gray-500 font-bold italic">VS</div>
                    <input type="text" id="p4" placeholder="Oyuncu 4" maxlength="10" required 
                        class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white placeholder-gray-600">
                </div>
            </div>

            <button type="submit" class="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95">
                🔥 TURNUVAYI BAŞLAT
            </button>
        </form>
        
        <button id="back-btn" class="w-full mt-4 text-gray-500 hover:text-gray-300 text-sm font-medium transition">
            ← Dashboard'a Dön
        </button>

      </div>
    </div>
  `,

  init: () => {
    const form = document.getElementById('tournament-form') as HTMLFormElement;
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const p1 = (document.getElementById('p1') as HTMLInputElement).value.trim();
            const p2 = (document.getElementById('p2') as HTMLInputElement).value.trim();
            const p3 = (document.getElementById('p3') as HTMLInputElement).value.trim();
            const p4 = (document.getElementById('p4') as HTMLInputElement).value.trim();

            // Aynı isim kontrolü
            const names = [p1, p2, p3, p4];
            const uniqueNames = new Set(names);
            if (uniqueNames.size !== 4) {
                Modal.alert("Hata", "Oyuncu isimleri birbirinden farklı olmalıdır!");
                return;
            }

            console.log("Turnuva Başlıyor:", names);
            
            // Turnuva verisini hazırla
            const tournamentData = {
                players: [p1, p2, p3, p4],
                matches: [
                    { id: 1, p1: p1, p2: p2, winner: null, played: false }, // Maç 1
                    { id: 2, p1: p3, p2: p4, winner: null, played: false }, // Maç 2
                    { id: 3, p1: null, p2: null, winner: null, played: false } // Final
                ],
                currentMatchIndex: 0
            };

            // Kaydet ve Yönlendir
            localStorage.setItem('active_tournament', JSON.stringify(tournamentData));
            navigate('/tournament/bracket'); // İşte burası senin attığın dosyaya yönlendiriyor
        });
    }

    document.getElementById('back-btn')?.addEventListener('click', () => {
        navigate('/dashboard');
    });
  }
};