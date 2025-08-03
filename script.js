document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const apiKey = 'dab09b6a8c6783e9ee39d9af2900f195'; // Replace with your actual API key
    let currentUnit = 'metric'; // Default to Celsius
    
    // DOM elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const celsiusBtn = document.getElementById('celsius-btn');
    const fahrenheitBtn = document.getElementById('fahrenheit-btn');
    const currentWeatherContainer = document.getElementById('current-weather');
    const forecastContainer = document.getElementById('forecast-container');
    const alertsContainer = document.getElementById('alerts-container');
    const lastUpdatedSpan = document.getElementById('last-updated');
    
    // Check for saved location or use default
    const savedLocation = localStorage.getItem('lastLocation') || 'London';
    searchInput.value = savedLocation;
    
    // Initial load
    fetchWeather(savedLocation);
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    refreshBtn.addEventListener('click', refreshWeather);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    celsiusBtn.addEventListener('click', () => toggleUnits('metric', event));
    fahrenheitBtn.addEventListener('click', () => toggleUnits('imperial', event));
    
    // Functions
    function searchWeather() {
        const location = searchInput.value.trim();
        if (location) {
            // Show loading state
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            fetchWeather(location);
            
            // Reset button after delay
            setTimeout(() => {
                searchBtn.innerHTML = '<i class="fas fa-search"></i>';
            }, 1000);
        } else {
            showError('Please enter a location');
        }
    }
    
    function refreshWeather() {
        const location = searchInput.value.trim() || savedLocation;
        // Show loading state with spin animation
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        fetchWeather(location);
        
        // Reset button after delay
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 1000);
    }
    
    function getLocationWeather() {
        if (navigator.geolocation) {
            // Show loading state
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                    
                    // Reset button
                    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                },
                error => {
                    showError('Unable to retrieve your location');
                    console.error('Geolocation error:', error);
                    
                    // Reset button
                    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                }
            );
        } else {
            showError('Geolocation is not supported by your browser');
        }
    }
    
    function toggleUnits(unit, event) {
        if (currentUnit !== unit) {
            currentUnit = unit;
            celsiusBtn.classList.toggle('active', unit === 'metric');
            fahrenheitBtn.classList.toggle('active', unit === 'imperial');
            
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            event.target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
            
            // Refresh weather data with new units
            const currentLocation = searchInput.value.trim() || savedLocation;
            fetchWeather(currentLocation);
        }
    }
    
    async function fetchWeather(location) {
        try {
            // Show loading state
            showLoading(currentWeatherContainer);
            showLoading(forecastContainer);
            
            // Fetch current weather
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${currentUnit}&appid=${apiKey}`;
            const currentResponse = await fetch(currentWeatherUrl);
            
            if (!currentResponse.ok) {
                throw new Error('Location not found. Please try another city.');
            }
            
            const currentData = await currentResponse.json();
            
            // Fetch forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${currentUnit}&appid=${apiKey}`;
            const forecastResponse = await fetch(forecastUrl);
            
            if (!forecastResponse.ok) {
                throw new Error('Could not load forecast data');
            }
            
            const forecastData = await forecastResponse.json();
            
            // Update UI
            displayCurrentWeather(currentData);
            displayForecast(forecastData);
            updateDynamicBackground(currentData.weather[0].id);
            
            // Check for alerts (OpenWeatherMap One Call API would be better for alerts)
            if (currentData.alerts) {
                displayAlerts(currentData.alerts);
            } else {
                alertsContainer.innerHTML = '<div class="no-alerts">No current weather alerts</div>';
            }
            
            // Update search input with the official city name
            searchInput.value = currentData.name;
            
            // Save location to localStorage
            localStorage.setItem('lastLocation', currentData.name);
            
            // Update last updated time
            const now = new Date();
            lastUpdatedSpan.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            
        } catch (error) {
            showError(error.message);
            console.error('Error fetching weather data:', error);
        }
    }
    
    async function fetchWeatherByCoords(lat, lon) {
        try {
            // Show loading state
            showLoading(currentWeatherContainer);
            showLoading(forecastContainer);
            
            // Fetch current weather
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
            const currentResponse = await fetch(currentWeatherUrl);
            const currentData = await currentResponse.json();
            
            // Fetch forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            // Update UI
            displayCurrentWeather(currentData);
            displayForecast(forecastData);
            updateDynamicBackground(currentData.weather[0].id);
            
            // Check for alerts
            if (currentData.alerts) {
                displayAlerts(currentData.alerts);
            } else {
                alertsContainer.innerHTML = '<div class="no-alerts">No current weather alerts</div>';
            }
            
            // Update search input with the official city name
            searchInput.value = currentData.name;
            
            // Save location to localStorage
            localStorage.setItem('lastLocation', currentData.name);
            
            // Update last updated time
            const now = new Date();
            lastUpdatedSpan.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            
        } catch (error) {
            showError('Unable to fetch weather data for your location');
            console.error('Error fetching weather data:', error);
        }
    }
    
    function displayCurrentWeather(data) {
        const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
        const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
        const windDirection = getWindDirection(data.wind.deg);
        const weatherIcon = getWeatherIcon(data.weather[0].id);
        
        currentWeatherContainer.innerHTML = `
            <div class="weather-main">
                <h2>${data.name}, ${data.sys.country}</h2>
                <div class="weather-icon">${weatherIcon}</div>
                <div class="temperature">${Math.round(data.main.temp)}${tempUnit}</div>
                <div class="weather-description">${data.weather[0].description}</div>
            </div>
            <div class="weather-details">
                <div><i class="fas fa-temperature-high"></i> Feels like: ${Math.round(data.main.feels_like)}${tempUnit}</div>
                <div><i class="fas fa-tint"></i> Humidity: ${data.main.humidity}%</div>
                <div><i class="fas fa-wind"></i> Wind: ${data.wind.speed} ${speedUnit} ${windDirection}</div>
                <div><i class="fas fa-compress-alt"></i> Pressure: ${data.main.pressure} hPa</div>
                <div><i class="fas fa-eye"></i> Visibility: ${(data.visibility / 1000).toFixed(1)} km</div>
                <div><i class="fas fa-sun"></i> Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div><i class="fas fa-moon"></i> Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
    }
    
    function displayForecast(data) {
        // Group forecast by day
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyForecast[date]) {
                dailyForecast[date] = [];
            }
            dailyForecast[date].push(item);
        });
        
        // Get the next 5 days (skip today)
        const forecastDays = Object.keys(dailyForecast).slice(1, 6);
        
        let forecastHTML = '';
        forecastDays.forEach(day => {
            const dayData = dailyForecast[day];
            const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Get min and max temps for the day
            const temps = dayData.map(item => item.main.temp);
            const maxTemp = Math.round(Math.max(...temps));
            const minTemp = Math.round(Math.min(...temps));
            
            // Get most common weather condition for the day
            const weatherConditions = {};
            dayData.forEach(item => {
                const condition = item.weather[0].id;
                weatherConditions[condition] = (weatherConditions[condition] || 0) + 1;
            });
            const mostCommonCondition = parseInt(Object.keys(weatherConditions).reduce((a, b) => 
                weatherConditions[a] > weatherConditions[b] ? a : b
            ));
            
            const weatherIcon = getWeatherIcon(mostCommonCondition);
            const weatherDescription = dayData.find(item => 
                item.weather[0].id === mostCommonCondition
            ).weather[0].description;
            
            const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
            
            forecastHTML += `
                <div class="forecast-day">
                    <h3>${dayName}</h3>
                    <div>${dateStr}</div>
                    <div class="forecast-icon">${weatherIcon}</div>
                    <div>${weatherDescription}</div>
                    <div class="forecast-temp">
                        <span class="high-temp">${maxTemp}${tempUnit}</span>
                        <span class="low-temp">${minTemp}${tempUnit}</span>
                    </div>
                </div>
            `;
        });
        
        forecastContainer.innerHTML = forecastHTML;
    }
    
    function displayAlerts(alerts) {
        alertsContainer.innerHTML = '';
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = 'alert-card';
            alertElement.innerHTML = `
                <h3><i class="fas fa-exclamation-circle"></i> ${alert.event}</h3>
                <p><strong>From:</strong> ${new Date(alert.start * 1000).toLocaleString()}</p>
                <p><strong>To:</strong> ${new Date(alert.end * 1000).toLocaleString()}</p>
                <p>${alert.description}</p>
                <p><strong>Issued by:</strong> ${alert.sender_name}</p>
            `;
            alertsContainer.appendChild(alertElement);
        });
    }
    
    function showLoading(container) {
        container.innerHTML = `
            <div class="skeleton-loading">
                <div class="skeleton-line" style="width: 70%"></div>
                <div class="skeleton-line" style="width: 50%"></div>
                <div class="skeleton-icon"></div>
                <div class="skeleton-line" style="width: 60%"></div>
            </div>
        `;
    }
    
    function showError(message) {
        currentWeatherContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <p>Please try another location or check your spelling.</p>
            </div>
        `;
        forecastContainer.innerHTML = '';
        alertsContainer.innerHTML = '';
    }
    
    function updateDynamicBackground(weatherId) {
        const body = document.body;
        body.className = ''; // Clear previous classes
        
        if (weatherId >= 200 && weatherId < 300) {
            body.classList.add('thunderstorm');
        } else if (weatherId >= 300 && weatherId < 600) {
            body.classList.add('rainy');
        } else if (weatherId >= 600 && weatherId < 700) {
            body.classList.add('snowy');
        } else if (weatherId === 800) {
            body.classList.add('sunny');
        } else if (weatherId > 800) {
            body.classList.add('cloudy');
        }
    }
    
    function getWeatherIcon(weatherCode) {
        // Clear
        if (weatherCode === 800) {
            return '<i class="fas fa-sun"></i>';
        }
        // Clouds
        if (weatherCode === 801) return '<i class="fas fa-cloud-sun"></i>';
        if (weatherCode === 802) return '<i class="fas fa-cloud"></i>';
        if (weatherCode > 802) return '<i class="fas fa-clouds"></i>';
        // Rain
        if (weatherCode >= 500 && weatherCode < 600) {
            if (weatherCode < 520) return '<i class="fas fa-cloud-rain"></i>';
            return '<i class="fas fa-umbrella"></i>';
        }
        // Thunderstorm
        if (weatherCode >= 200 && weatherCode < 300) {
            return '<i class="fas fa-bolt"></i>';
        }
        // Snow
        if (weatherCode >= 600 && weatherCode < 700) {
            return '<i class="far fa-snowflake"></i>';
        }
        // Atmosphere
        if (weatherCode >= 700 && weatherCode < 800) {
            if (weatherCode === 701) return '<i class="fas fa-smog"></i>';
            if (weatherCode === 711) return '<i class="fas fa-fire"></i>';
            if (weatherCode === 721) return '<i class="fas fa-sun-haze"></i>';
            if (weatherCode === 731) return '<i class="fas fa-wind"></i>';
            if (weatherCode === 741) return '<i class="fas fa-fog"></i>';
            if (weatherCode === 751) return '<i class="fas fa-wind"></i>';
            return '<i class="fas fa-smog"></i>';
        }
        // Default
        return '<i class="fas fa-cloud"></i>';
    }
    
    function getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((degrees % 360) / 45) % 8;
        return directions[index];
    }
});
