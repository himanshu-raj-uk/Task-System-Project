const express = require("express");
const AdminModel = require("../Model/admin");
const EmployeeModel = require("../Model/employee");
const project = express.Router();
const Super_Admin_Key = require("../Token/SecretToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Auth = require("../Token/SecretToken");
const Super_Admin = require("../Token/Super_Admin_Auth");

// CREATE SUPER ADMIN..

project.post("/super-admin", async (req, res) => {
  try {
    const data = req.body;

    data.role = "super-admin";

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    data.password = hashedPassword;

    const SuperAdmin = await AdminModel.create(data);

    return res.status(201).json({
      status: true,
      message: "Super admin created successfully",
      data: SuperAdmin,
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// LOGIN ADMIN AND HASH PASSWORD..

project.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }
    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.Secret_Key,
      {
        expiresIn: "24h",
      },
    );

    return res.status(201).json({
      status: true,
      message: "Admin login successfully",
      token,
    });
  } catch (err) {
    console.log("Got an error:", err);

    return res.status(500).json({
      status: false,
      message: "Unable to read admin",
    });
  }
});

project.post("/create", Auth, async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }
    const data = req.body;
    const ExistingEmail = await AdminModel.findOne({
      email: data.email,
    });

    // if (ExistingEmail) {
    //   return res.status(400).json({
    //     status: false,
    //     message: "Email already exists",
    //   });
    // }

    const Admins = await AdminModel.countDocuments({
      role: "admin",
    });

    if (Admins >= 2) {
      return res.status(400).json({
        message: "Maximum 2 admins allowed",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const admin = await AdminModel.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: "admin",
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

project.delete("/delete/:adminId", Auth, async (req, res) => {
  try {
    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot delete yourself",
      });
    }
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    const adminId = req.params.adminId;

    if (req.user.id === adminId) {
      return res.status(400).json({
        message: "Super admin cannot delete himself",
      });
    }

    await EmployeeModel.updateMany(
      {
        adminId: adminId,
      },
      {
        adminId: req.user.id,
      },
    );

    await TaskModel.updateMany(
      {
        assignedBy: adminId,
      },
      {
        assignedBy: req.user.id,
      },
    );

    await AdminModel.findByIdAndDelete(adminId);

    res.json({
      status: true,
      message: "Admin deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

// READ ADMIN DATA AND CHECK ADMIN ID IS CORRECT OR NOT.

project.get("/admin/employee", Auth, async (req, res) => {
  try {
    const employees = await EmployeeModel.find({
      adminId: req.user.id,
    });

    res.json({
      status: true,
      employees,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
});

module.exports = project;
