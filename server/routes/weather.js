const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();

// =====================================================
// CONFIGURATION
// =====================================================

// Successful weather data will be reused for 30 minutes.
const CACHE_DURATION_MS = 30 * 60 * 1000;

// In-memory cache:
// storageId -> { timestamp, data }
const weatherCache = new Map();


// =====================================================
// OPEN-METEO WEATHER CODE -> DESCRIPTION
// =====================================================

function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";

  if ([1, 2].includes(code)) {
    return "Partly cloudy";
  }

  if (code === 3) {
    return "Overcast";
  }

  if ([45, 48].includes(code)) {
    return "Foggy";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "Drizzle";
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return "Rain";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "Snow";
  }

  if ([80, 81, 82].includes(code)) {
    return "Rain showers";
  }

  if ([85, 86].includes(code)) {
    return "Snow showers";
  }

  if ([95, 96, 99].includes(code)) {
    return "Thunderstorm";
  }

  return "Unknown";
}


// =====================================================
// SOLAR AVAILABILITY - OPEN-METEO
// =====================================================

function getSolarAvailability(
  solarRadiation,
  cloudCover,
  precipitationProbability
) {
  if (
    solarRadiation >= 18 &&
    cloudCover <= 45 &&
    precipitationProbability < 50
  ) {
    return "HIGH";
  }

  if (
    solarRadiation >= 10 &&
    cloudCover <= 75
  ) {
    return "MODERATE";
  }

  return "LOW";
}


// =====================================================
// SOLAR AVAILABILITY - WEATHERAPI FALLBACK
// =====================================================
//
// WeatherAPI fallback may not provide the same daily
// shortwave radiation field used by Open-Meteo.
//
// Therefore DO NOT invent solar radiation.
//
// Instead, estimate availability conservatively from
// cloud cover and rain probability.
//
// =====================================================

function getFallbackSolarAvailability(
  cloudCover,
  precipitationProbability
) {
  if (
    cloudCover <= 35 &&
    precipitationProbability < 40
  ) {
    return "HIGH";
  }

  if (
    cloudCover <= 75 &&
    precipitationProbability < 70
  ) {
    return "MODERATE";
  }

  return "LOW";
}


// =====================================================
// VOOLER ENERGY STRATEGY
// =====================================================

function getEnergyStrategy(solarAvailability) {
  if (solarAvailability === "HIGH") {
    return {
      mode: "ACTIVE COOLING + PCM CHARGING",

      recommendation:
        "Strong solar availability expected. Prioritize active chamber cooling and use surplus solar energy to freeze or charge the PCM thermal storage.",
    };
  }

  if (solarAvailability === "MODERATE") {
    return {
      mode: "BALANCED OPERATION",

      recommendation:
        "Moderate solar availability expected. Maintain chamber cooling while balancing battery use and PCM charging according to available solar energy.",
    };
  }

  return {
    mode: "PCM SUPPORT + ENERGY CONSERVATION",

    recommendation:
      "Low solar availability expected. Conserve battery energy and rely more on stored PCM cooling to reduce compressor demand where possible.",
  };
}


// =====================================================
// GET VALID CACHE
// =====================================================

function getValidCache(storageId) {
  const cached = weatherCache.get(storageId);

  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;

  if (age > CACHE_DURATION_MS) {
    return null;
  }

  return {
    ...cached.data,

    cached: true,

    cacheAgeMinutes:
      Math.floor(age / 60000),
  };
}


// =====================================================
// GET STALE CACHE
// =====================================================
//
// If both weather providers fail, stale weather is still
// better than completely removing weather information.
//
// =====================================================

function getStaleCache(storageId) {
  const cached = weatherCache.get(storageId);

  if (!cached) {
    return null;
  }

  return {
    ...cached.data,

    cached: true,

    stale: true,

    message:
      "Using the most recently available weather forecast because live weather services are temporarily unavailable.",
  };
}


// =====================================================
// SAVE CACHE
// =====================================================

function saveCache(storageId, data) {
  weatherCache.set(storageId, {
    timestamp: Date.now(),
    data,
  });
}


// =====================================================
// FETCH FROM OPEN-METEO
// =====================================================

