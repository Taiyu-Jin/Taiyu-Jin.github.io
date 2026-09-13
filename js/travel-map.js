/**
 * travel-map.js — 首页"足迹 · 中国"科技感地图
 * 数据：/data/china.json（阿里云 DataV 标准中国地图 GeoJSON，含台湾省、南海诸岛与九段线）
 *       /data/travel-data.json（去过的地方，自行维护）
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
      // 标题文案以数据文件为准
      const section = document.getElementById('travel-map-section');
      if (section) {
        const t = section.querySelector('.travel-map-title');
        const s = section.querySelector('.travel-map-sub');
        const h = section.querySelector('.travel-map-hint');
        if (t && travel.title) t.textContent = travel.title;
        if (s && travel.subtitle) s.textContent = travel.subtitle;
        if (h && travel.hint) h.textContent = travel.hint;
      }

      echarts.registerMap('china', chinaGeo);

      const cities = Array.isArray(travel.cities) ? travel.cities : [];
      const visitedProvinces = [...new Set(cities.map((c) => c.province).filter(Boolean))];

      // 已去的省份：点亮
      const provinceData = visitedProvinces.map((name) => ({
        name,
        itemStyle: {
          areaColor: 'rgba(0, 229, 255, 0.22)',
          borderColor: 'rgba(0, 229, 255, 0.9)',
          shadowColor: 'rgba(0, 229, 255, 0.5)',
          shadowBlur: 18
        },
        emphasis: {
          itemStyle: { areaColor: 'rgba(0, 229, 255, 0.45)' },
          label: { color: '#eaffff' }
        }
      }));

      // 城市：涟漪光点
      const scatterData = cities
        .filter((c) => Array.isArray(c.coord))
        .map((c) => ({ name: c.name, value: c.coord, city: c }));

      const chart = echarts.init(container, null, { renderer: 'canvas' });

      const photoHTML = (city) =>
        city.photo
          ? '<img src="' + city.photo + '" alt="' + city.name + '" style="display:block;width:200px;max-width:56vw;border-radius:10px;margin:8px 0 6px;pointer-events:none;" onerror="this.style.display=\'none\'" />'
          : '';

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(10, 18, 40, 0.92)',
          borderColor: 'rgba(0, 229, 255, 0.4)',
          borderWidth: 1,
          padding: [10, 12],
          textStyle: { color: '#eaf2ff', fontSize: 12 },
          extraCssText: 'backdrop-filter: blur(8px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,229,255,0.15); max-width: 240px;',
          formatter: (p) => {
            if (p.seriesType === 'effectScatter') {
              const city = p.data.city || {};
              return (
                '<div style="font-size:14px;font-weight:600;letter-spacing:.02em;">' + (city.name || p.name) + '</div>' +
                (city.date ? '<div style="opacity:.65;margin-top:2px;">' + city.date + '</div>' : '') +
                photoHTML(city) +
                (city.note ? '<div style="opacity:.85;line-height:1.6;">' + city.note + '</div>' : '')
              );
            }
            // 省份悬停
            const hit = visitedProvinces.includes(p.name);
            return (
              '<div style="font-size:13px;font-weight:600;">' + p.name + '</div>' +
              (hit ? '<div style="opacity:.7;margin-top:2px;">去过这里 ✦</div>' : '')
            );
          }
        },
        geo: {
          map: 'china',
          roam: false,
          zoom: 1,
          layoutCenter: ['50%', '52%'],
          layoutSize: '95%',
          label: { show: false },
          itemStyle: {
            areaColor: 'rgba(30, 58, 110, 0.35)',
            borderColor: 'rgba(0, 229, 255, 0.35)',
            borderWidth: 0.8,
            shadowColor: 'rgba(0, 120, 255, 0.35)',
            shadowBlur: 24
          },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: 'rgba(0, 120, 255, 0.35)' }
          },
          regions: provinceData
        },
        series: [
          {
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: scatterData,
            symbolSize: 11,
            rippleEffect: { brushType: 'stroke', scale: 4.2, period: 4 },
            itemStyle: { color: '#00e5ff', shadowColor: '#00e5ff', shadowBlur: 14 },
            emphasis: { scale: 1.6 },
            zlevel: 2
          }
        ]
      });

      window.addEventListener('resize', () => chart.resize());

      // PJAX 离开页面时释放
      document.addEventListener('pjax:send', () => {
        try { chart.dispose(); } catch (e) {}
      }, { once: true });
    })
    .catch((err) => {
      console.warn('[travel-map] 加载失败：', err);
      const section = document.getElementById('travel-map-section');
      if (section) section.style.display = 'none';
    });
})();
