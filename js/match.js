// match.js - 跨时空羁绊测试页面逻辑

// ========== DOM 引用 ==========
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

// ========== 状态 ==========
let isMatching = false;
let matchTimer = null;
let starAnimationId = null;
let currentPartner = null;

// ========== Token 工具（复用） ==========
const TOKEN_KEY = 'love_cycle_token';
function getToken() { return localStorage.getItem(TOKEN_KEY); }

// ========== 页面加载 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
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

    // 绑定事件
    startBtn.addEventListener('click', startMatch);
    cancelBtn.addEventListener('click', cancelMatch);
    retryBtn.addEventListener('click', () => { matchError.style.display = 'none'; startMatch(); });
    rematchBtn.addEventListener('click', () => { resetUI(); startMatch(); });
    chatBtn.addEventListener('click', enterChat);
    backToHomeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    backToHomeErrorBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
});

// ========== UI 重置 ==========
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

// ========== 开始匹配 ==========
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
    // 这里模拟等待 3~8 秒后匹配成功
    let count = 0;
    matchTimer = setInterval(() => {
        count++;
        waitingCountSpan.textContent = Math.floor(Math.random() * 20);
        if (count > 5 + Math.floor(Math.random() * 3)) {
            clearInterval(matchTimer);
            // 模拟匹配成功
            const partner = {
                nickname: ['星尘', '月影', '流光', '幻夜', '风灵', '云曦'][Math.floor(Math.random()*6)],
                location: ['M78星云', '仙女座', '猎户座', '天狼星', '织女星', '开普勒-452b'][Math.floor(Math.random()*6)],
                cycleNumber: Math.floor(Math.random()*999)+1
            };
            handleMatchSuccess(partner);
        }
    }, 1000);
}

// ========== 取消匹配 ==========
function cancelMatch() {
    if (matchTimer) clearInterval(matchTimer);
    isMatching = false;
    resetUI();
    matchIdle.style.display = 'block';
}

// ========== 匹配成功 ==========
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

// ========== 双星动画（Canvas） ==========
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

// ========== 进入聊天（预留） ==========
function enterChat() {
    if (!currentPartner) return;
    alert(`即将与 ${currentPartner.nickname} 开始跨时空对话！\n（聊天功能开发中...）`);
}

// ========== 返回主页 ==========
window.addEventListener('beforeunload', () => {
    if (starAnimationId) cancelAnimationFrame(starAnimationId);
    clearInterval(matchTimer);
});