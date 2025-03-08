const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const PORT = process.env.PORT || 3000
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

let voteCounts = {}; // Store votes in memory

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.htm"));
});

let playerRatings = {}; // Store Elo ratings in memory

// Elo rating formula
function updateElo(winner, loser) {
    const K = 32; // K-factor (higher = faster ranking changes)

    let Ra = playerRatings[winner] || 1000; // Default rating if new player
    let Rb = playerRatings[loser] || 1000;

    // Expected scores
    let Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
    let Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400));

    // Update ratings
    playerRatings[winner] = Math.round(Ra + K * (1 - Ea));
    playerRatings[loser] = Math.round(Rb + K * (0 - Eb));
}

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send the current player ratings to the new client
    socket.emit("updateRatings", playerRatings);

    socket.on("vote", ({ winner, loser }) => {
        updateElo(winner, loser); // Apply Elo rating changes
        io.emit("updateRatings", playerRatings); // Broadcast updated ratings to all clients
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000/"));
