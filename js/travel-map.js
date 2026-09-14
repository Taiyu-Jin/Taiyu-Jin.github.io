/**
 * travel-map.js — 首页"足迹 · Cesium 3D 地球"
 *
 * 使用 CesiumJS 渲染高德地图 3D 地球（GCJ-02 纠偏）：
 *   - 高德卫星影像（默认）+ 可切矢量/注记
 *   - 固定视角对准中国，可鼠标拖动旋转 / 滚轮缩放
 *   - 城市光点（去过的城市，WGS84 坐标）
 *   - hover 光点 → 城市名标签（常驻显示）
 *   - 点击光点 → 弹出照片卡（DOM 浮层，含照片/日期/笔记）
 *
 * 数据：
 *   - /data/travel-data.json —— 去过的地方
 *
 * Cesium 由 custom-effects.js 本地注入后，按需加载本脚本。
 * 本脚本需在 window.Cesium 就绪后执行。
 */
(function () {
  'use strict';

  const dom = document.getElementById('hero-globe');
  if (!dom || typeof window.Cesium === 'undefined') return;

  const Cesium = window.Cesium;

  /* =============================================================
   * 1. WGS84 <-> GCJ-02 纠偏
   * ============================================================= */
  const PI = Math.PI;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function outOfChina(lng, lat) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  }
  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
    ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320.0 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
    return ret;
  }
  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
    ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
    return ret;
  }
  function wgs84ToGcj02(lng, lat) {
    if (outOfChina(lng, lat)) return [lng, lat];
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
    dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
    return [lng + dLng, lat + dLat];
  }
  function gcj02ToWgs84(lng, lat) {
    if (outOfChina(lng, lat)) return [lng, lat];
    let wgsLng = lng, wgsLat = lat;
    for (let i = 0; i < 8; i++) {
      const gcj = wgs84ToGcj02(wgsLng, wgsLat);
      const dLng = gcj[0] - lng, dLat = gcj[1] - lat;
      wgsLng -= dLng; wgsLat -= dLat;
      if (Math.abs(dLng) < 1e-8 && Math.abs(dLat) < 1e-8) break;
    }
    return [wgsLng, wgsLat];
  }

  /* =============================================================
   * 2. GCJ-02 WebMercator Projection
   * ============================================================= */
  function GCJ02WebMercatorProjection(ellipsoid) {
    this._ellipsoid = ellipsoid || Cesium.Ellipsoid.WGS84;
    this._webMercator = new Cesium.WebMercatorProjection(this._ellipsoid);
  }
  Object.defineProperty(GCJ02WebMercatorProjection.prototype, 'ellipsoid', {
    get: function () { return this._ellipsoid; }
  });
  GCJ02WebMercatorProjection.prototype.project = function (cartographic, result) {
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const gcj = wgs84ToGcj02(lng, lat);
    const converted = new Cesium.Cartographic(
      Cesium.Math.toRadians(gcj[0]),
      Cesium.Math.toRadians(gcj[1]),
      cartographic.height || 0
    );
    return this._webMercator.project(converted, result);
  };
  GCJ02WebMercatorProjection.prototype.unproject = function (cartesian, result) {
    const gcjCartographic = this._webMercator.unproject(cartesian);
    const gcjLng = Cesium.Math.toDegrees(gcjCartographic.longitude);
    const gcjLat = Cesium.Math.toDegrees(gcjCartographic.latitude);
    const wgs = gcj02ToWgs84(gcjLng, gcjLat);
    if (!result) result = new Cesium.Cartographic();
    result.longitude = Cesium.Math.toRadians(wgs[0]);
    result.latitude = Cesium.Math.toRadians(wgs[1]);
    result.height = gcjCartographic.height || 0;
    return result;
  };

  function createGCJ02TilingScheme() {
    const scheme = new Cesium.WebMercatorTilingScheme({
      ellipsoid: Cesium.Ellipsoid.WGS84
    });
    scheme._projection = new GCJ02WebMercatorProjection(scheme.ellipsoid);
    return scheme;
  }

  /* =============================================================
   * 3. 高德图层
   * ============================================================= */
  const GAODE_URLS = {
    vector: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    image: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    imageLabel: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
  };

  function createGaodeProvider(type) {
    return new Cesium.UrlTemplateImageryProvider({
      url: GAODE_URLS[type],
      tilingScheme: createGCJ02TilingScheme(),
      subdomains: ['1', '2', '3', '4'],
      minimumLevel: 0,
      maximumLevel: 18,
      credit: new Cesium.Credit('高德地图')
    });
  }

  /* =============================================================
   * 4. Viewer
   * ============================================================= */
  let viewer;
  try {
    viewer = new Cesium.Viewer(dom, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      vrButton: false,
      requestRenderMode: true,
      maximumRenderTimeChange: 0.5
    });
  } catch (err) {
    console.warn('[hero-globe] Cesium 初始化失败：', err);
    return;
  }

  const scene = viewer.scene;
  window.__cesium_viewer = viewer; // 调试句柄

  if (scene.globe) {
    scene.globe.showGroundAtmosphere = true;
    scene.globe.depthTestAgainstTerrain = false;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#08131f');
    scene.globe.maximumScreenSpaceError = 2.0;
  }
  scene.highDynamicRange = false;

  // 默认卫星影像
  try {
    viewer.imageryLayers.addImageryProvider(createGaodeProvider('image'));
  } catch (e) {
    console.warn('[hero-globe] 高德图层加载失败：', e);
  }

  /* =============================================================
   * 5. 相机：固定视角对准中国
   * ============================================================= */
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(105.0, 35.0, 20000000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
  });

  /* =============================================================
   * 6. 城市光点 + 照片卡
   * ============================================================= */
  const photoCard = document.createElement('div');
  photoCard.className = 'city-photo-card';
  photoCard.innerHTML =
    '<button class="city-photo-close" aria-label="关闭" type="button">' +
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>' +
    '</button><div class="city-photo-body"></div>';
  const heroRoot = dom.closest('.hero-earth') || dom.parentNode;
  heroRoot.appendChild(photoCard);
  const photoBody = photoCard.querySelector('.city-photo-body');

  const renderPhotoCard = (city) => {
    if (!city) return;
    photoBody.innerHTML =
      '<div class="city-photo-title">' + (city.name || '') + '</div>' +
      (city.date ? '<div class="city-photo-date">' + city.date + '</div>' : '') +
      (city.photo
        ? '<img class="city-photo-img" src="' + city.photo + '" alt="' + (city.name || '') + '" onerror="this.parentNode.removeChild(this)" />'
        : '<div class="city-photo-empty">还没有照片，先保留这段回忆 🌏</div>') +
      (city.note ? '<div class="city-photo-note">' + city.note + '</div>' : '');
    photoCard.classList.add('show');
  };
  const closePhotoCard = () => photoCard.classList.remove('show');
  photoCard.querySelector('.city-photo-close').addEventListener('click', closePhotoCard);
  // 「点击外部关闭」放在 LEFT_CLICK 处理器之后统一处理（见下方 document 监听）

  // 加载数据并放置光点
  fetch('/data/travel-data.json')
    .then((r) => r.json())
    .then((travel) => {
      const cities = Array.isArray(travel.cities) ? travel.cities : [];
      cities.forEach((c) => {
        if (!Array.isArray(c.coord)) return;
        const entity = viewer.entities.add({
          name: c.name,
          position: Cesium.Cartesian3.fromDegrees(c.coord[0], c.coord[1], 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#7dd3fc'),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: c.name,
            font: '13px "PingFang SC", "Microsoft YaHei", sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#0a1630'),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 22, 48, 0.85)'),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        // Cesium 不会拷贝自定义属性，需要创建后手动挂载
        entity._city = c;
      });
    })
    .catch((err) => console.warn('[hero-globe] 城市数据加载失败：', err));

  // 点击光点 → 弹照片卡；点击空白处 → 关闭
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position);
    if (Cesium.defined(picked) && picked.id && picked.id._city) {
      renderPhotoCard(picked.id._city);
    } else {
      closePhotoCard();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 点击卡片外部关闭（忽略 canvas 上的点击——那由 Cesium 处理，
  // 否则打开卡片的这次点击会冒泡到 document 立即把卡片关掉）
  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest && e.target.closest('canvas')) return;
    if (photoCard.classList.contains('show') && !photoCard.contains(e.target)) closePhotoCard();
  });
  document.addEventListener('pjax:send', () => {
    try { handler.destroy(); viewer.destroy(); } catch (e) {}
  }, { once: true });
})();
