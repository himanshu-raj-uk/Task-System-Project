const jwt = require("jsonwebtoken");
const AdminModel = require("../Model/admin");
const EmployeeModel = require("../Model/employee");

const Auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Token missing",
      });
    }

    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.Secret_Key);

    let user = await AdminModel.findById(decoded.id);
    let role = "admin";

    if (!user) {
      user = await EmployeeModel.findById(decoded.id);
      role = "employee";
    }

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: decoded.role || role,
      adminId: decoded.adminId,
    };

    next();

  } catch (error) {
    console.log("Auth Error:", error.message);

    return res.status(401).json({
      status: false,
      message: "Unauthorized / Invalid token",
    });
  }
};

module.exports = Auth;