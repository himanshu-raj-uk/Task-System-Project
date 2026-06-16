const express = require("express");
const project = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const EmployeeModel = require("../Model/employee");
const AdminModel = require("../Model/admin");
const Auth = require("../Token/SecretToken");
const ErorrAuth = require("../Token/Error_Handler");
const ApiError = require("../utilities/ApiError");

project.post("/create", Auth, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (req.user.role !== "admin") {
      throw new ApiError(403, "Only admins can create employee accounts.");
    }

    if (!name)     throw new ApiError(400, "Name is required.");
    if (!email)    throw new ApiError(400, "Email is required.");
    if (!password) throw new ApiError(400, "Password is required.");
    if (!phone)    throw new ApiError(400, "Phone number is required.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Please enter a valid email address.");
    }

    const existing = await EmployeeModel.findOne({ email });
    if (existing) {
      throw new ApiError(409, "Employee already exists.");
    }

    const admin = await AdminModel.findById(req.user.id);

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await EmployeeModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      adminId: req.user.id,     
      adminName: admin?.name,     
    });

    return res.status(201).json({
      status: true,
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        adminId: employee.adminId,
        adminName: employee.adminName,
      },
    });

  } catch (err) {
    next(err);
  }
});

project.post("/login", async (req, res, next) => { 
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required.");
    }

    const employee = await EmployeeModel.findOne({ email });

    if (!employee) {
      throw new ApiError(404, "Employee not found.");
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid password.");
    }

    const token = jwt.sign(
      {
        id: employee._id,
        role: "employee",
        adminId: employee.adminId,
      },
      process.env.Secret_Key,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      status: true,
      message: "Employee login successful",
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        adminId: employee.adminId,
      },
    });

  } catch (err) {
    next(err); 
  }
});
project.put("/update/:employeeId", Auth, async (req, res) => {
  try {
    const data = req.body;

    if (req.user.role === "employee" && req.user.id !== req.params.employeeId) {
      return res.status(403).json({
        status: false,
        message: "You can update only your profile",
      });
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (req.user.role !== "employee") {
      return res.status(403).json({
        status: false,
        message: "Only employee allowed",
      });
    }
    const employee = await EmployeeModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true },
    );

    res.json({
      status: true,
      employee,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

project.delete("/delete/:employeeId", Auth, async (req, res) => {
  await EmployeeModel.findByIdAndDelete(req.params.employeeId);

  res.json({
    status: true,
    message: "Employee deleted",
  });
});

module.exports = project;
