import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.RIOT_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^RIOT_API_KEY=(.*)$/m);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("Error: RIOT_API_KEY is not defined in .env.local or process.env.");
  process.exit(1);
}

const webhookUrl = process.argv[2];
if (!webhookUrl) {
  console.error("Error: Please provide your webhook URL as an argument.");
  console.error("Usage: node scripts/register-riot-tournament.mjs https://your-domain.vercel.app");
  process.exit(1);
}

// ensure it has /api/riot-webhook at the end
const fullWebhookUrl = webhookUrl.endsWith('/api/riot-webhook') 
  ? webhookUrl 
  : `${webhookUrl.replace(/\/$/, '')}/api/riot-webhook`;

console.log(`Using Webhook URL: ${fullWebhookUrl}`);
console.log(`Using API Key: ${apiKey.slice(0, 12)}...`);

async function register() {
  try {
    // 1. Register Provider
    const providerRes = await fetch('https://americas.api.riotgames.com/lol/tournament-stub/v5/providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Riot-Token': apiKey
      },
      body: JSON.stringify({
        url: fullWebhookUrl,
        region: 'SEA' // region code for SEA/VN tournaments
      })
    });

    if (!providerRes.ok) {
      const errText = await providerRes.text();
      throw new Error(`Failed to register provider: ${providerRes.status} - ${errText}`);
    }

    const providerId = await providerRes.json();
    console.log(`\n✅ Provider registered successfully!`);
    console.log(`Riot Provider ID: ${providerId}`);

    // 2. Register Tournament
    const tournamentRes = await fetch('https://americas.api.riotgames.com/lol/tournament-stub/v5/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Riot-Token': apiKey
      },
      body: JSON.stringify({
        name: 'VNG Corporate Cup 2026',
        providerId: providerId
      })
    });

    if (!tournamentRes.ok) {
      const errText = await tournamentRes.text();
      throw new Error(`Failed to register tournament: ${tournamentRes.status} - ${errText}`);
    }

    const tournamentId = await tournamentRes.json();
    console.log(`✅ Tournament registered successfully!`);
    console.log(`Riot Tournament ID: ${tournamentId}`);

    console.log(`\n👉 Next Steps:`);
    console.log(`1. Open the Admin Panel (http://localhost:3000/admin)`);
    console.log(`2. Go to the "Riot Tournament API" tab`);
    console.log(`3. Enter Provider ID: ${providerId}`);
    console.log(`4. Enter Tournament ID: ${tournamentId}`);
    console.log(`5. Click "Save Riot Credentials"`);
  } catch (error) {
    console.error(`\n❌ Error registering:`, error.message);
  }
}

register();
