// frontend/src/pages/GameOnline.ts
import { navigate } from '../router';
import { saveGameReq } from '../services/game.service';
import { lang } from '../services/language.service';
import { socketService } from '../services/socket.service';
import { getProfileReq } from '../services/auth.service';
import { escapeHTML } from '../utils/escape';
import { Modal } from '../utils/Modal';

export const GameOnline = {
  render: () => `
    <div class="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white relative overflow-hidden py-4">
      
      <div id="game-title" class="text-indigo-500 font-bold tracking-widest text-xl opacity-80 mb-2 uppercase">
        ONLINE ARENA
      </div>

      <div class="flex gap-20 text-6xl font-mono font-bold select-none opacity-20 mb-4">
        <div id="score-left">0</div>
        <div id="score-right">0</div>
      </div>

      <!-- OYUN ALANI -->
      <canvas id="pong-canvas" width="960" height="540" class="bg-black border-4 border-slate-700 shadow-2xl rounded-lg cursor-none max-w-[95%] max-h-[60vh] object-contain"></canvas>

      <!-- BİLGİLER -->
      <div class="mt-4 w-full max-w-[960px] grid grid-cols-3 px-10 text-slate-500 text-sm font-mono select-none items-start">
        <div class="text-left">
             <p class="text-xl text-red-400 font-bold mb-1" id="left-name">...</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">${lang.t('game_keys_arrow')}</span></p>
        </div>
        <div class="text-center pt-2">
             <button id="mobile-exit" class="md:hidden bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded text-[10px] uppercase font-bold transition-all active:scale-95 mb-1">${lang.t('game_exit_btn')}</button>
             <p class="opacity-50 text-[10px] md:text-sm">ONLINE MATCH</p>
        </div>
        <div class="text-right">
             <p class="text-xl text-blue-400 font-bold mb-1" id="right-name">...</p>
             <p class="text-xs">${lang.t('game_control')}: <span class="text-slate-300">${lang.t('game_keys_arrow')}</span></p>
        </div>
      </div>

      <!-- MOBİL KONTROLLER -->
      <div class="flex md:hidden gap-10 mt-10 w-full justify-center px-4 pb-10">
        <button id="touch-up" class="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center text-4xl border-2 border-slate-500 active:bg-indigo-600 active:scale-90 transition-all select-none touch-none">🔼</button>
        <button id="touch-down" class="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center text-4xl border-2 border-slate-500 active:bg-indigo-600 active:scale-90 transition-all select-none touch-none">🔽</button>
      </div>

      <div id="game-over-modal" class="hidden absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="bg-slate-800 p-8 rounded-xl text-center border border-indigo-500 shadow-2xl min-w-[300px]">
            <h2 class="text-4xl font-bold mb-4 text-white" id="winner-text">...</h2>
            <button id="exit-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold transition mt-4">${lang.t('game_exit_btn')}</button>
        </div>
      </div>
    </div>
  `,

  init: async () => {
    let myUsername = "BEN";
    try {
        const user = await getProfileReq();
        myUsername = user.username;
    } catch (e) { navigate('/login'); return; }

    const role = socketService.currentGameRole;
    const opponentName = socketService.currentOpponentName;
    if (!role) { navigate('/dashboard'); return; }

    // PERSPEKTİF: Kendimizi her zaman SAĞDA (Right) göstermek için
    const isP1 = (role === 'player1');
    const leftDisplayName = opponentName;
    const rightDisplayName = myUsername;

    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    ctx.imageSmoothingEnabled = false;

    document.getElementById('left-name')!.innerText = `🔴 ${leftDisplayName}`;
    document.getElementById('right-name')!.innerText = `🔵 ${rightDisplayName}`;
    
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.innerText = `${leftDisplayName} vs ${rightDisplayName}`;

    const WIN_SCORE = 3; 
    const PADDLE_WIDTH = 15; const PADDLE_HEIGHT = 100; const BALL_SIZE = 14; 
    const START_SPEED = 7; const MAX_SPEED = 14;

    let gameRunning = true;
    let score1 = 0; let score2 = 0; // score1: Player1, score2: Player2
    
    const player1 = { x: 10, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#ef4444' };
    const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height/2 - PADDLE_HEIGHT/2, color: '#3b82f6' };
    const ball = { x: canvas.width/2, y: canvas.height/2, width: BALL_SIZE, height: BALL_SIZE, speedX: START_SPEED, speedY: START_SPEED, color: '#ffffff' };
    
    const keys: { [key: string]: boolean } = {};
    let lastTime = 0;
    let accumulator = 0;
    const tickRate = 1000 / 60;
    let animationFrameId: number;

    // --- SOCKET LISTENERS ---
    socketService.onOpponentMove((data) => {
        if (isP1) player2.y = data.y; else player1.y = data.y; 
    });

    socketService.onBallSync((data) => {
        if (!isP1) {
            ball.x = data.ballX; ball.y = data.ballY;
            score1 = data.score1; score2 = data.score2;
            updateScoreDisplay();
        }
    });

    socketService.onGameEnded((data) => { showEndScreen(data.winner); });

    socketService.onOpponentLeft(async () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        await Modal.alert(lang.t('game_online_forfeit_title'), "Rakip oyundan ayrıldı.");
        navigate('/dashboard');
    });

    // --- OYUN DÖNGÜSÜ (Fixed Timestep) ---
    function gameLoop(timestamp: number) {
        if (!gameRunning) return;
        if (!lastTime) lastTime = timestamp;
        let delta = timestamp - lastTime;
        lastTime = timestamp;

        if (delta > 100) delta = tickRate;
        accumulator += delta;

        while (accumulator >= tickRate) {
            updatePhysics();
            accumulator -= tickRate;
        }

        draw(); 
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function updatePhysics() {
        const paddleSpeed = 9;
        if (isP1) {
            if ((keys['ArrowUp'] || keys['TouchUp']) && player1.y > 0) player1.y -= paddleSpeed;
            if ((keys['ArrowDown'] || keys['TouchDown']) && player1.y < canvas.height - PADDLE_HEIGHT) player1.y += paddleSpeed;
            socketService.sendPaddleMove(player1.y);
        } else {
            if ((keys['ArrowUp'] || keys['TouchUp']) && player2.y > 0) player2.y -= paddleSpeed;
            if ((keys['ArrowDown'] || keys['TouchDown']) && player2.y < canvas.height - PADDLE_HEIGHT) player2.y += paddleSpeed;
            socketService.sendPaddleMove(player2.y);
        }

        // Sadece Host (P1) Top Fiziğini Hesaplar
        if (isP1) {
            ball.x += ball.speedX; ball.y += ball.speedY;
            if (ball.y <= 0) { ball.y = 0; ball.speedY = -ball.speedY; }
            else if (ball.y + BALL_SIZE >= canvas.height) { ball.y = canvas.height - BALL_SIZE; ball.speedY = -ball.speedY; }

            if (checkCollision(ball, player1)) { 
                ball.speedX = Math.min(Math.abs(ball.speedX) * 1.05, MAX_SPEED); 
                ball.x = player1.x + PADDLE_WIDTH; 
            }
            if (checkCollision(ball, player2)) { 
                ball.speedX = -Math.min(Math.abs(ball.speedX) * 1.05, MAX_SPEED); 
                ball.x = player2.x - BALL_SIZE; 
            }

            if (ball.x > canvas.width) { score1++; resetBall(); } 
            else if (ball.x + BALL_SIZE < 0) { score2++; resetBall(); }

            updateScoreDisplay();
            socketService.sendBallUpdate(ball.x, ball.y, score1, score2);

            if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
                const winnerName = (score1 >= WIN_SCORE) ? myUsername : opponentName;
                endGameAsHost(winnerName);
            }
        }
    }

    async function endGameAsHost(winnerName: string) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        socketService.sendGameOver(winnerName);
        try { await saveGameReq(score1, score2, socketService.currentOpponentId); } catch (err) { console.error(err); }
        showEndScreen(winnerName);
    }

    function showEndScreen(winnerName: string) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        const winnerText = document.getElementById('winner-text')!;
        winnerText.innerHTML = `🎉 <span class="text-yellow-400">${escapeHTML(winnerName)}</span> ${lang.t('game_winner')} 🎉`;
        document.getElementById('game-over-modal')?.classList.remove('hidden');
    }

    function checkCollision(b: any, p: any) { return (b.x < p.x + PADDLE_WIDTH && b.x + b.width > p.x && b.y < p.y + PADDLE_HEIGHT && b.y + b.height > p.y); }
    
    function draw() {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
        ctx.setLineDash([]);

        // PERSPEKTİF ÇİZİM
        if (isP1) {
            // P1 için her şeyi ters çiz (Logic X: 10 -> Render X: 935)
            drawPaddle(player1, true); // Kendim (Logic 10 -> Render Sağ)
            drawPaddle(player2, true); // Rakip (Logic 935 -> Render Sol)
            drawBall(true);
        } else {
            // P2 için normal çiz (Logic X: 935 zaten Sağda)
            drawPaddle(player1, false);
            drawPaddle(player2, false);
            drawBall(false);
        }
    }

    function drawPaddle(p: any, flip: boolean) {
        ctx.fillStyle = p.color;
        let rx = flip ? (canvas.width - p.x - PADDLE_WIDTH) : p.x;
        ctx.fillRect(Math.floor(rx), Math.floor(p.y), PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    function drawBall(flip: boolean) {
        ctx.fillStyle = ball.color;
        let rx = flip ? (canvas.width - ball.x - BALL_SIZE) : ball.x;
        ctx.beginPath();
        ctx.arc(Math.floor(rx + BALL_SIZE/2), Math.floor(ball.y + BALL_SIZE/2), BALL_SIZE/2, 0, Math.PI*2);
        ctx.fill();
        ctx.closePath();
    }

    function resetBall() {
        ball.x = canvas.width/2 - BALL_SIZE/2; ball.y = canvas.height/2 - BALL_SIZE/2;
        ball.speedX = START_SPEED * (Math.random() > 0.5 ? 1 : -1);
        ball.speedY = START_SPEED * (Math.random() > 0.5 ? 1 : -1);
    }

    function updateScoreDisplay() {
        const sLeft = document.getElementById('score-left'); 
        const sRight = document.getElementById('score-right');
        if (isP1) {
            // P1 için: Sağda kendi skoru (score1), Solda rakip (score2)
            if(sLeft) sLeft.innerText = score2.toString();
            if(sRight) sRight.innerText = score1.toString();
        } else {
            // P2 için: Sağda kendi skoru (score2), Solda rakip (score1)
            if(sLeft) sLeft.innerText = score1.toString();
            if(sRight) sRight.innerText = score2.toString();
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => { 
        if(["ArrowUp", "ArrowDown", " "].indexOf(e.key) > -1) e.preventDefault(); 
        keys[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // MOBİL
    const btnUp = document.getElementById('touch-up'); const btnDown = document.getElementById('touch-down');
    if (btnUp && btnDown) {
        btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); keys['TouchUp'] = true; }, { passive: false });
        btnUp.addEventListener('touchend', (e) => { e.preventDefault(); keys['TouchUp'] = false; }, { passive: false });
        btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); keys['TouchDown'] = true; }, { passive: false });
        btnDown.addEventListener('touchend', (e) => { e.preventDefault(); keys['TouchDown'] = false; }, { passive: false });
    }

    document.getElementById('exit-btn')?.addEventListener('click', () => { navigate('/dashboard'); });
    document.getElementById('mobile-exit')?.addEventListener('click', () => { navigate('/dashboard'); });

    requestAnimationFrame(gameLoop);

    return () => {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        socketService.offGameEvents(); 
    };
  }
};