# 🎮 Esports Team Logo Design & Generation Guide

Welcome to the Esports Logo Design Guide for the **Gear Games LoL Cup 2026**! Because esports portals thrive on aggressive, high-contrast, and vibrant team branding, this guide outlines the best strategies, prompt structures, and custom prompts for each of your 9 teams.

---

## 💡 The Esports Logo AI Prompt Blueprint

Esports logos have a very specific visual language. To get high-quality results from AI generators (like **Midjourney**, **DALL-E 3 / Bing Image Creator**, or **Leonardo.ai**), your prompts should follow this structure:

```
[Mascot/Subject], esport gaming logo, vector badge shield, [Color 1] and [Color 2] neon glow, aggressive stance, bold clean lines, dark background, sticker style, high contrast --no text realistic photo 3d photorealistic gradients
```

### 🚨 Critical AI Image Generation Rules

1. **No Text Rendering (`--no text` / "no text"):**
   AI models (including Midjourney, DALL-E, and Stable Diffusion) are notoriously bad at rendering readable text. They will distort, misspell, or produce gibberish.
   * **Strategy:** Generate the **mascot/symbol only** as a clean vector badge on a dark/neutral background. If you need a wordmark/team name, add it manually in **Figma**, **Canva**, or **Adobe Illustrator**.
2. **Bold & Scalable Silhouettes:**
   Since team logos will scale down to **16px favicons**, **32px brackets**, and **48px leaderboard lists**, avoid intricate, tiny details. Use words like `flat vector design`, `bold outlines`, `high contrast`, and `clean mascot badge`.
3. **Contrast and Color:**
   Use dark mode friendly neon colors (neon blue, electric purple, toxic green, hot pink, amber gold) framed inside a sharp shield or hexagonal badge.

---

## 🏆 Custom Logo Prompts for Your 9 Teams

Here are custom, pre-optimized prompts for each team in your tournament database. You can copy and paste these directly into DALL-E 3 (Bing), Midjourney, or Leonardo.ai:

### 1. Kỳ Lân Parky (Group B)
* **Theme:** Unicorn (Kỳ Lân - Qilin) Mascot
* **Prompt:**
  > `flat vector esports mascot logo of an aggressive mythical unicorn qilin head, glowing neon cyan and electric purple mane, sharp horns, vector shield badge design, bold clean lines, dark background, high contrast --no text photo realistic`

### 2. 36 Lõi Kim Cương (Group C)
* **Theme:** Teamfight Tactics (TFT) Hextech Diamond Cores / Augments
* **Prompt:**
  > `flat vector geometric logo of interlocking futuristic diamond shards forming a glowing core, neon cyan hextech style, esports badge design, sharp metallic edges, dark blue background, bold line art --no text`

### 3. TEAM SIUUUUUU (Group C)
* **Theme:** "Goat" (Greatest of All Time) / Ronaldo celebration motif
* **Prompt:**
  > `flat vector esports mascot logo of an aggressive lightning goat head, electric golden and jet black colors, fiery energy, gaming crest shield, vector illustration, bold strokes, dark background --no text`

### 4. TEAM 4ĐTL (Group A)
* **Theme:** Dynamic cross-swords or stylized four-point emblem
* **Prompt:**
  > `flat vector esports crest logo of four crossed glowing swords inside a medieval shield, crimson red and gold color palette, bold metallic line art, sharp edges, professional gaming emblem, dark background --no text`

### 5. TEAM Liên minh đá bay (Group B)
* **Theme:** Flying kick / Winged boots action crest
* **Prompt:**
  > `flat vector esports logo of a winged boots emblem with electric sparks, toxic green and neon yellow, action pose, gaming league badge, bold clean lines, high contrast, dark background --no text`

### 6. U40-500KG (Group A)
* **Theme:** Heavy armored Grizzly Bear or Rhinoceros (representing 500KG)
* **Prompt:**
  > `flat vector esports mascot logo of a massive armored grizzly bear roaring, metallic charcoal gray and amber orange, heavy steel armor, aggressive gamer badge, bold outlines, dark background --no text`

### 7. Gap Vibe (Group A)
* **Theme:** Cyberpunk skull / Soundwave vibe check
* **Prompt:**
  > `flat vector cyberpunk gaming mascot logo of a skull wearing futuristic neon sunglasses and headphones, hot pink and neon purple glow, synthwave style, circular badge, bold strokes, dark background --no text`

### 8. BoDoi (Group B)
* **Theme:** Military combat / Soldier helmet badge
* **Prompt:**
  > `flat vector esports logo of a modern tactical combat soldier helmet with a glowing gold star emblem, olive drab green and tactical grey, military crest, sharp gaming shield, dark background --no text`

### 9. Pick Me (Group C)
* **Theme:** Cute but competitive neon controller mascot
* **Prompt:**
  > `flat vector esports mascot logo of a playful cartoon hand holding a glowing neon gaming controller, vibrant pink and cyan, sticker style badge, thick borders, dark background --no text`

---

## 🛠️ How to Integrate Your New Logos

Once you have generated your logos and saved them as `.png` files, follow these steps to integrate them into your Next.js project:

### Step 1: Save Logos in Public Directory
Save your generated and cropped logo files inside a new folder in public:
* `public/logos/kylan.png`
* `public/logos/36loi.png`
* `public/logos/siuu.png`
* `...`

### Step 2: Update database file (`src/lib/db.js`)
Edit [db.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/lib/db.js) to replace the external Unsplash URLs with your local relative paths:

```js
const DEFAULT_TEAMS = {
  "team-kylan": {
    "id": "team-kylan",
    "name": "Kỳ Lân Parky",
    "logo": "/logos/kylan.png", // [UPDATE] points to public/logos/kylan.png
    "group": "B",
    ...
  },
  "team-36loi": {
    "id": "team-36loi",
    "name": "36 Lõi Kim Cương",
    "logo": "/logos/36loi.png", // [UPDATE]
    "group": "C",
    ...
  },
  ...
}
```

### Step 3: Clear Mock Data (If utilizing local storage)
Since mock mode saves settings in the browser's `localStorage`, you'll need to clear your site's local storage or click **Reset Data** on the Admin page to apply the updated default paths.
