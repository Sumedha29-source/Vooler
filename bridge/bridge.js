const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = 8080;

const VOOLER_BACKEND =
  "https://vooler.onrender.com/api/device/data";


// ============================================
// HEALTH CHECK
// ============================================

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "VOOLER HTTP bridge is running",
  });

});


// ============================================
// RECEIVE DATA FROM SIM800L
// ============================================

app.post(
  "/api/device/data",
  async (req, res) => {

    console.log("\n==============================");
    console.log("Data received from SIM800L:");
    console.log(req.body);
    console.log("==============================");


    try {

      const response =
        await axios.post(
          VOOLER_BACKEND,
          req.body,
          {
            headers: {
              "Content-Type":
                "application/json",
            },

            timeout: 30000,
          }
        );


      console.log(
        "Render response:",
        response.status
      );

      console.log(
        response.data
      );


      return res
        .status(response.status)
        .json(response.data);

    } catch (error) {

      console.error(
        "Bridge forwarding error:"
      );


      if (error.response) {

        console.error(
          "Render status:",
          error.response.status
        );

        console.error(
          error.response.data
        );


        return res
          .status(
            error.response.status
          )
          .json(
            error.response.data
          );

      }


      console.error(
        error.message
      );


      return res
        .status(502)
        .json({

          success: false,

          message:
            "Bridge could not reach VOOLER backend",

        });

    }

  }
);


// ============================================
// START BRIDGE
// ============================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "================================"
    );

    console.log(
      "VOOLER HTTP Bridge"
    );

    console.log(
      `Running on port ${PORT}`
    );

    console.log(
      "================================"
    );

  }
);