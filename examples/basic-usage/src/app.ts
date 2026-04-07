import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AfromomoSDK } from "chia-sdk";
import { errorHandler } from "./middleware/error";

// Initialize the SDK first
AfromomoSDK.initialize();

// Import routes after SDK initialization
import { paychanguRouter } from "./routes/paychangu";
import { pawapayRouter } from "./routes/pawapay";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/paychangu", paychanguRouter);
app.use("/pawapay", pawapayRouter);

// New route to get all configured services
app.get("/services", (req, res) => {
	const sdk = AfromomoSDK.getInstance();
	const services = sdk.getConfiguredServices();
	res.json({
		success: true,
		services,
		count: services.length,
	});
});

// Error handling
app.use(errorHandler);

export default app;
