/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

export default function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [displayCountry, setDisplayCountry] = useState("");
  const [weather, setWeather] = useState({});

  function handleChangeLoaction(e) {
    setLocation(e.target.value);
  }

  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
  }, []);

  useEffect(() => {
    async function fetchLocation() {
      if (location.length <= 2) return setWeather({});
      // console.log(location)

      try {
        setIsLoading(true);

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();
        // console.log(geoData)

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country } =
          geoData.results.at(0);

        setDisplayLocation(name);
        setDisplayCountry(country);

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        // console.log(weatherData.daily)
        setWeather(weatherData.daily);
        // console.log(weather)

        localStorage.setItem("location", location);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocation();
  }, [location]);

  return (
    <div className="app">
      <h1>Funcy Weather</h1>
      <Input location={location} onChangeLoaction={handleChangeLoaction} />
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && (
        <Weather
          weather={weather}
          location={displayLocation}
          country={displayCountry}
        />
      )}
    </div>
  );
}

function Input({ location, onChangeLoaction }) {
  return (
    <div>
      <input
        value={location}
        onChange={onChangeLoaction}
        type="text"
        placeholder="Enter city or location..."
      />
    </div>
  );
}

function Weather({ weather, location, country }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  return (
    <div>
      <div className="location-title">
        <h2>
          <span>Weather </span> {location}
        </h2>
        <span>{country}</span>
      </div>

      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ code, date, isToday, min, max }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; - <strong>{Math.ceil(max)}</strong>
      </p>
    </li>
  );
}

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
