const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();


// =====================================================
// WEATHER CODE → SIMPLE DESCRIPTION
// =====================================================

function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";

  if ([1, 2].includes(code))
    return "Partly cloudy";

  if (code === 3)
    return "Overcast";

  if ([45, 48].includes(code))
    return "Foggy";

  if ([51, 53, 55, 56, 57].includes(code))
    return "Drizzle";

  if ([61, 63, 65, 66, 67].includes(code))
    return "Rain";

  if ([71, 73, 75, 77].includes(code))
    return "Snow";

  if ([80, 81, 82].includes(code))
    return "Rain showers";

  if ([85, 86].includes(code))
    return "Snow showers";

  if ([95, 96, 99].includes(code))
    return "Thunderstorm";

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
  /*
    This is a VOOLER planning estimate.

    We primarily use forecast solar radiation.
    Cloud cover and rain probability provide
    additional context.
  */

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
// GET WEATHER FOR A STORAGE UNIT
// =====================================================
//
// Example:
// GET /api/weather/CS001
//
// =====================================================

router.get("/:storageId", async (req, res) => {

  try {

    const storageId =
      req.params.storageId.trim();

    // -------------------------------------------------
    // FIND STORAGE / FARMER
    // -------------------------------------------------

    const farmer = await Farmer.findOne({
      storageId,
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Storage unit not found",
      });
    }


    // -------------------------------------------------
    // CHECK INSTALLATION LOCATION
    // -------------------------------------------------

    if (
      !farmer.location ||
      !Number.isFinite(
        farmer.location.latitude
      ) ||
      !Number.isFinite(
        farmer.location.longitude
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Installation location has not been configured for this storage unit",
      });
    }


    const latitude =
      farmer.location.latitude;

    const longitude =
      farmer.location.longitude;


    // -------------------------------------------------
    // OPEN-METEO REQUEST
    // -------------------------------------------------

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


    const weatherResponse =
      await fetch(weatherURL);


    if (!weatherResponse.ok) {

      console.error(
        "Open-Meteo error:",
        weatherResponse.status
      );

      return res.status(502).json({
        success: false,

        message:
          "Weather forecast temporarily unavailable",
      });
    }


    const weatherData =
      await weatherResponse.json();


    // -------------------------------------------------
    // VALIDATE RESPONSE
    // -------------------------------------------------

    if (
      !weatherData.daily ||
      !weatherData.daily.time
    ) {
      return res.status(502).json({
        success: false,

        message:
          "Invalid weather forecast received",
      });
    }


    // -------------------------------------------------
    // BUILD 4-DAY FORECAST
    // -------------------------------------------------

    const forecast =
      weatherData.daily.time.map(
        (date, index) => {

          const weatherCode =
            weatherData.daily
              .weather_code[index];

          const maxTemperature =
            weatherData.daily
              .temperature_2m_max[index];

          const minTemperature =
            weatherData.daily
              .temperature_2m_min[index];

          const precipitationProbability =
            weatherData.daily
              .precipitation_probability_max[
                index
              ] ?? 0;

          const sunshineSeconds =
            weatherData.daily
              .sunshine_duration[index] ?? 0;

          const solarRadiation =
            weatherData.daily
              .shortwave_radiation_sum[
                index
              ] ?? 0;

          const cloudCover =
            weatherData.daily
              .cloud_cover_mean[index] ?? 0;


          // Convert seconds → hours

          const sunshineHours =
            Number(
              (
                sunshineSeconds / 3600
              ).toFixed(1)
            );


          // Determine expected solar availability

          const solarAvailability =
            getSolarAvailability(
              solarRadiation,
              cloudCover,
              precipitationProbability
            );


          // Generate VOOLER recommendation

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


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.status(200).json({

      success: true,

      storageId:
        farmer.storageId,

      location: {
        latitude,
        longitude,

        placeName:
          farmer.location.placeName ||
          "",
      },

      timezone:
        weatherData.timezone,

      forecast,
    });

  } catch (error) {

    console.error(
      "Weather route error:",
      error.message
    );

    res.status(500).json({
      success: false,

      message:
        "Unable to retrieve weather forecast",
    });
  }
});


module.exports = router;