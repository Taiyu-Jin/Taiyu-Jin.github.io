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

  // 地球纹理 —— 4096x2048 4K 等距柱状全球白天贴图（无云高清），本地静态资源
  const EARTH_TEX = '/img/earth/earth-hd.jpg';

  fetch('/data/travel-data.json')
    .then((r) => r.json())
    .then((travel) => {
      const cities = Array.isArray(travel.cities) ? travel.cities : [];

      const chart = echarts.init(dom, null, {
        renderer: 'canvas',
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2)
      });

      // 城市 → 3D 球面坐标 + 光点
      const cityScatter = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({
          name: c.name,
          value: c.coord, // [lon, lat]
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