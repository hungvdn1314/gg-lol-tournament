import { isMockMode, database } from "./firebase";
import { ref, get, set, update, remove, onValue } from "firebase/database";

// ==========================================
// DEFAULT DATA FOR INITIALIZATION
// ==========================================

const DEFAULT_CONFIG = {
  title: "Gear Games ARAM Mayhem 2026",
  date: "June 25 - July 5, 2026",
  venue: "Howling Abyss (Online)",
  description: "The annual corporate showdown. Eight departments clash in the chaotic ARAM Mayhem for gold, glory, and the corporate trophy.",
  finalized: false,
  captainPasscode: "aram2026"
};

const DEFAULT_TEAMS = {
  "team-kylan": {
    "id": "team-kylan",
    "name": "Kỳ Lân Parky",
    "logo": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=150&auto=format&fit=crop&q=80",
    "group": "B",
    "players": [
      {
        "name": "TienNX-10013",
        "role": "ARAM Combatant",
        "riotId": "Tớ Là Tínn#vn1",
        "jerseyName": "Em Tínn",
        "size": "2XL"
      },
      {
        "name": "HieuVT2910-10061",
        "role": "ARAM Combatant",
        "riotId": "Tiểu Vân#2801",
        "jerseyName": "Hieuthuhigh",
        "size": "2XL"
      },
      {
        "name": "ChinhNM",
        "role": "ARAM Combatant",
        "riotId": "⁦Zz Prince zZ⁩#⁦NMC⁩",
        "jerseyName": "Prince",
        "size": "2XL"
      },
      {
        "name": "ThanhND - 10058",
        "role": "ARAM Combatant",
        "riotId": "Zinno#zinno",
        "jerseyName": "Zinno",
        "size": "3XL"
      },
      {
        "name": "ThuyHT",
        "role": "ARAM Combatant",
        "riotId": "Em Cáo Kiêu Kì #3721",
        "jerseyName": "Dotori",
        "size": "M"
      },
      {
        "name": "TamHD",
        "role": "ARAM Combatant",
        "riotId": "Cải Sama #alaba",
        "jerseyName": "Cải Sama",
        "size": "XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-36loi": {
    "id": "team-36loi",
    "name": "36 Lõi Kim Cương",
    "logo": "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=150&auto=format&fit=crop&q=80",
    "group": "C",
    "players": [
      {
        "name": "HaiLT-3238",
        "role": "ARAM Combatant",
        "riotId": "Amadeus#2507",
        "jerseyName": "midking",
        "size": "3XL"
      },
      {
        "name": "HieuTT-2434",
        "role": "ARAM Combatant",
        "riotId": "HieuTT-2434#vn1",
        "jerseyName": "Đòn Enjoyer",
        "size": "3XL"
      },
      {
        "name": "KienBD-10050",
        "role": "ARAM Combatant",
        "riotId": "mmbl#888",
        "jerseyName": "neikcd",
        "size": "L"
      },
      {
        "name": "PhucDT-10055",
        "role": "ARAM Combatant",
        "riotId": "Phucego #phuc",
        "jerseyName": "Phucego",
        "size": "4XL"
      },
      {
        "name": "QuanNP-3580",
        "role": "ARAM Combatant",
        "riotId": "DarkTurquois#7293",
        "jerseyName": "DarkTurquois",
        "size": "4XL"
      },
      {
        "name": "MinhDH-2437",
        "role": "ARAM Combatant",
        "riotId": "LôngDáiVịLẩuThái#MG32",
        "jerseyName": "Minh Cầu Giấy",
        "size": "4XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-siuu": {
    "id": "team-siuu",
    "name": "TEAM SIUUUUUU",
    "logo": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80",
    "group": "C",
    "players": [
      {
        "name": "NhanNM",
        "role": "ARAM Combatant",
        "riotId": "JayQKA2",
        "jerseyName": "10h37",
        "size": "XL"
      },
      {
        "name": "QuangPD0305",
        "role": "ARAM Combatant",
        "riotId": "SứtMôiĐẹpTrai",
        "jerseyName": "6h50",
        "size": "3XL"
      },
      {
        "name": "DatNT1",
        "role": "ARAM Combatant",
        "riotId": "SuperiorDragon12#3883",
        "jerseyName": "SuperiorDragon",
        "size": "2XL"
      },
      {
        "name": "SonNH",
        "role": "ARAM Combatant",
        "riotId": "Crying Over You#2307",
        "jerseyName": "3 Ca Chưa Say",
        "size": "3XL"
      },
      {
        "name": "HungLN2703",
        "role": "ARAM Combatant",
        "riotId": "SmokeWeedAllTime",
        "jerseyName": "Bảy Chọ",
        "size": "3XL"
      },
      {
        "name": "DuongNNP",
        "role": "ARAM Combatant",
        "riotId": "4th #2109",
        "jerseyName": "mẹo m bé",
        "size": "4XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-4dtl": {
    "id": "team-4dtl",
    "name": "TEAM 4ĐTL",
    "logo": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80",
    "group": "A",
    "players": [
      {
        "name": "TinBT - 1526",
        "role": "ARAM Combatant",
        "riotId": "but my boo boo#266",
        "jerseyName": "Remy",
        "size": "4XL"
      },
      {
        "name": "LinhHVK-875",
        "role": "ARAM Combatant",
        "riotId": "notyourbb#256",
        "jerseyName": "kl",
        "size": "M"
      },
      {
        "name": "SonDT-10037",
        "role": "ARAM Combatant",
        "riotId": "Đoòng#129",
        "jerseyName": "Đoòng",
        "size": "4XL"
      },
      {
        "name": "VuHQ-2418",
        "role": "ARAM Combatant",
        "riotId": "Quá Tam Ba Sáu #3636",
        "jerseyName": "VuHQ",
        "size": "XL"
      },
      {
        "name": "XuanBN-10036",
        "role": "ARAM Combatant",
        "riotId": "Đại Mạç Cô Yên#2906",
        "jerseyName": "Cain",
        "size": "XL"
      },
      {
        "name": "DoTV-10064",
        "role": "ARAM Combatant",
        "riotId": "Mai Quỳnh Hương#UwU",
        "jerseyName": "mr.least",
        "size": "3XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-lienminh": {
    "id": "team-lienminh",
    "name": "TEAM Liên minh đá bay",
    "logo": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80",
    "group": "B",
    "players": [
      {
        "name": "HieuPV",
        "role": "ARAM Combatant",
        "riotId": "MochAme",
        "jerseyName": "MochAme",
        "size": "L"
      },
      {
        "name": "HungVDN",
        "role": "ARAM Combatant",
        "riotId": "IrrationaL雨洁天青#1314",
        "jerseyName": "IrrationaL",
        "size": "2XL"
      },
      {
        "name": "QuanNLH",
        "role": "ARAM Combatant",
        "riotId": "Cá Hồi Hộp",
        "jerseyName": "Chovy Sông Hàn",
        "size": "2XL"
      },
      {
        "name": "PhongTH",
        "role": "ARAM Combatant",
        "riotId": "GateKeeper#phong",
        "jerseyName": "Zion",
        "size": "L"
      },
      {
        "name": "TriDM-10066",
        "role": "ARAM Combatant",
        "riotId": "Nhớ Nhung#8438",
        "jerseyName": "Trée",
        "size": "L"
      },
      {
        "name": "TriemPT",
        "role": "ARAM Combatant",
        "riotId": "Hadestrb#GAF",
        "jerseyName": "Hadestrb",
        "size": "L"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-u40": {
    "id": "team-u40",
    "name": "U40-500KG",
    "logo": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80",
    "group": "A",
    "players": [
      {
        "name": "TriTM-1529",
        "role": "ARAM Combatant",
        "riotId": "Pezzy#02208",
        "jerseyName": "Pezzy",
        "size": "3XL"
      },
      {
        "name": "SonLN-3108",
        "role": "ARAM Combatant",
        "riotId": "Sơn Lê Stark#stark",
        "jerseyName": "Stark",
        "size": "2XL"
      },
      {
        "name": "QuangPD-2397",
        "role": "ARAM Combatant",
        "riotId": "FakerDCMAntin#dz222",
        "jerseyName": "Pentakill",
        "size": "4XL"
      },
      {
        "name": "LamHT-496",
        "role": "ARAM Combatant",
        "riotId": "Gối Ôm Wibu#19696",
        "jerseyName": "LamHT",
        "size": "XL"
      },
      {
        "name": "HungLN-443",
        "role": "ARAM Combatant",
        "riotId": "Hector#REK7",
        "jerseyName": "Hector",
        "size": "2XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-gapvibe": {
    "id": "team-gapvibe",
    "name": "Gap Vibe",
    "logo": "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=150&auto=format&fit=crop&q=80",
    "group": "A",
    "players": [
      {
        "name": "TuanDV",
        "role": "ARAM Combatant",
        "riotId": "Hạ Cái Tôi Xuống#0701",
        "jerseyName": "Chovy > Faker",
        "size": "L"
      },
      {
        "name": "ThangLD",
        "role": "ARAM Combatant",
        "riotId": "Silent Mary #thang",
        "jerseyName": "ShaloMArtist",
        "size": "2XL"
      },
      {
        "name": "ChinhVQ",
        "role": "ARAM Combatant",
        "riotId": "Kiemhiepden",
        "jerseyName": "Kiemhiepden",
        "size": "L"
      },
      {
        "name": "TuLQ",
        "role": "ARAM Combatant",
        "riotId": "Uchihahaha",
        "jerseyName": "HASAGI",
        "size": "L"
      },
      {
        "name": "Tomas",
        "role": "ARAM Combatant",
        "riotId": "ioslav",
        "jerseyName": "ioslav",
        "size": "3XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-bodoi": {
    "id": "team-bodoi",
    "name": "BoDoi",
    "logo": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
    "group": "B",
    "players": [
      {
        "name": "KhanhTT",
        "role": "ARAM Combatant",
        "riotId": "anryone#vn2",
        "jerseyName": "anryone",
        "size": "L"
      },
      {
        "name": "CongNT",
        "role": "ARAM Combatant",
        "riotId": "BabyEvil",
        "jerseyName": "B.E",
        "size": "L"
      },
      {
        "name": "HaoTM",
        "role": "ARAM Combatant",
        "riotId": "zzDaiKaLaTa0zz",
        "jerseyName": "Vuacaulong",
        "size": "XL"
      },
      {
        "name": "HieuNM",
        "role": "ARAM Combatant",
        "riotId": "Vua Cục Khẳng",
        "jerseyName": "SantosSiuuuu",
        "size": "2XL"
      },
      {
        "name": "NinhPQ",
        "role": "ARAM Combatant",
        "riotId": "Psychik",
        "jerseyName": "Psychik",
        "size": "4XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  },
  "team-pickme": {
    "id": "team-pickme",
    "name": "Pick Me",
    "logo": "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
    "group": "C",
    "players": [
      {
        "name": "DungHP2712",
        "role": "ARAM Combatant",
        "riotId": "Cô giáo Moe",
        "jerseyName": "Cô giáo Moe",
        "size": "M"
      },
      {
        "name": "DuyNN",
        "role": "ARAM Combatant",
        "riotId": "bobobi",
        "jerseyName": "bobobi",
        "size": "XL"
      },
      {
        "name": "TuNN",
        "role": "ARAM Combatant",
        "riotId": "nabnedtaT",
        "jerseyName": "nabnedtaT",
        "size": "XL"
      },
      {
        "name": "HungDV",
        "role": "ARAM Combatant",
        "riotId": "Mizutan",
        "jerseyName": "Mizutan",
        "size": "XL"
      },
      {
        "name": "TuyenVT",
        "role": "ARAM Combatant",
        "riotId": "TQF5.TuyênTe",
        "jerseyName": "TQF5.TuyênTe",
        "size": "2XL"
      }
    ],
    "stats": {
      "played": 0,
      "wins": 0,
      "losses": 0,
      "points": 0,
      "gameWins": 0,
      "gameLosses": 0
    }
  }
};

const DEFAULT_MATCHES = {
  "match-g-a1": {
    "id": "match-g-a1",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-gapvibe",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-a2": {
    "id": "match-g-a2",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-4dtl",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-a3": {
    "id": "match-g-a3",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-gapvibe",
    "teamBId": "team-4dtl",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-b1": {
    "id": "match-g-b1",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-lienminh",
    "teamBId": "team-bodoi",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-b2": {
    "id": "match-g-b2",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-bodoi",
    "teamBId": "team-kylan",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-b3": {
    "id": "match-g-b3",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-lienminh",
    "teamBId": "team-kylan",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-c1": {
    "id": "match-g-c1",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-siuu",
    "teamBId": "team-36loi",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-c2": {
    "id": "match-g-c2",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-36loi",
    "teamBId": "team-pickme",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T19:00:00.000Z",
    "winnerId": null
  },
  "match-g-c3": {
    "id": "match-g-c3",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-siuu",
    "teamBId": "team-pickme",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-1": {
    "id": "match-playoff-1",
    "type": "knockout",
    "stage": "Upper Semifinals #1",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-27T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-2": {
    "id": "match-playoff-2",
    "type": "knockout",
    "stage": "Upper Semifinals #2",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-27T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-3": {
    "id": "match-playoff-3",
    "type": "knockout",
    "stage": "Lower Quarterfinals #1",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-28T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-4": {
    "id": "match-playoff-4",
    "type": "knockout",
    "stage": "Lower Quarterfinals #2",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-28T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-5": {
    "id": "match-playoff-5",
    "type": "knockout",
    "stage": "Upper Finals",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-29T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-6": {
    "id": "match-playoff-6",
    "type": "knockout",
    "stage": "Lower Semifinals",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-29T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-7": {
    "id": "match-playoff-7",
    "type": "knockout",
    "stage": "Losers Bracket Final",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 5,
    "scheduledTime": "2026-07-30T19:00:00.000Z",
    "winnerId": null
  },
  "match-playoff-8": {
    "id": "match-playoff-8",
    "type": "knockout",
    "stage": "Grand Final",
    "teamAId": null,
    "teamBId": null,
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 5,
    "scheduledTime": "2026-08-03T19:00:00.000Z",
    "winnerId": null
  }
};

const DEFAULT_BRACKET = {
  size: 6,
  rounds: [
    {
      name: "Upper Semifinals",
      matches: ["match-playoff-1", "match-playoff-2"]
    },
    {
      name: "Upper Finals",
      matches: ["match-playoff-5"]
    },
    {
      name: "Lower Quarterfinals",
      matches: ["match-playoff-3", "match-playoff-4"]
    },
    {
      name: "Lower Semifinals",
      matches: ["match-playoff-6"]
    },
    {
      name: "Lower Finals",
      matches: ["match-playoff-7"]
    },
    {
      name: "Grand Finals",
      matches: ["match-playoff-8"]
    }
  ]
};

// ==========================================
// STORAGE MANAGEMENT (LOCAL STORAGE MOCK)
// ==========================================

const subscribers = {
  config: [],
  teams: [],
  matches: [],
  bracket: [],
  matchDetails: [],
  news: []
};

function getMockStorage(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  const val = localStorage.getItem(`lol_tourney_${key}`);
  if (!val) {
    localStorage.setItem(`lol_tourney_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
}

function setMockStorage(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lol_tourney_${key}`, JSON.stringify(value));
  // Notify local subscribers
  if (subscribers[key]) {
    subscribers[key].forEach(callback => callback(value));
  }
}

// Initialise Local Storage defaults if not present
if (typeof window !== "undefined") {
  const currentTitle = getMockStorage("config", DEFAULT_CONFIG)?.title;
  if (currentTitle && !currentTitle.includes("ARAM")) {
    console.log("Old database detected. Resetting to finalized ARAM Mayhem structure.");
    localStorage.removeItem("lol_tourney_config");
    localStorage.removeItem("lol_tourney_teams");
    localStorage.removeItem("lol_tourney_matches");
    localStorage.removeItem("lol_tourney_bracket");
    localStorage.removeItem("lol_tourney_matchDetails");
  }
  getMockStorage("config", DEFAULT_CONFIG);
  getMockStorage("teams", DEFAULT_TEAMS);
  getMockStorage("matches", DEFAULT_MATCHES);
  getMockStorage("bracket", DEFAULT_BRACKET);
  getMockStorage("matchDetails", {});
}

// ==========================================
// UNIFIED DATABASE ACTIONS
// ==========================================

// Realtime subscriptions
export function subscribeToData(key, callback) {
  if (isMockMode) {
    // Return initial value
    const data = getMockStorage(key, key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {});
    callback(data);
    
    // Register subscription
    subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  } else {
    const dbRef = ref(database, key);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    }, (error) => {
      console.error(`Firebase subscription error for ${key}:`, error);
    });
  }
}

// Single fetch (Promise-based)
export async function fetchData(key) {
  if (isMockMode) {
    return getMockStorage(key, key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {});
  } else {
    try {
      const dbRef = ref(database, key);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {};
    } catch (e) {
      console.error(`Firebase fetch error for ${key}:`, e);
      return key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {};
    }
  }
}

// Save functions
export async function saveConfig(newConfig) {
  if (isMockMode) {
    setMockStorage("config", newConfig);
    return newConfig;
  } else {
    const dbRef = ref(database, "config");
    await set(dbRef, newConfig);
    return newConfig;
  }
}

export async function saveTeam(team) {
  if (isMockMode) {
    const teams = getMockStorage("teams", DEFAULT_TEAMS);
    teams[team.id] = team;
    setMockStorage("teams", teams);
    await recalculateLeaderboard();
    return team;
  } else {
    const dbRef = ref(database, `teams/${team.id}`);
    await set(dbRef, team);
    await recalculateLeaderboard();
    return team;
  }
}

export async function deleteTeam(teamId) {
  if (isMockMode) {
    const teams = getMockStorage("teams", DEFAULT_TEAMS);
    delete teams[teamId];
    setMockStorage("teams", teams);
    await recalculateLeaderboard();
    return teamId;
  } else {
    const dbRef = ref(database, `teams/${teamId}`);
    await remove(dbRef);
    await recalculateLeaderboard();
    return teamId;
  }
}

export async function saveMatch(match) {
  if (isMockMode) {
    const matches = getMockStorage("matches", DEFAULT_MATCHES);
    matches[match.id] = match;
    
    // Double Elimination Playoff Bracket Automation
    if (match.status === "completed" && match.winnerId) {
      const loserId = match.winnerId === match.teamAId ? match.teamBId : match.teamAId;
      if (match.id === "match-playoff-1") {
        if (matches["match-playoff-5"]) matches["match-playoff-5"].teamAId = match.winnerId;
        if (matches["match-playoff-3"]) matches["match-playoff-3"].teamBId = loserId;
      } else if (match.id === "match-playoff-2") {
        if (matches["match-playoff-5"]) matches["match-playoff-5"].teamBId = match.winnerId;
        if (matches["match-playoff-4"]) matches["match-playoff-4"].teamBId = loserId;
      } else if (match.id === "match-playoff-3") {
        if (matches["match-playoff-6"]) matches["match-playoff-6"].teamAId = match.winnerId;
      } else if (match.id === "match-playoff-4") {
        if (matches["match-playoff-6"]) matches["match-playoff-6"].teamBId = match.winnerId;
      } else if (match.id === "match-playoff-5") {
        if (matches["match-playoff-8"]) matches["match-playoff-8"].teamAId = match.winnerId;
        if (matches["match-playoff-7"]) matches["match-playoff-7"].teamAId = loserId;
      } else if (match.id === "match-playoff-6") {
        if (matches["match-playoff-7"]) matches["match-playoff-7"].teamBId = match.winnerId;
      } else if (match.id === "match-playoff-7") {
        if (matches["match-playoff-8"]) matches["match-playoff-8"].teamBId = match.winnerId;
      }
    }

    setMockStorage("matches", matches);
    await recalculateLeaderboard();
    return match;
  } else {
    const dbRef = ref(database, `matches/${match.id}`);
    await set(dbRef, match);
    
    // Double Elimination Playoff Bracket Automation
    if (match.status === "completed" && match.winnerId) {
      const loserId = match.winnerId === match.teamAId ? match.teamBId : match.teamAId;
      if (match.id === "match-playoff-1") {
        await set(ref(database, `matches/match-playoff-5/teamAId`), match.winnerId);
        await set(ref(database, `matches/match-playoff-3/teamBId`), loserId);
      } else if (match.id === "match-playoff-2") {
        await set(ref(database, `matches/match-playoff-5/teamBId`), match.winnerId);
        await set(ref(database, `matches/match-playoff-4/teamBId`), loserId);
      } else if (match.id === "match-playoff-3") {
        await set(ref(database, `matches/match-playoff-6/teamAId`), match.winnerId);
      } else if (match.id === "match-playoff-4") {
        await set(ref(database, `matches/match-playoff-6/teamBId`), match.winnerId);
      } else if (match.id === "match-playoff-5") {
        await set(ref(database, `matches/match-playoff-8/teamAId`), match.winnerId);
        await set(ref(database, `matches/match-playoff-7/teamAId`), loserId);
      } else if (match.id === "match-playoff-6") {
        await set(ref(database, `matches/match-playoff-7/teamBId`), match.winnerId);
      } else if (match.id === "match-playoff-7") {
        await set(ref(database, `matches/match-playoff-8/teamBId`), match.winnerId);
      }
    }

    await recalculateLeaderboard();
    return match;
  }
}

export async function deleteMatch(matchId) {
  if (isMockMode) {
    const matches = getMockStorage("matches", DEFAULT_MATCHES);
    delete matches[matchId];
    setMockStorage("matches", matches);
    await recalculateLeaderboard();
    return matchId;
  } else {
    const dbRef = ref(database, `matches/${matchId}`);
    await remove(dbRef);
    await recalculateLeaderboard();
    return matchId;
  }
}

export async function saveBracket(bracket) {
  if (isMockMode) {
    setMockStorage("bracket", bracket);
    return bracket;
  } else {
    const dbRef = ref(database, "bracket");
    await set(dbRef, bracket);
    return bracket;
  }
}

// Reset entire database to default mock structures
export async function resetToDefaultData() {
  if (isMockMode) {
    setMockStorage("config", DEFAULT_CONFIG);
    setMockStorage("teams", DEFAULT_TEAMS);
    setMockStorage("matches", DEFAULT_MATCHES);
    setMockStorage("bracket", DEFAULT_BRACKET);
    setMockStorage("matchDetails", {});
    setMockStorage("news", {});
    await recalculateLeaderboard();
  } else {
    await set(ref(database, "config"), DEFAULT_CONFIG);
    await set(ref(database, "teams"), DEFAULT_TEAMS);
    await set(ref(database, "matches"), DEFAULT_MATCHES);
    await set(ref(database, "bracket"), DEFAULT_BRACKET);
    await set(ref(database, "matchDetails"), {});
    await set(ref(database, "news"), {});
    await recalculateLeaderboard();
  }
}

// ==========================================
// DYNAMIC STANDINGS CALCULATION (ROUND ROBIN)
// ==========================================

export async function recalculateLeaderboard() {
  const teams = await fetchData("teams");
  const matches = await fetchData("matches");

  // Reset team stats
  Object.keys(teams).forEach((id) => {
    teams[id].stats = {
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      gameWins: 0,
      gameLosses: 0
    };
  });

  // Calculate stats based on COMPLETED matches
  Object.values(matches).forEach((match) => {
    if (match.type === "group" && match.status === "completed") {
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];

      if (teamA && teamB) {
        teamA.stats.played += 1;
        teamB.stats.played += 1;

        teamA.stats.gameWins += match.scoreA;
        teamA.stats.gameLosses += match.scoreB;
        teamB.stats.gameWins += match.scoreB;
        teamB.stats.gameLosses += match.scoreA;

        if (match.winnerId === match.teamAId) {
          teamA.stats.wins += 1;
          teamA.stats.points += 3; // 3 points for win
          teamB.stats.losses += 1;
        } else if (match.winnerId === match.teamBId) {
          teamB.stats.wins += 1;
          teamB.stats.points += 3;
          teamA.stats.losses += 1;
        } else {
          // Tie/Draw if possible in some formats (e.g. Bo2)
          teamA.stats.points += 1;
          teamB.stats.points += 1;
        }
      }
    }
  });

  // Save the updated team data
  if (isMockMode) {
    setMockStorage("teams", teams);
  } else {
    await set(ref(database, "teams"), teams);
  }
}

// ==========================================
// MATCH DETAILS OPERATIONS
// ==========================================

export async function saveMatchDetails(matchId, details) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    allDetails[matchId] = details;
    setMockStorage("matchDetails", allDetails);
    return details;
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    await set(dbRef, details);
    return details;
  }
}

export async function fetchMatchDetails(matchId) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    return allDetails[matchId] || null;
  } else {
    try {
      const dbRef = ref(database, `matchDetails/${matchId}`);
      const snapshot = await get(dbRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      console.error(`Firebase fetch error for matchDetails/${matchId}:`, e);
      return null;
    }
  }
}

export async function submitCaptainGameScore(matchId, gameIndex, gameDetails) {
  // 1. Fetch match metadata
  const match = await fetchData(`matches/${matchId}`);
  if (!match || !match.id) {
    throw new Error(`Match ${matchId} not found`);
  }

  // 2. Fetch existing match details
  let existingDetails = await fetchData(`matchDetails/${matchId}`) || [];
  if (!Array.isArray(existingDetails)) {
    existingDetails = [existingDetails];
  }

  // Ensure details array is large enough
  while (existingDetails.length <= gameIndex) {
    existingDetails.push(null);
  }

  // 3. Save the new gameDetails to the index
  existingDetails[gameIndex] = gameDetails;

  // Save details back to db
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    allDetails[matchId] = existingDetails;
    setMockStorage("matchDetails", allDetails);
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    await set(dbRef, existingDetails);
  }

  // 4. Recalculate match scores based on existingDetails
  let scoreA = 0;
  let scoreB = 0;
  existingDetails.forEach(game => {
    if (game) {
      const isBlueWinner = game.teams[100]?.winner;
      if (isBlueWinner) {
        scoreA += 1;
      } else {
        scoreB += 1;
      }
    }
  });

  const targetWins = Math.ceil(match.bestOf / 2);
  let status = "live";
  let winnerId = null;

  if (scoreA >= targetWins) {
    status = "completed";
    winnerId = match.teamAId;
  } else if (scoreB >= targetWins) {
    status = "completed";
    winnerId = match.teamBId;
  }

  const updatedMatch = {
    ...match,
    scoreA,
    scoreB,
    status,
    winnerId
  };

  // 5. Save updated match metadata
  if (isMockMode) {
    const matches = getMockStorage("matches", DEFAULT_MATCHES);
    matches[matchId] = updatedMatch;
    
    // Playoff Bracket Advancement
    if (status === "completed" && match.type === "knockout") {
      if (matchId === "match-semi1" && matches["match-final"]) {
        matches["match-final"].teamAId = winnerId;
        if (matches["match-third"]) {
          matches["match-third"].teamAId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
        }
      } else if (matchId === "match-semi2" && matches["match-final"]) {
        matches["match-final"].teamBId = winnerId;
        if (matches["match-third"]) {
          matches["match-third"].teamBId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
        }
      }
    }
    setMockStorage("matches", matches);
  } else {
    const { database: db } = await import("@/lib/firebase");
    const { ref: dbRef, set: dbSet } = await import("firebase/database");
    await dbSet(dbRef(db, `matches/${matchId}`), updatedMatch);
    
    // Playoff Bracket Advancement
    if (status === "completed" && match.type === "knockout") {
      if (matchId === "match-semi1") {
        await dbSet(dbRef(db, "matches/match-final/teamAId"), winnerId);
        await dbSet(dbRef(db, "matches/match-third/teamAId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
      } else if (matchId === "match-semi2") {
        await dbSet(dbRef(db, "matches/match-final/teamBId"), winnerId);
        await dbSet(dbRef(db, "matches/match-third/teamBId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
      }
    }
  }

  // 6. Recalculate standings leaderboard
  await recalculateLeaderboard();
  return { updatedMatch, gameDetails };
}

export function subscribeToMatchDetails(matchId, callback) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    callback(allDetails[matchId] || null);

    const handler = (newAllDetails) => {
      callback(newAllDetails[matchId] || null);
    };

    subscribers.matchDetails.push(handler);
    return () => {
      subscribers.matchDetails = subscribers.matchDetails.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.val() || null);
    }, (error) => {
      console.error(`Firebase subscription error for matchDetails/${matchId}:`, error);
    });
  }
}

export async function fetchAllMatchDetails() {
  if (isMockMode) {
    return getMockStorage("matchDetails", {});
  } else {
    try {
      const dbRef = ref(database, `matchDetails`);
      const snapshot = await get(dbRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (e) {
      console.error(`Firebase fetch error for all matchDetails:`, e);
      return {};
    }
  }
}

export function subscribeToAllMatchDetails(callback) {
  if (isMockMode) {
    callback(getMockStorage("matchDetails", {}));
    
    const handler = (newAllDetails) => {
      callback(newAllDetails || {});
    };
    
    subscribers.matchDetails.push(handler);
    return () => {
      subscribers.matchDetails = subscribers.matchDetails.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, `matchDetails`);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
  }
}

// ==========================================
// NEWS & ANNOUNCEMENTS
// ==========================================

export async function saveNews(newsItem) {
  if (isMockMode) {
    const newsList = getMockStorage("news", {});
    newsList[newsItem.id] = newsItem;
    setMockStorage("news", newsList);
    return newsItem;
  } else {
    const dbRef = ref(database, `news/${newsItem.id}`);
    await set(dbRef, newsItem);
    return newsItem;
  }
}

export async function deleteNews(newsId) {
  if (isMockMode) {
    const newsList = getMockStorage("news", {});
    delete newsList[newsId];
    setMockStorage("news", newsList);
    return newsId;
  } else {
    const dbRef = ref(database, `news/${newsId}`);
    await remove(dbRef);
    return newsId;
  }
}

export function subscribeToNews(callback) {
  if (isMockMode) {
    callback(getMockStorage("news", {}));
    const handler = (newNews) => {
      callback(newNews || {});
    };
    if (!subscribers.news) subscribers.news = [];
    subscribers.news.push(handler);
    return () => {
      subscribers.news = subscribers.news.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, "news");
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
  }
}
