// frontend/src/pages/GameAI.ts
import { navigate } from '../router';
import { saveGameReq } from '../services/game.service';
import { getProfileReq } from '../services/auth.service';

export const GameAI = {
  render: () => `
    <div class="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white relative overflow-hidden py-4">
      
      <!-- BAŞLIK -->
      <div id="game-title" class="text-indigo-500 font-bold tracking-widest text-xl opacity-80 mb-2">
        OYUNCU vs YAPAY ZEKA
      </div>

      <!-- SKOR -->
      <div class="flex gap-24 text-6xl font-mono font-bold select-none opacity-20 mb-4">
        <div id="score-left">0</div>
        <div id="score-right">0</div>
      </div>

      <!-- OYUN ALANI -->
      <canvas id="pong-canvas" width="960" height="540" class="bg-black border-4 border-indigo-900 shadow-2xl rounded-lg cursor-none max-w-[95%] max-h-[60vh] object-contain"></canvas>

      <!-- BİLGİLER -->
      <div class="mt-4 w-full max-w-[960px] flex justify-between px-10 text-slate-500 text-sm font-mono select-none">
        
        <div class="text-left">
             <p class="text-xl text-red-400 font-bold mb-1">🤖 YAPAY ZEKA</p>
             <p class="text-xs">Durum: <span class="text-slate-300">HESAPLIYOR...</span></p>
        </div>

        <div class="text-center pt-2 opacity-50">ESC:Çıkış</div>

        <div class="text-right">
             <p class="text-xl text-blue-400 font-bold mb-1" id="player-name">YÜKLENİYOR...</p>
             <p class="text-xs">Kontrol: <span class="text-slate-300">OK TUŞLARI</span></p>
        </div>

      </div>

      <div id="game-over-modal" class="hidden absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="bg-slate-800 p-8 rounded-xl text-center border border-indigo-500 shadow-2xl min-w-[300px]">
            <h2 class="text-4xl font-bold mb-4 text-white" id="winner-text">...</h2>
            <div class="flex gap-4 justify-center mt-6">
                <button id="restart-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold transition">Tekrar Oyna</button>
                <button id="exit-btn" class="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-bold transition">Çıkış</button>
            </div>
        </div>
      </div>
    </div>
  `,

  init: async () => {
    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    // Profil Çek
    let currentUsername = "SEN";
    try {
        const user = await getProfileReq();
        currentUsername = user.username;
        document.getElementById('player-name')!.innerText = `🔵 ${currentUsername}`;
        
        // Başlığı güncelle: "AI vs Kullanıcı"
        const titleEl = document.getElementById('game-title');
        if (titleEl) {
            titleEl.innerText = `AI VS ${currentUsername}`;
        }
    } catch(e) { navigate('/login'); return; }

    const WIN_SCORE = 3; 
    const PADDLE_HEIGHT = 100; const PADDLE_WIDTH = 15; const BALL_SIZE = 14; 
    
    let gameRunning = true;
    let score1 = 0; // AI (SOL)
    let score2 = 0; // SEN (SAĞ)

    let aiKeys = { w: false, s: false };
    let aiInterval: any = null;
    let animationFrameId: number; // STABILITY FIX

    const player1 = { x: 10, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#ef4444' }; // AI
    const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#3b82f6' }; // SEN
    const ball = { x: canvas.width/2, y: canvas.height/2, width: BALL_SIZE, height: BALL_SIZE, speedX: 7, speedY: 7, color: '#ffffff' };
    const keys: { [key: string]: boolean } = {};

    function gameLoop() {
        if (!gameRunning) return;
        update(); 
        draw(); 
        animationFrameId = requestAnimationFrame(gameLoop); // STABILITY FIX
    }

    function startAILogic() {
        aiInterval = setInterval(() => {
            if (!gameRunning) return;
            if (ball.speedX < 0) { // Top sola (AI'ya) geliyorsa
                const distanceToPaddle = ball.x - player1.x;
                const timeToReach = distanceToPaddle / Math.abs(ball.speedX);
                let futureY = ball.y + (ball.speedY * timeToReach);

                const boardHeight = canvas.height;
                while (futureY < 0 || futureY > boardHeight) {
                    if (futureY < 0) futureY = -futureY; 
                    else if (futureY > boardHeight) futureY = 2 * boardHeight - futureY; 
                }
                decideMovement(futureY);
            } else { decideMovement(canvas.height / 2); }
        }, 1000);
    }

    function decideMovement(targetY: number) {
        const paddleCenter = player1.y + PADDLE_HEIGHT / 2;
        const tolerance = 20; 
        aiKeys.w = false; aiKeys.s = false;
        if (paddleCenter < targetY - tolerance) aiKeys.s = true; 
        else if (paddleCenter > targetY + tolerance) aiKeys.w = true; 
    }

    function update() {
        const paddleSpeed = 9;
        // AI Hareketi
        if (aiKeys.w && player1.y > 0) player1.y -= paddleSpeed; 
        if (aiKeys.s && player1.y < canvas.height - PADDLE_HEIGHT) player1.y += paddleSpeed;

        // SENİN Hareketin
        if (keys['ArrowUp'] && player2.y > 0) player2.y -= paddleSpeed;
        if (keys['ArrowDown'] && player2.y < canvas.height - PADDLE_HEIGHT) player2.y += paddleSpeed;

        ball.x += ball.speedX; ball.y += ball.speedY;

        if (ball.y <= 0) { ball.y = 0; ball.speedY = -ball.speedY; }
        else if (ball.y + BALL_SIZE >= canvas.height) { ball.y = canvas.height - BALL_SIZE; ball.speedY = -ball.speedY; }

        if (checkCollision(ball, player1)) { ball.speedX = Math.abs(ball.speedX); ball.x = player1.x + PADDLE_WIDTH; increaseSpeed(); }
        if (checkCollision(ball, player2)) { ball.speedX = -Math.abs(ball.speedX); ball.x = player2.x - BALL_SIZE; increaseSpeed(); }

        if (ball.x > canvas.width) { score1++; updateScore(); resetBall(); } // AI Attı
        else if (ball.x + BALL_SIZE < 0) { score2++; updateScore(); resetBall(); } // SEN Attın

        if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
            endGame(score1 >= WIN_SCORE ? "YAPAY ZEKA" : currentUsername);
        }
    }

    // --- AI İÇİN DÜZELTİLEN ENDGAME (STABILITY FIX) ---
    async function endGame(winnerName: string) {
        gameRunning = false;
        clearInterval(aiInterval);
        cancelAnimationFrame(animationFrameId); // STABILITY FIX
        
        const winnerText = document.getElementById('winner-text')!;
        winnerText.innerHTML = `🎉 <span class="text-yellow-400">${winnerName}</span> KAZANDI! 🎉`;
        document.getElementById('game-over-modal')?.classList.remove('hidden');

        try {
            // DİKKAT: score2 = SEN, score1 = AI
            await saveGameReq(score2, score1, "Yapay Zeka");
            console.log("AI Maçı Kaydedildi ✅");
        } catch (err) { console.error(err); }
    }

    // Helperlar
    function checkCollision(b: any, p: any) { return (b.x < p.x + PADDLE_WIDTH && b.x + b.width > p.x && b.y < p.y + PADDLE_HEIGHT && b.y + b.height > p.y); }
    function increaseSpeed() { if (Math.abs(ball.speedX) < 16) { ball.speedX *= 1.05; ball.speedY *= 1.05; } }
    function draw() {
        if(!canvas.getContext) return; // STABILITY FIX
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
        aiKeys.w = false; aiKeys.s = false;
    }
    function updateScore() {
        document.getElementById('score-left')!.innerText = score1.toString();
        document.getElementById('score-right')!.innerText = score2.toString();
    }
    
    // --- STABILITY FIX: EVENT HANDLERS ---
    const handleKeyDown = (e: KeyboardEvent) => { 
        if(["ArrowUp", "ArrowDown", " ", "Escape"].indexOf(e.key) > -1) e.preventDefault();
        
        if(e.key === 'Escape') { 
            gameRunning = false;
            cancelAnimationFrame(animationFrameId);
            clearInterval(aiInterval);
            navigate('/dashboard'); 
            return;
        }
        
        keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- STABILITY FIX: RESTART & EXIT ---
    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');

    const handleRestart = () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        clearInterval(aiInterval);
        
        score1 = 0; score2 = 0; updateScore();
        document.getElementById('game-over-modal')?.classList.add('hidden');
        
        gameRunning = true; resetBall(); startAILogic(); gameLoop();
    };

    const handleExit = () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        clearInterval(aiInterval);
        navigate('/dashboard');
    };

    restartBtn?.addEventListener('click', handleRestart);
    exitBtn?.addEventListener('click', handleExit);

    startAILogic(); 
    gameLoop();

    // --- STABILITY FIX: CLEANUP ---
    return () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        clearInterval(aiInterval);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        restartBtn?.removeEventListener('click', handleRestart);
        exitBtn?.removeEventListener('click', handleExit);
    };
  }
};