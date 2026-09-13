/**
 * travel-map.js — 首页"足迹 · 3D 地球"
 *
 * 使用 ECharts GL 渲染可旋转的 3D 球体地球（参考高德地图风格）：
 *   - 黑色太空背景
 *   - 地球纹理（默认带光照）
 *   - 国家轮廓（暗色描边）
 *   - 城市光柱（去过的城市向上立光柱，柱顶白色脉冲圆点）
 *   - 鼠标拖动旋转 / 滚轮缩放
 *   - 悬停城市：弹出照片卡
 *
 * 数据：
 *   - /data/travel-data.json —— 去过的地方
 *
 * 由 custom-effects.js 在首页加载 ECharts、ECharts GL、世界地图后，按需加载本脚本。
 */
(function () {
  'use strict';

  const dom = document.getElementById('hero-globe');
  if (!dom || typeof echarts === 'undefined' || !echarts.graphic) return;

  // 地球纹理（白天 + 夜景 + 海拔）—— 本地静态资源，不依赖外部 CDN
  // earth-blue.jpg 为 1600x800 标准 2:1 等距柱状全球白天贴图（真实陆地/海洋）
  const EARTH_TEX = '/img/earth/earth-blue.jpg';
  const NIGHT_TEX = '/img/earth/earth-night.jpg';
  const BUMP_TEX = '/img/earth/earth-topology.png';

  fetch('/data/travel-data.json')
    .then((r) => r.json())
    .then((travel) => {
      const hero = document.getElementById('hero-earth');
      const titleEl = hero && hero.querySelector('.hero-earth-title');
      const subEl = hero && hero.querySelector('.hero-earth-sub');
      const statEl = hero && hero.querySelector('.hero-earth-stats');
      if (titleEl && travel.title) titleEl.textContent = travel.title;
      if (subEl && travel.subtitle) subEl.textContent = travel.subtitle;

      const cities = Array.isArray(travel.cities) ? travel.cities : [];

      if (statEl) {
        statEl.innerHTML =
          '<div class="hero-stat"><span class="hero-stat-num">' + cities.length + '</span><span class="hero-stat-label">造访过的地方</span></div>' +
          '<div class="hero-stat"><span class="hero-stat-num">' +
          new Set(cities.map((c) => c.region).filter(Boolean)).size +
          '</span><span class="hero-stat-label">片 区</span></div>';
      }

      const chart = echarts.init(dom, null, { renderer: 'canvas' });

      // 城市 → 3D 球面坐标 + 光柱
      const cityScatter = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({
          name: c.name,
          value: c.coord, // [lon, lat]
          city: c
        }));

      const cityBars = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({
          name: c.name,
          value: c.coord,
          city: c
        }));

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderColor: 'rgba(125, 211, 252, 0.4)',
          borderWidth: 1,
          padding: [10, 12],
          textStyle: { color: '#f0f6ff', fontSize: 13 },
          extraCssText: 'backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.45); max-width: 240px;',
          formatter: (p) => {
            if (p.seriesType === 'scatter3D') {
              const city = p.data.city || {};
              const photo = city.photo
                ? '<img src="' + city.photo + '" alt="' + (city.name || '') + '" style="display:block;width:200px;border-radius:10px;margin:8px 0 6px;pointer-events:none;" onerror="this.style.display=\'none\'" />'
                : '';
              return (
                '<div style="font-size:14px;font-weight:600;letter-spacing:.02em;">' + (city.name || p.name) + '</div>' +
                (city.date ? '<div style="opacity:.55;margin-top:2px;font-size:12px;">' + city.date + '</div>' : '') +
                photo +
                (city.note ? '<div style="opacity:.85;line-height:1.55;margin-top:2px;">' + city.note + '</div>' : '')
              );
            }
            return '';
          }
        },
        globe: {
          baseTexture: EARTH_TEX,
          shading: 'color',
          light: {
            ambient: { intensity: 1.0 },
            main: { intensity: 0.6, alpha: 20, beta: 20 }
          },
          viewControl: {
            autoRotate: true,
            autoRotateSpeed: 8,
            distance: 220,
            alpha: 30,
            beta: 35,
            targetCoord: [105, 30]
          }
        },
        series: [
          // 城市点（光点）
          {
            type: 'scatter3D',
            coordinateSystem: 'globe',
            data: cityScatter,
            symbolSize: 10,
            itemStyle: {
              color: '#ffffff',
              opacity: 1,
              borderColor: '#7dd3fc',
              borderWidth: 1.5,
              shadowColor: '#7dd3fc',
              shadowBlur: 12
            }
          }
        ]
      });

      window.addEventListener('resize', () => chart.resize());
      document.addEventListener('pjax:send', () => { try { chart.dispose(); } catch (e) {} }, { once: true });
    })
    .catch((err) => {
      console.warn('[hero-globe] 加载失败：', err);
    });
})();