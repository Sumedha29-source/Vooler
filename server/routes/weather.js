const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();

// =====================================================
// WEATHER CACHE
// =====================================================
//
// Weather does not need to be fetched from Open-Meteo
// every time a farmer opens the dashboard.
//
// Cache is stored per storage unit.
//
// Example:
// CS001 -> cached forecast
//
// =====================================================

const weatherCache = new Map();

// Cache successful forecasts for 30 minutes.
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;


// =====================================================
// WEATHER CODE -> DESCRIPTION
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
// SOLAR AVAILABILITY
// =====================================================

function getSolarAvailability(
  solarRadiation,
  cloudCover,
  precipitationProbability
) {
  // VOOLER prototype decision rules.

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
// GET WEATHER FOR STORAGE UNIT
// =====================================================
//
// GET /api/weather/CS001
//
// =====================================================

router.get("/:storageId", async (req, res) => {
  try {
    const storageId = req.params.storageId.trim();

    // =================================================
    // CHECK CACHE FIRST
    // =================================================

    const cachedWeather = weatherCache.get(storageId);

    if (cachedWeather) {
      const cacheAge =
        Date.now() - cachedWeather.timestamp;

      if (cacheAge < WEATHER_CACHE_DURATION) {
        console.log(
          `Weather cache HIT for ${storageId}`
        );

        return res.status(200).json({
          ...cachedWeather.data,

          cached: true,

          cacheAgeMinutes: Math.floor(
            cacheAge / 60000
          ),
        });
      }
    }

    console.log(
      `Weather cache MISS for ${storageId}`
    );


    // =================================================
    // FIND STORAGE INSTALLATION LOCATION
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
    // CHECK STORAGE
    // =================================================

    if (!farmerWithLocation) {
      const storageExists =
        await Farmer.exists({
          storageId,
        });

      if (!storageExists) {
        return res.status(404).json({
          success: false,

          message:
            "Storage unit not found",
        });
      }

      return res.status(400).json({
        success: false,

        message:
          "Installation location has not been configured for this storage unit",
      });
    }


    // =================================================
    // READ LOCATION
    // =================================================

    const latitude = Number(
      farmerWithLocation.location.latitude
    );

    const longitude = Number(
      farmerWithLocation.location.longitude
    );

    const placeName =
      farmerWithLocation.location.placeName || "";


    // =================================================
    // VALIDATE LOCATION
    // =================================================

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid installation location configured for this storage unit",
      });
    }


    // =================================================
    // BUILD OPEN-METEO REQUEST
    // =================================================

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
      `Requesting Open-Meteo weather for ${storageId}`
    );


    // =================================================
    // FETCH OPEN-METEO
    // =================================================

    const weatherResponse =
      await fetch(weatherURL);


    // =================================================
    // OPEN-METEO FAILURE
    // =================================================

    if (!weatherResponse.ok) {
      const errorBody =
        await weatherResponse.text();

      console.error(
        "Open-Meteo request failed:",
        weatherResponse.status,
        errorBody
      );


      // ===============================================
      // FALLBACK TO OLD CACHE
      // ===============================================
      //
      // Even if cache is older than 30 minutes,
      // old weather is better than showing nothing
      // during temporary API failure.
      //
      // ===============================================

      if (cachedWeather) {
        console.log(
          `Using stale weather cache for ${storageId}`
        );

        return res.status(200).json({
          ...cachedWeather.data,

          cached: true,

          stale: true,

          message:
            "Using previously stored weather forecast because the weather service is temporarily unavailable.",
        });
      }


      // No cache exists yet.

      if (weatherResponse.status === 429) {
        return res.status(503).json({
          success: false,

          message:
            "Weather service request limit reached. Forecast will become available when the provider resets its request allowance.",
        });
      }


      return res.status(502).json({
        success: false,

        message:
          "Weather forecast temporarily unavailable",
      });
    }


    // =================================================
    // PARSE WEATHER
    // =================================================

    const weatherData =
      await weatherResponse.json();


    // =================================================
    // VALIDATE RESPONSE
    // =================================================

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


      // Try old cache if available.

      if (cachedWeather) {
        return res.status(200).json({
          ...cachedWeather.data,

          cached: true,

          stale: true,

          message:
            "Using previously stored weather forecast.",
        });
      }


      return res.status(502).json({
        success: false,

        message:
          "Invalid weather forecast received",
      });
    }


    // =================================================
    // BUILD FORECAST
    // =================================================

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


          // =============================================
          // SUNSHINE SECONDS -> HOURS
          // =============================================

          const sunshineHours =
            Number(
              (
                sunshineSeconds /
                3600
              ).toFixed(1)
            );


          // =============================================
          // SOLAR AVAILABILITY
          // =============================================

          const solarAvailability =
            getSolarAvailability(
              solarRadiation,
              cloudCover,
              precipitationProbability
            );


          // =============================================
          // ENERGY STRATEGY
          // =============================================

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


    // =================================================
    // FINAL RESPONSE
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
        weatherData.timezone,

      forecast,
    };


    // =================================================
    // SAVE CACHE
    // =================================================

    weatherCache.set(
      storageId,
      {
        timestamp: Date.now(),

        data: responseData,
      }
    );


    console.log(
      `Weather cached successfully for ${storageId}`
    );


    // =================================================
    // RETURN FORECAST
    // =================================================

    return res.status(200).json({
      ...responseData,

      cached: false,
    });
  } catch (error) {
    console.error(
      "Weather route error:",
      error
    );


    // =================================================
    // LAST CHANCE CACHE FALLBACK
    // =================================================

    const storageId =
      req.params.storageId?.trim();

    const cachedWeather =
      weatherCache.get(storageId);


    if (cachedWeather) {
      console.log(
        `Unexpected error - using stale cache for ${storageId}`
      );

      return res.status(200).json({
        ...cachedWeather.data,

        cached: true,

        stale: true,

        message:
          "Using previously stored weather forecast.",
      });
    }


    return res.status(500).json({
      success: false,

      message:
        "Unable to retrieve weather forecast",
    });
  }
});


module.exports = router;