// frontend/src/pages/Game.ts
import { navigate } from '../router';
import { saveGameReq } from '../services/game.service';
import { getProfileReq } from '../services/auth.service';
import { lang } from '../services/language.service';
import { Modal } from '../utils/Modal';

export const Game = {
  render: () => `
    <div class="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white relative overflow-hidden py-4">
      
      <!-- BAŞLIK (Artık akış içinde) -->
      <div id="game-title" class="text-indigo-500 font-bold tracking-widest text-xl opacity-80 mb-2">
        ${lang.t('game_local_title')}
      </div>

      <!-- SKOR TABLOSU (Artık akış içinde) -->
      <div class="flex gap-20 text-6xl font-mono font-bold select-none opacity-20 mb-4">
        <div id="score-left">0</div>
        <div id="score-right">0</div>
      </div>

      <!-- OYUN ALANI -->
      <canvas id="pong-canvas" width="960" height="540" class="bg-black border-4 border-slate-700 shadow-2xl rounded-lg cursor-none max-w-[95%] max-h-[60vh] object-contain"></canvas>

      <!-- KONTROLLER & İSİMLER -->
      <div class="mt-4 w-full max-w-[960px] grid grid-cols-3 px-10 text-slate-500 text-sm font-mono select-none items-start">
        
        <div class="text-left">
             <p class="text-xl text-white font-bold mb-1" id="p1-name">${lang.t('game_guest_name')}</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">W / S</span></p>
        </div>

        <div class="text-center pt-2 opacity-50">${lang.t('game_exit_esc')}</div>

        <div class="text-right">
             <p class="text-xl text-indigo-400 font-bold mb-1" id="p2-name">${lang.t('game_loading')}</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">${lang.t('game_keys_arrow')}</span></p>
        </div>

      </div>

      <div id="game-over-modal" class="hidden absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="bg-slate-800 p-8 rounded-xl text-center border border-indigo-500 shadow-2xl min-w-[300px]">
            <h2 class="text-4xl font-bold mb-4 text-white" id="winner-text">${lang.t('game_over')}</h2>
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
    const ctx = canvas.getContext('2d')!;

    // 1. KULLANICI BİLGİSİ
    let currentUsername = "SEN";
    let guestName = lang.t('dash_guest');

    try {
        const user = await getProfileReq();
        currentUsername = user.username;
        
        const input = await Modal.prompt(lang.t('game_ask_guest'), guestName);
        if (input && input.trim() !== "") guestName = input.trim();

    } catch (e) {
        console.error("Kullanıcı bilgisi yok");
        navigate('/login');
        return;
    }

    // HTML Güncelle (SOL: Misafir, SAĞ: Sen)
    document.getElementById('p1-name')!.innerText = `🔴 ${guestName}`;
    document.getElementById('p2-name')!.innerText = `🔵 ${currentUsername}`;

    // Başlığı güncelle: "Misafir vs Kullanıcı"
    const titleEl = document.getElementById('game-title');
    if (titleEl) {
        titleEl.innerText = `${guestName} vs ${currentUsername}`;
    }

    const WIN_SCORE = 3; 
    const PADDLE_WIDTH = 15; const PADDLE_HEIGHT = 100; const BALL_SIZE = 14; 
    
    let gameRunning = true;
    let score1 = 0; // SOL (Misafir)
    let score2 = 0; // SAĞ (Sen)

    const player1 = { x: 10, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#ef4444' };
    const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#3b82f6' };
    
    const ball = { x: canvas.width/2, y: canvas.height/2, width: BALL_SIZE, height: BALL_SIZE, speedX: 7, speedY: 7, color: '#ffffff' };
    const keys: { [key: string]: boolean } = {};
    let animationFrameId: number;

    function gameLoop() {
        if (!gameRunning) return;
        update(); 
        draw(); 
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function update() {
        const paddleSpeed = 9;
        
        // P1 (Misafir - Sol - W/S)
        if (keys['w'] && player1.y > 0) player1.y -= paddleSpeed;
        if (keys['s'] && player1.y < canvas.height - PADDLE_HEIGHT) player1.y += paddleSpeed;

        // P2 (SEN - Sağ - OK TUŞLARI)
        if (keys['ArrowUp'] && player2.y > 0) player2.y -= paddleSpeed;
        if (keys['ArrowDown'] && player2.y < canvas.height - PADDLE_HEIGHT) player2.y += paddleSpeed;

        ball.x += ball.speedX; ball.y += ball.speedY;

        if (ball.y <= 0) { ball.y = 0; ball.speedY = -ball.speedY; }
        else if (ball.y + BALL_SIZE >= canvas.height) { ball.y = canvas.height - BALL_SIZE; ball.speedY = -ball.speedY; }

        if (checkCollision(ball, player1)) { ball.speedX = Math.abs(ball.speedX); ball.x = player1.x + PADDLE_WIDTH; increaseSpeed(); }
        if (checkCollision(ball, player2)) { ball.speedX = -Math.abs(ball.speedX); ball.x = player2.x - BALL_SIZE; increaseSpeed(); }

        if (ball.x > canvas.width) { score1++; updateScore(); resetBall(); } // Misafir Attı
        else if (ball.x + BALL_SIZE < 0) { score2++; updateScore(); resetBall(); } // Sen Attın

        if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
            endGame(score1 >= WIN_SCORE ? guestName : currentUsername);
        }
    }

    async function endGame(winnerName: string) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId); // Döngüyü durdur
        
        const winnerText = document.getElementById('winner-text')!;
        winnerText.innerHTML = `🎉 <span class="text-yellow-400">${winnerName}</span> ${lang.t('game_winner')} 🎉`;
        document.getElementById('game-over-modal')?.classList.remove('hidden');

        try {
            // DİKKAT: score2 = SEN, score1 = MİSAFİR
            // Backend'e her zaman önce SENİN SKORUNU atıyoruz.
            await saveGameReq(score2, score1, guestName);
            console.log(lang.t('game_saved'));
        } catch (err) { console.error(err); }
    }

    // Helperlar (Kısa tutuldu)
    function checkCollision(b: any, p: any) { return (b.x < p.x + PADDLE_WIDTH && b.x + b.width > p.x && b.y < p.y + PADDLE_HEIGHT && b.y + b.height > p.y); }
    function increaseSpeed() { if (Math.abs(ball.speedX) < 16) { ball.speedX *= 1.1; ball.speedY *= 1.1; } }
    function draw() {
        if(!canvas.getContext) return; // Canvas yoksa çizme
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
        ctx.fillStyle = player1.color; ctx.fillRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = player2.color; ctx.fillRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = ball.color; ctx.beginPath(); ctx.arc(ball.x+BALL_SIZE/2, ball.y+BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI*2); ctx.fill();
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
            navigate('/dashboard');
            return;
        }

        keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');

    const handleRestart = () => {
        // GÜVENLİK: Önceki döngüyü kesinlikle öldür
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);

        // State sıfırla
        score1 = 0; score2 = 0; updateScore();
        document.getElementById('game-over-modal')?.classList.add('hidden');
        
        // Yeniden başlat
        gameRunning = true; 
        resetBall(); 
        gameLoop();
    };
    const handleExit = () => navigate('/dashboard');

    restartBtn?.addEventListener('click', handleRestart);
    exitBtn?.addEventListener('click', handleExit);

    gameLoop();

    // CLEANUP FONKSİYONU
    return () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        restartBtn?.removeEventListener('click', handleRestart);
        exitBtn?.removeEventListener('click', handleExit);
    };
  }
};
