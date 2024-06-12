"use strict";
const app = require("./src/index.server");
const http = require("serverless-http");
module.exports.messenger = http(app);
