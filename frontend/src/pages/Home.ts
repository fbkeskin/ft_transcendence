// frontend/src/pages/Home.ts

export const Home = {
	render: () => `
	  <div class="relative overflow-hidden">
		<div class="absolute top-0 left-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
  
		<div class="container mx-auto px-4 py-20 flex flex-col items-center text-center relative z-10">
		  
		  <span class="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in-up">
			New Generation Pong
		  </span>
  
		  <h1 class="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight animate-fade-in-up delay-100">
			Welcome PING PONG <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">42-Style</span> Game!
		  </h1>
  
		  <p class="text-lg text-slate-400 max-w-2xl mb-10 animate-fade-in-up delay-200">
			Sıradan oyunlardan sıkıldın mı? Gerçek zamanlı multiplayer, yapay zeka rakipler ve turnuva sistemiyle Pong deneyimini zirveye taşı.
		  </p>
  
		  <div class="flex gap-4 animate-fade-in-up delay-300">
			<a href="/register" class="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]" data-link>
			  Hemen Başla ⚡
			</a>
			<a href="/login" class="px-8 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition" data-link>
			  Giriş Yap
			</a>
		  </div>
  
		  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left animate-fade-in-up delay-500">
			<div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition group">
			  <div class="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
				🎮
			  </div>
			  <h3 class="text-xl font-bold text-white mb-2">Multiplayer Arena</h3>
			  <p class="text-slate-400 text-sm">Arkadaşlarına meydan oku veya rastgele rakiplerle eşleş.</p>
			</div>
  
			<div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition group">
			  <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
				🤖
			  </div>
			  <h3 class="text-xl font-bold text-white mb-2">Yapay Zeka Modu</h3>
			  <p class="text-slate-400 text-sm">İnternet yok mu? Gelişmiş AI botumuza karşı antrenman yap.</p>
			</div>
  
			<div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition group">
			  <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
				🏆
			  </div>
			  <h3 class="text-xl font-bold text-white mb-2">Turnuvalar</h3>
			  <p class="text-slate-400 text-sm">4 kişilik turnuvalar oluştur ve şampiyonluğunu ilan et.</p>
			</div>
		  </div>
  
		</div>
	  </div>
	`,
	init: () => {}
  };