import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import inmuebleRoutes from "./routes/inmuebles.js";
import personaRoutes from "./routes/personas.js";
import facturacionRoutes from "./routes/facturacion.js";
import recaudoRoutes from "./routes/recaudos.js";
import carteraRoutes from "./routes/cartera.js";
import reporteRoutes from "./routes/reportes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, servicio: "PH Gestión API" }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inmuebles", inmuebleRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api/facturacion", facturacionRoutes);
app.use("/api/recaudos", recaudoRoutes);
app.use("/api/cartera", carteraRoutes);
app.use("/api/reportes", reporteRoutes);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno", detalle: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`PH Gestión API escuchando en puerto ${PORT}`));
