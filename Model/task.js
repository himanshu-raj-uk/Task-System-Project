const express = require("express");
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "completed", "in-progress"],
    default: "pending",
    
  },
});
module.exports = mongoose.model("Task", TaskSchema);
