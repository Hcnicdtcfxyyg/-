// Vibe site: background particles + simple click game with burst + shake effect
(() => {
  // Utility: dpr-aware canvas resize
  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // Background particle system
  const bg = document.getElementById('bg');
  function resizeBg() {
    bg.width = window.innerWidth * devicePixelRatio;
    bg.height = window.innerHeight * devicePixelRatio;
    bg.style.width = window.innerWidth + 'px';
    bg.style.height = window.innerHeight + 'px';
  }
  resizeBg();
  const bgCtx = bg.getContext('2d');
  bgCtx.scale(devicePixelRatio, devicePixelRatio);

  const particles = [];
  const PARTICLE_COUNT = 60;
  function initParticles(){
    particles.length = 0;
    for(let i=0;i<PARTICLE_COUNT;i++){
      particles.push({
        x: Math.random()*window.innerWidth,
        y: Math.random()*window.innerHeight,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()-0.5)*0.2,
        r: 1 + Math.random()*3,
        hue: Math.random() > 0.5 ? 190 + Math.random()*30 : 320 + Math.random()*20,
        alpha: 0.06 + Math.random()*0.18
      });
    }
  }
  initParticles();

  function drawBg(ts){
    bgCtx.clearRect(0,0,window.innerWidth,window.innerHeight);
    // soft radial glow center
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const g = bgCtx.createRadialGradient(cx,cy,0,cx,cy,Math.max(cx,cy));
    g.addColorStop(0,'rgba(8,12,20,0.0)');
    g.addColorStop(0.5,'rgba(10,14,24,0.12)');
    g.addColorStop(1,'rgba(2,3,6,0.5)');
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0,0,window.innerWidth,window.innerHeight);

    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      // wrap
      if(p.x < -50) p.x = window.innerWidth + 50;
      if(p.x > window.innerWidth + 50) p.x = -50;
      if(p.y < -50) p.y = window.innerHeight + 50;
      if(p.y > window.innerHeight + 50) p.y = -50;

      const rad = bgCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*8);
      rad.addColorStop(0, `hsla(${p.hue},100%,60%,${p.alpha})`);
      rad.addColorStop(1, 'rgba(0,0,0,0)');
      bgCtx.fillStyle = rad;
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r*8, 0, Math.PI*2);
      bgCtx.fill();
    }
  }

  // Game canvas
  const game = document.getElementById('game');
  const gameCtx = setupCanvas(game);
  // Keep internal logical size square
  function resizeGame(){
    const size = Math.min(window.innerWidth * 0.72, 380);
    game.style.width = size + 'px';
    game.style.height = size + 'px';
    setupCanvas(game);
  }
  resizeGame();

  // Game state
  let score = 0;
  const scoreEl = document.getElementById('score');

  // central orb
  const orb = { x:150, y:150, r:50, scale:1, shake:0 };

  // burst particles from clicks
  const bursts = [];

  function spawnBurst(x,y){
    for(let i=0;i<18;i++){
      bursts.push({
        x, y,
        vx: (Math.random()-0.5)*6,
        vy: (Math.random()-0.7)*6,
        life: 40 + Math.random()*30,
        ttl: 40 + Math.random()*30,
        hue: Math.random()>0.5 ? 190 + Math.random()*30 : 320 + Math.random()*20
      });
    }
  }

  // Input handling (click & touch)
  function globalToCanvas(e){
    const rect = game.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (game.width / rect.width);
    const cy = (e.clientY - rect.top) * (game.height / rect.height);
    return { x: cx / (devicePixelRatio||1), y: cy / (devicePixelRatio||1) };
  }

  game.addEventListener('click', (e) => {
    const p = globalToCanvas(e);
    score++;
    scoreEl.innerText = 'Score: ' + score;
    orb.shake = 8;
    orb.scale = 1.08;
    spawnBurst(p.x, p.y);
  });

  game.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const p = globalToCanvas(touch);
    score++;
    scoreEl.innerText = 'Score: ' + score;
    orb.shake = 8;
    orb.scale = 1.08;
    spawnBurst(p.x, p.y);
  }, { passive: false });

  // animation loop
  function frame(t){
    drawBg(t);

    // game draw (clear)
    gameCtx.clearRect(0,0,game.width,game.height);

    // scale/position orb relative to canvas size
    const rect = game.getBoundingClientRect();
    const logicalSize = Math.min(rect.width, rect.height);
    const centerX = logicalSize/2;
    const centerY = logicalSize/2;
    const baseR = logicalSize * 0.17;

    // update orb shake & scale
    if(orb.shake > 0) orb.shake *= 0.88;
    if(orb.scale > 1) orb.scale += (1 - orb.scale) * 0.18;

    // draw glow layers
    for(let i=5;i>=1;i--){
      const a = 0.08 * (6 - i);
      gameCtx.beginPath();
      gameCtx.fillStyle = `rgba(5,243,255,${a})`;
      gameCtx.arc(centerX + (Math.random()-0.5)*orb.shake*0.2, centerY + (Math.random()-0.5)*orb.shake*0.2, baseR * (1 + i*0.18) * orb.scale, 0, Math.PI*2);
      gameCtx.fill();
    }

    // main orb (gradient)
    const g = gameCtx.createRadialGradient(centerX - baseR*0.3, centerY - baseR*0.3, baseR*0.1, centerX, centerY, baseR*1.1);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.2, '#a9fff7');
    g.addColorStop(1, '#ff6ad1');
    gameCtx.fillStyle = g;
    gameCtx.beginPath();
    const shakeX = (Math.random()-0.5) * orb.shake;
    const shakeY = (Math.random()-0.5) * orb.shake;
    gameCtx.arc(centerX + shakeX, centerY + shakeY, baseR * orb.scale, 0, Math.PI*2);
    gameCtx.fill();

    // bursts
    for(let i = bursts.length - 1; i >= 0; i--){
      const b = bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.12; // gravity
      b.life -= 1;
      const alpha = Math.max(0, b.life / b.ttl);
      gameCtx.fillStyle = `hsla(${b.hue},95%,60%,${alpha})`;
      gameCtx.beginPath();
      gameCtx.arc(b.x, b.y, Math.max(1, (b.life / b.ttl) * 4), 0, Math.PI*2);
      gameCtx.fill();
      if(b.life <= 0) bursts.splice(i,1);
    }

    // slight damping to shake
    if(orb.shake < 0.01) orb.shake = 0;

    requestAnimationFrame(frame);
  }

  // window resize handling
  function onResize(){
    resizeBg();
    initParticles();
    resizeGame();
  }
  window.addEventListener('resize', onResize);

  // start loop
  requestAnimationFrame(frame);

  // expose small debug helpers (optional)
  window.__vibe = { particles, bursts };
})();
