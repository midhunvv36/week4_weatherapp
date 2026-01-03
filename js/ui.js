export class WeatherUI {
    constructor() {
        this.currentWeatherEl = document.getElementById('currentWeather');
        this.forecastEl = document.getElementById('forecast');
        this.unitToggle = document.getElementById('unitToggle');
        this.unit = 'celsius';

        this.currentData = null;
        this.forecastData = null;
    }

    showLoading() {
        this.currentWeatherEl.innerHTML = '<div class="loading">Loading...</div>';
        this.forecastEl.innerHTML = '';
    }

    showError(msg) {
        this.currentWeatherEl.innerHTML = `<div class="error">${msg}</div>`;
    }

displayCurrentWeather(data) {
    this.currentData = data; // important for unit toggle

    const iconCode = data.weather[0].icon;
    const description = data.weather[0].description;

    this.currentWeatherEl.innerHTML = `
        <div class="card current-card">
            <h2>${data.name}, ${data.sys.country}</h2>

            <div class="current-icon">
                <img
                    src="${this.getIconPath(iconCode)}"
                    alt="${description}">
            </div>

            <div class="current-temp">
                ${this.convert(data.main.temp)}°
            </div>

            <div class="current-desc">
                ${description}
            </div>

            <div class="current-extra">
                Humidity: ${data.main.humidity}% &nbsp;
                Wind: ${data.wind.speed} m/s
            </div>
        </div>
    `;
}


displayForecast(data) {
    this.forecastData = data;

    // daysMap: { "Mon Jan 01 2026": { tempsMin: [], tempsMax: [], icon, desc, dt } }
    const daysMap = {};

    // 1) Group entries by date and collect min/max temps for the whole day
    data.list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const key = dateObj.toDateString();

        if (!daysMap[key]) {
            daysMap[key] = {
                tempsMin: [],
                tempsMax: [],
                icon: item.weather?.[0]?.icon || '01d',
                desc: item.weather?.[0]?.description || '',
                dt: item.dt
            };
        }

        // collect temps across the day
        daysMap[key].tempsMin.push(item.main.temp_min);
        daysMap[key].tempsMax.push(item.main.temp_max);

        // 2) Prefer the icon/desc around noon for that day (looks best)
        if (dateObj.getHours() === 12) {
            daysMap[key].icon = item.weather?.[0]?.icon || daysMap[key].icon;
            daysMap[key].desc = item.weather?.[0]?.description || daysMap[key].desc;
            daysMap[key].dt = item.dt;
        }
    });

    // Convert grouped object to array in chronological order
    const dayEntries = Object.entries(daysMap)
        .map(([key, val]) => ({ key, ...val }))
        .sort((a, b) => a.dt - b.dt);

    // If you want to exclude "today" from forecast list, uncomment below:
    // const todayKey = new Date().toDateString();
    // const filtered = dayEntries.filter(d => d.key !== todayKey);
    // const fiveDays = filtered.slice(0, 5);

    const fiveDays = dayEntries.slice(0, 5);

    // 3) Render
    this.forecastEl.innerHTML = `
        <div class="forecast-grid">
            ${fiveDays.map(d => {
                const date = new Date(d.dt * 1000);

                const minVal = Math.min(...d.tempsMin);
                const maxVal = Math.max(...d.tempsMax);

                return `
                    <div class="forecast-card">
                        <div class="forecast-day">
                            ${date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>

                        <div class="forecast-icon">
                            <img
                                src="${this.getIconPath(d.icon)}"
                                alt="${d.desc}">
                        </div>

                        <div class="forecast-temp">
                            <span class="max">${this.convert(maxVal)}°</span>
                            <span class="min">${this.convert(minVal)}°</span>
                        </div>

                        <div class="forecast-desc">
                            ${d.desc}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}



    toggleUnit() {
        this.unit = this.unit === 'celsius' ? 'fahrenheit' : 'celsius';
        this.unitToggle.textContent = `Switch to °${this.symbol()}`;
        if (this.currentData) this.displayCurrentWeather(this.currentData);
        if (this.forecastData) this.displayForecast(this.forecastData);
    }

    convert(t) {
        return this.unit === 'celsius'
            ? Math.round(t)
            : Math.round(t * 9 / 5 + 32);
    }

    symbol() {
        return this.unit === 'celsius' ? 'C' : 'F';
    }

    getIconPath(iconCode) {
        
    return `asset/icons/${iconCode}@2x.png`;
}

}
