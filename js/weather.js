// WMO（世界気象機関）の天気コードを日本語テキストに変換するテーブル
const WMO_CODE = {
  0: '快晴', 1: 'ほぼ晴れ', 2: '一部曇り', 3: '曇り',
  45: '霧', 48: '霧（着氷性）',
  51: '霧雨（弱）', 53: '霧雨', 55: '霧雨（強）',
  61: '雨（弱）',  63: '雨', 65: '雨（強）',
  71: '雪（弱）',  73: '雪', 75: '雪（強）', 77: '霰',
  80: 'にわか雨（弱）', 81: 'にわか雨', 82: 'にわか雨（強）',
  85: 'にわか雪（弱）', 86: 'にわか雪（強）',
  95: '雷雨', 96: '雷雨（雹を伴う）', 99: '激しい雷雨（雹を伴う）',
};

// WMO天気コードを絵文字に変換するテーブル
const WMO_EMOJI = {
  0: '☀️',  1: '🌤️', 2: '⛅',  3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// getDay() の戻り値（0=日曜）に対応する曜日文字
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];


//  Date オブジェクトを "YYYY-MM-DDTHH:00" 形式の文字列に変換する。
//  Open-Meteo API が返す hourly.time の形式に合わせるために使用する。
 
function toHourISO(date) {  //
  const ymd = date.toLocaleDateString('sv'); // "YYYY-MM-DD"
  const hh  = String(date.getHours()).padStart(2, '0');
  return `${ymd}T${hh}:00`;
}

// =========================================================
// API
// =========================================================

/**
// Open-Meteo API から指定座標の2日分の時間別天気データを取得する。
  @param {number} lat - 緯度
  @param {number} lng - 経度
  @returns {Promise<Object>} JSON
 */
async function fetchWeather(lat, lng) {
  // URLSearchParams でクエリパラメータを組み立てる
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lng,
    // 取得する時間別データ項目
    hourly:    'weathercode,temperature_2m,precipitation,precipitation_probability,relativehumidity_2m,windspeed_10m',
    timezone:  'auto',       // ブラウザのタイムゾーンに自動対応
    forecast_days: 2,        // 2日分取得（8スロット×3時間 = 24時間を確保するため）
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('天気データの取得に失敗しました');
  return res.json();
}

// =========================================================
// 描画
// =========================================================

/**
 * 現在時刻の天気情報をヘッダー形式の HTML 文字列で返す。
 * @param {Object} hourly  API レスポンスの hourly オブジェクト
 * @param {number} idx     現在時刻に対応する hourly 配列のインデックス
 * @param {Date}   now     現在時刻
 */
function renderHeader(hourly, idx, now) {
  const code      = hourly.weathercode[idx];
  const emoji     = WMO_EMOJI[code]  ?? '🌡️';         // 対応コードがなければ温度計絵文字
  const condition = WMO_CODE[code]   ?? `不明（${code}）`;
  const temp      = Math.round(hourly.temperature_2m[idx]);
  const prob      = hourly.precipitation_probability[idx] ?? '--'; // null の場合は '--' を表示
  const humidity  = hourly.relativehumidity_2m[idx]       ?? '--';
  const wind      = hourly.windspeed_10m[idx];
  const timeStr   = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const weekday   = WEEKDAYS[now.getDay()];

  // 結果をHTMLに文字列で返す
  return `
    <div class="weather-header">
      <div class="weather-header-left">
        <span class="weather-emoji-large">${emoji}</span>
        <span class="weather-temp-large">${temp}°C</span>
        <div class="weather-meta">
          <span>降水確率: ${prob}%</span>
          <span>湿度: ${humidity}%</span>
          <span>風速: ${wind} km/h</span>
        </div>
      </div>
      <div class="weather-header-right">
        <span class="weather-header-time">${timeStr}（${weekday}曜日）</span>
        <span class="weather-header-condition">${condition}</span>
      </div>
    </div>
  `;
}

/**
 * 1スロット（3時間ごとの1コマ）の HTML 文字列を返す。
 * @param {Object} hourly - API レスポンスの hourly オブジェクト
 * @param {number} idx    - 対象スロットの hourly 配列インデックス
 */
function renderSlot(hourly, idx) {
  const d        = new Date(hourly.time[idx]);
  const slotTime = `${String(d.getHours()).padStart(2, '0')}:00`;
  const slotDay  = WEEKDAYS[d.getDay()];
  const emoji    = WMO_EMOJI[hourly.weathercode[idx]] ?? '🌡️';
  const temp     = Math.round(hourly.temperature_2m[idx]);
  const prob     = hourly.precipitation_probability[idx] ?? '--';
  const wind     = hourly.windspeed_10m[idx];

  return `
    <div class="weather-slot">
      <p class="slot-time">${slotTime}</p>
      <p class="slot-day">${slotDay}</p>
      <p class="slot-emoji">${emoji}</p>
      <p class="slot-temp">${temp}°</p>
      <p class="slot-precip">💧${prob}%</p>
      <p class="slot-wind">💨${wind}<small>km/h</small></p>
    </div>
  `;
}

/**
 * API レスポンス全体を受け取り、ヘッダー＋3時間スロット行の HTML 文字列を返す。
 * @param {Object} data - fetchWeather() の戻り値
 */
function renderWeather(data) {
  const { hourly } = data;
  const now = new Date();

  // hourly.time 配列から現在時刻以降で最初の要素のインデックスを取得
  const curIdx = Math.max(0, hourly.time.findIndex(t => t >= toHourISO(now)));

  // 次の3時間区切り（0, 3, 6, 9, 12, 15, 18, 21時）の開始点を計算
  // 例: 現在14時なら次の区切りは15時
  const slotStart = new Date(now);
  slotStart.setHours(Math.ceil(now.getHours() / 3) * 3, 0, 0, 0);
  const startIdx = Math.max(0, hourly.time.findIndex(t => t >= toHourISO(slotStart)));

  // startIdx から3時間おきに8スロット分のインデックスを収集
  const slotIndices = Array.from({ length: 8 }, (_, i) => startIdx + i * 3)
    .filter(idx => idx < hourly.time.length); // 配列範囲外を除外

  const slotsHtml = slotIndices.map(idx => renderSlot(hourly, idx)).join('');

  return renderHeader(hourly, curIdx, now)
       + `<div class="weather-slots">${slotsHtml}</div>`;
}

export { fetchWeather, renderWeather };
