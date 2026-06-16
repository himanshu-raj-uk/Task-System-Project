const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: Number,
    required: true,
  },

  role: {
    type: String,
    default: "employee",
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  adminName: {
    type: String,
  },
});

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = Employee;
