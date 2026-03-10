// frontend/src/pages/Game.ts
import { navigate } from '../router';
import { saveGameReq } from '../services/game.service';
import { getProfileReq } from '../services/auth.service';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';
import { saveTournamentReq } from '../services/tournament.service';
import { escapeHTML } from '../utils/escape';

export const Game = {
  render: () => `
    <div class="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white relative overflow-hidden py-4">
      
      <div id="game-title" class="text-indigo-500 font-bold tracking-widest text-xl opacity-80 mb-2">
        ... VS ...
      </div>

      <div class="flex gap-20 text-6xl font-mono font-bold select-none opacity-20 mb-4">
        <div id="score-left">0</div>
        <div id="score-right">0</div>
      </div>

      <canvas id="pong-canvas" width="960" height="540" class="bg-black border-4 border-slate-700 shadow-2xl rounded-lg cursor-none max-w-[95%] max-h-[60vh] object-contain"></canvas>

      <!-- MOBİL KONTROLLER (P1 - SOL) -->
      <div class="flex md:hidden gap-10 mt-6 w-full justify-center px-4">
        <div class="flex flex-col items-center gap-4">
            <p class="text-[10px] text-red-400 font-bold uppercase tracking-widest">P1 Control</p>
            <div class="flex gap-4">
                <button id="p1-touch-up" class="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-3xl border-2 border-red-500 active:bg-red-600 active:scale-90 transition-all select-none touch-none">🔼</button>
                <button id="p1-touch-down" class="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-3xl border-2 border-red-500 active:bg-red-600 active:scale-90 transition-all select-none touch-none">🔽</button>
            </div>
        </div>
        <div class="flex flex-col items-center gap-4 border-l border-slate-700 pl-10 ml-6">
            <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">P2 Control</p>
            <div class="flex gap-4">
                <button id="p2-touch-up" class="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center text-3xl border-2 border-blue-500 active:bg-blue-600 active:scale-90 transition-all select-none touch-none">🔼</button>
                <button id="p2-touch-down" class="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center text-3xl border-2 border-blue-500 active:bg-blue-600 active:scale-90 transition-all select-none touch-none">🔽</button>
            </div>
        </div>
      </div>

      <div class="mt-4 w-full max-w-[960px] grid grid-cols-3 px-10 text-slate-500 text-sm font-mono select-none items-start">
        
        <div class="text-left">
             <p class="text-xl text-white font-bold mb-1" id="p1-name">${lang.t('game_guest_name')}</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">W / S</span></p>
        </div>

        <div class="text-center pt-2">
             <button id="mobile-exit" class="md:hidden bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded text-[10px] uppercase font-bold transition-all active:scale-95 mb-1">${lang.t('game_exit_btn')}</button>
             <p class="opacity-50 text-[10px] md:text-sm">${lang.t('game_exit_esc')}</p>
        </div>

        <div class="text-right">
             <p class="text-xl text-indigo-400 font-bold mb-1" id="p2-name">${lang.t('game_loading')}</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">${lang.t('game_keys_arrow')}</span></p>
        </div>

      </div>

      <div id="game-over-modal" class="hidden absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="bg-slate-800 p-8 rounded-xl text-center border border-indigo-500 shadow-2xl min-w-[300px]">
            <h2 class="text-4xl font-bold mb-4 text-white" id="winner-text">${lang.t('game_over')}</h2>
            <div class="flex gap-4 justify-center mt-6" id="game-over-buttons">
                <button id="restart-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold transition">${lang.t('game_restart_btn')}</button>
                <button id="exit-btn" class="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-bold transition">${lang.t('game_exit_btn')}</button>
            </div>
        </div>
      </div>
    </div>
  `,

  init: async () => {
    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d')!;

    // --- TURNUVA KONTROLÜ ---
    const urlParams = new URLSearchParams(window.location.search);
    const isTournament = urlParams.get('tournament') === 'true';

    // Oyuncu İsimleri
    let leftPlayerName = "[GUEST_PLAYER]"; 
    let rightPlayerName = "Player 2";      

    if (isTournament) {
        try {
            const tData = JSON.parse(localStorage.getItem('active_tournament') || '{}');
            const match = tData.matches[tData.currentMatchIndex];
            if (match) { leftPlayerName = match.p1; rightPlayerName = match.p2; }
            else { navigate('/tournament/bracket'); return; }
        } catch (e) { navigate('/dashboard'); return; }
    } else {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const user = await getProfileReq();
                rightPlayerName = user.username;
            }
        } catch (e) {}
        try {
            const input = await Modal.prompt(lang.t('game_ask_guest'), lang.t('dash_guest'));
            if (input && input.trim() !== "") leftPlayerName = input.trim();
        } catch (e) {}
    }

    const displayNameLeft = leftPlayerName === "[GUEST_PLAYER]" ? lang.t('dash_guest') : leftPlayerName;
    document.getElementById('p1-name')!.innerText = `🔴 ${displayNameLeft}`;
    document.getElementById('p2-name')!.innerText = `🔵 ${rightPlayerName}`;
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.innerText = `${displayNameLeft} vs ${rightPlayerName}`;

    const WIN_SCORE = 3; 
    const PADDLE_WIDTH = 15; const PADDLE_HEIGHT = 100; const BALL_SIZE = 14; 
    
    let gameRunning = true;
    let score1 = 0; let score2 = 0; 
    let countdownValue = 3;

    const countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue < 0) clearInterval(countdownInterval);
    }, 1000);

    const player1 = { x: 10, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#ef4444' };
    const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#3b82f6' };
    
    const ball = { x: canvas.width/2, y: canvas.height/2, width: BALL_SIZE, height: BALL_SIZE, speedX: 7, speedY: 7, color: '#ffffff' };
    const keys: { [key: string]: boolean } = {};
    let animationFrameId: number;

    function gameLoop() {
        if (!gameRunning) return;
        if (document.querySelector('.fixed.inset-0')) {
            draw(); animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        update(); draw(); 
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function update() {
        if (countdownValue > 0) return;
        const paddleSpeed = 9;
        if ((keys['w'] || keys['P1Up']) && player1.y > 0) player1.y -= paddleSpeed;
        if ((keys['s'] || keys['P1Down']) && player1.y < canvas.height - PADDLE_HEIGHT) player1.y += paddleSpeed;
        if ((keys['ArrowUp'] || keys['P2Up']) && player2.y > 0) player2.y -= paddleSpeed;
        if ((keys['ArrowDown'] || keys['P2Down']) && player2.y < canvas.height - PADDLE_HEIGHT) player2.y += paddleSpeed;

        ball.x += ball.speedX; ball.y += ball.speedY;
        if (ball.y <= 0) { ball.y = 0; ball.speedY = -ball.speedY; }
        else if (ball.y + BALL_SIZE >= canvas.height) { ball.y = canvas.height - BALL_SIZE; ball.speedY = -ball.speedY; }

        if (checkCollision(ball, player1)) { ball.speedX = Math.abs(ball.speedX); ball.x = player1.x + PADDLE_WIDTH; increaseSpeed(); }
        if (checkCollision(ball, player2)) { ball.speedX = -Math.abs(ball.speedX); ball.x = player2.x - BALL_SIZE; increaseSpeed(); }

        if (ball.x > canvas.width) { score1++; updateScore(); resetBall(); }
        else if (ball.x + BALL_SIZE < 0) { score2++; updateScore(); resetBall(); }

        if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
            endGame(score1 >= WIN_SCORE ? displayNameLeft : rightPlayerName);
        }
    }

    async function endGame(winnerName: string) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        const winnerText = document.getElementById('winner-text')!;
        winnerText.innerHTML = `🎉 <span class="text-yellow-400">${escapeHTML(winnerName)}</span> ${lang.t('game_winner')} 🎉`;
        document.getElementById('game-over-modal')?.classList.remove('hidden');
        if (isTournament) { handleTournamentEnd(winnerName); } 
        else { try { await saveGameReq(score2, score1, leftPlayerName); } catch (err) {} }
    }

	async function handleTournamentEnd(winnerName: string) {
        const tData = JSON.parse(localStorage.getItem('active_tournament') || '{}');
        const currentIndex = tData.currentMatchIndex;
        tData.matches[currentIndex].winner = winnerName;
        tData.matches[currentIndex].played = true;
        if (currentIndex === 0) tData.matches[2].p1 = winnerName;
        else if (currentIndex === 1) tData.matches[2].p2 = winnerName;
        else if (currentIndex === 2) {
            try { await saveTournamentReq(tData.players, winnerName); } catch (err) {}
        }
        tData.currentMatchIndex++;
        localStorage.setItem('active_tournament', JSON.stringify(tData));
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.style.display = 'none';
        const exitBtn = document.getElementById('exit-btn');
        if (exitBtn) {
            exitBtn.innerText = lang.t('tour_bracket_back');
            const newBtn = exitBtn.cloneNode(true);
            exitBtn.parentNode?.replaceChild(newBtn, exitBtn);
            newBtn.addEventListener('click', () => { navigate('/tournament/bracket'); });
        }
    }

    function checkCollision(b: any, p: any) { return (b.x < p.x + PADDLE_WIDTH && b.x + b.width > p.x && b.y < p.y + PADDLE_HEIGHT && b.y + b.height > p.y); }
    function increaseSpeed() { if (Math.abs(ball.speedX) < 16) { ball.speedX *= 1.1; ball.speedY *= 1.1; } }
    function draw() {
        if(!canvas.getContext) return;
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
        ctx.fillStyle = player1.color; ctx.fillRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = player2.color; ctx.fillRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = ball.color; ctx.beginPath(); ctx.arc(ball.x+BALL_SIZE/2, ball.y+BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI*2); ctx.fill();

        // 3-2-1 geri sayım overlay
        if (countdownValue >= 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 96px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = countdownValue === 0
                ? lang.t('game_go')
                : countdownValue === 3 ? lang.t('game_ready') : String(countdownValue);
            ctx.fillStyle = countdownValue === 0 ? '#a3e635' : countdownValue <= 1 ? '#fbbf24' : '#ffffff';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }
    }
    function resetBall() {
        ball.x = canvas.width/2 - BALL_SIZE/2; ball.y = canvas.height/2 - BALL_SIZE/2;
        ball.speedX = 7 * (Math.random() > 0.5 ? 1 : -1); ball.speedY = 7 * (Math.random() > 0.5 ? 1 : -1);
    }
    function updateScore() {
        const sLeft = document.getElementById('score-left');
        const sRight = document.getElementById('score-right');
        if(sLeft) sLeft.innerText = score1.toString();
        if(sRight) sRight.innerText = score2.toString();
    }

    const handleKeyDown = (e: KeyboardEvent) => { 
        if(["ArrowUp", "ArrowDown", " ", "Escape"].indexOf(e.key) > -1) e.preventDefault();
        if(e.key === 'Escape') {
            gameRunning = false;
            cancelAnimationFrame(animationFrameId);
            if (isTournament) navigate('/tournament/bracket');
            else navigate('/dashboard');
            return;
        }
        keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- MOBİL DOKUNMATİK ---
    const btns = [
        { id: 'p1-touch-up', key: 'P1Up' }, { id: 'p1-touch-down', key: 'P1Down' },
        { id: 'p2-touch-up', key: 'P2Up' }, { id: 'p2-touch-down', key: 'P2Down' }
    ];
    btns.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) {
            el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[b.key] = true; }, { passive: false });
            el.addEventListener('touchend', (e) => { e.preventDefault(); keys[b.key] = false; }, { passive: false });
        }
    });

    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');
    import('../services/socket.service').then(({ socketService }) => { socketService.updateStatus('BUSY'); });

    const handleRestart = () => {
        gameRunning = false; cancelAnimationFrame(animationFrameId);
        score1 = 0; score2 = 0; updateScore();
        document.getElementById('game-over-modal')?.classList.add('hidden');
        gameRunning = true; resetBall(); gameLoop();
    };
    if (!isTournament) {
        restartBtn?.addEventListener('click', handleRestart);
        exitBtn?.addEventListener('click', () => navigate('/dashboard'));
    }
    document.getElementById('mobile-exit')?.addEventListener('click', () => {
        if (isTournament) navigate('/tournament/bracket');
        else navigate('/dashboard');
    });

    gameLoop();
    return () => {
        gameRunning = false; cancelAnimationFrame(animationFrameId);
        clearInterval(countdownInterval);
        import('../services/socket.service').then(({ socketService }) => { socketService.updateStatus('AVAILABLE'); });
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }
};