async function fetchOpenMeteo(
  latitude,
  longitude
) {
  const params =
    new URLSearchParams({
      latitude:
        latitude.toString(),

      longitude:
        longitude.toString(),

      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunshine_duration",
        "shortwave_radiation_sum",
        "cloud_cover_mean",
      ].join(","),

      timezone: "auto",

      forecast_days: "4",
  });

  const weatherURL =
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  console.log(
    "Attempting Open-Meteo weather request..."
  );

  const response =
    await fetch(weatherURL);

  if (!response.ok) {
    const errorBody =
      await response.text();

    console.error(
      "Open-Meteo failed:",
      response.status,
      errorBody
    );

    return null;
  }

  const weatherData =
    await response.json();

  if (
    !weatherData.daily ||
    !Array.isArray(
      weatherData.daily.time
    )
  ) {
    console.error(
      "Invalid Open-Meteo response:",
      weatherData
    );

    return null;
  }

  const forecast =
    weatherData.daily.time.map(
      (date, index) => {
        const weatherCode =
          weatherData.daily
            .weather_code?.[index] ??
          null;

        const maxTemperature =
          weatherData.daily
            .temperature_2m_max?.[index] ??
          null;

        const minTemperature =
          weatherData.daily
            .temperature_2m_min?.[index] ??
          null;

        const precipitationProbability =
          weatherData.daily
            .precipitation_probability_max?.[
              index
            ] ?? 0;

        const sunshineSeconds =
          weatherData.daily
            .sunshine_duration?.[index] ??
          0;

        const solarRadiation =
          weatherData.daily
            .shortwave_radiation_sum?.[
              index
            ] ?? 0;

        const cloudCover =
          weatherData.daily
            .cloud_cover_mean?.[index] ??
          0;

        const sunshineHours =
          Number(
            (
              sunshineSeconds /
              3600
            ).toFixed(1)
          );

        const solarAvailability =
          getSolarAvailability(
            solarRadiation,
            cloudCover,
            precipitationProbability
          );

        const strategy =
          getEnergyStrategy(
            solarAvailability
          );

        return {
          date,

          weatherCode,

          condition:
            getWeatherDescription(
              weatherCode
            ),

          temperature: {
            max: maxTemperature,
            min: minTemperature,
          },

          precipitationProbability,

          cloudCover,

          sunshineHours,

          solarRadiation,

          solarAvailability,

          strategy,
        };
      }
    );

  return {
    provider: "Open-Meteo",

    timezone:
      weatherData.timezone,

    forecast,
  };
}


// =====================================================
// FETCH FROM WEATHERAPI
// =====================================================

async function fetchWeatherAPI(
  latitude,
  longitude
) {
  const apiKey =
    process.env.WEATHER_API_KEY;

  if (!apiKey) {
    console.error(
      "WEATHER_API_KEY is missing from environment variables."
    );

    return null;
  }

  const location =
    `${latitude},${longitude}`;

  const params =
    new URLSearchParams({
      key: apiKey,

      q: location,

      days: "4",

      aqi: "no",

      alerts: "no",
    });

  const weatherURL =
    `https://api.weatherapi.com/v1/forecast.json?${params.toString()}`;

  console.log(
    "Attempting WeatherAPI fallback..."
  );

  const response =
    await fetch(weatherURL);

  if (!response.ok) {
    const errorBody =
      await response.text();

    console.error(
      "WeatherAPI failed:",
      response.status,
      errorBody
    );

    return null;
  }

  const weatherData =
    await response.json();

  if (
    !weatherData.forecast ||
    !Array.isArray(
      weatherData.forecast.forecastday
    )
  ) {
    console.error(
      "Invalid WeatherAPI response:",
      weatherData
    );

    return null;
  }

  const forecast =
    weatherData.forecast.forecastday.map(
      (dayData) => {
        const day =
          dayData.day || {};

        const hourData =
          Array.isArray(dayData.hour)
            ? dayData.hour
            : [];

        // -----------------------------------------------
        // Average hourly cloud cover for the day
        // -----------------------------------------------

        let cloudCover = 0;

        if (hourData.length > 0) {
          const totalCloud =
            hourData.reduce(
              (sum, hour) =>
                sum +
                Number(hour.cloud || 0),
              0
            );

          cloudCover =
            Math.round(
              totalCloud /
              hourData.length
            );
        }

        // -----------------------------------------------
        // Rain probability
        // -----------------------------------------------

        const precipitationProbability =
          Number(
            day.daily_chance_of_rain ??
            0
          );

        // -----------------------------------------------
        // Sunshine estimate
        // -----------------------------------------------
        //
        // WeatherAPI gives daylight information through
        // astronomy, but daylight != actual sunshine.
        //
        // Therefore we deliberately do not invent
        // sunshine duration.
        //
        // -----------------------------------------------

        const sunshineHours = null;

        // -----------------------------------------------
        // Solar radiation
        // -----------------------------------------------
        //
        // Not available as the same daily field used by
        // our Open-Meteo calculation.
        //
        // -----------------------------------------------

        const solarRadiation = null;

        const solarAvailability =
          getFallbackSolarAvailability(
            cloudCover,
            precipitationProbability
          );

        const strategy =
          getEnergyStrategy(
            solarAvailability
          );

        return {
          date:
            dayData.date,

          weatherCode:
            day.condition?.code ??
            null,

          condition:
            day.condition?.text ||
            "Weather data available",

          temperature: {
            max:
              day.maxtemp_c ??
              null,

            min:
              day.mintemp_c ??
              null,
          },

          precipitationProbability,

          cloudCover,

          sunshineHours,

          solarRadiation,

          solarAvailability,

          strategy,

          estimatedSolarAvailability:
            true,
        };
      }
    );

  return {
    provider: "WeatherAPI",

    timezone:
      weatherData.location?.tz_id ||
      null,

    forecast,
  };
}


