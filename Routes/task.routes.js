const express = require("express");

const TaskModel = require("../Model/task");
const EmployeeModel = require("../Model/employee");
const Auth = require("../Token/SecretToken");
const task = require("../Model/task");
const ApiError = require("../utilities/ApiError");

const project = express.Router();

project.post("/assign", Auth, async (req, res, next) => {
  try {
    const { title, description, dueDate, employeeId } = req.body;

    if (!title || !description || !dueDate || !employeeId) {
      throw new ApiError(
        400,
        "Title, description, dueDate and employeeId are required"
      );
    }

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      throw new ApiError(400, "Invalid dueDate format");
    }

    const employee = await EmployeeModel.findOne({
      _id: employeeId,
      adminId: req.user.id,
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const task = await TaskModel.create({
      title: title.trim(),
      description: description.trim(),
      dueDate: parsedDueDate,
      assignedTo: employee.id,
      assignedBy: req.user.id,
      status: "pending",
    });

    return res.status(201).json({
      status: true,
      message: "Task assigned successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
});

project.get("/view-tasks", Auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    let tasks = [];

    if (role === "superadmin") {
      tasks = await TaskModel.find()
        .populate("assignedTo")
        .populate("assignedBy");
    } else if (role === "admin") {
      tasks = await TaskModel.find({
        assignedBy: userId,
      }).populate("assignedTo");
    } else if (role === "employee") {
      tasks = await TaskModel.find({
        assignedTo: userId,
      });
    }

    return res.status(200).json({
      status: true,
      tasks,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

project.put("/complete/:taskId", Auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await TaskModel.findById(taskId);

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    if (req.user.role !== "employee") {
      return res.status(403).json({
        status: false,
        message: "Only employees can complete tasks",
      });
    }

    const employeeId = req.user.id || req.user._id;

    if (String(task.assignedTo) !== String(employeeId)) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to complete this task",
      });
    }

    task.status = "completed";

    await task.save();

    return res.status(200).json({
      status: true,
      message: "Task completed successfully",
      task,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

project.put("/status/:taskId", Auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const { taskId } = req.params;

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const task = await TaskModel.findById(taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const userId = req.user.id;
    const role = req.user.role;

    if (role === "admin") {
      if (String(task.assignedBy) !== String(userId)) {
        throw new ApiError(403, "Unauthorized access to this task");
      }
    }

   

    task.status = status;
    await task.save();

    return res.status(200).json({
      status: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
});

project.delete("/delete/:taskId", Auth, async (req, res) => {
  const task = await TaskModel.findById(req.params.taskId);

  if (!task) {
    return res.status(404).json({
      status: false,
      message: "Task not found",
    });
  }
  if (req.user.role === "employee") {
    return res.status(403).json({
      status: false,
      message: "Only admin or superadmin allowed",
    });
  }

  if (req.user.role === "admin" && task.assignedBy.toString() !== req.user.id) {
    return res.status(403).json({
      status: false,
      message: "Unauthorized",
    });
  }

  res.json({
    status: true,
    message: "Task deleted",
  });
});

module.exports = project;
