// ========== match.js - 跨时空羁绊测试页面逻辑 ==========

// ---------- 第一部分：防调试系统（与主页一致） ----------
const 键盘防护 = {
    enabled: true,
    禁用组合: [
        { key: 'F12' }, { ctrl: true, key: 's' }, { ctrl: true, key: 'u' },
        { ctrl: true, shift: true, key: 'i' }, { ctrl: true, shift: true, key: 'j' },
        { ctrl: true, shift: true, key: 'c' }
    ],
    init() {
        this.keydownHandler = (e) => {
            if (!this.enabled) return;
            for (let combo of this.禁用组合) {
                if (combo.key === 'F12' && e.key === 'F12') { e.preventDefault(); this.违规('F12'); return; }
                if (combo.ctrl && e.ctrlKey && combo.key === e.key.toLowerCase()) { e.preventDefault(); this.违规(combo.key); return; }
                if (combo.ctrl && combo.shift && e.ctrlKey && e.shiftKey && combo.key === e.key.toLowerCase()) { e.preventDefault(); this.违规(combo.key); return; }
            }
        };
        document.addEventListener('keydown', this.keydownHandler, true);
        document.addEventListener('contextmenu', (e) => {
            if (!this.enabled) return;
            e.preventDefault();
        });
    },
    违规(key) {
        document.getElementById('keyboardWatcher').style.display = 'block';
        document.getElementById('keyboardWatcher').textContent = `已拦截: ${key}`;
        setTimeout(() => document.getElementById('keyboardWatcher').style.display = 'none', 2000);
        // 不设永久锁定，匹配页暂不需要锁定
    },
    unlock() {
        this.enabled = false;
        document.removeEventListener('keydown', this.keydownHandler, true);
        document.removeEventListener('contextmenu', (e) => e.preventDefault());
        console.log('🔓 调试已解锁，F12 可用。');
    }
};

const 反调试 = {
    timer: null,
    enabled: true,
    start() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.enabled) return;
            const start = performance.now();
            debugger;
            if (performance.now() - start > 100) this.检测到调试();
        }, 1000);
    },
    检测到调试() {
        document.getElementById('antiInspect').style.display = 'flex';
        this.stop();
    },
    stop() {
        clearInterval(this.timer);
        this.timer = null;
    },
    unlock() {
        this.enabled = false;
        this.stop();
        document.getElementById('antiInspect').style.display = 'none';
        console.log('🔓 反调试已禁用。');
    }
};

// 右上角三连击解锁调试
let debugClickCount = 0;
let debugClickTimer = null;
function setupDebugUnlock() {
    const handler = (e) => {
        let clientX, clientY;
        if (e.changedTouches) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (clientX > w - 80 && clientY < 80) {
            e.stopPropagation();
            debugClickCount++;
            if (debugClickCount === 1) {
                debugClickTimer = setTimeout(() => {
                    debugClickCount = 0;
                }, 1000);
            } else if (debugClickCount >= 3) {
                clearTimeout(debugClickTimer);
                debugClickCount = 0;
                键盘防护.unlock();
                反调试.unlock();
                alert('🔓 调试模式已开启，F12 可用。');
            }
        }
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler, { passive: true });
}

// ---------- 第二部分：背景系统（从主页移植） ----------
function 创建星星() {
    const universe = document.getElementById('universe');
    if (!universe) return;
    universe.innerHTML = '';
    for (let i = 0; i < 300; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        star.style.setProperty('--opacity', Math.random() * 0.8 + 0.2);
        universe.appendChild(star);
    }
}

let cosmicAnimId = null;
let meteors = [];
let galaxyAngle = 0;

