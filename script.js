document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your actual API key
    let currentUnit = 'metric'; // Default to Celsius
    
    // DOM elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const celsiusBtn = document.getElementById('celsius-btn');
    const fahrenheitBtn = document.getElementById('fahrenheit-btn');
    const currentWeatherContainer = document.getElementById('current-weather');
    const forecastContainer = document.getElementById('forecast-container');
    const alertsContainer = document.getElementById('alerts-container');
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    celsiusBtn.addEventListener('click', () => toggleUnits('metric'));
    fahrenheitBtn.addEventListener('click', () => toggleUnits('imperial'));
    
    // Initial load with default location (London)
    fetchWeather('London');
    
    // Functions
    function searchWeather() {
        const location = searchInput.value.trim();
        if (location) {
            fetchWeather(location);
        } else {
            showError('Please enter a location');
        }
    }
    
    function getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                error => {
                    showError('Unable to retrieve your location');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            showError('Geolocation is not supported by your browser');
        }
    }
    
    function toggleUnits(unit) {
        if (currentUnit !== unit) {
            currentUnit = unit;
            celsiusBtn.classList.toggle('active', unit === 'metric');
            fahrenheitBtn.classList.toggle('active', unit === 'imperial');
            
            // Refresh weather data with new units
            const currentLocation = searchInput.value.trim() || 'London';
            fetchWeather(currentLocation);
        }
    }
    
    async function fetchWeather(location) {
        try {
            // Show loading state
            currentWeatherContainer.innerHTML = '<div class="loading">Loading current weather...</div>';
            forecastContainer.innerHTML = '<div class="loading">Loading forecast...</div>';
            
            // Fetch current weather
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${currentUnit}&appid=${apiKey}`;
            const currentResponse = await fetch(currentWeatherUrl);
            
            if (!currentResponse.ok) {
                throw new Error('Location not found');
            }
            
            const currentData = await currentResponse.json();
            
            // Fetch forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${currentUnit}&appid=${apiKey}`;
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            // Update UI
            displayCurrentWeather(currentData);
            displayForecast(forecastData);
            
            // Check for alerts
            if (currentData.alerts) {
                displayAlerts(currentData.alerts);
            } else {
                alertsContainer.innerHTML = '<div class="no-alerts">No current weather alerts</div>';
            }
            
            // Update search input with the official city name
            searchInput.value = currentData.name;
            
        } catch (error) {
            showError(error.message);
            console.error('Error fetching weather data:', error);
        }
    }
    
    async function fetchWeatherByCoords(lat, lon) {
        try {
            // Show loading state
            currentWeatherContainer.innerHTML = '<div class="loading">Loading current weather...</div>';
            forecastContainer.innerHTML = '<div class="loading">Loading forecast...</div>';
            
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
            
            // Check for alerts
            if (currentData.alerts) {
                displayAlerts(currentData.alerts);
            } else {
                alertsContainer.innerHTML = '<div class="no-alerts">No current weather alerts</div>';
            }
            
            // Update search input with the official city name
            searchInput.value = currentData.name;
            
        } catch (error) {
            showError('Unable to fetch weather data for your location');
            console.error('Error fetching weather data:', error);
        }
    }
    
    function displayCurrentWeather(data) {
        const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
        const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
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
                <div><i class="fas fa-wind"></i> Wind: ${data.wind.speed} ${windUnit} ${windDirection}</div>
                <div><i class="fas fa-compress-alt"></i> Pressure: ${data.main.pressure} hPa</div>
                <div><i class="fas fa-eye"></i> Visibility: ${(data.visibility / 1000).toFixed(1)} km</div>
                <div><i class="fas fa-sun"></i> Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</div>
                <div><i class="fas fa-moon"></i> Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</div>
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
        
        // Get the next 5 days
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
                <h3>${alert.event}</h3>
                <p><strong>From:</strong> ${new Date(alert.start * 1000).toLocaleString()}</p>
                <p><strong>To:</strong> ${new Date(alert.end * 1000).toLocaleString()}</p>
                <p>${alert.description}</p>
                <p><strong>Issued by:</strong> ${alert.sender_name}</p>
            `;
            alertsContainer.appendChild(alertElement);
        });
    }
    
    function showError(message) {
        currentWeatherContainer.innerHTML = `<div class="error-message">${message}</div>`;
        forecastContainer.innerHTML = '';
        alertsContainer.innerHTML = '';
    }
    
    function getWeatherIcon(weatherCode) {
        // Map weather codes to Font Awesome icons
        if (weatherCode >= 200 && weatherCode < 300) {
            return '<i class="fas fa-bolt"></i>'; // Thunderstorm
        } else if (weatherCode >= 300 && weatherCode < 400) {
            return '<i class="fas fa-cloud-rain"></i>'; // Drizzle
        } else if (weatherCode >= 500 && weatherCode < 600) {
            return '<i class="fas fa-umbrella"></i>'; // Rain
        } else if (weatherCode >= 600 && weatherCode < 700) {
            return '<i class="fas fa-snowflake"></i>'; // Snow
        } else if (weatherCode >= 700 && weatherCode < 800) {
            return '<i class="fas fa-smog"></i>'; // Atmosphere (fog, haze, etc.)
        } else if (weatherCode === 800) {
            return '<i class="fas fa-sun"></i>'; // Clear
        } else if (weatherCode > 800) {
            return '<i class="fas fa-cloud"></i>'; // Clouds
        } else {
            return '<i class="fas fa-question"></i>'; // Unknown
        }
    }
    
    function getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((degrees % 360) / 45) % 8;
        return directions[index];
    }
});
