import { CONFIG } from './config.js';
import { WeatherService } from './weatherService.js';
import { Storage } from './storage.js';
import { WeatherUI } from './ui.js';

const service = new WeatherService(CONFIG.API_KEY, CONFIG.BASE_URL);
const ui = new WeatherUI();

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const autoList = document.getElementById('autocompleteList');

let debounceTimer;

async function loadWeather(city) {
    try {
        ui.showLoading();

        const cacheKey = `weather_${city}`;
        const cached = Storage.load(cacheKey);

        if (cached && Date.now() - cached.time < CONFIG.CACHE_DURATION) {
            ui.displayCurrentWeather(cached.current);
            ui.displayForecast(cached.forecast);
            return;
        }

        const current = await service.getCurrentWeather(city);
        const forecast = await service.getForecast(city);

        Storage.save(cacheKey, { current, forecast, time: Date.now() });

        ui.displayCurrentWeather(current);
        ui.displayForecast(forecast);
    } catch {
        ui.showError('City not found or API error');
    }
}

/* =========================
   🔍 AUTOCOMPLETE
   ========================= */
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);

    const q = searchInput.value.trim();
    if (q.length < 2) {
        autoList.innerHTML = '';
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            const cities = await service.searchCities(q);

            autoList.innerHTML = cities
                .map(c => `<div class="autocomplete-item">${c.name}, ${c.country}</div>`)
                .join('');

            [...autoList.children].forEach((el, i) => {
                el.onclick = () => {
                    searchInput.value = cities[i].name;
                    autoList.innerHTML = '';
                    loadWeather(cities[i].name);
                };
            });
        } catch {
            autoList.innerHTML = '';
        }
    }, 300);
});

// Robust "click outside" (doesn't depend on wrapper class)
document.addEventListener('click', e => {
    const clickedInside =
        e.target.closest('#searchInput') ||
        e.target.closest('#autocompleteList');
    if (!clickedInside) autoList.innerHTML = '';
});

searchBtn.onclick = () => {
    const city = searchInput.value.trim();
    if (city) loadWeather(city);
};

document.getElementById('unitToggle').onclick = () => ui.toggleUnit();

/* =========================
   📍 GEOLOCATION
   ========================= */
document.getElementById('locationBtn').onclick = () => {
    navigator.geolocation.getCurrentPosition(
        async pos => {
            try {
                ui.showLoading();

                // Get current weather by coordinates
                const data = await service.getByCoords(
                    pos.coords.latitude,
                    pos.coords.longitude
                );

                // Show current weather immediately
                ui.displayCurrentWeather(data);

                // Then load full (current + forecast) using city name returned by API
                // (This reuses your existing loadWeather logic)
                if (data && data.name) {
                    loadWeather(data.name);
                } else {
                    ui.showError('Unable to detect city name from location');
                }
            } catch {
                ui.showError('Unable to fetch weather for location');
            }
        },
        () => ui.showError('Location permission denied')
    );
};

/* =========================
   🌙 THEME (Light/Dark)
   ========================= */
const themeBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }
}

// Apply saved theme even if button is missing
const savedTheme = Storage.load('theme')?.value || 'light';
applyTheme(savedTheme);

if (themeBtn) {
    themeBtn.onclick = () => {
        const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        Storage.save('theme', { value: next, time: Date.now() });
        applyTheme(next);
    };
}
