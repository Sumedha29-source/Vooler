const express = require("express");

const Farmer = require("../models/Farmers");
const WeatherCache = require("../models/WeatherCache");

const router = express.Router();


// =====================================================
// CONFIGURATION
// =====================================================

// Weather newer than 30 minutes is considered fresh.
const CACHE_DURATION_MS = 30 * 60 * 1000;


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
// OPEN-METEO SOLAR AVAILABILITY
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
// WEATHERAPI FALLBACK SOLAR AVAILABILITY
// =====================================================
//
// WeatherAPI fallback does not provide the same daily
// shortwave radiation field used by Open-Meteo.
//
// Therefore we estimate solar availability using cloud
// cover and rain probability instead of inventing a
// radiation value.
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
// CONVERT MONGODB CACHE -> API RESPONSE
// =====================================================

function cacheToResponse(cache) {
  return {
    success: true,

    storageId: cache.storageId,

    location: {
      latitude:
        cache.location.latitude,

      longitude:
        cache.location.longitude,

      placeName:
        cache.location.placeName || "",
    },

    timezone:
      cache.timezone,

    provider:
      cache.provider,

    forecast:
      cache.forecast,
  };
}


// =====================================================
// GET MONGODB CACHE
// =====================================================

async function getWeatherCache(storageId) {
  return WeatherCache.findOne({
    storageId,
  }).lean();
}


// =====================================================
// CHECK WHETHER CACHE IS FRESH
// =====================================================

function isCacheFresh(cache) {
  if (!cache || !cache.fetchedAt) {
    return false;
  }

  const age =
    Date.now() -
    new Date(cache.fetchedAt).getTime();

  return age < CACHE_DURATION_MS;
}


// =====================================================
// CACHE AGE
// =====================================================

function getCacheAgeMinutes(cache) {
  if (!cache || !cache.fetchedAt) {
    return null;
  }

  const age =
    Date.now() -
    new Date(cache.fetchedAt).getTime();

  return Math.max(
    0,
    Math.floor(age / 60000)
  );
}


// =====================================================
// SAVE / UPDATE MONGODB CACHE
// =====================================================

async function saveWeatherCache(
  storageId,
  location,
  weather
) {
  await WeatherCache.findOneAndUpdate(
    {
      storageId,
    },

    {
      $set: {
        storageId,

        location: {
          latitude:
            location.latitude,

          longitude:
            location.longitude,

          placeName:
            location.placeName || "",
        },

        timezone:
          weather.timezone || null,

        provider:
          weather.provider,

        forecast:
          weather.forecast,

        fetchedAt:
          new Date(),
      },
    },

    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
}


// =====================================================
// FETCH FROM OPEN-METEO
// =====================================================

async function fetchOpenMeteo(
  latitude,
  longitude
) {
  try {
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

        timezone:
          "auto",

        forecast_days:
          "4",
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
              max:
                maxTemperature,

              min:
                minTemperature,
            },

            precipitationProbability,

            cloudCover,

            sunshineHours,

            solarRadiation,

            solarAvailability,

            strategy,

            estimatedSolarAvailability:
              false,
          };
        }
      );


    return {
      provider:
        "Open-Meteo",

      timezone:
        weatherData.timezone || null,

      forecast,
    };
  } catch (error) {
    console.error(
      "Open-Meteo request error:",
      error.message
    );

    return null;
  }
}


// =====================================================
// FETCH FROM WEATHERAPI
// =====================================================

