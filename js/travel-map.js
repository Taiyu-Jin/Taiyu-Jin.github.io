/**
 * travel-map.js — 首页"足迹 · 3D 地球"
 *
 * 使用 ECharts GL 渲染固定视角的 3D 球体地球：
 *   - 太空深蓝背景 + 星空（由 CSS 提供）
 *   - 地球纹理（白天贴图 + 暗面夜景灯光）
 *   - 城市光点（去过的城市，白点蓝晕）
 *   - 悬停光点 → 光点高亮 + 城市名标签（tooltip）
 *   - 点击光点 → 弹出照片卡（DOM 浮层，含照片/日期/笔记）
 *   - 固定视角（不自动旋转），仍可鼠标拖动旋转 / 滚轮缩放
 *
 * 数据：
 *   - /data/travel-data.json —— 去过的地方
 *
 * 由 custom-effects.js 在首页加载 ECharts、ECharts GL 后，按需加载本脚本。
 */
(function () {
  'use strict';

  const dom = document.getElementById('hero-globe');
  if (!dom || typeof echarts === 'undefined' || !echarts.graphic) return;

  // 地球纹理 —— 4096x2048 4K 等距柱状全球白天贴图（无云高清），本地静态资源
  const EARTH_TEX = '/img/earth/earth-hd.jpg';
  // 夜景灯光贴图：4096x2048，等距柱状，黑色海洋 + 暖黄色城市灯光
  const NIGHT_TEX = '/img/earth/earth-night.jpg';

  fetch('/data/travel-data.json')
    .then((r) => r.json())
    .then((travel) => {
      const cities = Array.isArray(travel.cities) ? travel.cities : [];

      const chart = echarts.init(dom, null, {
        renderer: 'canvas',
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2)
      });

      // 城市 → 光点数据 [lon, lat]
      const cityScatter = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({
          name: c.name,
          value: c.coord, // [lon, lat]
          city: c
        }));

      // ---------- 照片卡（点击光点弹出） ----------
      const photoCard = document.createElement('div');
      photoCard.className = 'city-photo-card';
      photoCard.innerHTML = `
        <button class="city-photo-close" aria-label="关闭" type="button">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
        </button>
        <div class="city-photo-body"></div>
      `;
      // 挂到 hero-earth 容器（绝对定位层），避免被 canvas 事件遮挡
      const heroRoot = dom.closest('.hero-earth') || dom.parentNode;
      heroRoot.appendChild(photoCard);

      const photoBody = photoCard.querySelector('.city-photo-body');
      const closeBtn = photoCard.querySelector('.city-photo-close');

      const renderPhotoCard = (city) => {
        if (!city) return;
        const hasPhoto = city.photo;
        photoBody.innerHTML =
          '<div class="city-photo-title">' + (city.name || '') + '</div>' +
          (city.date ? '<div class="city-photo-date">' + city.date + '</div>' : '') +
          (hasPhoto
            ? '<img class="city-photo-img" src="' + city.photo + '" alt="' + (city.name || '') + '" onerror="this.parentNode.removeChild(this)" />'
            : '<div class="city-photo-empty">还没有照片，先保留这段回忆 🌏</div>') +
          (city.note ? '<div class="city-photo-note">' + city.note + '</div>' : '');
        photoCard.classList.add('show');
      };

      const closePhotoCard = () => photoCard.classList.remove('show');
      closeBtn.addEventListener('click', closePhotoCard);
      // 点击卡片外部关闭
      document.addEventListener('click', (e) => {
        if (photoCard.classList.contains('show') && !photoCard.contains(e.target)) {
          closePhotoCard();
        }
      });

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(10, 22, 48, 0.92)',
          borderColor: 'rgba(125, 211, 252, 0.5)',
          borderWidth: 1,
          padding: [4, 10],
          textStyle: { color: '#ffffff', fontSize: 13, fontWeight: 600 },
          extraCssText: 'backdrop-filter: blur(10px); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
          // 只对 scatter3D 显示城市名标签（hover 看名字）
          formatter: function (p) {
            if (p.seriesType === 'scatter3D') return p.name || '';
            return '';
          }
        },
        globe: {
          baseTexture: EARTH_TEX,
          environment: NIGHT_TEX, // 暗面叠加夜景灯光（高德地图同款）
          shading: 'lambert',
          light: {
            ambient: { intensity: 0.45 },
            main: { intensity: 1.4, alpha: 30, beta: 40 }
          },
          atmosphere: {
            show: true,
            color: '#3d8bff',
            glowPower: 6,
            innerGlowPower: 2,
            offset: 0.15
          },
          postEffect: {
            enable: true,
            bloom: {
              enable: true,
              bloomIntensity: 0.6
            }
          },
          viewControl: {
            autoRotate: false, // 取消自动旋转，固定视角
            distance: 280, // 拉远一点，给上方标题留出空间
            alpha: 30,
            beta: 35,
            targetCoord: [105, 30]
          }
        },
        series: [
          // 城市光点（scatter3D）：悬停高亮 + 城市名，点击弹出照片卡
          {
            type: 'scatter3D',
            coordinateSystem: 'globe',
            data: cityScatter,
            symbolSize: 12,
            itemStyle: {
              color: '#ffffff',
              opacity: 1,
              borderColor: '#7dd3fc',
              borderWidth: 1.5,
              shadowColor: '#7dd3fc',
              shadowBlur: 14
            },
            emphasis: {
              itemStyle: {
                color: '#ffffff',
                shadowColor: '#ffffff',
                shadowBlur: 24
              },
              label: {
                show: true,
                distance: 4,
                formatter: '{b}',
                textStyle: {
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: 'rgba(10, 22, 48, 0.85)',
                  padding: [3, 9],
                  borderRadius: 8
                }
              }
            }
          }
        ]
      });

      // 点击城市光点 → 弹出照片卡
      chart.on('click', (params) => {
        if (params.seriesType === 'scatter3D' && params.data && params.data.city) {
          renderPhotoCard(params.data.city);
        }
      });

      window.addEventListener('resize', () => chart.resize());
      document.addEventListener('pjax:send', () => { try { chart.dispose(); } catch (e) {} }, { once: true });
    })
    .catch((err) => {
      console.warn('[hero-globe] 加载失败：', err);
    });
})();
