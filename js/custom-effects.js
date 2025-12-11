/**
 * 博客自定义效果 - 现代化科技感增强
 * 包含：鼠标追踪光点、平滑滚动、代码块增强、粒子背景等效果
 */

(function() {
    'use strict';

    // ========================================
    // 1. 鼠标追踪光点效果 (Cursor Trail)
    // ========================================
    const initCursorTrail = () => {
        const particles = [];
        const particleCount = 8;
        
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 3 + 2;
                this.speedX = (Math.random() - 0.5) * 2;
                this.speedY = (Math.random() - 0.5) * 2;
                this.opacity = 1;
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= 0.02;
                this.speedY += 0.1;
            }
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = 'rgba(0, 206, 209, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        
        window.addEventListener('resize', resizeCanvas);
        
        let animationId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw(ctx);
                if (particles[i].opacity <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            animationId = requestAnimationFrame(animate);
        };
        animate();
        
        document.addEventListener('mousemove', (e) => {
            if (particles.length < particleCount) {
                particles.push(new Particle(e.clientX, e.clientY));
            }
        });
    };

    // ========================================
    // 2. 平滑滚动效果 (Smooth Scroll)
    // ========================================
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };

    // ========================================
    // 3. 代码块复制功能增强
    // ========================================
    const initCodeBlockEnhance = () => {
        document.querySelectorAll('pre').forEach(preElement => {
            const codeBlock = preElement.querySelector('code');
            if (!codeBlock) return;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.textContent = '复制';
            copyBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 6px 12px;
                background: rgba(0, 206, 209, 0.8);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
                z-index: 10;
            `;
            
            copyBtn.onmouseover = () => {
                copyBtn.style.background = 'rgba(0, 206, 209, 1)';
                copyBtn.style.transform = 'translateY(-2px)';
            };
            copyBtn.onmouseout = () => {
                copyBtn.style.background = 'rgba(0, 206, 209, 0.8)';
                copyBtn.style.transform = 'translateY(0)';
            };
            
            copyBtn.addEventListener('click', () => {
                const text = codeBlock.innerText || codeBlock.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = '已复制!';
                    setTimeout(() => {
                        copyBtn.textContent = '复制';
                    }, 2000);
                });
            });
            
            preElement.style.position = 'relative';
            preElement.appendChild(copyBtn);
        });
    };

    // ========================================
    // 4. 图片懒加载与悬停效果
    // ========================================
    const initImageEffects = () => {
        const images = document.querySelectorAll('img');
        
        // 添加懒加载
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            img.style.transition = 'all 0.3s ease';
            img.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.05)';
                this.style.filter = 'brightness(1.1)';
            });
            img.addEventListener('mouseout', function() {
                this.style.transform = 'scale(1)';
                this.style.filter = 'brightness(1)';
            });
            imageObserver.observe(img);
        });
    };

    // ========================================
    // 5. 动画标题效果
    // ========================================
    const initAnimatedTitle = () => {
        const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        titles.forEach(title => {
            // 只对没有子元素的标题应用动画（纯文本）
            if (title.children.length > 0) return;
            
            title.style.cssText = `
                position: relative;
                overflow: hidden;
                letter-spacing: 1px;
            `;
            
            const text = title.textContent;
            title.innerHTML = '';
            
            Array.from(text).forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.cssText = `
                    display: inline-block;
                    animation: slideInUp 0.5s ease forwards;
                    animation-delay: ${index * 50}ms;
                `;
                title.appendChild(span);
            });
        });
    };

    // ========================================
    // 6. 加入CSS动画
    // ========================================
    const injectAnimations = () => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
            }
            
            @keyframes glow {
                0%, 100% {
                    text-shadow: 0 0 5px rgba(0, 206, 209, 0.3);
                }
                50% {
                    text-shadow: 0 0 15px rgba(0, 206, 209, 0.8);
                }
            }
            
            @keyframes float {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-10px);
                }
            }
            
            /* 链接悬停效果 */
            a {
                position: relative;
                transition: color 0.3s ease;
            }
            
            a::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: linear-gradient(to right, #00CED1, #008B8B);
                transition: width 0.3s ease;
            }
            
            a:hover::after {
                width: 100%;
            }
            
            /* 代码块优化 */
            pre {
                background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.95));
                border-left: 4px solid #00CED1;
                border-radius: 8px;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            pre:hover {
                box-shadow: 0 0 20px rgba(0, 206, 209, 0.2);
            }
            
            code {
                color: #00CED1;
                font-family: 'Fira Code', 'Courier New', monospace;
            }
            
            /* 目录高亮 */
            a.active {
                color: #00CED1;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(0, 206, 209, 0.5);
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // 7. 页面加载动画
    // ========================================
    const initPageLoadAnimation = () => {
        const style = document.createElement('style');
        style.textContent = `
            body {
                animation: pageIn 0.6s ease-out;
            }
            
            @keyframes pageIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // 8. 夜间模式自动检测
    // ========================================
    const initDarkModeDetection = () => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-color-mode', 'dark');
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            document.documentElement.setAttribute('data-color-mode', e.matches ? 'dark' : 'light');
        });
    };

    // ========================================
    // 9. 阅读进度条 (Reading Progress Bar)
    // ========================================
    const initReadingProgress = () => {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(to right, #00CED1, #008B8B);
            width: 0%;
            z-index: 10000;
            transition: width 0.1s ease;
            box-shadow: 0 0 10px rgba(0, 206, 209, 0.5);
        `;
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });
    };

    // ========================================
    // 10. 文章目录自动生成与高亮 (TOC Highlight)
    // ========================================
    const initTocHighlight = () => {
        const headings = document.querySelectorAll('h2, h3, h4');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('a[href*="#"]').forEach(link => {
                        link.classList.remove('active');
                    });
                    const id = entry.target.id;
                    if (id) {
                        const activeLink = document.querySelector(`a[href="#${id}"]`);
                        if (activeLink) activeLink.classList.add('active');
                    }
                }
            });
        }, { threshold: 0.3 });
        
        headings.forEach(heading => {
            if (!heading.id) {
                heading.id = 'heading-' + Math.random().toString(36).substr(2, 9);
            }
            observer.observe(heading);
        });
    };

    // ========================================
    // 11. 鼠标点击涟漪效果 (Click Ripple)
    // ========================================
    const initClickRipple = () => {
        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: fixed;
                pointer-events: none;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(0, 206, 209, 0.8), transparent);
                width: 20px;
                height: 20px;
                left: ${e.clientX - 10}px;
                top: ${e.clientY - 10}px;
                animation: rippleExpand 0.6s ease-out;
                z-index: 9999;
            `;
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });

        // 添加涟漪动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rippleExpand {
                from {
                    width: 20px;
                    height: 20px;
                    opacity: 1;
                }
                to {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // 12. 页面可见性检测 (Page Visibility)
    // ========================================
    const initPageVisibility = () => {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.title = '👋 期待你的回来...';
            } else {
                document.title = document.title.replace('👋 期待你的回来...', '') || '欢迎回来！';
            }
        });
    };

    // ========================================
    // 13. 文章字数统计与阅读时间
    // ========================================
    const initReadingTime = () => {
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        if (!article) return;
        
        const text = article.innerText || article.textContent;
        const wordCount = text.length;
        const readingTime = Math.ceil(wordCount / 300); // 假设每分钟阅读300字
        
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 206, 209, 0.1), rgba(0, 139, 139, 0.1));
            border-left: 3px solid #00CED1;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #00CED1;
        `;
        stats.innerHTML = `
            <span style="margin-right: 20px;">📊 字数：${wordCount}</span>
            <span>⏱️ 阅读时间：约 ${readingTime} 分钟</span>
        `;
        
        const firstHeading = article.querySelector('h2');
        if (firstHeading) {
            firstHeading.insertAdjacentElement('afterend', stats);
        }
    };

    // ========================================
    // 14. 代码块行号与语言标签
    // ========================================
    const initCodeBlockLabels = () => {
        document.querySelectorAll('pre').forEach((preElement, index) => {
            const codeBlock = preElement.querySelector('code');
            if (!codeBlock) return;
            
            // 获取语言类
            const classes = codeBlock.className;
            const match = classes.match(/language-(\w+)/);
            const language = match ? match[1].toUpperCase() : 'CODE';
            
            // 添加语言标签
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 206, 209, 0.2);
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 11px;
                color: #00CED1;
                font-weight: bold;
                pointer-events: none;
            `;
            label.textContent = language;
            preElement.appendChild(label);
        });
    };

    // ========================================
    // 15. 平滑的返回到顶部（通过滚动绑定）
    // ========================================
    const initSmoothScrollToTop = () => {
        window.scrollToTopSmooth = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
    };

    // ========================================
    // 16. 迷你音乐播放器
    // ========================================
    const initMusicPlayer = () => {
        // 默认播放列表 - 可替换为你自己的音乐URL
        const playlist = [
            { title: '钢琴曲 - 平静之光', artist: '轻音乐', url: 'https://music.163.com/song/media/outer/url?id=22707008.mp3' },
            { title: '和平之日', artist: '轻音乐', url: 'https://music.163.com/song/media/outer/url?id=16931066.mp3' },
            { title: '静夜思', artist: '背景音乐', url: 'https://music.163.com/song/media/outer/url?id=16842768.mp3' },
            { title: '星辰大海', artist: '钢琴', url: 'https://music.163.com/song/media/outer/url?id=22707008.mp3' },
            { title: '晨曦', artist: '环境音乐', url: 'https://music.163.com/song/media/outer/url?id=25906124.mp3' }
        ];
        
        let currentTrackIndex = 0;
        
        const musicPlayer = document.createElement('div');
        musicPlayer.className = 'music-player';
        musicPlayer.innerHTML = `
            <div class="music-player-content">
                <div class="music-header">
                    <span class="music-icon">🎵</span>
                    <span class="music-title">Music Player</span>
                    <button class="music-toggle-btn">−</button>
                </div>
                <div class="music-body">
                    <div class="music-visualizer">
                        <div class="bar" style="animation-delay: 0s"></div>
                        <div class="bar" style="animation-delay: 0.1s"></div>
                        <div class="bar" style="animation-delay: 0.2s"></div>
                        <div class="bar" style="animation-delay: 0.3s"></div>
                        <div class="bar" style="animation-delay: 0.4s"></div>
                    </div>
                    <div class="music-info">
                        <p class="music-artist" id="music-artist">选择一首歌</p>
                        <p class="music-time"><span id="current-time">00:00</span> / <span id="total-time">00:00</span></p>
                    </div>
                    <audio class="audio-player" id="audio-player" controls>
                        你的浏览器不支持音频播放
                    </audio>
                </div>
                <div class="music-playlist">
                    <div class="playlist-header">📋 播放列表</div>
                    <div class="playlist-items" id="playlist-items"></div>
                    <button class="add-music-btn">+ 添加音乐</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(musicPlayer);
        
        // 生成播放列表UI
        const playlistContainer = musicPlayer.querySelector('#playlist-items');
        playlist.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === 0) item.classList.add('active');
            item.innerHTML = `
                <span class="playlist-item-title">${song.title}</span>
                <span class="playlist-item-artist">${song.artist}</span>
            `;
            item.addEventListener('click', () => {
                currentTrackIndex = index;
                loadTrack(index);
                playAudio();
                updatePlaylistUI();
            });
            playlistContainer.appendChild(item);
        });
        
        const audio = musicPlayer.querySelector('#audio-player');
        const artistName = musicPlayer.querySelector('#music-artist');
        const currentTimeSpan = musicPlayer.querySelector('#current-time');
        const totalTimeSpan = musicPlayer.querySelector('#total-time');
        
        // 加载曲目
        const loadTrack = (index) => {
            const track = playlist[index];
            audio.src = track.url;
            artistName.textContent = `${track.title} - ${track.artist}`;
        };
        
        // 播放音频
        const playAudio = () => {
            audio.play().catch(() => {
                console.log('音频加载中...');
            });
        };
        
        // 更新播放列表UI
        const updatePlaylistUI = () => {
            musicPlayer.querySelectorAll('.playlist-item').forEach((item, index) => {
                item.classList.toggle('active', index === currentTrackIndex);
            });
        };
        
        // 时间更新
        audio.addEventListener('timeupdate', () => {
            const mins = Math.floor(audio.currentTime / 60);
            const secs = Math.floor(audio.currentTime % 60);
            currentTimeSpan.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        });
        
        // 加载元数据获取总时长
        audio.addEventListener('loadedmetadata', () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            totalTimeSpan.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        });
        
        // 歌曲结束自动下一首
        audio.addEventListener('ended', () => {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
            updatePlaylistUI();
            playAudio();
        });
        
        // 加载第一首歌
        loadTrack(0);
        
        const style = document.createElement('style');
        style.textContent = `
            .music-player {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 320px;
                background: linear-gradient(135deg, rgba(0, 206, 209, 0.1), rgba(0, 139, 139, 0.1));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(0, 206, 209, 0.3);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 206, 209, 0.2);
                z-index: 9998;
                transition: all 0.3s ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-height: 600px;
            }
            
            .music-player-content {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                height: 100%;
            }
            
            .music-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: linear-gradient(to right, rgba(0, 206, 209, 0.2), rgba(0, 139, 139, 0.2));
                cursor: move;
                user-select: none;
                flex-shrink: 0;
            }
            
            .music-icon {
                font-size: 18px;
                margin-right: 8px;
            }
            
            .music-title {
                flex: 1;
                color: #00CED1;
                font-weight: bold;
                font-size: 14px;
            }
            
            .music-toggle-btn {
                background: none;
                border: none;
                color: #00CED1;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.3s ease;
            }
            
            .music-toggle-btn:hover {
                color: #00CED1;
                transform: scale(1.2);
            }
            
            .music-body {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }
            
            .music-visualizer {
                display: flex;
                align-items: flex-end;
                justify-content: center;
                height: 40px;
                gap: 4px;
            }
            
            .bar {
                width: 4px;
                background: linear-gradient(to top, #00CED1, #008B8B);
                border-radius: 2px;
                animation: musicBars 0.6s ease-in-out infinite;
            }
            
            @keyframes musicBars {
                0%, 100% {
                    height: 10px;
                }
                50% {
                    height: 35px;
                }
            }
            
            .music-info {
                text-align: center;
                color: #00CED1;
                font-size: 12px;
            }
            
            .music-artist {
                margin: 0;
                font-weight: bold;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }
            
            .music-time {
                margin: 0;
                opacity: 0.8;
                font-size: 11px;
            }
            
            .audio-player {
                width: 100%;
                height: 28px;
                margin: 8px 0;
            }
            
            .music-playlist {
                padding: 12px 16px;
                border-top: 1px solid rgba(0, 206, 209, 0.2);
                overflow-y: auto;
                max-height: 200px;
                flex-shrink: 1;
            }
            
            .playlist-header {
                font-size: 12px;
                color: #00CED1;
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .playlist-items {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 8px;
            }
            
            .playlist-item {
                padding: 6px 8px;
                background: rgba(0, 206, 209, 0.05);
                border-left: 2px solid transparent;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 12px;
                overflow: hidden;
            }
            
            .playlist-item:hover {
                background: rgba(0, 206, 209, 0.15);
                border-left-color: #00CED1;
            }
            
            .playlist-item.active {
                background: rgba(0, 206, 209, 0.2);
                border-left-color: #00CED1;
                color: #00CED1;
                font-weight: bold;
            }
            
            .playlist-item-title {
                display: block;
                color: #00CED1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .playlist-item-artist {
                display: block;
                font-size: 10px;
                color: #00CED1;
                opacity: 0.7;
            }
            
            .add-music-btn {
                width: 100%;
                padding: 8px;
                background: linear-gradient(to right, #00CED1, #008B8B);
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .add-music-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 206, 209, 0.4);
            }
            
            .music-player.collapsed .music-body,
            .music-player.collapsed .music-playlist {
                display: none;
            }
        `;
        document.head.appendChild(style);
        
        // 切换功能
        const toggleBtn = musicPlayer.querySelector('.music-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            musicPlayer.classList.toggle('collapsed');
            toggleBtn.textContent = musicPlayer.classList.contains('collapsed') ? '+' : '−';
        });
        
        // 拖拽功能
        const header = musicPlayer.querySelector('.music-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - musicPlayer.offsetLeft;
            initialY = e.clientY - musicPlayer.offsetTop;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                musicPlayer.style.right = 'auto';
                musicPlayer.style.bottom = 'auto';
                musicPlayer.style.left = currentX + 'px';
                musicPlayer.style.top = currentY + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    };

    // ========================================
    // 17. 背景音乐自动播放 (可选)
    // ========================================
    const initBackgroundMusic = () => {
        // 如果你想添加背景音乐，可以取消注释下面的代码
        // const audio = new Audio('你的音乐地址.mp3');
        // audio.loop = true;
        // audio.volume = 0.3;
        // 点击页面后自动播放
        // document.addEventListener('click', () => {
        //     if (audio.paused) audio.play();
        // }, { once: true });
    };

    // ========================================
    // 18. 初始化所有效果
    // ========================================
    const init = () => {
        document.addEventListener('DOMContentLoaded', () => {
            injectAnimations();
            initPageLoadAnimation();
            initCursorTrail();
            initSmoothScroll();
            initCodeBlockEnhance();
            initImageEffects();
            initAnimatedTitle();
            initDarkModeDetection();
            initReadingProgress();
            initTocHighlight();
            initClickRipple();
            initPageVisibility();
            initReadingTime();
            initCodeBlockLabels();
            initSmoothScrollToTop();
            initMusicPlayer();
            initBackgroundMusic();
            
            console.log('✨ 博客科技感效果已加载！');
        });
    };

    init();
})();