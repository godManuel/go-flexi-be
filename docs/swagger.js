const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "GoFlexi Developer API",
      version: "1.0.0",
    },

    servers: [
      {
        url: "https://api.goflexi.com",
      },
    ],
  },

  apis: ["./routes/public-api/*.js"],
};

module.exports = swaggerJsdoc(options);
