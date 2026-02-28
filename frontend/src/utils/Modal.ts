// frontend/src/utils/Modal.ts
import { lang } from '../services/language.service';

export class Modal {
    // Mevcut Alert (Tek butonlu)
    static alert(title: string, message: string): Promise<void> {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300';
        modal.innerHTML = `
          <div class="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-transform duration-300">
            <h3 class="text-xl font-bold text-white mb-2 border-b border-gray-700 pb-2">${title}</h3>
            <p class="text-gray-300 mb-6 text-sm leading-relaxed">${message}</p>
            <div class="flex justify-end">
              <button id="modal-ok-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${lang.t('btn_ok')}
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animasyon için küçük bir timeout
        setTimeout(() => modal.classList.add('opacity-100'), 10);
  
        const btn = modal.querySelector('#modal-ok-btn');
        btn?.addEventListener('click', () => {
          modal.classList.remove('opacity-100'); // Kapanış animasyonu
          setTimeout(() => {
              document.body.removeChild(modal);
              resolve();
          }, 300);
        });
      });
    }
  
    // --- YENİ EKLENEN: CONFIRM (KABUL ET / REDDET) ---
    static confirm(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm';
            
            modal.innerHTML = `
              <div class="bg-slate-800 border-2 border-indigo-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-bounce-in">
                
                <div class="flex items-center gap-3 mb-4">
                    <span class="text-2xl">⚔️</span>
                    <h3 class="text-xl font-bold text-white tracking-wide">${title}</h3>
                </div>
                
                <p class="text-gray-300 mb-8 text-sm">${message}</p>
                
                <div class="flex justify-between gap-4">
                  <button id="modal-cancel-btn" class="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold py-3 px-4 rounded-xl transition border border-slate-600">
                    ${lang.t('btn_reject')}
                  </button>
                  <button id="modal-confirm-btn" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition transform hover:scale-105">
                    ${lang.t('btn_accept')}
                  </button>
                </div>
              </div>
            `;
            
            document.body.appendChild(modal);
      
            const cancelBtn = modal.querySelector('#modal-cancel-btn');
            const confirmBtn = modal.querySelector('#modal-confirm-btn');
      
            // Reddet butonuna basınca FALSE döner
            cancelBtn?.addEventListener('click', () => {
              document.body.removeChild(modal);
              resolve(false);
            });
      
            // Kabul et butonuna basınca TRUE döner
            confirmBtn?.addEventListener('click', () => {
              document.body.removeChild(modal);
              resolve(true);
            });
          });
    }
	// --- YENİ EKLENECEK METOD: TÜM MODALLARI KAPAT ---
    // Bunu çağırdığımız an ekrandaki tüm açık pencereler silinir.
    static closeAll() {
        // Modal sınıfımızın kullandığı CSS sınıflarına sahip elemanları bulup siliyoruz
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => modal.remove());
    }
  }