function initCosmicEffects() {
    const canvas = document.getElementById('cosmicCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function spawnMeteor() {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.4;
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.6;
        const speed = 8 + Math.random() * 12;
        const length = 60 + Math.random() * 120;
        meteors.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: length,
            life: 1.0,
            decay: 0.003 + Math.random() * 0.006
        });
    }

    let meteorTimer = 0;
    const METEOR_INTERVAL = 40;

    function drawGalaxy(cx, cy, time) {
        const tilt = 0.35;
        const arms = 3;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);

        let grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 180);
        grd.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
        grd.addColorStop(0.1, 'rgba(255, 200, 150, 0.7)');
        grd.addColorStop(0.3, 'rgba(200, 180, 255, 0.4)');
        grd.addColorStop(0.6, 'rgba(100, 120, 220, 0.15)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(0, 0, 200, 70, 0, 0, Math.PI*2);
        ctx.fill();

        const maxRadius = 200;
        for (let arm = 0; arm < arms; arm++) {
            const offset = arm * 2 * Math.PI / arms;
            ctx.beginPath();
            for (let r = 20; r < maxRadius; r += 3) {
                const angle = r / 35 + offset + time * 0.02;
                const x = r * Math.cos(angle);
                const y = r * 0.3 * Math.sin(angle);
                if (r === 20) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(180, 200, 255, 0.12)';
            ctx.lineWidth = 25;
            ctx.stroke();
            ctx.beginPath();
            for (let r = 25; r < maxRadius-10; r += 2) {
                const angle = r / 32 + offset + time * 0.02;
                const x = r * Math.cos(angle);
                const y = r * 0.28 * Math.sin(angle);
                if (r === 25) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(220, 230, 255, 0.2)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        const starCount = 200;
        for (let i = 0; i < starCount; i++) {
            const r = 30 + Math.random() * 170;
            const angle = r / 30 + (Math.floor(Math.random() * arms) * 2 * Math.PI / arms) + time * 0.02 + (Math.random()*0.5-0.25);
            const x = r * Math.cos(angle);
            const y = r * 0.3 * Math.sin(angle);
            const size = 0.5 + Math.random() * 2;
            const bright = 0.3 + 0.7 * (Math.sin(time * 2 + r + i) * 0.5 + 0.5);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 255, ${bright * 0.6})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(200, 220, 255, 0.3)';
            ctx.fill();
        }
        for (let i = 0; i < 30; i++) {
            const r = 50 + Math.random() * 150;
            const angle = r / 28 + (Math.floor(Math.random() * arms) * 2 * Math.PI / arms) + time * 0.018;
            const x = r * Math.cos(angle);
            const y = r * 0.3 * Math.sin(angle);
            const size = 2 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 240, 200, ${0.4 + Math.random()*0.3})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(255, 200, 150, 0.5)';
            ctx.fill();
        }
        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 星云背景
        ctx.save();
        const gradient = ctx.createRadialGradient(width*0.7, height*0.2, 10, width*0.7, height*0.2, 400);
        gradient.addColorStop(0, 'rgba(180, 70, 200, 0.08)');
        gradient.addColorStop(0.5, 'rgba(70, 130, 200, 0.05)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        const gradient2 = ctx.createRadialGradient(width*0.2, height*0.8, 10, width*0.2, height*0.8, 350);
        gradient2.addColorStop(0, 'rgba(255, 100, 80, 0.06)');
        gradient2.addColorStop(0.5, 'rgba(200, 150, 50, 0.04)');
        gradient2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // 银河
        galaxyAngle += 0.002;
        const gx = width * 0.6;
        const gy = height * 0.4;
        drawGalaxy(gx, gy, Date.now() / 1000);

        // 流星
        meteorTimer++;
        if (meteorTimer % METEOR_INTERVAL === 0 && Math.random() < 0.7) spawnMeteor();
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;
            if (m.life <= 0 || m.x > width || m.y > height) { meteors.splice(i, 1); continue; }
            ctx.save();
            const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 5, m.y - m.vy * 5);
            grad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
            grad.addColorStop(0.3, `rgba(255, 220, 180, ${m.life * 0.8})`);
            grad.addColorStop(1, `rgba(255, 150, 100, 0)`);
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * 5, m.y - m.vy * 5);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2 + m.life * 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(255,200,150,${m.life*0.5})`;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(m.x, m.y, 2 + m.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${m.life})`;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fff';
            ctx.fill();
            ctx.restore();
        }

        // 粒子流
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const x = (Math.sin(Date.now() / 10000 + i * 2.3) * 0.5 + 0.5) * width;
            const y = (Math.cos(Date.now() / 12000 + i * 1.7) * 0.5 + 0.5) * height;
            const size = 1 + Math.sin(Date.now() / 3000 + i) * 0.5;
            const alpha = 0.1 + 0.2 * (Math.sin(Date.now() / 4000 + i * 1.3) * 0.5 + 0.5);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(100, 150, 255, ${alpha*0.5})`;
            ctx.fill();
        }
        ctx.restore();

        cosmicAnimId = requestAnimationFrame(draw);
    }
    draw();
}

// ---------- 第三部分：匹配逻辑 ----------
// DOM 引用
const myCycleDisplay = document.getElementById('myCycleDisplay');
const startBtn = document.getElementById('startMatchBtn');
const matchIdle = document.getElementById('matchIdle');
const matchWaiting = document.getElementById('matchWaiting');
const matchSuccess = document.getElementById('matchSuccess');
const matchError = document.getElementById('matchError');
const waitingCountSpan = document.getElementById('waitingCount');
const cancelBtn = document.getElementById('cancelMatchBtn');
const retryBtn = document.getElementById('retryMatchBtn');
const rematchBtn = document.getElementById('rematchBtn');
const chatBtn = document.getElementById('chatNowBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const backToHomeErrorBtn = document.getElementById('backToHomeErrorBtn');

const partnerName = document.getElementById('partnerName');
const partnerLocation = document.getElementById('partnerLocation');
const partnerCycle = document.getElementById('partnerCycle');

const starCanvas = document.getElementById('binaryStarCanvas');
const starCtx = starCanvas.getContext('2d');

// 状态
let isMatching = false;
let matchTimer = null;
let starAnimationId = null;
let currentPartner = null;

// Token 工具
const TOKEN_KEY = 'love_cycle_token';
function getToken() { return localStorage.getItem(TOKEN_KEY); }

// UI 重置
function resetUI() {
    matchIdle.style.display = 'block';
    matchWaiting.style.display = 'none';
    matchSuccess.style.display = 'none';
    matchError.style.display = 'none';
    if (starAnimationId) {
        cancelAnimationFrame(starAnimationId);
        starAnimationId = null;
    }
    isMatching = false;
    clearTimeout(matchTimer);
}

// 开始匹配
async function startMatch() {
    if (isMatching) return;
    const token = getToken();
    if (!token) {
        alert('请先登录');
        return;
    }

    resetUI();
    matchIdle.style.display = 'none';
    matchWaiting.style.display = 'block';
    isMatching = true;

    // 模拟匹配（开发用，实际替换为 API 调用）
    let count = 0;
    matchTimer = setInterval(() => {
        count++;
        waitingCountSpan.textContent = Math.floor(Math.random() * 20);
        if (count > 5 + Math.floor(Math.random() * 3)) {
            clearInterval(matchTimer);
            const partner = {
                nickname: ['星尘', '月影', '流光', '幻夜', '风灵', '云曦'][Math.floor(Math.random()*6)],
                location: ['M78星云', '仙女座', '猎户座', '天狼星', '织女星', '开普勒-452b'][Math.floor(Math.random()*6)],
                cycleNumber: Math.floor(Math.random()*999)+1
            };
            handleMatchSuccess(partner);
        }
    }, 1000);
}

// 取消匹配
function cancelMatch() {
    if (matchTimer) clearInterval(matchTimer);
    isMatching = false;
    resetUI();
    matchIdle.style.display = 'block';
}

// 匹配成功
function handleMatchSuccess(partner) {
    isMatching = false;
    clearInterval(matchTimer);
    matchWaiting.style.display = 'none';
    matchSuccess.style.display = 'block';

    currentPartner = partner;
    partnerName.textContent = partner.nickname || '匿名觉醒者';
    partnerLocation.textContent = partner.location || '未知坐标';
    partnerCycle.textContent = `#${partner.cycleNumber || '???'}`;

    drawBinaryStars(partner);
}

