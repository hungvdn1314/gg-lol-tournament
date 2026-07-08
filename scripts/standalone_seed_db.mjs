import fs from "fs";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLgPyqrjccZFCknWaDZ4r1QCu2MjUd_3s",
  authDomain: "gg-internal-tournament.firebaseapp.com",
  databaseURL: "https://gg-internal-tournament-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gg-internal-tournament",
  storageBucket: "gg-internal-tournament.firebasestorage.app",
  messagingSenderId: "606400057218",
  appId: "1:606400057218:web:4ddc7f6141d7cd45fe499b"
};

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.log("\n======================================================================");
  console.log("HOW TO SEED UPDATED MATCH TIMES:");
  console.log("======================================================================");
  console.log("Option A (Terminal Seed):");
  console.log("Provide your Firebase Admin credentials as environment variables:");
  console.log("ADMIN_EMAIL=your-email@gg.com ADMIN_PASSWORD=your-pass node scripts/standalone_seed_db.mjs");
  console.log("\nOption B (Admin Dashboard - Recommended):");
  console.log("1. Open the website: http://localhost:3000/admin");
  console.log("2. Log in with your admin account.");
  console.log("3. Click the 'Reset Default Data' button.");
  console.log("======================================================================\n");
  process.exit(0);
}

console.log("Reading src/lib/db.js to extract DEFAULT_MATCHES...");
const dbFileContent = fs.readFileSync("./src/lib/db.js", "utf8");

const startKeyword = "const DEFAULT_MATCHES = {";
const startIndex = dbFileContent.indexOf(startKeyword);
if (startIndex === -1) {
  console.error("Could not find DEFAULT_MATCHES in db.js");
  process.exit(1);
}

let braceCount = 1;
let currentIndex = startIndex + startKeyword.length;
let objectContent = "{";

while (braceCount > 0 && currentIndex < dbFileContent.length) {
  const char = dbFileContent[currentIndex];
  if (char === "{") braceCount++;
  if (char === "}") braceCount--;
  objectContent += char;
  currentIndex++;
}

let defaultMatches;
try {
  const parseObject = new Function(`return ${objectContent}`);
  defaultMatches = parseObject();
} catch (e) {
  console.error("Failed to parse DEFAULT_MATCHES text:", e);
  process.exit(1);
}

console.log("Successfully parsed DEFAULT_MATCHES. Count:", Object.keys(defaultMatches).length);

// Connect to Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

console.log(`Authenticating as ${email}...`);
signInWithEmailAndPassword(auth, email, password)
  .then(() => {
    console.log("Authentication successful! Pushing updated match schedule to Firebase...");
    const matchesRef = ref(database, "matches");
    return set(matchesRef, defaultMatches);
  })
  .then(() => {
    console.log("Database matches updated successfully to 12:00:00.000Z (7:00 PM ICT)!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding operation failed:", err.message);
    process.exit(1);
  });
