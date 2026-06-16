const ErrorAuth = async (err,req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Something Went Wrong..";

  if (err.code === 11000) {
    status = 400;
    message = "Data is already exists.";
  }

  if (err.name == "JsonWebTokenError" && err.message == "invalid signature") {
    status = 401;
    message =
      "You are not authenticated to perform the action because of invalid token";
  }

  if (err.name == "TokenExpiredError" && err.message == "jwt expired") {
    status = 401;
    message =
      "You are not authenticated to perform the action because of expired token";
  }

  res.status(status).json({
    status: false,
    message: message,
    timestamp: new Date(),
    path: req.path,
  });
};

module.exports = ErrorAuth;
