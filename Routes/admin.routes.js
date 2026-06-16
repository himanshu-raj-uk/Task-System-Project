const express = require("express");
const AdminModel = require("../Model/admin");
const EmployeeModel = require("../Model/employee");
const project = express.Router();
const Super_Admin_Key = require("../Token/SecretToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Auth = require("../Token/SecretToken");
const Super_Admin = require("../Token/Super_Admin_Auth");

// CREATE SUPER ADMIN...

project.post("/super-admin", async (req, res, next) => {
  try {
    const { email, password, ...rest } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const existingAdmin = await AdminModel.findOne({ email });

    if (existingAdmin) {
      throw new ApiError(400, "Super admin already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await AdminModel.create({
      ...rest,
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    return res.status(201).json({
      status: true,
      message: "Super admin created successfully",
      data: superAdmin,
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN ADMIN AND HASH PASSWORD..

project.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      throw new ApiError(400, "Invalid password");
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.Secret_Key,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      status: true,
      message: "Admin login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
});


project.delete("/delete/:adminId", Auth, async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (req.user.role !== "superadmin") {
      throw new ApiError(403, "Only super admin allowed");
    }

    if (req.user.id === adminId) {
      throw new ApiError(400, "Super admin cannot delete himself");
    }

    const admin = await AdminModel.findById(adminId);

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    await EmployeeModel.updateMany(
      { adminId },
      { adminId: req.user.id }
    );

    await TaskModel.updateMany(
      { assignedBy: adminId },
      { assignedBy: req.user.id }
    );

    await AdminModel.findByIdAndDelete(adminId);

    return res.status(200).json({
      status: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// READ ADMIN DATA AND CHECK ADMIN ID IS CORRECT OR NOT.

project.get("/admin/employee", Auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      throw new ApiError(403, "Unauthorized");
    }

    let query = {};

    if (req.user.role === "admin") {
      query.adminId = req.user.id;
    }

    const employees = await EmployeeModel.find(query);

    return res.status(200).json({
      status: true,
      employees,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = project;
