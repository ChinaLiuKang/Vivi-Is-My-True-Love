// ========== 全局变量 ==========
let contentUnlocked = false;
let securityLocked = false;
let unlockAttempts = 0;
let securityViolations = 0;
const MAX_ATTEMPTS = 5;
const MAX_VIOLATIONS = 3;
let debugUnlocked = false;
// ========== Token 管理 ==========
const TOKEN_KEY = 'love_cycle_token';
const USER_COUNT_KEY = 'love_cycle_userCount';
// 请求地址
//const httpUrl = 'https://truelove.dongdongxunji.com'
const httpUrl = 'http://127.0.0.1:9898'
// 存储 token 和 userCount
function saveAuth(token, userCount) {
	if (token) localStorage.setItem(TOKEN_KEY, token);
	if (userCount !== undefined) localStorage.setItem(USER_COUNT_KEY, userCount);
}

// 获取 token
function getToken() {
	return localStorage.getItem(TOKEN_KEY);
}

// 清除登录状态（退出时使用）
function clearAuth() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_COUNT_KEY);
}

// 封装 fetch 请求，自动添加 Authorization 头
async function apiRequest(url, options = {}) {
	const token = getToken();
	const headers = {
		'Content-Type': 'application/json',
		...options.headers,
	};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	const response = await fetch(url, {
		...options,
		headers,
	});
	return response;
}
// ========== 指纹识别系统 ==========
// 初始化 FingerprintJS（在页面加载时开始加载）
const fpPromise = FingerprintJS.load();
// 定义异步函数获取 visitorId
async function getVisitorId() {
	try {
		const fp = await fpPromise;
		const result = await fp.get();
		const visitorId = result.visitorId;
		console.log('您的浏览器指纹 (visitorId):', visitorId);
		return visitorId;
	} catch (error) {
		console.error('生成指纹失败:', error);
		return null;
	}
}

// ========== 歌词偏移调整（单位：秒） ==========
const lyricsOffset = -1.0;

// ========== 密码加密系统 ==========
const 密码系统 = {
	片段: {
		a: "祝学友哥",
		b: "与Vivi姐",
		c: "永世幸福"
	},
	加密(text) {
		return text.split('').map(ch => String.fromCharCode(ch.charCodeAt(0) ^ 0x55)).join('');
	},
	解密(enc) {
		return this.加密(enc);
	},
	获取真实密码() {
		return this.片段.a + this.片段.b + this.片段.c;
	}
};

const 加密密码 = 密码系统.加密(密码系统.获取真实密码());

// ========== 键盘防护（可被解锁） ==========
const 键盘防护 = {
	enabled: true,
	禁用组合: [{
			key: 'F12'
		}, {
			ctrl: true,
			key: 's'
		}, {
			ctrl: true,
			key: 'u'
		},
		{
			ctrl: true,
			shift: true,
			key: 'i'
		}, {
			ctrl: true,
			shift: true,
			key: 'j'
		},
		{
			ctrl: true,
			shift: true,
			key: 'c'
		}
	],
	init() {
		this.keydownHandler = (e) => {
			if (!this.enabled) return;
			for (let combo of this.禁用组合) {
				if (combo.key === 'F12' && e.key === 'F12') {
					e.preventDefault();
					this.违规('F12');
					return;
				}
				if (combo.ctrl && e.ctrlKey && combo.key === e.key.toLowerCase()) {
					e.preventDefault();
					this.违规(combo.key);
					return;
				}
				if (combo.ctrl && combo.shift && e.ctrlKey && e.shiftKey && combo.key === e.key.toLowerCase()) {
					e.preventDefault();
					this.违规(combo.key);
					return;
				}
			}
		};
		document.addEventListener('keydown', this.keydownHandler, true);
		document.addEventListener('contextmenu', (e) => {
			if (!this.enabled) return;
			if (e.target.id !== 'passwordInput') e.preventDefault();
		});
	},
	违规(key) {
		securityViolations++;
		document.getElementById('keyboardWatcher').style.display = 'block';
		document.getElementById('keyboardWatcher').textContent = `已拦截: ${key}`;
		setTimeout(() => document.getElementById('keyboardWatcher').style.display = 'none', 2000);
		if (securityViolations >= MAX_VIOLATIONS) this.永久锁定();
	},
	永久锁定() {
		securityLocked = true;
		document.getElementById('protectedScreen').innerHTML = `
            <div class="title">🔒 安全锁定</div>
            <div style="margin:2rem;padding:2rem;background:rgba(255,71,87,0.1);border-radius:20px;">
                <p>多次违规操作，页面已锁定</p>
                <p>请刷新页面重试</p>
            </div>
        `;
	},
	unlock() {
		this.enabled = false;
		document.removeEventListener('keydown', this.keydownHandler, true);
		document.removeEventListener('contextmenu', (e) => e.preventDefault());
		console.log('🔓 调试已解锁，F12 可用。');
	}
};