// =====================================================
// WEATHER ROUTE
// =====================================================
//
// GET /api/weather/CS001
//
// =====================================================

router.get(
  "/:storageId",
  async (req, res) => {
    try {
      const storageId =
        req.params.storageId.trim();


      // =================================================
      // 1. CHECK CACHE
      // =================================================

      const cached =
        getValidCache(storageId);

      if (cached) {
        console.log(
          `Weather cache HIT: ${storageId}`
        );

        return res
          .status(200)
          .json(cached);
      }


      console.log(
        `Weather cache MISS: ${storageId}`
      );


      // =================================================
      // 2. FIND INSTALLATION LOCATION
      // =================================================

      const farmerWithLocation =
        await Farmer.findOne({
          storageId,

          "location.latitude": {
            $ne: null,
          },

          "location.longitude": {
            $ne: null,
          },
        });


      // =================================================
      // 3. CHECK STORAGE
      // =================================================

      if (!farmerWithLocation) {
        const storageExists =
          await Farmer.exists({
            storageId,
          });

        if (!storageExists) {
          return res
            .status(404)
            .json({
              success: false,

              message:
                "Storage unit not found",
            });
        }

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Installation location has not been configured for this storage unit",
          });
      }


      // =================================================
      // 4. READ LOCATION
      // =================================================

      const latitude =
        Number(
          farmerWithLocation
            .location.latitude
        );

      const longitude =
        Number(
          farmerWithLocation
            .location.longitude
        );

      const placeName =
        farmerWithLocation
          .location.placeName || "";


      // =================================================
      // 5. VALIDATE LOCATION
      // =================================================

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid installation location configured for this storage unit",
          });
      }


      // =================================================
      // 6. TRY OPEN-METEO
      // =================================================

      let weather =
        await fetchOpenMeteo(
          latitude,
          longitude
        );


      // =================================================
      // 7. FALLBACK TO WEATHERAPI
      // =================================================

      if (!weather) {
        console.log(
          "Open-Meteo unavailable. Switching to WeatherAPI..."
        );

        weather =
          await fetchWeatherAPI(
            latitude,
            longitude
          );
      }


      // =================================================
      // 8. BOTH PROVIDERS FAILED
      // =================================================

      if (!weather) {
        console.error(
          "Both weather providers failed."
        );

        const staleCache =
          getStaleCache(storageId);

        if (staleCache) {
          return res
            .status(200)
            .json(staleCache);
        }

        return res
          .status(503)
          .json({
            success: false,

            message:
              "Weather services are temporarily unavailable",
          });
      }


      // =================================================
      // 9. BUILD RESPONSE
      // =================================================

      const responseData = {
        success: true,

        storageId,

        location: {
          latitude,
          longitude,
          placeName,
        },

        timezone:
          weather.timezone,

        provider:
          weather.provider,

        forecast:
          weather.forecast,
      };


      // =================================================
      // 10. CACHE RESULT
      // =================================================

      saveCache(
        storageId,
        responseData
      );


      console.log(
        `Weather loaded from ${weather.provider}`
      );

      console.log(
        `Weather cached for ${storageId}`
      );


      // =================================================
      // 11. RETURN
      // =================================================

      return res
        .status(200)
        .json({
          ...responseData,

          cached: false,
        });
    } catch (error) {
      console.error(
        "Weather route error:",
        error
      );


      // =================================================
      // EMERGENCY STALE CACHE
      // =================================================

      const storageId =
        req.params.storageId
          ?.trim();

      const staleCache =
        getStaleCache(storageId);

      if (staleCache) {
        return res
          .status(200)
          .json(staleCache);
      }


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve weather forecast",
        });
    }
  }
);


module.exports = router;