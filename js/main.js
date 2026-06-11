const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let isOverworldActive = false;

// Basit Oyuncu Objesi
const player = {
    x: 400,
    y: 300,
    speed: 3,
    size: 20
};

const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mekan Merkezleri (Çarpışma algılamak ve mekana girmek için)
const locations = [
    { id: 'Deccal Ex', x: 200, y: 150, radius: 40 },
    { id: 'Coffeeland XL Plus', x: 600, y: 150, radius: 40 },
    { id: 'Maun Sandık Bar', x: 200, y: 450, radius: 40 },
    { id: 'Kanka\'s Home', x: 600, y: 450, radius: 40 }
];

function update() {
    if (!isOverworldActive) return;

    // Oyuncu Hareketi
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

    // Mekana Girme Kontrolü (Hitbox)
    locations.forEach(loc => {
        const dist = Math.hypot(player.x - loc.x, player.y - loc.y);
        if (dist < loc.radius + player.size) {
            enterLocation(loc.id);
        }
    });
}

function draw() {
    if (!isOverworldActive) return;

    // Arka plan (Harita görselini buraya çizebilirsin)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mekanları Çiz (Placeholder)
    locations.forEach(loc => {
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, loc.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText(loc.id, loc.x - 30, loc.y - 50);
    });

    // Oyuncuyu Çiz (Kafanın arkası / Kuş bakışı)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(player.x - player.size/2, player.y - player.size/2, player.size, player.size);
}

function enterLocation(locationId) {
    // Aynı mekana arka arkaya tetiklemeyi önlemek için haritayı durdur
    isOverworldActive = false; 
    keys['ArrowUp'] = keys['ArrowDown'] = keys['ArrowLeft'] = keys['ArrowRight'] = false;

    cutscenes.fadeToBlack(() => {
        console.log(`${locationId} mekanına girildi.`);
        
        // Geçici olarak geri dönmek için 2 saniye bekleyip haritaya atar
        setTimeout(() => {
            isOverworldActive = true;
            cutscenes.fadeFromBlack(() => {});
        }, 2000);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Oyunu Başlatan Fonksiyon (Cutscene'in sonundan çağrılır)
window.initOverworld = function() {
    isOverworldActive = true;
};

// Sayfa yüklendiğinde Intro başlasın
window.onload = () => {
    cutscenes.startIntroSequence();
    gameLoop();
};
