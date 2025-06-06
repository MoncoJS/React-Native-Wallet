import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
// Our custom middleware to log requests
// app.use((req, res, next) => {
//   console.log("Hey, a request was made to the server!", req.method);
//   next();
// });

const PORT = process.env.PORT || 5001;

async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS Transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
 )`;

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

app.get("/", (req, res) => {
  res.send("Welcome to the Expense Tracker API");
});

app.get("/api/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);

    const transactions = await sql`
        SELECT * FROM Transactions
        WHERE user_id = ${userId} ORDER BY created_at DESC
        `;

    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { title, amount, category, user_id } = req.body;
    if (!title || !amount || !category || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const transaction = await sql`
      INSERT INTO Transactions (user_id, title, amount, category)
      VALUES (${user_id}, ${title}, ${amount}, ${category})
      RETURNING *
    `;

    res.status(201).json(transaction[0]);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
        DELETE FROM Transactions
        WHERE id = ${id}
        RETURNING *
        `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res
      .status(200)
      .json({
        message: "Transaction deleted successfully",
        transaction: result[0],
      });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/transactions/summary/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const balanceResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS balance
            FROM transactions
            WHERE user_id = ${userId}
        `;

        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS income
            FROM transactions
            WHERE user_id = ${userId} AND amount > 0
        `;

        const expensesResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS expense
            FROM transactions
            WHERE user_id = ${userId} AND amount < 0
        `;

        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expenses: expensesResult[0].expense,
        });

    }catch (error) {
    console.error("Error getting transaction summary:", error);
    res.status(500).json({ message: "Internal server error" });
    }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
  });
});
