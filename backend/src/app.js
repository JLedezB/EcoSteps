const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const activitiesRoutes = require("./routes/activities.routes");
const evidencesRoutes = require("./routes/evidences.routes");
const reportsRoutes = require("./routes/reports.routes");
const progressRoutes = require("./routes/progress.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const ticketsRoutes = require("./routes/tickets.routes"); 

const app = express();

app.use(cors());
app.use(express.json());

//Rutas
app.use("/api/auth", authRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/evidences", evidencesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tickets", ticketsRoutes); 

app.get("/", (req, res) => {
  res.send("EcoSteps Backend funcionando");
});

module.exports = app;
