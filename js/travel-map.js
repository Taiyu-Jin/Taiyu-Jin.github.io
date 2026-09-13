/**
 * travel-map.js — 首页"足迹地图"（真实地图质感）
 *
 * 数据：/data/china.json（阿里云 DataV 标准中国地图 GeoJSON，含台湾省、港澳、南海诸岛九段线）
 *       /data/travel-data.json（去过的地方，自行维护）
 *
 * 结构：首页被拆成两段 ——
 *   第 1 段：满屏地图首屏（.hero-map）
 *   第 2 段：博客文章列表（往下滚动后淡入）
 * 由 custom-effects.js 在首页懒加载本文件与 echarts。
 */
(function () {
  'use strict';

  const container = document.getElementById('travel-map');
  if (!container || typeof echarts === 'undefined') return;

  const fetchData = (url) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.json();
    });

  Promise.all([fetchData('/data/china.json'), fetchData('/data/travel-data.json')])
    .then(([chinaGeo, travel]) => {
      const hero = document.getElementById('hero-map');
      const titleEl = hero && hero.querySelector('.hero-map-title');
      const subEl = hero && hero.querySelector('.hero-map-sub');
      const statEl = hero && hero.querySelector('.hero-map-stats');
      if (titleEl && travel.title) titleEl.textContent = travel.title;
      if (subEl && travel.subtitle) subEl.textContent = travel.subtitle;

      echarts.registerMap('china', chinaGeo);

      const cities = Array.isArray(travel.cities) ? travel.cities : [];
      const visitedProvinces = [...new Set(cities.map((c) => c.province).filter(Boolean))];
      const cityCount = cities.length;
      const provinceCount = visitedProvinces.length;

      if (statEl) {
        statEl.innerHTML =
          '<div class="hero-stat"><span class="hero-stat-num">' + cityCount + '</span><span class="hero-stat-label">去过的城市</span></div>' +
          '<div class="hero-stat"><span class="hero-stat-num">' + provinceCount + '</span><span class="hero-stat-label">踏足的省份</span></div>';
      }

      // 已去省份：真实地图上以暖色轻轻"染色"
      const provinceData = visitedProvinces.map((name) => ({
        name,
        itemStyle: {
          areaColor: '#e8dcc8',
          borderColor: '#b7a688'
        }
      }));

      // 城市：红色图钉点
      const scatterData = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({ name: c.name, value: c.coord, city: c }));

      const chart = echarts.init(container, null, { renderer: 'canvas' });

      const photoHTML = (city) =>
        city.photo
          ? '<img src="' + city.photo + '" alt="' + city.name + '" style="display:block;width:210px;max-width:52vw;border-radius:10px;margin:10px 0 8px;pointer-events:none;" onerror="this.style.display=\'none\'" />'
          : '';

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderColor: 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          padding: [12, 14],
          textStyle: { color: '#1d1d1f', fontSize: 13 },
          extraCssText: 'border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.16); max-width: 250px;',
          formatter: (p) => {
            if (p.seriesType === 'effectScatter') {
              const city = p.data.city || {};
              return (
                '<div style="font-size:15px;font-weight:600;letter-spacing:.01em;">' + (city.name || p.name) + '</div>' +
                (city.date ? '<div style="opacity:.55;margin-top:3px;font-size:12px;">' + city.date + '</div>' : '') +
                photoHTML(city) +
                (city.note ? '<div style="opacity:.82;line-height:1.6;margin-top:2px;">' + city.note + '</div>' : '')
              );
            }
            // 省份悬停
            const hit = visitedProvinces.includes(p.name);
            return (
              '<div style="font-size:13px;font-weight:600;">' + p.name + '</div>' +
              (hit ? '<div style="opacity:.6;margin-top:2px;font-size:12px;">去过这里</div>' : '')
            );
          }
        },
        geo: {
          map: 'china',
          roam: false,
          zoom: 1,
          layoutCenter: ['50%', '50%'],
          layoutSize: '92%',
          label: { show: false },
          itemStyle: {
            areaColor: '#f2efe9',
            borderColor: '#cfc7b8',
            borderWidth: 0.8
          },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#e6ddcb' }
          },
          regions: provinceData
        },
        series: [
          {
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: scatterData,
            symbolSize: 13,
            rippleEffect: { brushType: 'stroke', scale: 3.2, period: 3.5 },
            itemStyle: { color: '#d94f3d', shadowColor: 'rgba(217,79,61,0.5)', shadowBlur: 8 },
            emphasis: { scale: 1.5 },
            zlevel: 2
          }
        ]
      });

      // ---- 滚动过渡：地图首屏 → 博客列表 ----
      const content = document.getElementById('blog-content');
      if (content) {
        const onScroll = () => {
          const scrollY = window.scrollY;
          const max = window.innerHeight * 0.7;
          const progress = Math.min(scrollY / max, 1);

          // 地图随滚动轻微上移 + 淡出（视差）
          hero.style.opacity = String(1 - progress * 0.55);
          hero.style.transform = 'translateY(' + (-scrollY * 0.25) + 'px)';

          // 博客列表淡入上移
          content.style.opacity = String(progress);
          content.style.transform = 'translateY(' + ((1 - progress) * 60) + 'px)';
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('pjax:send', () => window.removeEventListener('scroll', onScroll), { once: true });
      }

      window.addEventListener('resize', () => chart.resize());
      document.addEventListener('pjax:send', () => { try { chart.dispose(); } catch (e) {} }, { once: true });
    })
    .catch((err) => {
      console.warn('[travel-map] 加载失败：', err);
      const hero = document.getElementById('hero-map');
      if (hero) hero.style.display = 'none';
    });
})();
