// main.js
// importで他のモジュールを読み込む
import { fetchWeather, renderWeather } from './weather.js';
import { initNationalWeather } from './national.js';

// 全国の天気ボタンの初期化
initNationalWeather();
// 現地の天気ボタンのイベントリスナーを設定
const button = document.getElementById('local_weather_button');
const result = document.getElementById('local_weather_result');
const error = document.getElementById('local_weather_error');
const loading = document.getElementById('local_weather_loading');


// 現地の天気を取得するボタンのイベントリスナー
button.addEventListener('click', () => {
  result.innerHTML = '';
  error.textContent = '';
  loading.textContent = '取得中...';
  button.disabled = true;

  // Geolocation API を使ってユーザーの位置情報を取得
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
        result.innerHTML = renderWeather(data);
      } catch (e) {
        error.textContent = e.message;
      } finally {
        loading.textContent = '';
        button.disabled = false;
      }
    },
    () => {
      error.textContent = '位置情報の取得に失敗しました。ブラウザの設定を確認してください。';
      loading.textContent = '';
      button.disabled = false;
    }
  );
});
