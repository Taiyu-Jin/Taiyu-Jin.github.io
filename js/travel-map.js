/**
 * travel-map.js — 首页"足迹 · 卫星视角"
 *
 * 风格：从太空俯瞰亚洲的真实卫星图像。城市以白色脉冲光点标注在地球表面上，
 *      鼠标悬停弹出对应照片。
 *
 * 数据：
 *   - /img/earth/asia-from-space.jpg  —— 卫星视角背景图
 *   - /data/travel-data.json          —— 去过的地方
 *   每个城市的 `pos` 字段是 [x%, y%]（基于背景图坐标，0~1），用户维护。
 *
 * 由 custom-effects.js 在首页懒加载本脚本。
 */
(function () {
  'use strict';

  const root = document.getElementById('hero-earth');
  if (!root) return;

  const hero = root;

  const fetchData = (url) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.json();
    });

  fetchData('/data/travel-data.json')
    .then((travel) => {
      // 文案
      const titleEl = hero.querySelector('.hero-earth-title');
      const subEl = hero.querySelector('.hero-earth-sub');
      const statEl = hero.querySelector('.hero-earth-stats');
      if (titleEl && travel.title) titleEl.textContent = travel.title;
      if (subEl && travel.subtitle) subEl.textContent = travel.subtitle;

      const cities = Array.isArray(travel.cities) ? travel.cities : [];
      const cityCount = cities.length;

      if (statEl) {
        statEl.innerHTML =
          '<div class="hero-stat"><span class="hero-stat-num">' + cityCount + '</span><span class="hero-stat-label">造访过的地方</span></div>' +
          '<div class="hero-stat"><span class="hero-stat-num">' +
          new Set(cities.map((c) => c.region).filter(Boolean)).size +
          '</span><span class="hero-stat-label">片 区</span></div>';
      }

      // 渲染城市点
      const dotsEl = hero.querySelector('.hero-earth-dots');
      if (dotsEl) {
        dotsEl.innerHTML = '';
        cities.forEach((city, i) => {
          const pos = Array.isArray(city.pos) ? city.pos : null;
          if (!pos) return;
          const x = Math.max(0, Math.min(100, pos[0]));
          const y = Math.max(0, Math.min(100, pos[1]));

          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'earth-dot';
          dot.style.left = x + '%';
          dot.style.top = y + '%';
          dot.setAttribute('aria-label', city.name || ('city-' + i));
          dot.style.animationDelay = (i * 0.18).toFixed(2) + 's';

          const label = document.createElement('span');
          label.className = 'earth-dot-label';
          label.textContent = city.name || '';
          dot.appendChild(label);

          if (city.photo) {
            const tip = document.createElement('span');
            tip.className = 'earth-dot-tip';
            tip.innerHTML =
              '<img src="' + city.photo + '" alt="' + (city.name || '') + '" onerror="this.style.display=\'none\'" />' +
              (city.date ? '<span class="tip-date">' + city.date + '</span>' : '') +
              (city.note ? '<span class="tip-note">' + city.note + '</span>' : '');
            dot.appendChild(tip);
          }

          dotsEl.appendChild(dot);
        });
      }

      // ---- 视差：背景图随鼠标轻微漂浮 + 随滚动缓慢上移 ----
      const bg = hero.querySelector('.hero-earth-bg');
      let raf = null;
      let tx = 0, ty = 0;
      const onMouse = (e) => {
        const rect = hero.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        tx = nx * 8;
        ty = ny * 5;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          if (bg) bg.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(1.08)';
          raf = null;
        });
      };
      hero.addEventListener('mousemove', onMouse);
      document.addEventListener('pjax:send', () => hero.removeEventListener('mousemove', onMouse), { once: true });

      // ---- 滚动过渡：首屏淡出上移，博客段落淡入 ----
      const content = document.getElementById('blog-content');
      if (content) {
        const onScroll = () => {
          const scrollY = window.scrollY;
          const max = window.innerHeight * 0.7;
          const progress = Math.min(scrollY / max, 1);

          hero.style.opacity = String(1 - progress * 0.6);
          hero.style.transform = 'translateY(' + (-scrollY * 0.18) + 'px)';

          content.style.opacity = String(progress);
          content.style.transform = 'translateY(' + ((1 - progress) * 60) + 'px)';
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('pjax:send', () => window.removeEventListener('scroll', onScroll), { once: true });
      }
    })
    .catch((err) => {
      console.warn('[travel-earth] 加载失败：', err);
      hero.style.display = 'none';
    });
})();