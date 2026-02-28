
import { tr } from '../locales/tr';
import { en } from '../locales/en';
import { fr } from '../locales/fr';
 
const translations: { [key: string]: any } = { tr, en, fr };

class LanguageService 
{
   currentLang: string = localStorage.getItem('lang') || 'tr';

   t(key: string): string 
   {
    return translations[this.currentLang][key] || key;
   }
   
   setLanguage(lang: string)
   {
    if (translations[lang])
    {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
      	window.location.reload();
      	// window.dispatchEvent(new Event('languageChanged'));
    }
   }
   
   getCurrentLang()
   {
    return this.currentLang;
   }
}
 
export const lang = new LanguageService();
