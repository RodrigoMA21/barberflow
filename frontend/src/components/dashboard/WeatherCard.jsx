import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function getLocale(language) {
  const lang = language || "pt";
  if (lang.startsWith("pt")) return "pt-BR";
  if (lang.startsWith("es")) return "es";
  return "en";
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? "denied" : "error")),
      { timeout: 8000, maximumAge: 600000 },
    );
  });
}

async function reverseGeocode(lat, lon, language) {
  const loc = language?.startsWith("pt") ? "pt" : language?.startsWith("es") ? "es" : "en";
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${loc}`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = await res.json();
  return data.city || data.locality || data.principalSubdivision || data.countryName || "";
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("error");
  const data = await res.json();
  const times = Array.isArray(data.daily?.time) ? data.daily.time : [];
  return {
    current: {
      temp: Math.round(Number(data.current?.temperature_2m ?? 0)),
      feels: Math.round(Number(data.current?.apparent_temperature ?? 0)),
      humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0)),
      wind: Math.round(Number(data.current?.wind_speed_10m ?? 0)),
      code: Number(data.current?.weather_code ?? 0),
    },
    daily: times.slice(0, 4).map((date, i) => ({
      date,
      code: Number(data.daily?.weather_code?.[i] ?? 0),
      max: Math.round(Number(data.daily?.temperature_2m_max?.[i] ?? 0)),
      min: Math.round(Number(data.daily?.temperature_2m_min?.[i] ?? 0)),
    })),
  };
}

function weatherInfo(code, t) {
  const c = Number(code);
  if (c === 0) return { label: t("dashboard.weatherClear"), icon: "sun" };
  if (c === 1 || c === 2) return { label: t("dashboard.weatherPartly"), icon: "sunCloud" };
  if (c === 3) return { label: t("dashboard.weatherCloudy"), icon: "cloud" };
  if (c === 45 || c === 48) return { label: t("dashboard.weatherFog"), icon: "fog" };
  if (c === 51 || c === 53 || c === 55) return { label: t("dashboard.weatherDrizzle"), icon: "drizzle" };
  if (c === 61 || c === 63 || c === 65) return { label: t("dashboard.weatherRain"), icon: "rain" };
  if (c === 66 || c === 67) return { label: t("dashboard.weatherFreezing"), icon: "snow" };
  if (c === 71 || c === 73 || c === 75 || c === 77) return { label: t("dashboard.weatherSnow"), icon: "snow" };
  if (c === 80 || c === 81 || c === 82) return { label: t("dashboard.weatherShowers"), icon: "rain" };
  if (c === 85 || c === 86) return { label: t("dashboard.weatherSnowShowers"), icon: "snow" };
  if (c === 95) return { label: t("dashboard.weatherThunder"), icon: "thunder" };
  if (c === 96 || c === 99) return { label: t("dashboard.weatherThunderHail"), icon: "hail" };
  return { label: t("dashboard.weatherCloudy"), icon: "cloud" };
}

const ICONS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="7" y2="7" />
      <line x1="17" y1="17" x2="18.7" y2="18.7" />
      <line x1="18.7" y1="5.3" x2="17" y2="7" />
      <line x1="7" y1="17" x2="5.3" y2="18.7" />
    </>
  ),
  sunCloud: (
    <>
      <circle cx="8" cy="8" r="3.5" />
      <line x1="8" y1="1.5" x2="8" y2="3" />
      <line x1="2" y1="8" x2="3.5" y2="8" />
      <line x1="13.5" y1="3" x2="12.3" y2="4.2" />
      <line x1="3" y1="13.5" x2="4.2" y2="12.3" />
      <path d="M18 17.5h-9a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 18 17.5z" />
      <path d="M18 17.5h1a2.5 2.5 0 1 0 0-5" />
    </>
  ),
  cloud: (
    <path d="M18 17h-9.5a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 18 11.5a2.5 2.5 0 0 1 0 5.5z" />
  ),
  fog: (
    <>
      <path d="M18 10.5h-9a3.5 3.5 0 0 1-.5-6.97A5 5 0 0 1 18 6.5a2.5 2.5 0 0 1 0 4z" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="4" y1="17.5" x2="20" y2="17.5" />
      <line x1="7" y1="21" x2="17" y2="21" />
    </>
  ),
  drizzle: (
    <>
      <path d="M17 12.5h-7a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 17 6.5a2.5 2.5 0 0 1 0 6z" />
      <line x1="8" y1="18" x2="8" y2="21" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </>
  ),
  rain: (
    <>
      <path d="M17 12.5h-7a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 17 6.5a2.5 2.5 0 0 1 0 6z" />
      <line x1="8" y1="18" x2="8" y2="21.5" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      <line x1="16" y1="18" x2="16" y2="21.5" />
    </>
  ),
  snow: (
    <>
      <path d="M17 12.5h-7a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 17 6.5a2.5 2.5 0 0 1 0 6z" />
      <line x1="8" y1="19" x2="8" y2="21.5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="16" y1="19" x2="16" y2="21.5" />
    </>
  ),
  thunder: (
    <>
      <path d="M17 12.5h-7a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 17 6.5a2.5 2.5 0 0 1 0 6z" />
      <polyline points="10.5 14 9 19 12 17.5 10.5 22" />
    </>
  ),
  hail: (
    <>
      <path d="M17 12.5h-7a3.5 3.5 0 0 1-.6-6.96A5 5 0 0 1 17 6.5a2.5 2.5 0 0 1 0 6z" />
      <circle cx="8.5" cy="18.5" r="0.5" />
      <circle cx="12" cy="20.5" r="0.5" />
      <circle cx="15.5" cy="18.5" r="0.5" />
    </>
  ),
};

function WeatherIcon({ name, size = 22, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[name] || ICONS.cloud}
    </svg>
  );
}

export default function WeatherCard() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("loading");
  const [city, setCity] = useState("");
  const [current, setCurrent] = useState(null);
  const [daily, setDaily] = useState([]);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const pos = await getPosition();
      const [cidade, weather] = await Promise.all([
        reverseGeocode(pos.latitude, pos.longitude, i18n.language),
        fetchWeather(pos.latitude, pos.longitude),
      ]);
      setCity(cidade);
      setCurrent(weather.current);
      setDaily(weather.daily);
      setStatus("ready");
    } catch (err) {
      setStatus(err.message === "denied" ? "denied" : "error");
    }
  }, [i18n.language]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load, reload]);

  const handleReload = () => {
    setStatus("loading");
    setReload((r) => r + 1);
  };

  const locale = getLocale(i18n.language);
  const info = current ? weatherInfo(current.code, t) : null;

  return (
    <div className="card p-6 flex flex-col card-accent-info animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-info-light text-info flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium text-text-secondary">{t("dashboard.weather")}</span>
            {city && <p className="text-xs text-text-tertiary truncate">{city}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="btn-ghost btn-icon"
          title={t("common.refresh")}
          aria-label={t("common.refresh")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
        </button>
      </div>

      {status === "loading" && (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-sm text-text-tertiary animate-pulse-soft">{t("dashboard.weatherLoading")}</div>
        </div>
      )}

      {status === "denied" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
          <p className="text-sm text-text-secondary">{t("dashboard.weatherDenied")}</p>
          <button type="button" onClick={handleReload} className="btn-secondary text-xs">
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
          <p className="text-sm text-text-secondary">{t("dashboard.weatherError")}</p>
          <button type="button" onClick={handleReload} className="btn-secondary text-xs">
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {status === "ready" && current && (
        <>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-info-light/60 text-info flex items-center justify-center shrink-0">
              <WeatherIcon name={info.icon} size={30} />
            </div>
            <div>
              <p className="text-4xl font-bold text-text tracking-tight leading-none">
                {current.temp}°<span className="text-lg font-semibold text-text-secondary">C</span>
              </p>
              <p className="text-sm text-text-secondary mt-1">{info.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="bg-surface-secondary rounded-xl px-3 py-2 text-center border border-border/50">
              <p className="text-[11px] text-text-tertiary">{t("dashboard.feelsLike")}</p>
              <p className="text-sm font-semibold text-text mt-0.5">{current.feels}°</p>
            </div>
            <div className="bg-surface-secondary rounded-xl px-3 py-2 text-center border border-border/50">
              <p className="text-[11px] text-text-tertiary">{t("dashboard.humidity")}</p>
              <p className="text-sm font-semibold text-text mt-0.5">{current.humidity}%</p>
            </div>
            <div className="bg-surface-secondary rounded-xl px-3 py-2 text-center border border-border/50">
              <p className="text-[11px] text-text-tertiary">{t("dashboard.wind")}</p>
              <p className="text-sm font-semibold text-text mt-0.5">{current.wind}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 mt-5 pt-4 border-t border-border">
            {daily.map((day, i) => {
              const d = weatherInfo(day.code, t);
              const dateLabel = i === 0
                ? t("common.today")
                : new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short" });
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-[11px] text-text-secondary capitalize">{dateLabel}</span>
                  <WeatherIcon name={d.icon} size={18} className="text-text-secondary" />
                  <span className="text-xs font-semibold text-text tabular-nums">{day.max}°</span>
                  <span className="text-[11px] text-text-tertiary tabular-nums">{day.min}°</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
