import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

connectDB(process.env.DATABASE_URL);

app.get("/", (req, res) => {
  res.send("It, Works! 123");
});

app.listen(PORT, () => {
  console.log("Server is running on port:", PORT);
});
