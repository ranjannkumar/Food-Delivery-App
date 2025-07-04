import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import refundRouter from "./routes/refundRoute.js";
import dotenv from "dotenv"; 

dotenv.config(); 

const app = express();
const port = 4000;

// db connection
connectDB();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads")); 
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter); 
app.use("/api/refunds", refundRouter);


app.get("/", (req, res) => {
    res.send("API working");
});

// Start the server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
