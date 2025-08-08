// game.js
// Updated: Music starts after first user interaction (works after reload & restart)

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Images
const raftImg = new Image();
raftImg.src = "raft.png";
const rockImg = new Image();
rockImg.src = "rock.png";

let assetsLoaded = 0;
raftImg.onload = assetLoaded;
rockImg.onload = assetLoaded;
function assetLoaded() {
  assetsLoaded++;
  if (assetsLoaded === 2) init();
}

// 🎵 Background music
const bgMusic = new Audio("behula.mp3");
bgMusic.loop = true;
let musicUnlocked = false; // prevents autoplay issues

function startMusic() {
  if (!musicUnlocked) return; // don’t try until allowed
  bgMusic.currentTime = 0;
  bgMusic.play().catch(err => {
    console.log("Music blocked:", err);
  });
}

function stopMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// Unlock music after first click/touch/keydown
function unlockMusic() {
  if (!musicUnlocked) {
    musicUnlocked = true;
    startMusic();
    document.removeEventListener("keydown", unlockMusic);
    document.removeEventListener("click", unlockMusic);
    document.removeEventListener("touchstart", unlockMusic);
  }
}
document.addEventListener("keydown", unlockMusic);
document.addEventListener("click", unlockMusic);
document.addEventListener("touchstart", unlockMusic);

// Game state
const RAFT_W = 80, RAFT_H = 80;
const ROCK_W = 70, ROCK_H = 70;
let raft = { x: canvas.width / 2 - RAFT_W / 2, y: canvas.height - 110, width: RAFT_W, height: RAFT_H, speed: 5 };
let rocks = [];
let rockSpeed = 3;
let spawnMs = 1400;
let spawnIntervalId = null;

let keys = { left: false, right: false };
let gameOver = false;
let score = 0;

// Restart button
let restartBtn = { x: 0, y: 0, w: 160, h: 48 };

function init() {
  if (spawnIntervalId === null) {
    spawnIntervalId = setInterval(() => {
      if (!gameOver) spawnRock();
    }, spawnMs);
  }
  addInputListeners();
  requestAnimationFrame(loop);
}

function spawnRock() {
  let tries = 0;
  let x;
  do {
    x = Math.random() * (canvas.width - ROCK_W);
    let ok = true;
    for (const r of rocks) {
      if (r.y < ROCK_H && Math.abs(r.x - x) < ROCK_W) { ok = false; break; }
    }
    if (ok) break;
    tries++;
  } while (tries < 10);
  rocks.push({ x, y: -ROCK_H, width: ROCK_W, height: ROCK_H, speed: rockSpeed });
}

function addInputListeners() {
  window.addEventListener("keydown", (e) => {
    if (gameOver) { restartGame(); return; }
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  });

  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");

  if (leftBtn) {
    leftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!gameOver) keys.left = true; }, { passive: false });
    leftBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys.left = false; }, { passive: false });
    leftBtn.addEventListener("mousedown", () => { if (!gameOver) keys.left = true; });
    leftBtn.addEventListener("mouseup", () => keys.left = false);
    leftBtn.addEventListener("mouseleave", () => keys.left = false);
  }

  if (rightBtn) {
    rightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!gameOver) keys.right = true; }, { passive: false });
    rightBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys.right = false; }, { passive: false });
    rightBtn.addEventListener("mousedown", () => { if (!gameOver) keys.right = true; });
    rightBtn.addEventListener("mouseup", () => keys.right = false);
    rightBtn.addEventListener("mouseleave", () => keys.right = false);
  }

  canvas.addEventListener("click", (e) => {
    if (!gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (pointInRect(cx, cy, restartBtn)) restartGame();
  });

  canvas.addEventListener("touchstart", (e) => {
    if (!gameOver) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const cx = t.clientX - rect.left;
    const cy = t.clientY - rect.top;
    if (pointInRect(cx, cy, restartBtn)) restartGame();
  }, { passive: false });
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function update() {
  if (gameOver) return;
  if (keys.left) raft.x -= raft.speed;
  if (keys.right) raft.x += raft.speed;
  raft.x = Math.max(0, Math.min(canvas.width - raft.width, raft.x));
  for (const rock of rocks) rock.y += rock.speed;

  rocks = rocks.filter(rock => {
    if (rock.y > canvas.height) { score++; return false; }
    return true;
  });

  const PAD = 12;
  for (const rock of rocks) {
    const a = { x: raft.x + PAD, y: raft.y + PAD, w: raft.width - PAD * 2, h: raft.height - PAD * 2 };
    const b = { x: rock.x + PAD, y: rock.y + PAD, w: rock.width - PAD * 2, h: rock.height - PAD * 2 };
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
      showGameOver();
      break;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#4FC3F7");
  g.addColorStop(1, "#0288D1");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(raftImg, raft.x, raft.y, raft.width, raft.height);
  for (const rock of rocks) ctx.drawImage(rockImg, rock.x, rock.y, rock.width, rock.height);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 26);

  if (gameOver) drawGameOverOverlay();
}

function drawGameOverOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxW = Math.min(340, canvas.width - 40);
  const boxH = 180;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = (canvas.height - boxH) / 2;

  roundRect(ctx, boxX, boxY, boxW, boxH, 12, true, false, "#222");

  ctx.fillStyle = "white";
  ctx.font = "34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, boxY + 55);

  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, boxY + 90);

  restartBtn.w = 160; restartBtn.h = 48;
  restartBtn.x = canvas.width / 2 - restartBtn.w / 2;
  restartBtn.y = boxY + boxH - 70;

  roundRect(ctx, restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, 8, true, false, "#fff");
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText("Restart", canvas.width / 2, restartBtn.y + 32);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, fillColor) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fillColor || ctx.fillStyle;
    ctx.fill();
  }
  if (stroke) ctx.stroke();
}

function showGameOver() {
  gameOver = true;
  stopMusic();
}

function restartGame() {
  gameOver = false;
  rocks = [];
  score = 0;
  raft.x = canvas.width / 2 - raft.width / 2;
  startMusic();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

if (raftImg.complete && rockImg.complete) {
  assetsLoaded = 2;
  init();
}