// ========== 防调试（可被解锁） ==========
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

// ========== 右上角三连击解锁调试 ==========
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
	document.addEventListener('touchstart', handler, {
		passive: true
	});
}

// ========== 密码检查 ==========
window.checkPassword = function() {
	if (securityLocked) return alert('页面已锁定，请刷新');
	const input = document.getElementById('passwordInput').value.trim();
	const err = document.getElementById('errorMessage');
	if (密码系统.加密(input) === 加密密码) {
		// 获取指纹并发送到后端（示例）
		getVisitorId().then(visitorId => {
			if (visitorId) {
				fetch(httpUrl + '/trueLove/login', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							username: visitorId,
							password: input
						})
					})
					.then(res => res.json())
					.then(data => {
						if (data.code === 0) {
							// 登录成功
							saveAuth(data.token, data.userCount);
							// 显示用户编号
							showUserCount(data.userCount);
							解锁内容();
							console.log('后端登录成功，指纹已绑定');
						}
					})
					.catch(err => console.error('后端登录请求失败:', err));
			}
		});
	} else {
		unlockAttempts++;
		err.style.display = 'block';
		err.textContent = `密码错误 (尝试 ${unlockAttempts}/${MAX_ATTEMPTS})`;
		document.getElementById('passwordInput').style.animation = 'shake 0.4s';
		setTimeout(() => document.getElementById('passwordInput').style.animation = '', 400);
		if (unlockAttempts >= MAX_ATTEMPTS) 键盘防护.永久锁定();
	}
};

window.checkEnter = function(e) {
	if (e.key === 'Enter') checkPassword();
};

function 解锁内容() {
	contentUnlocked = true;
	document.getElementById('protectedScreen').style.display = 'none';
	反调试.stop();
	document.querySelectorAll(
		'.container, .bigbang-trigger, .cycle-counter, .music-player, .chakra-point, .eye-container').forEach(el =>
		el.style.display = 'block');
	document.getElementById('cosmicCanvas').style.display = 'block';
	initCosmicEffects();
	   // ... 原有代码 ...
	    document.querySelectorAll('.container, .bigbang-trigger, .cycle-counter, .music-player, .chakra-point, .eye-container').forEach(el => el.style.display = 'block');
	    // 显示爱心按钮
	    const loveBtn = document.getElementById('loveEntryBtn');
	    if (loveBtn) loveBtn.style.display = 'block';
	显示解锁消息();
	setTimeout(() => {
		const music = document.getElementById('backgroundMusic');
		music.play().then(() => {
			document.getElementById('playPauseBtn').innerHTML = '⏸️';
		}).catch(() => {});
	}, 500);
	
}

function 显示解锁消息() {
	const div = document.createElement('div');
	div.style.cssText =
		'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.95);padding:3rem;border-radius:40px;border:3px solid #2ed573;text-align:center;z-index:10000;box-shadow:0 0 100px #2ed573;animation:fadeInUp 0.5s;';
	div.innerHTML =
		'<h2 style="color:#2ed573;font-size:2.5rem;">🎉 解锁成功！</h2><p style="margin:1rem 0;color:#fff;font-size:1.5rem;">祝学友哥与Vivi姐永世幸福</p><p style="color:#aaa;">轮回之爱系统启动</p>';
	document.body.appendChild(div);
	setTimeout(() => div.remove(), 3000);
}

// ========== 轮回系统 ==========
const 轮回系统 = {
	次数: 0,
	宇宙重启() {
		this.次数++;
		document.getElementById('currentCycle').textContent = this.次数;
		触发大爆炸视觉效果();
		增强瞳术特效();
	}
};

window.triggerBigBang = function() {
	if (!contentUnlocked) return alert('请先解锁内容！');
	轮回系统.宇宙重启();
};

function 触发大爆炸视觉效果() {
	const bang = document.getElementById('bigBang');
	bang.classList.remove('active');
	void bang.offsetWidth;
	bang.classList.add('active');
	触发查克拉波动();
	更新星空();
}

