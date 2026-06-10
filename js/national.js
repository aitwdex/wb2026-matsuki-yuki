import { fetchWeather, renderWeather } from './weather.js';

// ボタンID → 都市情報
const CITIES = {
  sapporo_weather_button:   { name: '北海道（札幌）', lat: 43.0642, lng: 141.3469 },
  sendai_weather_button:    { name: '仙台',           lat: 38.2682, lng: 140.8694 },
  tokyo_weather_button:     { name: '東京',           lat: 35.6762, lng: 139.6503 },
  nagoya_weather_button:    { name: '名古屋',         lat: 35.1815, lng: 136.9066 },
  osaka_weather_button:     { name: '大阪',           lat: 34.6937, lng: 135.5023 },
  hiroshima_weather_button: { name: '広島',           lat: 34.3963, lng: 132.4596 },
  fukuoka_weather_button:   { name: '福岡',           lat: 33.5904, lng: 130.4017 },
};
// 全ての都市ボタンを有効/無効にする関数
function setAllDisabled(disabled) {
  for (const id of Object.keys(CITIES)) {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = disabled;
  }
}

// =========================================================
// データ取得
// =========================================================

export function initNationalWeather() {
  const result  = document.getElementById('national_weather_result');
  const error   = document.getElementById('national_weather_error');
  const loading = document.getElementById('national_weather_loading');

  for (const [buttonId, city] of Object.entries(CITIES)) {
    const btn = document.getElementById(buttonId);
    if (!btn) continue;

    btn.addEventListener('click', async () => {
      result.innerHTML  = '';
      error.textContent = '';
      loading.textContent = `${city.name}の天気を取得中...`;
      setAllDisabled(true);
      
      // 天気情報を取得して表示
      try {
        const data = await fetchWeather(city.lat, city.lng);
        result.innerHTML = `<p class="national-city-name">${city.name}</p>` + renderWeather(data);
      } catch (e) {
        error.textContent = e.message;
      } finally {
        loading.textContent = '';
        setAllDisabled(false);
      }
    });
  }
}
