const express = require("express");

const SmsCommand =
  require("../models/SmsCommands");

const Farmer =
  require("../models/Farmers");


const router = express.Router();


// =====================================================
// VERIFY VOOLER DEVICE
// =====================================================

async function verifyDevice(
  storageId,
  deviceKey
) {

  if (!storageId || !deviceKey) {
    return false;
  }


  const farmer =
    await Farmer.findOne({
      storageId,
      deviceKey,
    });


  return !!farmer;
}


// =====================================================
// GET NEXT PENDING SMS
// ESP32 CALLS THIS
// =====================================================

router.post(
  "/pending",
  async (req, res) => {

    try {

      const {
        storageId,
        deviceKey,
      } = req.body;


      const validDevice =
        await verifyDevice(
          storageId,
          deviceKey
        );


      if (!validDevice) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid device credentials",
          });

      }


      const sms =
        await SmsCommand
          .findOne({
            storageId,
            status: "pending",
          })
          .sort({
            createdAt: 1,
          });


      // Nothing to send
      if (!sms) {

        return res.json({

          success: true,

          hasMessage: false,

        });

      }


      return res.json({

        success: true,

        hasMessage: true,

        sms: {

          id:
            sms._id,

          phone:
            sms.phone,

          message:
            sms.message,

        },

      });

    }
    catch (error) {

      console.error(
        "Pending SMS error:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to retrieve SMS command",

        });

    }

  }
);


// =====================================================
// MARK SMS AS SENT
// =====================================================

router.post(
  "/:id/sent",
  async (req, res) => {

    try {

      const {
        storageId,
        deviceKey,
      } = req.body;


      const validDevice =
        await verifyDevice(
          storageId,
          deviceKey
        );


      if (!validDevice) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid device credentials",

          });

      }


      const sms =
        await SmsCommand.findOneAndUpdate(

          {
            _id: req.params.id,
            storageId,
          },

          {
            status: "sent",
            sentAt: new Date(),
          },

          {
            new: true,
          }

        );


      if (!sms) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "SMS command not found",

          });

      }


      return res.json({

        success: true,

        message:
          "SMS marked as sent",

      });

    }
    catch (error) {

      console.error(
        "SMS acknowledgement error:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to update SMS command",

        });

    }

  }
);


module.exports = router;