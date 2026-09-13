/**
 * Terry's Blog — Apple 风格轻量增强 (PJAX 适配版)
 * 只保留两件事：平滑锚点滚动、极简音乐播放器。
 * 已移除旧版的花哨特效（赛博网格、鼠标粒子、青色进度条等），
 * 顶部阅读进度条由 Keep 主题自带提供，不再重复注入。
 */

(function () {
  'use strict';

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
  // 1. 平滑锚点滚动
  // ========================================
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.onclick = (e) => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) {
          e.preventDefault();
          t.scrollIntoView({ behavior: 'smooth' });
        }
      };
    });
  };

  // ========================================
  // 2. 极简音乐播放器（导航栏胶囊）
  // ========================================
  const ICONS = {
    play:
      '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M4.5 2.9c0-.8.9-1.3 1.6-.9l7.2 4.6c.6.4.6 1.4 0 1.8l-7.2 4.6c-.7.4-1.6-.1-1.6-.9V2.9z"/></svg>',
    pause:
      '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><rect x="3" y="2.5" width="3.4" height="11" rx="1"/><rect x="9.6" y="2.5" width="3.4" height="11" rx="1"/></svg>',
    prev:
      '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="2.5" y="3" width="1.8" height="10" rx="0.9"/><path d="M13.5 4.1v7.8c0 .7-.8 1.1-1.4.7L6.7 8.8c-.5-.4-.5-1.2 0-1.6l5.4-3.8c.6-.4 1.4 0 1.4.7z"/></svg>',
    next:
      '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="11.7" y="3" width="1.8" height="10" rx="0.9"/><path d="M2.5 4.1v7.8c0 .7.8 1.1 1.4.7l5.4-3.8c.5-.4.5-1.2 0-1.6L3.9 3.4c-.6-.4-1.4 0-1.4.7z"/></svg>',
    plus:
      '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3.2v9.6M3.2 8h9.6"/></svg>'
  };

  const initMusicPlayer = () => {
    // Audio 单例
    let audio = document.getElementById('terry-bgm');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'terry-bgm';
      audio.preload = 'auto';
      document.body.appendChild(audio);
    }

    let playlist = [
      { title: 'SoundHelix #1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { title: 'SoundHelix #2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
    ];
    const defaultPlaylist = [...playlist];
    let currentIndex = 0;

    const createPlayerHTML = (isMobile) => `
      <div class="music-player-content">
        <div class="music-controls">
          <button class="music-btn prev-btn" title="上一首" aria-label="上一首">${ICONS.prev}</button>
          <button class="music-btn play-btn" title="播放/暂停" aria-label="播放或暂停">${ICONS.play}</button>
          <button class="music-btn next-btn" title="下一首" aria-label="下一首">${ICONS.next}</button>
        </div>
        <div class="music-info-bar" title="点击展开列表">…</div>
        ${!isMobile ? '<div class="music-time">00:00</div>' : ''}
        <div class="music-playlist-dropdown">
          <div class="playlist-header">
            <span>播放列表</span>
            <button class="add-music-btn-mini" title="添加音乐" aria-label="添加音乐">${ICONS.plus}</button>
          </div>
          <div class="playlist-items"></div>
        </div>
      </div>
    `;

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
        document.querySelectorAll('.music-playlist-dropdown').forEach((d) => {
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

    const fmt = (t) => {
      const m = Math.floor(t / 60).toString().padStart(2, '0');
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const updateAllUI = () => {
      const track = playlist[currentIndex];
      if (!track) return;
      const isPaused = audio.paused;
      document.querySelectorAll('.music-player-content').forEach((el) => {
        el.querySelector('.music-info-bar').textContent = track.title;
        el.querySelector('.play-btn').innerHTML = isPaused ? ICONS.play : ICONS.pause;
        const timeEl = el.querySelector('.music-time');
        if (timeEl) timeEl.textContent = fmt(audio.currentTime);
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
      document.querySelectorAll('.playlist-items').forEach((el) => {
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

    // 注入前先清理旧实例，防止 PJAX 下重复
    document.querySelectorAll('.music-player-pc, .music-player-mobile').forEach((el) => el.remove());

    // PC：插入菜单列表
    const menuList = document.querySelector('.header-wrapper .menu-list');
    if (menuList) {
      const li = document.createElement('li');
      li.className = 'menu-item music-player-pc';
      li.innerHTML = createPlayerHTML(false);
      bindEvents(li);
      menuList.insertBefore(li, menuList.lastElementChild);
    }

    // 移动端
    const mobileHeader = document.querySelector('.header-wrapper .right .mobile');
    if (mobileHeader) {
      const div = document.createElement('div');
      div.className = 'music-player-mobile';
      div.innerHTML = createPlayerHTML(true);
      bindEvents(div);
      mobileHeader.insertBefore(div, mobileHeader.firstElementChild);
    }

    audio.ontimeupdate = () => { updateAllUI(); saveState(); };
    audio.onended = playNext;
    audio.onplay = updateAllUI;
    audio.onpause = updateAllUI;

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.music-player-content')) {
        document.querySelectorAll('.music-playlist-dropdown').forEach((d) => d.classList.remove('show'));
      }
    });

    // 初始化播放列表与状态
    (async () => {
      try {
        const res = await fetch('/music/playlist.json');
        if (res.ok) {
          const ext = await res.json();
          if (Array.isArray(ext)) playlist = ext;
        }
      } catch (e) {}
      try {
        const user = JSON.parse(localStorage.getItem('terry_user_playlist'));
        if (Array.isArray(user)) playlist = playlist.concat(user);
      } catch (e) {}
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
      } catch (e) { loadTrack(); }
    })();
  };

  // ========================================
  // 3. 播放器样式：苹果式极简胶囊（浅/深色）
  // ========================================
  const injectPlayerStyle = () => {
    if (document.getElementById('terry-custom-css')) return;
    const style = document.createElement('style');
    style.id = 'terry-custom-css';
    style.textContent = `
      .music-player-pc { display: flex; align-items: center; margin: 0 4px; height: 100%; }

      /* 较窄视口（≥ 800px 但仍不够宽）隐藏 PC 音乐播放器，给导航腾出空间 */
      @media (min-width: 801px) and (max-width: 1100px) {
        .music-player-pc { display: none !important; }
      }
      .music-player-content {
        display: flex; align-items: center; gap: 8px;
        height: 30px; padding: 0 10px;
        background: rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 999px;
        color: var(--text-color-3);
        font-size: 12px;
        cursor: default;
        position: relative;
        transition: background 0.25s ease, border-color 0.25s ease;
      }
      .music-player-content:hover { background: rgba(0, 0, 0, 0.07); }
      .music-controls { display: flex; align-items: center; gap: 6px; }
      .music-btn {
        display: flex; align-items: center; justify-content: center;
        width: 18px; height: 18px;
        background: none; border: none; padding: 0;
        color: var(--text-color-2); cursor: pointer; opacity: 0.85;
        transition: opacity 0.2s ease, color 0.2s ease;
      }
      .music-btn:hover { opacity: 1; color: var(--primary-color); }
      .music-info-bar {
        max-width: 96px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
        font-size: 12px; text-align: center; cursor: pointer;
        color: var(--text-color-3);
      }
      .music-time { font-size: 11px; opacity: 0.7; min-width: 32px; text-align: center; font-variant-numeric: tabular-nums; }
      .music-player-mobile { display: flex; align-items: center; margin-right: 8px; }
      .music-player-mobile .music-player-content { padding: 0 8px; height: 28px; }
      .music-player-mobile .music-info-bar { max-width: 56px; }

      @media (max-width: 800px) {
        .music-player-pc { display: none !important; }
        .music-player-mobile { display: flex !important; }
      }
      @media (min-width: 801px) {
        .music-player-pc { display: flex !important; }
        .music-player-mobile { display: none !important; }
      }

      /* 播放列表下拉：干净浮层 */
      .music-playlist-dropdown {
        position: absolute; top: calc(100% + 10px); left: 50%; transform: translateX(-50%);
        width: 220px; max-height: 300px;
        background: var(--background-color-1);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        display: none; flex-direction: column;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
        overflow: hidden;
        z-index: 2001;
      }
      .music-playlist-dropdown.show { display: flex; }
      .playlist-header {
        padding: 10px 14px; border-bottom: 1px solid var(--border-color);
        display: flex; justify-content: space-between; align-items: center;
        font-size: 12px; font-weight: 600; color: var(--text-color-1);
      }
      .add-music-btn-mini {
        display: flex; align-items: center; justify-content: center;
        width: 20px; height: 20px;
        background: none; border: none; padding: 0;
        color: var(--text-color-4); cursor: pointer;
        transition: color 0.2s ease;
      }
      .add-music-btn-mini:hover { color: var(--primary-color); }
      .playlist-items { overflow-y: auto; padding: 6px 0; }
      .playlist-item {
        padding: 7px 14px; cursor: pointer; font-size: 12px;
        color: var(--text-color-3);
        transition: background 0.15s ease, color 0.15s ease;
      }
      .playlist-item:hover { background: var(--background-color-2); }
      .playlist-item.active { color: var(--primary-color); font-weight: 600; }

      /* 深色模式 */
      .dark-mode .music-player-content {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .dark-mode .music-player-content:hover { background: rgba(255, 255, 255, 0.14); }
    `;
    document.head.appendChild(style);
  };

  // ========================================
  // 3. 首页"足迹 · 中国"地图（懒加载，仅首页）
  // ========================================
  const loadScript = (src, id) =>
    new Promise((resolve, reject) => {
      const old = document.getElementById(id);
      if (old) old.remove();
      const s = document.createElement('script');
      s.src = src;
      s.id = id;
      s.onload = resolve;
      s.onerror = () => reject(new Error('加载失败: ' + src));
      document.head.appendChild(s);
    });

  const initTravelMap = () => {
    const mainContent = document.querySelector('.page-main-content.is-home .main-content');
    if (!mainContent) return;

    // PJAX 回到首页时重建
    const oldHero = document.getElementById('hero-earth');
    if (oldHero) oldHero.remove();

    // 第 1 段：满屏 3D 地球首屏
    const hero = document.createElement('section');
    hero.id = 'hero-earth';
    hero.className = 'hero-earth';
    hero.innerHTML = `
      <div id="hero-globe" class="hero-globe" aria-label="可旋转缩放的 3D 地球"></div>
      <div class="hero-earth-overlay">
        <div class="hero-earth-head">
          <h1 class="hero-earth-title">我的足迹</h1>
          <p class="hero-earth-sub">这颗星球上我去过的地方</p>
        </div>
        <div class="hero-earth-stats"></div>
        <button class="hero-earth-scroll-hint" aria-label="向下滚动到博客">
          <span>向下滑动，看我的博客</span>
          <i class="hero-earth-arrow"></i>
        </button>
        <div class="hero-earth-hint-controls">
          <span class="hero-earth-tip">拖动旋转 · 滚轮缩放 · 点光点看照片</span>
        </div>
      </div>
    `;

    // 第 2 段：把原有内容（文章列表）包进一个容器，作为博客段落
    const existing = mainContent.children;
    const wrapper = document.createElement('div');
    wrapper.id = 'blog-content';
    wrapper.className = 'blog-content';
    while (existing.length) {
      wrapper.appendChild(existing[0]);
    }

    mainContent.appendChild(hero);
    mainContent.appendChild(wrapper);

    // 向下滚动引导：点击滚动到博客段落
    const hint = hero.querySelector('.hero-earth-scroll-hint');
    hint.addEventListener('click', () => {
      wrapper.scrollIntoView({ behavior: 'smooth' });
    });

    // 加载链：ECharts → echarts-gl → travel-map
    loadScript('/js/vendor/echarts.min.js', 'echarts-vendor')
      .then(() => loadScript('/js/vendor/echarts-gl.min.js', 'echarts-gl-vendor'))
      .then(() => loadScript('/js/travel-map.js', 'travel-map-script'))
      .catch((err) => {
        console.warn('[hero-earth] 加载失败：', err);
        hero.remove();
      });
  };

  // ========================================
  // 4. 启动
  // ========================================
  const start = () => {
    injectPlayerStyle();
    initSmoothScroll();
    initMusicPlayer();
    initTravelMap();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  document.addEventListener('pjax:complete', start);
})();
