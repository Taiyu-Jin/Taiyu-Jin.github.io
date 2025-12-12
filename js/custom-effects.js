/**
 * 博客自定义效果 - 现代化科技感增强 (PJAX适配版)
 * 包含：鼠标追踪光点、平滑滚动、代码块增强、粒子背景、赛博风格覆盖层、持久化音乐播放器
 */

(function() {
    'use strict';

    // 工具函数
    const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isKeepThemePresent = () => typeof window.KEEP === 'object' && window.KEEP && window.KEEP.theme_config;
    const rafThrottle = (fn) => {
        let locked = false;
        return (...args) => {
            if (locked) return;
            locked = true;
            requestAnimationFrame(() => {
                fn(...args);
                locked = false;
            });
        };
    };

    // ========================================
    // 1. 全局效果 (只初始化一次)
    // ========================================
    const initGlobalEffects = () => {
        initCyberOverlay();
        initCursorTrail();
        initMusicPlayer(); // 音乐播放器 (全局单例)
        initBackgroundMusic();
        initPageLoadAnimation();
        initDarkModeDetection();
        injectAnimations();
    };

    // ========================================
    // 2. 页面效果 (PJAX 重新初始化)
    // ========================================
    const initPageEffects = () => {
        initSmoothScroll();
        if (!isKeepThemePresent()) {
            initCodeBlockEnhance();
            initImageEffects();
            initTocHighlight();
            initCodeBlockLabels();
        }
        if (!prefersReducedMotion()) {
            initAnimatedTitle();
            initClickRipple();
        }
        initReadingProgress();
        initPageVisibility();
        initReadingTime();
        initSmoothScrollToTop();
    };

    // ========================================
    // 3. 具体功能实现
    // ========================================

    // --- 赛博网格 ---
    const initCyberOverlay = () => {
        if (prefersReducedMotion() || document.getElementById('cyber-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'cyber-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.1;mix-blend-mode:screen;';
        document.body.appendChild(overlay);
    };

    // --- 鼠标追踪 ---
    const initCursorTrail = () => {
        if (prefersReducedMotion() || isCoarsePointer() || document.getElementById('cursor-canvas')) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'cursor-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'lighter';
        const particles = [];
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        window.addEventListener('resize', rafThrottle(resize));
        resize();
        class Particle {
            constructor(x, y) {
                this.x = x; this.y = y;
                this.size = Math.random() * 3 + 2;
                this.speedX = (Math.random() - 0.5) * 2;
                this.speedY = (Math.random() - 0.5) * 2;
                this.opacity = 1;
            }
            update() { this.x += this.speedX; this.y += this.speedY; this.opacity -= 0.02; this.speedY += 0.1; }
            draw(c) {
                c.save(); c.globalAlpha = this.opacity; c.fillStyle = 'rgba(0, 206, 209, 0.6)';
                c.beginPath(); c.arc(this.x, this.y, this.size, 0, Math.PI*2); c.fill(); c.restore();
            }
        }
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width/(window.devicePixelRatio||1), canvas.height/(window.devicePixelRatio||1));
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update(); particles[i].draw(ctx);
                if (particles[i].opacity <= 0) particles.splice(i, 1);
            }
            requestAnimationFrame(loop);
        };
        loop();
        document.addEventListener('mousemove', rafThrottle(e => {
            if (particles.length < 8) particles.push(new Particle(e.clientX, e.clientY));
        }), {passive: true});
    };

    // --- 音乐播放器 (顶部栏嵌入式) ---
    const initMusicPlayer = () => {
        // 1. Audio Element (Singleton)
        let audio = document.getElementById('terry-bgm');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'terry-bgm';
            audio.preload = 'auto';
            document.body.appendChild(audio);
        }

        // 2. State
        let playlist = [
            { title: 'SoundHelix #1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { title: 'SoundHelix #2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
        ];
        const defaultPlaylist = [...playlist];
        let currentIndex = 0;

        // 3. UI Builder
        const createPlayerHTML = (isMobile) => {
            return `
                <div class="music-player-content">
                    <div class="music-controls">
                        <button class="music-btn prev-btn" title="上一首">⏮</button>
                        <button class="music-btn play-btn" title="播放/暂停">▶</button>
                        <button class="music-btn next-btn" title="下一首">⏭</button>
                    </div>
                    <div class="music-info-bar" title="点击展开列表">Loading...</div>
                    ${!isMobile ? '<div class="music-time">00:00</div>' : ''}
                    <div class="music-playlist-dropdown">
                        <div class="playlist-header">
                            <span>播放列表</span>
                            <button class="add-music-btn-mini" title="添加音乐">+</button>
                        </div>
                        <div class="playlist-items"></div>
                    </div>
                </div>
            `;
        };

        // 4. Bind Events
        const bindEvents = (container) => {
            const playBtn = container.querySelector('.play-btn');
            const prevBtn = container.querySelector('.prev-btn');
            const nextBtn = container.querySelector('.next-btn');
            const infoBar = container.querySelector('.music-info-bar');
            const dropdown = container.querySelector('.music-playlist-dropdown');
            const listEl = container.querySelector('.playlist-items');
            const addBtn = container.querySelector('.add-music-btn-mini');

            playBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };
            prevBtn.onclick = (e) => { e.stopPropagation(); playPrev(); };
            nextBtn.onclick = (e) => { e.stopPropagation(); playNext(); };
            
            infoBar.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.music-playlist-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
                renderPlaylist(listEl);
            };
            
            addBtn.onclick = (e) => {
                e.stopPropagation();
                const url = prompt('音乐URL:');
                if (url) {
                    const title = prompt('标题:') || 'Unknown';
                    playlist.push({ title, artist: 'User', url });
                    localStorage.setItem('terry_user_playlist', JSON.stringify(playlist.slice(defaultPlaylist.length)));
                    renderAllPlaylists();
                }
            };
        };

        // 5. Core Logic
        const togglePlay = () => { if (audio.paused) audio.play(); else audio.pause(); updateAllUI(); };
        const playPrev = () => { currentIndex = (currentIndex - 1 + playlist.length) % playlist.length; loadTrack(); audio.play(); };
        const playNext = () => { currentIndex = (currentIndex + 1) % playlist.length; loadTrack(); audio.play(); };
        
        const loadTrack = () => {
            const track = playlist[currentIndex];
            if (!track) return;
            if (audio.src !== track.url) audio.src = track.url;
            updateAllUI();
            saveState();
        };

        const updateAllUI = () => {
            const track = playlist[currentIndex];
            const isPaused = audio.paused;
            document.querySelectorAll('.music-player-content').forEach(el => {
                el.querySelector('.music-info-bar').textContent = `${track.title}`;
                el.querySelector('.play-btn').textContent = isPaused ? '▶' : '⏸';
                const timeEl = el.querySelector('.music-time');
                if (timeEl) {
                    const fmt = t => {
                        const m = Math.floor(t/60).toString().padStart(2,'0');
                        const s = Math.floor(t%60).toString().padStart(2,'0');
                        return `${m}:${s}`;
                    };
                    timeEl.textContent = fmt(audio.currentTime);
                }
            });
        };

        const renderPlaylist = (container) => {
            container.innerHTML = '';
            playlist.forEach((track, i) => {
                const item = document.createElement('div');
                item.className = `playlist-item ${i === currentIndex ? 'active' : ''}`;
                item.innerHTML = `<span>${track.title}</span>`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    currentIndex = i;
                    loadTrack();
                    audio.play();
                };
                container.appendChild(item);
            });
        };

        const renderAllPlaylists = () => {
            document.querySelectorAll('.playlist-items').forEach(el => {
                if (el.closest('.music-playlist-dropdown').classList.contains('show')) {
                    renderPlaylist(el);
                }
            });
        };

        const saveState = rafThrottle(() => {
            localStorage.setItem('terry_music_state', JSON.stringify({
                index: currentIndex,
                time: audio.currentTime,
                paused: audio.paused,
                volume: audio.volume
            }));
        });

        // 6. Injection
        // Clean up old instances first (to prevent duplicates)
        document.querySelectorAll('.music-player-pc, .music-player-mobile').forEach(el => el.remove());

        // PC
        const menuList = document.querySelector('.header-wrapper .menu-list');
        if (menuList) {
            const li = document.createElement('li');
            li.className = 'menu-item music-player-pc';
            li.innerHTML = createPlayerHTML(false);
            bindEvents(li);
            menuList.insertBefore(li, menuList.lastElementChild);
        }

        // Mobile
        const mobileHeader = document.querySelector('.header-wrapper .right .mobile');
        if (mobileHeader) {
            const div = document.createElement('div');
            div.className = 'music-player-mobile';
            div.innerHTML = createPlayerHTML(true);
            bindEvents(div);
            mobileHeader.insertBefore(div, mobileHeader.firstElementChild);
        }

        // 7. Global Listeners
        audio.ontimeupdate = () => { updateAllUI(); saveState(); };
        audio.onended = playNext;
        audio.onplay = updateAllUI;
        audio.onpause = updateAllUI;
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.music-player-content')) {
                document.querySelectorAll('.music-playlist-dropdown').forEach(d => d.classList.remove('show'));
            }
        });

        // Init Load
        (async () => {
            try {
                const res = await fetch('/music/playlist.json');
                if (res.ok) {
                    const ext = await res.json();
                    if (Array.isArray(ext)) playlist = ext;
                }
            } catch(e) {}
            try {
                const user = JSON.parse(localStorage.getItem('terry_user_playlist'));
                if (Array.isArray(user)) playlist = playlist.concat(user);
            } catch(e) {}
            try {
                const state = JSON.parse(localStorage.getItem('terry_music_state'));
                if (state) {
                    currentIndex = state.index || 0;
                    audio.volume = state.volume || 1;
                    loadTrack();
                    audio.currentTime = state.time || 0;
                    if (!state.paused) audio.play().catch(() => {});
                } else {
                    loadTrack();
                }
            } catch(e) { loadTrack(); }
        })();
    };

    // --- 样式注入 ---
    const injectAnimations = () => {
        if (document.getElementById('terry-custom-css')) return;
        const style = document.createElement('style');
        style.id = 'terry-custom-css';
        style.textContent = `
            :root { --tech-cyan: #00CED1; }
            @keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            @keyframes cyberGridMove { from { background-position: 0 0; } to { background-position: 240px 240px; } }
            
            #cyber-overlay {
                background-image: linear-gradient(to right, rgba(0,206,209,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,206,209,0.1) 1px, transparent 1px);
                background-size: 48px 48px;
                animation: cyberGridMove 20s linear infinite;
            }

            /* 顶部音乐播放器样式 (嵌入式) */
            .music-player-pc {
                display: flex;
                align-items: center;
                margin: 0 5px;
                height: 100%;
            }
            .music-player-content {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 2px 10px;
                height: 32px;
                gap: 8px;
                color: var(--default-text-color);
                font-size: 12px;
                transition: all 0.3s;
                position: relative;
            }
            .music-player-content:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: var(--primary-color);
            }
            .music-controls { display: flex; gap: 5px; }
            .music-btn {
                background: none; border: none; color: inherit; cursor: pointer;
                font-size: 12px; padding: 0 2px; opacity: 0.8; transition: opacity 0.2s;
                display: flex; align-items: center;
            }
            .music-btn:hover { opacity: 1; color: var(--primary-color); }
            .music-info-bar {
                max-width: 100px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
                font-size: 12px; text-align: center;
                cursor: pointer;
            }
            .music-time { font-size: 10px; opacity: 0.8; min-width: 30px; text-align: center; }
            
            /* 移动端样式 */
            .music-player-mobile {
                display: flex;
                align-items: center;
                margin-right: 8px;
            }
            .music-player-mobile .music-player-content {
                padding: 2px 6px;
                height: 28px;
            }
            .music-player-mobile .music-info-bar {
                max-width: 60px;
            }

            /* 强制显隐控制 (避免双重显示) */
            @media (max-width: 800px) {
                .music-player-pc { display: none !important; }
                .music-player-mobile { display: flex !important; }
            }
            @media (min-width: 801px) {
                .music-player-pc { display: flex !important; }
                .music-player-mobile { display: none !important; }
            }
            
            /* 播放列表下拉框 */
            .music-playlist-dropdown {
                position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
                width: 200px; max-height: 300px;
                background: var(--background-color);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                display: none; flex-direction: column;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                z-index: 2001;
                margin-top: 10px;
            }
            .music-playlist-dropdown.show { display: flex; }
            .playlist-header {
                padding: 8px 12px; border-bottom: 1px solid var(--border-color);
                display: flex; justify-content: space-between; align-items: center; font-size: 12px;
            }
            .playlist-items { overflow-y: auto; padding: 5px 0; }
            .playlist-item {
                padding: 6px 12px; cursor: pointer; font-size: 12px; display: flex; justify-content: space-between;
                opacity: 0.7; transition: all 0.2s;
            }
            .playlist-item:hover, .playlist-item.active { opacity: 1; color: var(--primary-color); background: rgba(0,0,0,0.05); }
            
            /* 适配深色模式 */
            [data-theme="dark"] .music-player-content {
                background: rgba(0, 0, 0, 0.2);
                border-color: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    };

    // --- 其他辅助函数 ---
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.onclick = e => {
                const t = document.querySelector(a.getAttribute('href'));
                if (t) { e.preventDefault(); t.scrollIntoView({behavior:'smooth'}); }
            };
        });
    };
    const initCodeBlockEnhance = () => {
        document.querySelectorAll('pre').forEach(pre => {
            if (pre.querySelector('.copy-code-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn'; btn.textContent = '复制';
            btn.style.cssText = 'position:absolute;top:5px;right:5px;font-size:12px;padding:2px 6px;cursor:pointer;';
            btn.onclick = () => {
                navigator.clipboard.writeText(pre.querySelector('code').innerText).then(() => {
                    btn.textContent = '已复制'; setTimeout(() => btn.textContent = '复制', 2000);
                });
            };
            pre.style.position = 'relative'; pre.appendChild(btn);
        });
    };
    const initImageEffects = () => {}; 
    const initAnimatedTitle = () => {};
    const initReadingProgress = () => {
        let bar = document.getElementById('reading-progress');
        if (!bar) {
            bar = document.createElement('div'); bar.id = 'reading-progress';
            bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:#00CED1;z-index:10000;width:0;transition:width 0.1s;';
            document.body.appendChild(bar);
        }
        window.addEventListener('scroll', rafThrottle(() => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            if (h > 0) bar.style.width = (window.scrollY / h * 100) + '%';
        }));
    };
    const initTocHighlight = () => {};
    const initClickRipple = () => {};
    const initPageVisibility = () => {};
    const initReadingTime = () => {};
    const initCodeBlockLabels = () => {};
    const initSmoothScrollToTop = () => {};
    const initBackgroundMusic = () => {};
    const initPageLoadAnimation = () => {};
    const initDarkModeDetection = () => {};

    // 启动
    const start = () => { initGlobalEffects(); initPageEffects(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    document.addEventListener('pjax:complete', initPageEffects);

})();
