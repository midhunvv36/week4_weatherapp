import { CONFIG } from './config.js';

export class WeatherService {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        return res.json();
    }

    getCurrentWeather(city) {
        return this.fetchJson(
            `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${this.apiKey}`
        );
    }

    getForecast(city) {
        return this.fetchJson(
            `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${this.apiKey}`
        );
    }

    // ✅ NO hard-coded URL
    searchCities(query) {
        return this.fetchJson(
            `${CONFIG.GEO_BASE_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`
        );
    }

    getByCoords(lat, lon) {
        return this.fetchJson(
            `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`
        );
    }
}
