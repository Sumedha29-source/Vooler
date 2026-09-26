const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();


// =====================================================
// WEATHER CODE → DESCRIPTION
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
  /*
    These are VOOLER prototype decision rules.

    HIGH:
    Good solar radiation,
    relatively low cloud cover,
    and low rain probability.

    MODERATE:
    Usable solar conditions.

    LOW:
    Poor solar availability.
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
// GET WEATHER FOR STORAGE UNIT
// =====================================================
//
// Example:
//
// GET /api/weather/CS001
//
// =====================================================

router.get("/:storageId", async (req, res) => {

  try {

    const storageId =
      req.params.storageId.trim();


    // =================================================
    // FIND STORAGE LOCATION
    // =================================================
    //
    // Multiple farmers may belong to the SAME storage
    // unit (for example CS001).
    //
    // Therefore we must NOT simply use:
    //
    // Farmer.findOne({ storageId })
    //
    // because that may return a farmer whose location
    // has not been configured.
    //
    // Instead, find a record belonging to this storage
    // unit that actually contains coordinates.
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
    // CHECK WHETHER STORAGE EXISTS AT ALL
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

    const latitude =
      Number(
        farmerWithLocation.location.latitude
      );

    const longitude =
      Number(
        farmerWithLocation.location.longitude
      );

    const placeName =
      farmerWithLocation.location.placeName || "";


    // =================================================
    // VALIDATE COORDINATES
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
    // DEBUG LOG
    // =================================================

    console.log(
      `Weather request for ${storageId}`
    );

    console.log(
      `Using installation location: ${placeName}`
    );

    console.log(
      `Latitude: ${latitude}`
    );

    console.log(
      `Longitude: ${longitude}`
    );


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

        timezone:
          "auto",

        forecast_days:
          "4",
      });


    const weatherURL =
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`;


    // =================================================
    // FETCH REAL WEATHER FORECAST
    // =================================================

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


    // =================================================
    // VALIDATE WEATHER RESPONSE
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


      return res.status(502).json({
        success: false,

        message:
          "Invalid weather forecast received",
      });
    }


    // =================================================
    // BUILD FORECAST ARRAY
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
          // CONVERT SUNSHINE SECONDS → HOURS
          // =============================================

          const sunshineHours =
            Number(
              (
                sunshineSeconds /
                3600
              ).toFixed(1)
            );


          // =============================================
          // DETERMINE SOLAR AVAILABILITY
          // =============================================

          const solarAvailability =
            getSolarAvailability(
              solarRadiation,
              cloudCover,
              precipitationProbability
            );


          // =============================================
          // DETERMINE VOOLER OPERATING STRATEGY
          // =============================================

          const strategy =
            getEnergyStrategy(
              solarAvailability
            );


          // =============================================
          // DAY RESPONSE
          // =============================================

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
          };
        }
      );


    // =================================================
    // SEND FINAL RESPONSE
    // =================================================

    return res.status(200).json({

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
    });

  }

  catch (error) {

    console.error(
      "Weather route error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to retrieve weather forecast",
    });
  }
});


module.exports = router;