function 增强瞳术特效() {
	document.querySelectorAll('.eye-container').forEach(el => {
		el.style.animation = 'none';
		el.offsetHeight;
		el.style.animation = 'eye-float 6s infinite alternate';
	});
}

// ========== 星空 ==========
function 创建星星() {
	const universe = document.getElementById('universe');
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

function showUserCount(count) {
	const display = document.getElementById('userCountDisplay');
	const numberSpan = document.getElementById('userCountNumber');
	if (display && numberSpan) {
		numberSpan.textContent = count;
		display.style.display = 'block';
	}
}

function 更新星空() {
	创建星星();
}

function 触发查克拉波动() {
	document.querySelectorAll('.chakra-point').forEach(p => {
		p.style.animation = 'none';
		p.offsetHeight;
		p.style.animation = 'chakra-pulse 2s infinite';
	});
}

// ========== 宇宙特效（银河 + 流星 + 星云） ==========
let cosmicAnimId = null;
let meteors = [];
let galaxyAngle = 0;

function initCosmicEffects() {
	const canvas = document.getElementById('cosmicCanvas');
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
			x,
			y,
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
		ctx.ellipse(0, 0, 200, 70, 0, 0, Math.PI * 2);
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
			for (let r = 25; r < maxRadius - 10; r += 2) {
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
			const angle = r / 30 + (Math.floor(Math.random() * arms) * 2 * Math.PI / arms) + time * 0.02 + (Math
				.random() * 0.5 - 0.25);
			const x = r * Math.cos(angle);
			const y = r * 0.3 * Math.sin(angle);
			const size = 0.5 + Math.random() * 2;
			const bright = 0.3 + 0.7 * (Math.sin(time * 2 + r + i) * 0.5 + 0.5);
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
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
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 240, 200, ${0.4 + Math.random()*0.3})`;
			ctx.shadowBlur = 20;
			ctx.shadowColor = 'rgba(255, 200, 150, 0.5)';
			ctx.fill();
		}
		ctx.restore();
	}

	function draw() {
		if (!contentUnlocked) return;
		ctx.clearRect(0, 0, width, height);

		ctx.save();
		const gradient = ctx.createRadialGradient(width * 0.7, height * 0.2, 10, width * 0.7, height * 0.2, 400);
		gradient.addColorStop(0, 'rgba(180, 70, 200, 0.08)');
		gradient.addColorStop(0.5, 'rgba(70, 130, 200, 0.05)');
		gradient.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
		const gradient2 = ctx.createRadialGradient(width * 0.2, height * 0.8, 10, width * 0.2, height * 0.8, 350);
		gradient2.addColorStop(0, 'rgba(255, 100, 80, 0.06)');
		gradient2.addColorStop(0.5, 'rgba(200, 150, 50, 0.04)');
		gradient2.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = gradient2;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();

		galaxyAngle += 0.002;
		const gx = width * 0.6;
		const gy = height * 0.4;
		drawGalaxy(gx, gy, Date.now() / 1000);

		meteorTimer++;
		if (meteorTimer % METEOR_INTERVAL === 0 && Math.random() < 0.7) spawnMeteor();
		for (let i = meteors.length - 1; i >= 0; i--) {
			const m = meteors[i];
			m.x += m.vx;
			m.y += m.vy;
			m.life -= m.decay;
			if (m.life <= 0 || m.x > width || m.y > height) {
				meteors.splice(i, 1);
				continue;
			}
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

// ========== 音乐播放器 ==========
const music = document.getElementById('backgroundMusic');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const progressHandle = document.getElementById('progressHandle');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeControl = document.getElementById('volumeControl');
const volumeValue = document.getElementById('volumeValue');
const lyricsContainer = document.getElementById('lyricsContainer');
const currentLyric = document.getElementById('currentLyric');
const nextLyric = document.getElementById('nextLyric');

// ========== 补全整首歌《克卜勒》的所有歌词 ==========
const lyrics = [
	// 第一段主歌（约 9~51 秒）
	{
		time: 9,
		text: "等不到你 成为我最闪亮的星星"
	},
	{
		time: 16,
		text: "我依然愿意借给你我的光"
	},
	{
		time: 23,
		text: "投射给你 直到你那灿烂的光芒"
	},
	{
		time: 30,
		text: "静静地挂在遥远的天上"
	},
	{
		time: 37,
		text: "当你沉浸 天空那条冰冷的银河"
	},
	{
		time: 44,
		text: "隐没在宇宙深处 我正穿越"
	},
	{
		time: 51,
		text: "茫茫人海 为你点亮 一盏温暖的灯火"
	},
	// 第一段副歌（约 65~86 秒）
	{
		time: 65,
		text: "一闪一闪亮晶晶 好像你的身体"
	},
	{
		time: 72,
		text: "藏在众多孤星之中 还是找得到你"
	},
	{
		time: 79,
		text: "挂在天上放光明 反射我的孤寂"
	},
	{
		time: 86,
		text: "提醒我 我也只是一颗寂寞的星星"
	},
	// 第二段主歌（约 93~135 秒）
	{
		time: 93,
		text: "等不到你 成为我最闪亮的星星"
	},
	{
		time: 100,
		text: "我依然愿意借给你我的光"
	},
	{
		time: 107,
		text: "投射给你 直到你那灿烂的光芒"
	},
	{
		time: 114,
		text: "静静地挂在遥远的天上"
	},
	{
		time: 121,
		text: "当你沉浸 天空那条冰冷的银河"
	},
	{
		time: 128,
		text: "隐没在宇宙深处 我正穿越"
	},
	{
		time: 135,
		text: "茫茫人海 为你点亮 一盏温暖的灯火"
	},
	// 第二段副歌（约 149~170 秒）
	{
		time: 149,
		text: "一闪一闪亮晶晶 好像你的身体"
	},
	{
		time: 156,
		text: "藏在众多孤星之中 还是找得到你"
	},
	{
		time: 163,
		text: "挂在天上放光明 反射我的孤寂"
	},
	{
		time: 170,
		text: "提醒我 我也只是一颗寂寞的星星"
	},
	// 结束语（240秒，接近尾声）
	{
		time: 240,
		text: "🌟 歌曲已终了，轮回之爱永存"
	}
];

let currentLyricIndex = -1;
let lyricsVisible = false;

// ========== 歌词切换函数 ==========
window.toggleLyrics = function(e) {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	if (!contentUnlocked) {
		alert('请先解锁内容');
		return;
	}
	lyricsVisible = !lyricsVisible;
	if (lyricsVisible) {
		lyricsContainer.classList.add('show');
		lyricsContainer.style.animation = 'none';
		void lyricsContainer.offsetWidth;
		lyricsContainer.style.animation = 'fadeInUp 0.4s ease';
		updateLyrics();
	} else {
		lyricsContainer.classList.remove('show');
	}
};

document.getElementById('lyricsCloseBtn').addEventListener('pointerdown', window.toggleLyrics);

const lyricsToggleBtn = document.getElementById('lyricsToggleBtn');
lyricsToggleBtn.addEventListener('pointerdown', window.toggleLyrics);
lyricsToggleBtn.addEventListener('click', function(e) {
	e.preventDefault();
	e.stopPropagation();
});

function updateLyrics() {
	if (!contentUnlocked) return;
	const t = music.currentTime + lyricsOffset;
	let idx = -1;
	for (let i = lyrics.length - 1; i >= 0; i--) {
		if (t >= lyrics[i].time) {
			idx = i;
			break;
		}
	}
	if (idx !== currentLyricIndex) {
		currentLyricIndex = idx;
		if (idx >= 0) {
			currentLyric.textContent = lyrics[idx].text;
			nextLyric.textContent = lyrics[idx + 1]?.text || '';
			currentLyric.style.transform = 'scale(1.2)';
			currentLyric.style.color = '#ff4757';
			setTimeout(() => {
				currentLyric.style.transform = 'scale(1)';
				currentLyric.style.color = '#2ed573';
			}, 300);
		} else {
			currentLyric.textContent = '音乐即将开始...';
			nextLyric.textContent = lyrics[0]?.text || '';
		}
	}
}

function updateProgress() {
	if (!contentUnlocked) return;
	if (music.duration) {
		const p = (music.currentTime / music.duration) * 100;
		progressBar.style.width = p + '%';
		progressHandle.style.left = p + '%';
		currentTimeEl.textContent = formatTime(music.currentTime);
		durationEl.textContent = formatTime(music.duration);
		if (lyricsVisible) updateLyrics();
	}
}

function formatTime(s) {
	const m = Math.floor(s / 60);
	s = Math.floor(s % 60);
	return `${m}:${s < 10 ? '0' + s : s}`;
}

window.playPause = function() {
	if (!contentUnlocked) return alert('请先解锁内容');
	if (music.paused) {
		music.play().then(() => playPauseBtn.innerHTML = '⏸️');
	} else {
		music.pause();
		playPauseBtn.innerHTML = '▶️';
	}
};
window.skipForward = () => {
	if (contentUnlocked) music.currentTime = Math.min(music.duration, music.currentTime + 15);
};
window.skipBackward = () => {
	if (contentUnlocked) music.currentTime = Math.max(0, music.currentTime - 15);
};

progressContainer.addEventListener('click', (e) => {
	if (!contentUnlocked) return;
	const rect = progressContainer.getBoundingClientRect();
	music.currentTime = ((e.clientX - rect.left) / rect.width) * music.duration;
});

volumeControl.addEventListener('input', () => {
	music.volume = volumeControl.value;
	volumeValue.textContent = Math.round(volumeControl.value * 100) + '%';
});

// ========== 播放器拖拽（通用） ==========
let isDragging = false;
let offset = {
	x: 0,
	y: 0
};
const player = document.getElementById('musicPlayer');
const dragHandle = document.getElementById('dragHandle');

function getPointerPos(e) {
	if (e.touches && e.touches.length > 0) {
		return {
			clientX: e.touches[0].clientX,
			clientY: e.touches[0].clientY
		};
	}
	return {
		clientX: e.clientX,
		clientY: e.clientY
	};
}

function startDrag(e) {
	if (!contentUnlocked) return;
	if (e.target.closest('button')) return;
	if (e.type === 'touchstart') e.preventDefault();
	isDragging = true;
	player.classList.add('dragging');
	const rect = player.getBoundingClientRect();
	player.style.width = rect.width + 'px';
	player.style.height = rect.height + 'px';
	const pos = getPointerPos(e);
	offset.x = pos.clientX - rect.left;
	offset.y = pos.clientY - rect.top;
	if (!player.style.left || player.style.left === '') {
		player.style.left = rect.left + 'px';
		player.style.top = rect.top + 'px';
		player.style.transform = 'none';
	}
}

function moveDrag(e) {
	if (!isDragging || !contentUnlocked) return;
	e.preventDefault();
	const pos = getPointerPos(e);
	let x = pos.clientX - offset.x;
	let y = pos.clientY - offset.y;
	const maxX = window.innerWidth - player.offsetWidth;
	const maxY = window.innerHeight - player.offsetHeight;
	x = Math.max(0, Math.min(x, maxX));
	y = Math.max(0, Math.min(y, maxY));
	player.style.left = x + 'px';
	player.style.top = y + 'px';
	player.style.transform = 'none';
}

function endDrag() {
	if (isDragging) {
		isDragging = false;
		player.classList.remove('dragging');
	}
}

dragHandle.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);
dragHandle.addEventListener('touchstart', startDrag, {
	passive: false
});
document.addEventListener('touchmove', moveDrag, {
	passive: false
});
document.addEventListener('touchend', endDrag);
document.addEventListener('touchcancel', endDrag);
// 跳转到匹配页面
window.goToMatch = function() {
    const token = getToken();
    if (!token) {
        alert('请先登录再进行羁绊测试');
        return;
    }
    window.location.href = 'match.html';
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
	创建星星();
	键盘防护.init();
	反调试.start();
	setupDebugUnlock();

	// 检查是否有已保存的 token
	const token = getToken();
	const userCount = localStorage.getItem(USER_COUNT_KEY);
	if (token) {
		// 免密登录成功，直接解锁
		解锁内容();
		if (userCount) showUserCount(userCount);
		// 可选：验证 token 有效性（调用 /api/verify 等）
	} else {
		 document.getElementById('protectedScreen').style.display = 'block';
		// 没有 token，显示密码界面（默认显示）
		// 如果你的密码框默认是显示的，则无需额外操作
	}

	music.addEventListener('timeupdate', updateProgress);
	music.addEventListener('loadedmetadata', () => durationEl.textContent = formatTime(music.duration));
	music.addEventListener('ended', () => playPauseBtn.innerHTML = '▶️');
	music.volume = volumeControl.value;
	// 在 DOMContentLoaded 或脚本末尾
	const goToMatchBtn = document.getElementById('goToMatchBtn');
	if (goToMatchBtn) {
		goToMatchBtn.addEventListener('click', () => {
			// 检查是否已登录（是否有 token）
			const token = localStorage.getItem('love_cycle_token');
			if (!token) {
				alert('请先登录再进行羁绊测试');
				return;
			}
			window.location.href = 'match.html';
		});
	}
	setInterval(() => {
		if (contentUnlocked && Math.random() < 0.1) 轮回系统.宇宙重启();
	}, 27000);
});