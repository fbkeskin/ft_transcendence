// frontend/src/pages/GameAI.ts
import { navigate } from '../router';
import { saveGameReq } from '../services/game.service';
import { getProfileReq } from '../services/auth.service';
import { lang } from '../services/language.service';
import { escapeHTML } from '../utils/escape';

export const GameAI = {
  render: () => `
    <div class="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white relative overflow-hidden py-4">
      <div id="game-title" class="text-indigo-500 font-bold tracking-widest text-xl opacity-80 mb-2">AI VS ...</div>
      <div class="flex gap-24 text-6xl font-mono font-bold select-none opacity-20 mb-4">
        <div id="score-left">0</div>
        <div id="score-right">0</div>
      </div>
      <canvas id="pong-canvas" width="960" height="540" class="bg-black border-4 border-indigo-900 shadow-2xl rounded-lg cursor-none max-w-[95%] max-h-[60vh] object-contain"></canvas>
      <div class="flex md:hidden gap-10 mt-6 w-full justify-center px-4">
        <button id="touch-up" class="w-24 h-24 bg-blue-900/30 rounded-full flex items-center justify-center text-4xl border-2 border-blue-500 active:bg-blue-600 active:scale-90 transition-all select-none touch-none">🔼</button>
        <button id="touch-down" class="w-24 h-24 bg-blue-900/30 rounded-full flex items-center justify-center text-4xl border-2 border-blue-500 active:bg-blue-600 active:scale-90 transition-all select-none touch-none">🔽</button>
      </div>
      <div class="mt-4 w-full max-w-[960px] grid grid-cols-3 px-10 text-slate-500 text-sm font-mono select-none items-start">
        <div class="text-left">
             <p class="text-xl text-red-400 font-bold mb-1">🤖 ${lang.t('game_ai_name')}</p>
             <p class="text-xs">${lang.t('game_ai_status')}: <span class="text-slate-300">${lang.t('game_ai_thinking')}</span></p>
        </div>
        <div class="text-center pt-2">
             <button id="mobile-exit" class="md:hidden bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded text-[10px] uppercase font-bold transition-all active:scale-95 mb-1">${lang.t('game_exit_btn')}</button>
             <p class="opacity-50 text-[10px] md:text-sm">${lang.t('game_exit_esc')}</p>
        </div>
        <div class="text-right">
             <p class="text-xl text-blue-400 font-bold mb-1" id="player-name">${lang.t('game_loading')}</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">${lang.t('game_keys_arrow')}</span></p>
        </div>
      </div>
      <div id="game-over-modal" class="hidden absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="bg-slate-800 p-8 rounded-xl text-center border border-indigo-500 shadow-2xl min-w-[300px]">
            <h2 class="text-4xl font-bold mb-4 text-white" id="winner-text">...</h2>
            <div class="flex gap-4 justify-center mt-6">
                <button id="restart-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold transition">${lang.t('game_restart_btn')}</button>
                <button id="exit-btn" class="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-bold transition">${lang.t('game_exit_btn')}</button>
            </div>
        </div>
      </div>
    </div>
  `,
  init: async () => {
    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    let currentUsername = "SEN";
    try {
        const user = await getProfileReq();
        currentUsername = user.username;
        document.getElementById('player-name')!.innerText = `🔵 ${currentUsername}`;
        const titleEl = document.getElementById('game-title');
        if (titleEl) titleEl.innerText = `AI VS ${currentUsername}`;
    } catch(e) { navigate('/login'); return; }

    const WIN_SCORE = 3; 
    const PADDLE_HEIGHT = 100; const PADDLE_WIDTH = 15; const BALL_SIZE = 14; 
    const START_SPEED = 7; const MAX_SPEED = 14;
    
    let gameRunning = true;
    let score1 = 0; let score2 = 0; 
    let aiDecisionY = canvas.height / 2;
    let aiTimer = 0; 
    let lastTime = 0;
    let accumulator = 0;
    const tickRate = 1000 / 60; // 60 FPS Sabit Adım
    let animationFrameId: number;

    const player1 = { x: 10, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#ef4444' }; // AI
    const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#3b82f6' }; // PLAYER
    const ball = { x: canvas.width/2, y: canvas.height/2, width: BALL_SIZE, height: BALL_SIZE, speedX: START_SPEED, speedY: START_SPEED, color: '#ffffff' };
    const keys: { [key: string]: boolean } = {};

    function updateAILogic() {
        if (!gameRunning) return;
        const dist = ball.x - player1.x;
        const w = canvas.width;
        if (ball.speedX < 0) { 
            if (dist > w * 0.7) aiDecisionY = ball.y + (Math.random() - 0.5) * 150;
            else if (dist > w * 0.3) {
                let pY = ball.y + (ball.speedY * (dist / Math.abs(ball.speedX)));
                if (pY < 0) pY = -pY; else if (pY > canvas.height) pY = 2 * canvas.height - pY;
                aiDecisionY = pY + (Math.random() - 0.5) * 80;
            } else {
                let fY = ball.y + (ball.speedY * (dist / Math.abs(ball.speedX)));
                while (fY < 0 || fY > canvas.height) fY = fY < 0 ? -fY : 2 * canvas.height - fY;
                aiDecisionY = fY - ((Math.random() - 0.5) * PADDLE_HEIGHT * 0.9);
            }
        } else aiDecisionY = canvas.height / 2 + (Math.random() - 0.5) * 200;
    }

    function gameLoop(timestamp: number) {
        if (!gameRunning) return;
        if (!lastTime) lastTime = timestamp;
        let delta = timestamp - lastTime;
        lastTime = timestamp;

        if (delta > 100) delta = tickRate; // Sekme takılmalarını önle
        
        accumulator += delta;
        while (accumulator >= tickRate) {
            update(); // SABİT ADIMLI GÜNCELLEME (Ghosting'i önleyen yer burası)
            accumulator -= tickRate;
            
            aiTimer += tickRate;
            if (aiTimer >= 1000) { updateAILogic(); aiTimer = 0; }
        }

        draw(); 
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function update() {
        // AI Hareketi
        const p1Center = player1.y + PADDLE_HEIGHT / 2;
        const p1Speed = 8;
        if (Math.abs(p1Center - aiDecisionY) > p1Speed) {
            if (p1Center > aiDecisionY && player1.y > 0) player1.y -= p1Speed;
            else if (p1Center < aiDecisionY && player1.y < canvas.height - PADDLE_HEIGHT) player1.y += p1Speed;
        }

        // Oyuncu Hareketi
        const p2Speed = 9;
        if ((keys['ArrowUp'] || keys['TouchUp']) && player2.y > 0) player2.y -= p2Speed;
        if ((keys['ArrowDown'] || keys['TouchDown']) && player2.y < canvas.height - PADDLE_HEIGHT) player2.y += p2Speed;

        // Top Hareketi
        ball.x += ball.speedX; ball.y += ball.speedY;
        if (ball.y <= 0 || ball.y + BALL_SIZE >= canvas.height) {
            ball.y = ball.y <= 0 ? 0 : canvas.height - BALL_SIZE;
            ball.speedY = -ball.speedY;
        }

        if (checkCollision(ball, player1)) { 
            ball.speedX = Math.min(Math.abs(ball.speedX) * 1.05, MAX_SPEED);
            ball.x = player1.x + PADDLE_WIDTH; 
        }
        if (checkCollision(ball, player2)) { 
            ball.speedX = -Math.min(Math.abs(ball.speedX) * 1.05, MAX_SPEED);
            ball.x = player2.x - BALL_SIZE; 
        }

        if (ball.x > canvas.width) { score1++; updateScore(); resetBall(); }
        else if (ball.x + BALL_SIZE < 0) { score2++; updateScore(); resetBall(); }

        if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) endGame(score1 >= WIN_SCORE ? lang.t('game_ai_name') : currentUsername);
    }

    function resetBall() {
        ball.x = canvas.width/2 - BALL_SIZE/2; ball.y = canvas.height/2 - BALL_SIZE/2;
        ball.speedX = START_SPEED * (Math.random() > 0.5 ? 1 : -1);
        ball.speedY = START_SPEED * (Math.random() > 0.5 ? 1 : -1);
        updateAILogic();
    }

    function updateScore() {
        document.getElementById('score-left')!.innerText = score1.toString();
        document.getElementById('score-right')!.innerText = score2.toString();
    }

    function endGame(winner: string) {
        gameRunning = false; cancelAnimationFrame(animationFrameId);
        document.getElementById('winner-text')!.innerHTML = `🎉 <span class="text-yellow-400">${escapeHTML(winner)}</span> ${lang.t('game_winner')} 🎉`;
        document.getElementById('game-over-modal')?.classList.remove('hidden');
        saveGameReq(score2, score1, "[AI_PLAYER]").catch(() => {});
    }

    function checkCollision(b: any, p: any) { return (b.x < p.x + PADDLE_WIDTH && b.x + b.width > p.x && b.y < p.y + PADDLE_HEIGHT && b.y + b.height > p.y); }
    
    function draw() {
        // Canvas Temizliği
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = player1.color; ctx.fillRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = player2.color; ctx.fillRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        
        // YUVARLAK TOP (Eski Sorunsuz Çizim Yöntemi)
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(Math.floor(ball.x + BALL_SIZE/2), Math.floor(ball.y + BALL_SIZE/2), BALL_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    const handleKeyDown = (e: KeyboardEvent) => { 
        if(["ArrowUp", "ArrowDown", " ", "Escape"].indexOf(e.key) > -1) e.preventDefault();
        if(e.key === 'Escape') navigate('/dashboard');
        keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);

    document.getElementById('restart-btn')?.addEventListener('click', () => {
        score1 = 0; score2 = 0; updateScore();
        document.getElementById('game-over-modal')?.classList.add('hidden');
        resetBall(); gameRunning = true; aiTimer = 0; lastTime = 0; accumulator = 0;
        requestAnimationFrame(gameLoop);
    });
    document.getElementById('exit-btn')?.addEventListener('click', () => navigate('/dashboard'));
    document.getElementById('mobile-exit')?.addEventListener('click', () => navigate('/dashboard'));

    updateAILogic(); 
    requestAnimationFrame(gameLoop);

    return () => {
        gameRunning = false; cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
    };
  }
};