async function fetchWeatherAPI(
  latitude,
  longitude
) {
  try {
    const apiKey =
      process.env.WEATHER_API_KEY;


    if (!apiKey) {
      console.error(
        "WEATHER_API_KEY is missing."
      );

      return null;
    }


    const location =
      `${latitude},${longitude}`;


    const params =
      new URLSearchParams({
        key:
          apiKey,

        q:
          location,

        days:
          "4",

        aqi:
          "no",

        alerts:
          "no",
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


          // =============================================
          // AVERAGE DAILY CLOUD COVER
          // =============================================

          let cloudCover = 0;


          if (hourData.length > 0) {
            const totalCloud =
              hourData.reduce(
                (sum, hour) =>
                  sum +
                  Number(
                    hour.cloud || 0
                  ),

                0
              );


            cloudCover =
              Math.round(
                totalCloud /
                hourData.length
              );
          }


          // =============================================
          // RAIN PROBABILITY
          // =============================================

          const precipitationProbability =
            Number(
              day.daily_chance_of_rain ??
              0
            );


          // =============================================
          // WEATHERAPI DOES NOT PROVIDE THE SAME
          // DAILY SOLAR VALUES USED BY OPEN-METEO
          // =============================================

          const sunshineHours =
            null;

          const solarRadiation =
            null;


          // =============================================
          // FALLBACK SOLAR ESTIMATE
          // =============================================

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
      provider:
        "WeatherAPI",

      timezone:
        weatherData.location?.tz_id ||
        null,

      forecast,
    };
  } catch (error) {
    console.error(
      "WeatherAPI request error:",
      error.message
    );

    return null;
  }
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
      // 1. CHECK MONGODB CACHE
      // =================================================

      let cachedWeather =
        await getWeatherCache(
          storageId
        );


      if (
        cachedWeather &&
        isCacheFresh(
          cachedWeather
        )
      ) {
        console.log(
          `MongoDB weather cache HIT: ${storageId}`
        );


        return res
          .status(200)
          .json({
            ...cacheToResponse(
              cachedWeather
            ),

            cached:
              true,

            stale:
              false,

            cacheAgeMinutes:
              getCacheAgeMinutes(
                cachedWeather
              ),
          });
      }


      console.log(
        `MongoDB weather cache MISS/STALE: ${storageId}`
      );


      // =================================================
      // 2. FIND STORAGE INSTALLATION LOCATION
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
              success:
                false,

              message:
                "Storage unit not found",
            });
        }


        // If the location was removed but old weather
        // exists, preserve availability.

        if (cachedWeather) {
          return res
            .status(200)
            .json({
              ...cacheToResponse(
                cachedWeather
              ),

              cached:
                true,

              stale:
                true,

              cacheAgeMinutes:
                getCacheAgeMinutes(
                  cachedWeather
                ),

              message:
                "Using the last available weather forecast because the installation location is currently unavailable.",
            });
        }


        return res
          .status(400)
          .json({
            success:
              false,

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
          .location.placeName ||
        "";


      // =================================================
      // 5. VALIDATE LOCATION
      // =================================================

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        ) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        if (cachedWeather) {
          return res
            .status(200)
            .json({
              ...cacheToResponse(
                cachedWeather
              ),

              cached:
                true,

              stale:
                true,

              cacheAgeMinutes:
                getCacheAgeMinutes(
                  cachedWeather
                ),

              message:
                "Using the last available weather forecast because the configured location is currently invalid.",
            });
        }


        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid installation location configured for this storage unit",
          });
      }


      const location = {
        latitude,
        longitude,
        placeName,
      };


      // =================================================
      // 6. TRY OPEN-METEO FIRST
      // =================================================

      let weather =
        await fetchOpenMeteo(
          latitude,
          longitude
        );


      // =================================================
      // 7. IF OPEN-METEO FAILS -> WEATHERAPI
      // =================================================

      if (!weather) {
        console.log(
          "Open-Meteo unavailable. Trying WeatherAPI..."
        );


        weather =
          await fetchWeatherAPI(
            latitude,
            longitude
          );
      }


      // =================================================
      // 8. IF A PROVIDER WORKED -> SAVE TO MONGODB
      // =================================================

      if (weather) {
        try {
          await saveWeatherCache(
            storageId,
            location,
            weather
          );


          console.log(
            `Weather saved to MongoDB for ${storageId}`
          );
        } catch (cacheError) {
          // Weather should still be returned even if
          // saving the cache unexpectedly fails.

          console.error(
            "Unable to save weather cache:",
            cacheError.message
          );
        }


        return res
          .status(200)
          .json({
            success:
              true,

            storageId,

            location,

            timezone:
              weather.timezone,

            provider:
              weather.provider,

            forecast:
              weather.forecast,

            cached:
              false,

            stale:
              false,
          });
      }


      // =================================================
      // 9. BOTH PROVIDERS FAILED
      //    -> RETURN OLD MONGODB FORECAST
      // =================================================

      if (cachedWeather) {
        console.log(
          `Both providers failed. Using stale MongoDB weather for ${storageId}`
        );


        return res
          .status(200)
          .json({
            ...cacheToResponse(
              cachedWeather
            ),

            cached:
              true,

            stale:
              true,

            cacheAgeMinutes:
              getCacheAgeMinutes(
                cachedWeather
              ),

            message:
              "Using the last available weather forecast because live weather services are temporarily unavailable.",
          });
      }


      // =================================================
      // 10. NO API + NO CACHE
      // =================================================

      return res
        .status(503)
        .json({
          success:
            false,

          message:
            "Weather services are temporarily unavailable and no stored forecast is available yet.",
        });
    } catch (error) {
      console.error(
        "Weather route error:",
        error
      );


      // =================================================
      // FINAL EMERGENCY CACHE ATTEMPT
      // =================================================

      try {
        const storageId =
          req.params.storageId
            ?.trim();


        if (storageId) {
          const cachedWeather =
            await getWeatherCache(
              storageId
            );


          if (cachedWeather) {
            return res
              .status(200)
              .json({
                ...cacheToResponse(
                  cachedWeather
                ),

                cached:
                  true,

                stale:
                  true,

                cacheAgeMinutes:
                  getCacheAgeMinutes(
                    cachedWeather
                  ),

                message:
                  "Using the last available stored weather forecast.",
              });
          }
        }
      } catch (cacheError) {
        console.error(
          "Emergency weather cache read failed:",
          cacheError.message
        );
      }


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to retrieve weather forecast",
        });
    }
  }
);


module.exports = router;