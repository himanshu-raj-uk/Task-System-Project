require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const project = express();

const AdminModel = require("./Model/admin");
const AdminRoute = require("./Routes/admin.routes");
const EmployeeRoute = require("./Routes/employee.routes");
const TaskRoute = require("./Routes/task.routes");
const ErrorHandling = require("./Token/Error_Handler");

project.use(express.json());

mongoose
  .connect(process.env.Mongoose_Connect)
  .then(async () => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("We got an error:", err);
  });

project.use("/admin", AdminRoute);
project.use("/employee", EmployeeRoute);
project.use("/task", TaskRoute);
project.use(ErrorHandling);


project.listen(process.env.Port, () => {
  console.log("Server started successfully");
});
