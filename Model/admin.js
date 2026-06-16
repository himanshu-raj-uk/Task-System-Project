const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
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

  role: {
    type: String,
    enum: ["super-admin", "admin"],
    default: "admin",
  },

  status: {
    type: String,
    enum: ["pending", "completed"],
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
  },
});

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = Admin;
