import { lang } from '../services/language.service';

export class Modal {
  
  // Basit Uyarı Kutusu (Alert)
  static alert(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.createModal(title, message, false, () => resolve(), () => resolve());
    });
  }

  // Veri Giriş Kutusu (Prompt)
  static prompt(title: string, defaultValue: string = ""): Promise<string | null> {
    return new Promise((resolve) => {
      this.createModal(title, defaultValue, true, 
        (val) => resolve(val), // OK
        () => resolve(null)    // CANCEL
      );
    });
  }

  private static createModal(
      title: string, 
      contentOrPlaceholder: string, 
      isPrompt: boolean, 
      onConfirm: (val: string) => void, 
      onCancel: () => void
  ) {
    // 1. Arka Plan (Overlay)
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4";

    // 2. Kutu (Container)
    const box = document.createElement('div');
    box.className = "bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-95 opacity-0";
    // Animasyon için setTimeout ile scale-100 yapacağız
    setTimeout(() => box.classList.remove('scale-95', 'opacity-0'), 10);

    // 3. Başlık
    const titleEl = document.createElement('h3');
    titleEl.className = "text-xl font-bold text-white mb-2";
    titleEl.innerText = title;

    // 4. İçerik (Mesaj veya Input)
    let inputEl: HTMLInputElement | null = null;
    let messageEl: HTMLParagraphElement | null = null;

    if (isPrompt) {
        inputEl = document.createElement('input');
        inputEl.type = "text";
        inputEl.value = contentOrPlaceholder;
        inputEl.className = "w-full bg-slate-900 border border-slate-600 text-white rounded p-3 mt-2 focus:border-indigo-500 outline-none transition";
        // Otomatik odaklanma
        setTimeout(() => inputEl?.focus(), 50);
    } else {
        messageEl = document.createElement('p');
        messageEl.className = "text-slate-300 mb-6";
        messageEl.innerText = contentOrPlaceholder;
    }

    // 5. Butonlar
    const btnContainer = document.createElement('div');
    btnContainer.className = "flex justify-end gap-3 mt-6";

    // İptal Butonu (Sadece Prompt ise veya Alert ama opsiyonel kapatma istenirse - şimdilik sadece Prompt)
    if (isPrompt) {
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = lang.t('btn_cancel');
        cancelBtn.className = "px-4 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition font-bold text-sm";
        cancelBtn.onclick = () => close(false);
        btnContainer.appendChild(cancelBtn);
    }

    // Tamam Butonu
    const okBtn = document.createElement('button');
    okBtn.innerText = lang.t('btn_ok');
    okBtn.className = "px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition transform active:scale-95";
    okBtn.onclick = () => close(true);
    btnContainer.appendChild(okBtn);

    // Enter tuşu desteği
    if (inputEl) {
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') close(true);
        });
    }

    // Elemanları Birleştir
    box.appendChild(titleEl);
    if (messageEl) box.appendChild(messageEl);
    if (inputEl) box.appendChild(inputEl);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Kapatma Fonksiyonu
    const close = (confirmed: boolean) => {
        // Çıkış Animasyonu
        box.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (confirmed) {
                onConfirm(inputEl ? inputEl.value : "");
            } else {
                onCancel();
            }
        }, 200);
    };
  }
}
