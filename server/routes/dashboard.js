const express = require("express");

const Reading = require("../models/Readings");
const Farmer = require("../models/Farmers");
const DeviceCommand = require("../models/DeviceCommands");

const router = express.Router();


// =====================================================
// GET DASHBOARD DATA
// =====================================================

router.get(
  "/:storageId",
  async (req, res) => {

    try {

      const cleanStorageId =
        String(
          req.params.storageId
        ).trim();


      // =================================================
      // VERIFY STORAGE EXISTS
      // =================================================

      const farmer =
        await Farmer.findOne({
          storageId:
            cleanStorageId,
        });


      if (!farmer) {

        return res
          .status(404)
          .json({
            success: false,

            message:
              "Storage ID not found",
          });

      }


      // =================================================
      // GET LATEST READING
      // =================================================

      const latestReading =
        await Reading
          .findOne({
            storageId:
              cleanStorageId,
          })
          .sort({
            createdAt: -1,
          })
          .lean();


      // =================================================
      // GET HISTORY
      // =================================================

      const historyReadings =
        await Reading
          .find({
            storageId:
              cleanStorageId,
          })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();


      // =================================================
      // GET DEVICE CONTROL / SET TEMPERATURES
      // =================================================

      let command =
        await DeviceCommand.findOne({
          storageId:
            cleanStorageId,
        });


      // If no command exists yet, create defaults
      if (!command) {

        command =
          await DeviceCommand.create({
            storageId:
              cleanStorageId,

            emergencyShutdown:
              false,

            chamber1SetTemperature:
              18,

            chamber2SetTemperature:
              18,
          });

      }


      // =================================================
      // DETERMINE ONLINE STATUS
      //
      // Device is online if latest reading is within
      // the last 2 minutes.
      // =================================================

      let online =
        false;


      if (
        latestReading &&
        latestReading.createdAt
      ) {

        const latestTime =
          new Date(
            latestReading.createdAt
          ).getTime();


        const currentTime =
          Date.now();


        const difference =
          currentTime -
          latestTime;


        const twoMinutes =
          2 * 60 * 1000;


        online =
          difference <=
          twoMinutes;

      }


      // =================================================
      // FORMAT LATEST
      // =================================================

      let latest =
        null;


      if (latestReading) {

        latest = {

          id:
            latestReading._id,

          storageId:
            latestReading.storageId,


          // CURRENT TEMPERATURES

          chamber1Temperature:
            typeof latestReading
              .chamber1Temperature ===
            "number"

              ? latestReading
                  .chamber1Temperature

              : null,


          chamber2Temperature:
            typeof latestReading
              .chamber2Temperature ===
            "number"

              ? latestReading
                  .chamber2Temperature

              : null,


          // SET TEMPERATURES

          chamber1SetTemperature:
            command
              .chamber1SetTemperature,

          chamber2SetTemperature:
            command
              .chamber2SetTemperature,


          // OTHER SENSOR DATA

          humidity:
            latestReading.humidity,

          power:
            latestReading.power,

          online,


          timestamp:
            latestReading.createdAt,

          createdAt:
            latestReading.createdAt,
        };

      }


      // =================================================
      // FORMAT HISTORY
      //
      // We attach the CURRENT set temperature values
      // to each history item so the website/app graphs
      // can show Current vs Set.
      // =================================================

      const history =
        historyReadings
          .reverse()
          .map(
            (reading) => {

              return {

                id:
                  reading._id,

                storageId:
                  reading.storageId,


                // CURRENT VALUES

                chamber1Temperature:
                  typeof reading
                    .chamber1Temperature ===
                  "number"

                    ? reading
                        .chamber1Temperature

                    : null,


                chamber2Temperature:
                  typeof reading
                    .chamber2Temperature ===
                  "number"

                    ? reading
                        .chamber2Temperature

                    : null,


                // SET VALUES

                chamber1SetTemperature:
                  command
                    .chamber1SetTemperature,

                chamber2SetTemperature:
                  command
                    .chamber2SetTemperature,


                humidity:
                  reading.humidity,

                power:
                  reading.power,

                online:
                  true,

                timestamp:
                  reading.createdAt,

                createdAt:
                  reading.createdAt,
              };

            }
          );


      // =================================================
      // SUCCESS RESPONSE
      // =================================================

      return res.json({
        success: true,

        storageId:
          cleanStorageId,


        latest,


        history,


        controls: {

          emergencyShutdown:
            command
              .emergencyShutdown,

          chamber1SetTemperature:
            command
              .chamber1SetTemperature,

          chamber2SetTemperature:
            command
              .chamber2SetTemperature,

          requestedBy:
            command
              .requestedBy,

          requestedAt:
            command
              .requestedAt,
        },

      });

    }
    catch (error) {

      console.error(
        "Dashboard fetch error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while loading dashboard",
        });

    }

  }
);


module.exports = router;