// 双星动画（Canvas）
function drawBinaryStars(partner) {
    const canvas = starCanvas;
    const ctx = starCtx;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    let angle = 0;

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // 背景星云
        const grd = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius*1.5);
        grd.addColorStop(0, 'rgba(100, 50, 200, 0.1)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);

        const star1X = centerX + Math.cos(angle) * radius;
        const star1Y = centerY + Math.sin(angle) * radius;
        const star2X = centerX + Math.cos(angle + Math.PI) * radius;
        const star2Y = centerY + Math.sin(angle + Math.PI) * radius;

        // 星1（自己）
        ctx.beginPath();
        ctx.arc(star1X, star1Y, 20, 0, Math.PI*2);
        const grad1 = ctx.createRadialGradient(star1X-5, star1Y-5, 5, star1X, star1Y, 25);
        grad1.addColorStop(0, '#ff6b81');
        grad1.addColorStop(1, '#cc0000');
        ctx.fillStyle = grad1;
        ctx.shadowColor = 'rgba(255, 100, 100, 0.8)';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('我', star1X, star1Y);

        // 星2（对方）
        ctx.beginPath();
        ctx.arc(star2X, star2Y, 20, 0, Math.PI*2);
        const grad2 = ctx.createRadialGradient(star2X-5, star2Y-5, 5, star2X, star2Y, 25);
        grad2.addColorStop(0, '#87ceeb');
        grad2.addColorStop(1, '#1e90ff');
        ctx.fillStyle = grad2;
        ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.fillText('她/他', star2X, star2Y);

        // 连接线
        ctx.beginPath();
        ctx.moveTo(star1X, star1Y);
        ctx.lineTo(star2X, star2Y);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5,5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 粒子环绕
        for (let i = 0; i < 20; i++) {
            const a = angle * 2 + i * Math.PI/10;
            const r = radius * 0.6 + Math.sin(angle*3 + i) * 10;
            const px = centerX + Math.cos(a) * r;
            const py = centerY + Math.sin(a) * r;
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.sin(angle*5 + i)*1, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.sin(angle*2 + i)*0.2})`;
            ctx.fill();
        }

        angle += 0.01;
        starAnimationId = requestAnimationFrame(animate);
    }
    animate();
}

// 进入聊天（预留）
function enterChat() {
    if (!currentPartner) return;
    alert(`即将与 ${currentPartner.nickname} 开始跨时空对话！\n（聊天功能开发中...）`);
}

// 返回首页
window.goBackHome = function() {
    window.location.href = 'index.html';
};

// ---------- 第四部分：初始化 ----------
document.addEventListener('DOMContentLoaded', function() {
    // 1. 防调试初始化
    键盘防护.init();
    反调试.start();
    setupDebugUnlock();

    // 2. 背景初始化
    创建星星();
    initCosmicEffects();

    // 3. 检查登录状态
    const token = getToken();
    const userCount = localStorage.getItem('love_cycle_userCount');
    if (!token) {
        alert('请先登录再访问匹配页面');
        window.location.href = 'index.html';
        return;
    }
    if (userCount) {
        myCycleDisplay.textContent = `#${userCount}`;
    }

    // 4. 绑定匹配事件
    startBtn.addEventListener('click', startMatch);
    cancelBtn.addEventListener('click', cancelMatch);
    retryBtn.addEventListener('click', () => { matchError.style.display = 'none'; startMatch(); });
    rematchBtn.addEventListener('click', () => { resetUI(); startMatch(); });
    chatBtn.addEventListener('click', enterChat);
    backToHomeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    backToHomeErrorBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
});

// 页面卸载时清理动画
window.addEventListener('beforeunload', () => {
    if (starAnimationId) cancelAnimationFrame(starAnimationId);
    clearInterval(matchTimer);
});