function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const message = error.message || "Internal server error";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}

module.exports = { errorHandler, notFoundHandler };
