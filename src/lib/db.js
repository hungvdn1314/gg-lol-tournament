import { isMockMode, database } from "./firebase";
import { ref, get, set, update, remove, onValue } from "firebase/database";

// ==========================================
// DEFAULT DATA FOR INITIALIZATION
// ==========================================

const DEFAULT_CONFIG = {
  title: "Gear Games League of Legend Championship",
  date: "Jul 22 - Aug 3, 2026",
  venue: "Ha Noi & Da Nang",
  description: "",
  finalized: false,
  captainPasscode: "aram2026"
};

const DEFAULT_MATCH_DETAILS = {
  "match-g-a1": [
    {
      "gameDuration": 977,
      "teams": {
        "100": {
          "winner": true,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": true
        },
        "200": {
          "winner": false,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": false
        }
      },
      "participants": [
        {
          "playerName": "TuanDV",
          "teamId": 100,
          "win": true,
          "kills": 16,
          "deaths": 5,
          "assists": 33,
          "gold": 14795,
          "cs": 68,
          "vision": 0,
          "damageDealt": 32273,
          "damageTaken": 14077,
          "healing": 3748,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 2,
          "inhibitorsKilled": 0,
          "champion": "Jhin",
          "items": [
            3134,
            126697,
            6676,
            3009,
            6696,
            3814
          ],
          "summonerSpells": [
            6,
            4
          ],
          "runes": {
            "keystoneId": 8021,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "ThangLD",
          "teamId": 100,
          "win": true,
          "kills": 10,
          "deaths": 6,
          "assists": 33,
          "gold": 13064,
          "cs": 90,
          "vision": 0,
          "damageDealt": 40812,
          "damageTaken": 25838,
          "healing": 6953,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 2,
          "inhibitorsKilled": 1,
          "champion": "Ryze",
          "items": [
            6657,
            3040,
            1001,
            3089,
            3802,
            1026
          ],
          "summonerSpells": [
            4,
            14
          ],
          "runes": {
            "keystoneId": 8230,
            "primaryStyleId": 8200
          }
        },
        {
          "playerName": "ChinhVQ",
          "teamId": 100,
          "win": true,
          "kills": 15,
          "deaths": 9,
          "assists": 24,
          "gold": 12489,
          "cs": 16,
          "vision": 0,
          "damageDealt": 24378,
          "damageTaken": 19627,
          "healing": 150,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Akali",
          "items": [
            4646,
            3157,
            3020,
            4645,
            2031,
            1052
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8112,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "TuLQ",
          "teamId": 100,
          "win": true,
          "kills": 16,
          "deaths": 10,
          "assists": 21,
          "gold": 12898,
          "cs": 6,
          "vision": 0,
          "damageDealt": 18698,
          "damageTaken": 24036,
          "healing": 4836,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Pyke",
          "items": [
            6696,
            0,
            3155,
            6676,
            3158,
            3814
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 9923,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "Tomas",
          "teamId": 100,
          "win": true,
          "kills": 3,
          "deaths": 10,
          "assists": 39,
          "gold": 10753,
          "cs": 7,
          "vision": 0,
          "damageDealt": 15150,
          "damageTaken": 33798,
          "healing": 3928,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Nautilus",
          "items": [
            3084,
            3111,
            3110,
            8020,
            1011,
            0
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8439,
            "primaryStyleId": 8400
          }
        },
        {
          "playerName": "TriTM-1529",
          "teamId": 200,
          "win": false,
          "kills": 10,
          "deaths": 11,
          "assists": 16,
          "gold": 11368,
          "cs": 31,
          "vision": 0,
          "damageDealt": 17781,
          "damageTaken": 24633,
          "healing": 864,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Teemo",
          "items": [
            3115,
            3006,
            6653,
            3124,
            0,
            0
          ],
          "summonerSpells": [
            4,
            14
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "SonLN-3108",
          "teamId": 200,
          "win": false,
          "kills": 4,
          "deaths": 8,
          "assists": 21,
          "gold": 9373,
          "cs": 20,
          "vision": 0,
          "damageDealt": 13479,
          "damageTaken": 12527,
          "healing": 464,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Xerath",
          "items": [
            6655,
            2031,
            4628,
            1001,
            1052,
            1058
          ],
          "summonerSpells": [
            13,
            4
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "QuangPD-2397",
          "teamId": 200,
          "win": false,
          "kills": 6,
          "deaths": 15,
          "assists": 19,
          "gold": 10354,
          "cs": 40,
          "vision": 0,
          "damageDealt": 17410,
          "damageTaken": 25700,
          "healing": 1017,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Jayce",
          "items": [
            6676,
            3042,
            3158,
            3155,
            3035,
            0
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8008,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "LamHT-496",
          "teamId": 200,
          "win": false,
          "kills": 16,
          "deaths": 9,
          "assists": 14,
          "gold": 14300,
          "cs": 72,
          "vision": 2,
          "damageDealt": 26139,
          "damageTaken": 20501,
          "healing": 4096,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Kalista",
          "items": [
            3111,
            3153,
            3302,
            3091,
            3085,
            0
          ],
          "summonerSpells": [
            4,
            1
          ],
          "runes": {
            "keystoneId": 8008,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "HungLN-443",
          "teamId": 200,
          "win": false,
          "kills": 3,
          "deaths": 17,
          "assists": 18,
          "gold": 9388,
          "cs": 9,
          "vision": 0,
          "damageDealt": 14259,
          "damageTaken": 51771,
          "healing": 853,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Malphite",
          "items": [
            3084,
            3047,
            3082,
            3083,
            1029,
            1027
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        }
      ]
    },
    {
      "gameDuration": 853,
      "teams": {
        "100": {
          "winner": false,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": true
        },
        "200": {
          "winner": true,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": false
        }
      },
      "participants": [
        {
          "playerName": "TuanDV",
          "teamId": 100,
          "win": false,
          "kills": 3,
          "deaths": 8,
          "assists": 13,
          "gold": 9432,
          "cs": 32,
          "vision": 0,
          "damageDealt": 18206,
          "damageTaken": 15561,
          "healing": 2167,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Lucian",
          "items": [
            3070,
            6696,
            3006,
            6676,
            1038,
            0
          ],
          "summonerSpells": [
            21,
            4
          ],
          "runes": {
            "keystoneId": 8005,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "ThangLD",
          "teamId": 100,
          "win": false,
          "kills": 6,
          "deaths": 11,
          "assists": 11,
          "gold": 10192,
          "cs": 56,
          "vision": 0,
          "damageDealt": 17816,
          "damageTaken": 19361,
          "healing": 2288,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Graves",
          "items": [
            6676,
            3033,
            3006,
            1053,
            1037,
            0
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8010,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "ChinhVQ",
          "teamId": 100,
          "win": false,
          "kills": 5,
          "deaths": 8,
          "assists": 5,
          "gold": 9041,
          "cs": 12,
          "vision": 0,
          "damageDealt": 17602,
          "damageTaken": 31718,
          "healing": 3038,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Garen",
          "items": [
            3084,
            3111,
            3071,
            3105,
            0,
            0
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8010,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "TuLQ",
          "teamId": 100,
          "win": false,
          "kills": 12,
          "deaths": 11,
          "assists": 10,
          "gold": 11968,
          "cs": 27,
          "vision": 0,
          "damageDealt": 21036,
          "damageTaken": 26907,
          "healing": 4404,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Rengar",
          "items": [
            6698,
            6610,
            2031,
            3158,
            6676,
            1038
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8112,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "Tomas",
          "teamId": 100,
          "win": false,
          "kills": 2,
          "deaths": 11,
          "assists": 12,
          "gold": 8535,
          "cs": 29,
          "vision": 0,
          "damageDealt": 18222,
          "damageTaken": 21033,
          "healing": 1891,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Samira",
          "items": [
            6676,
            3111,
            2031,
            6673,
            1036,
            0
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8010,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "TriTM-1529",
          "teamId": 200,
          "win": true,
          "kills": 9,
          "deaths": 5,
          "assists": 22,
          "gold": 11033,
          "cs": 46,
          "vision": 0,
          "damageDealt": 20280,
          "damageTaken": 26309,
          "healing": 10586,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 2,
          "inhibitorsKilled": 0,
          "champion": "Yorick",
          "items": [
            3084,
            3047,
            6662,
            3076,
            1028,
            1029
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8437,
            "primaryStyleId": 8400
          }
        },
        {
          "playerName": "SonLN-3108",
          "teamId": 200,
          "win": true,
          "kills": 7,
          "deaths": 8,
          "assists": 34,
          "gold": 10758,
          "cs": 30,
          "vision": 0,
          "damageDealt": 19479,
          "damageTaken": 19512,
          "healing": 3064,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Viktor",
          "items": [
            6657,
            3047,
            3040,
            6653,
            1011,
            0
          ],
          "summonerSpells": [
            4,
            6
          ],
          "runes": {
            "keystoneId": 8229,
            "primaryStyleId": 8200
          }
        },
        {
          "playerName": "QuangPD-2397",
          "teamId": 200,
          "win": true,
          "kills": 14,
          "deaths": 4,
          "assists": 21,
          "gold": 11310,
          "cs": 12,
          "vision": 0,
          "damageDealt": 27986,
          "damageTaken": 33340,
          "healing": 13464,
          "tripleKills": 1,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 1,
          "inhibitorsKilled": 0,
          "champion": "TahmKench",
          "items": [
            3084,
            1001,
            3083,
            3105,
            1011,
            0
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8439,
            "primaryStyleId": 8400
          }
        },
        {
          "playerName": "LamHT-496",
          "teamId": 200,
          "win": true,
          "kills": 8,
          "deaths": 7,
          "assists": 30,
          "gold": 10164,
          "cs": 19,
          "vision": 0,
          "damageDealt": 17554,
          "damageTaken": 13495,
          "healing": 1760,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Seraphine",
          "items": [
            2503,
            2031,
            3158,
            3165,
            3040,
            1052
          ],
          "summonerSpells": [
            4,
            7
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "HungLN-443",
          "teamId": 200,
          "win": true,
          "kills": 11,
          "deaths": 5,
          "assists": 22,
          "gold": 11452,
          "cs": 43,
          "vision": 0,
          "damageDealt": 21532,
          "damageTaken": 11824,
          "healing": 2250,
          "tripleKills": 1,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 1,
          "inhibitorsKilled": 1,
          "champion": "Caitlyn",
          "items": [
            6676,
            3031,
            3070,
            3006,
            126697,
            0
          ],
          "summonerSpells": [
            4,
            21
          ],
          "runes": {
            "keystoneId": 8005,
            "primaryStyleId": 8000
          }
        }
      ]
    },
    {
      "gameDuration": 276,
      "teams": {
        "100": {
          "winner": false,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": false
        },
        "200": {
          "winner": true,
          "bans": [],
          "barons": 0,
          "dragons": 0,
          "firstBlood": true
        }
      },
      "participants": [
        {
          "playerName": "TuanDV",
          "teamId": 100,
          "win": false,
          "kills": 1,
          "deaths": 3,
          "assists": 6,
          "gold": 3493,
          "cs": 1,
          "vision": 0,
          "damageDealt": 2543,
          "damageTaken": 6689,
          "healing": 176,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Thresh",
          "items": [
            1011,
            1001,
            3070,
            1011,
            1028,
            2010
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8351,
            "primaryStyleId": 8300
          }
        },
        {
          "playerName": "ThangLD",
          "teamId": 100,
          "win": false,
          "kills": 2,
          "deaths": 2,
          "assists": 5,
          "gold": 3839,
          "cs": 7,
          "vision": 0,
          "damageDealt": 2737,
          "damageTaken": 4681,
          "healing": 483,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Malphite",
          "items": [
            3070,
            2031,
            3801,
            1011,
            1011,
            1001
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8437,
            "primaryStyleId": 8400
          }
        },
        {
          "playerName": "ChinhVQ",
          "teamId": 100,
          "win": false,
          "kills": 3,
          "deaths": 3,
          "assists": 3,
          "gold": 3829,
          "cs": 13,
          "vision": 0,
          "damageDealt": 2779,
          "damageTaken": 6148,
          "healing": 347,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Garen",
          "items": [
            3084,
            2031,
            1001,
            0,
            0,
            0
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8437,
            "primaryStyleId": 8400
          }
        },
        {
          "playerName": "TuLQ",
          "teamId": 100,
          "win": false,
          "kills": 1,
          "deaths": 3,
          "assists": 5,
          "gold": 3329,
          "cs": 8,
          "vision": 0,
          "damageDealt": 4450,
          "damageTaken": 3490,
          "healing": 171,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Lux",
          "items": [
            6655,
            1052,
            0,
            0,
            0,
            0
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "Tomas",
          "teamId": 100,
          "win": false,
          "kills": 0,
          "deaths": 1,
          "assists": 0,
          "gold": 2696,
          "cs": 0,
          "vision": 0,
          "damageDealt": 212,
          "damageTaken": 797,
          "healing": 0,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Ahri",
          "items": [
            3802,
            2031,
            0,
            0,
            0,
            0
          ],
          "summonerSpells": [
            3,
            4
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "TriTM-1529",
          "teamId": 200,
          "win": true,
          "kills": 2,
          "deaths": 1,
          "assists": 3,
          "gold": 3617,
          "cs": 9,
          "vision": 0,
          "damageDealt": 3952,
          "damageTaken": 4776,
          "healing": 1269,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Aatrox",
          "items": [
            3084,
            0,
            0,
            0,
            0,
            0
          ],
          "summonerSpells": [
            32,
            4
          ],
          "runes": {
            "keystoneId": 8010,
            "primaryStyleId": 8000
          }
        },
        {
          "playerName": "SonLN-3108",
          "teamId": 200,
          "win": true,
          "kills": 5,
          "deaths": 2,
          "assists": 3,
          "gold": 4317,
          "cs": 3,
          "vision": 0,
          "damageDealt": 4075,
          "damageTaken": 2696,
          "healing": 193,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Corki",
          "items": [
            3057,
            3070,
            2003,
            3158,
            3051,
            1028
          ],
          "summonerSpells": [
            4,
            32
          ],
          "runes": {
            "keystoneId": 8229,
            "primaryStyleId": 8200
          }
        },
        {
          "playerName": "QuangPD-2397",
          "teamId": 200,
          "win": true,
          "kills": 3,
          "deaths": 0,
          "assists": 6,
          "gold": 4013,
          "cs": 3,
          "vision": 0,
          "damageDealt": 5426,
          "damageTaken": 2039,
          "healing": 627,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Leblanc",
          "items": [
            3802,
            2031,
            0,
            0,
            0,
            0
          ],
          "summonerSpells": [
            4,
            14
          ],
          "runes": {
            "keystoneId": 8112,
            "primaryStyleId": 8100
          }
        },
        {
          "playerName": "LamHT-496",
          "teamId": 200,
          "win": true,
          "kills": 0,
          "deaths": 2,
          "assists": 9,
          "gold": 3354,
          "cs": 6,
          "vision": 0,
          "damageDealt": 2430,
          "damageTaken": 3166,
          "healing": 329,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": true,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Renata",
          "items": [
            3070,
            3158,
            3916,
            2022,
            0,
            0
          ],
          "summonerSpells": [
            4,
            7
          ],
          "runes": {
            "keystoneId": 8214,
            "primaryStyleId": 8200
          }
        },
        {
          "playerName": "HungLN-443",
          "teamId": 200,
          "win": true,
          "kills": 2,
          "deaths": 2,
          "assists": 5,
          "gold": 4198,
          "cs": 18,
          "vision": 0,
          "damageDealt": 6127,
          "damageTaken": 3969,
          "healing": 951,
          "tripleKills": 0,
          "quadraKills": 0,
          "pentaKills": 0,
          "firstBlood": false,
          "turretsKilled": 0,
          "inhibitorsKilled": 0,
          "champion": "Graves",
          "items": [
            126697,
            0,
            0,
            0,
            0,
            0
          ],
          "summonerSpells": [
            7,
            4
          ],
          "runes": {
            "keystoneId": 8128,
            "primaryStyleId": 8100
          }
        }
      ]
    }
  ]
};

const DEFAULT_TEAMS = {
  "team-kylan": {
    "id": "team-kylan",
    "name": "Kỳ Lân Parky",
    "logo": "/logos/kylan.jpg",
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
    "logo": "/logos/loi_36.jpg",
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
    "logo": "/logos/siuu.jpg",
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
    "logo": "/logos/4dtl.jpg",
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
    "logo": "/logos/lienminh.jpg",
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
    "logo": "/logos/u40.jpg",
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
    "logo": "/logos/gapvibe.jpg",
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
    "logo": "/logos/bodoi.jpg",
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
    "logo": "/logos/pickme.jpg",
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
    "scheduledTime": "2026-07-22T12:00:00.000Z",
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
    "scheduledTime": "2026-07-23T12:00:00.000Z",
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
    "scheduledTime": "2026-07-24T12:00:00.000Z",
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
    "scheduledTime": "2026-07-22T12:00:00.000Z",
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
    "scheduledTime": "2026-07-23T12:00:00.000Z",
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
    "scheduledTime": "2026-07-24T12:00:00.000Z",
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
    "scheduledTime": "2026-07-22T12:00:00.000Z",
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
    "scheduledTime": "2026-07-23T12:00:00.000Z",
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
    "scheduledTime": "2026-07-24T12:00:00.000Z",
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
    "scheduledTime": "2026-07-27T12:00:00.000Z",
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
    "scheduledTime": "2026-07-27T12:00:00.000Z",
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
    "scheduledTime": "2026-07-28T12:00:00.000Z",
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
    "scheduledTime": "2026-07-28T12:00:00.000Z",
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
    "scheduledTime": "2026-07-29T12:00:00.000Z",
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
    "scheduledTime": "2026-07-29T12:00:00.000Z",
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
    "scheduledTime": "2026-07-30T12:00:00.000Z",
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
    "scheduledTime": "2026-08-03T12:00:00.000Z",
    "winnerId": null
  }
};

const FAKED_MATCHES = {
  "match-g-a1": {
    "id": "match-g-a1",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-gapvibe",
    "scoreA": 1,
    "scoreB": 2,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T12:00:00.000Z",
    "winnerId": "team-gapvibe"
  },
  "match-g-a2": {
    "id": "match-g-a2",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-4dtl",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T12:00:00.000Z",
    "winnerId": "team-u40"
  },
  "match-g-a3": {
    "id": "match-g-a3",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-gapvibe",
    "teamBId": "team-4dtl",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T12:00:00.000Z",
    "winnerId": "team-gapvibe"
  },
  "match-g-b1": {
    "id": "match-g-b1",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-lienminh",
    "teamBId": "team-bodoi",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T12:00:00.000Z",
    "winnerId": "team-lienminh"
  },
  "match-g-b2": {
    "id": "match-g-b2",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-bodoi",
    "teamBId": "team-kylan",
    "scoreA": 1,
    "scoreB": 2,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T12:00:00.000Z",
    "winnerId": "team-kylan"
  },
  "match-g-b3": {
    "id": "match-g-b3",
    "type": "group",
    "stage": "Group Stage",
    "group": "B",
    "teamAId": "team-lienminh",
    "teamBId": "team-kylan",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T12:00:00.000Z",
    "winnerId": "team-lienminh"
  },
  "match-g-c1": {
    "id": "match-g-c1",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-siuu",
    "teamBId": "team-36loi",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T12:00:00.000Z",
    "winnerId": "team-siuu"
  },
  "match-g-c2": {
    "id": "match-g-c2",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-36loi",
    "teamBId": "team-pickme",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-23T12:00:00.000Z",
    "winnerId": "team-36loi"
  },
  "match-g-c3": {
    "id": "match-g-c3",
    "type": "group",
    "stage": "Group Stage",
    "group": "C",
    "teamAId": "team-siuu",
    "teamBId": "team-pickme",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-24T12:00:00.000Z",
    "winnerId": "team-siuu"
  },
  "match-playoff-1": {
    "id": "match-playoff-1",
    "type": "knockout",
    "stage": "Upper Semifinals #1",
    "teamAId": "team-gapvibe",
    "teamBId": "team-kylan",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-27T12:00:00.000Z",
    "winnerId": "team-gapvibe"
  },
  "match-playoff-2": {
    "id": "match-playoff-2",
    "type": "knockout",
    "stage": "Upper Semifinals #2",
    "teamAId": "team-lienminh",
    "teamBId": "team-36loi",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-27T12:00:00.000Z",
    "winnerId": "team-lienminh"
  },
  "match-playoff-3": {
    "id": "match-playoff-3",
    "type": "knockout",
    "stage": "Lower Quarterfinals #1",
    "teamAId": "team-siuu",
    "teamBId": "team-kylan",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-28T12:00:00.000Z",
    "winnerId": "team-siuu"
  },
  "match-playoff-4": {
    "id": "match-playoff-4",
    "type": "knockout",
    "stage": "Lower Quarterfinals #2",
    "teamAId": "team-u40",
    "teamBId": "team-36loi",
    "scoreA": 1,
    "scoreB": 2,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-28T12:00:00.000Z",
    "winnerId": "team-36loi"
  },
  "match-playoff-5": {
    "id": "match-playoff-5",
    "type": "knockout",
    "stage": "Upper Finals",
    "teamAId": "team-gapvibe",
    "teamBId": "team-lienminh",
    "scoreA": 2,
    "scoreB": 1,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-29T12:00:00.000Z",
    "winnerId": "team-gapvibe"
  },
  "match-playoff-6": {
    "id": "match-playoff-6",
    "type": "knockout",
    "stage": "Lower Semifinals",
    "teamAId": "team-siuu",
    "teamBId": "team-36loi",
    "scoreA": 2,
    "scoreB": 0,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-29T12:00:00.000Z",
    "winnerId": "team-siuu"
  },
  "match-playoff-7": {
    "id": "match-playoff-7",
    "type": "knockout",
    "stage": "Losers Bracket Final",
    "teamAId": "team-lienminh",
    "teamBId": "team-siuu",
    "scoreA": 2,
    "scoreB": 3,
    "status": "completed",
    "bestOf": 5,
    "scheduledTime": "2026-07-30T12:00:00.000Z",
    "winnerId": "team-siuu"
  },
  "match-playoff-8": {
    "id": "match-playoff-8",
    "type": "knockout",
    "stage": "Grand Final",
    "teamAId": "team-gapvibe",
    "teamBId": "team-siuu",
    "scoreA": 3,
    "scoreB": 2,
    "status": "completed",
    "bestOf": 5,
    "scheduledTime": "2026-08-03T12:00:00.000Z",
    "winnerId": "team-gapvibe"
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
  if (currentTitle && (currentTitle.includes("ARAM") || !currentTitle.includes("Legend"))) {
    console.log("Old database detected. Resetting to Gear Games League of Legend Championship version.");
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
  getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
}

// ==========================================
// UNIFIED DATABASE ACTIONS
// ==========================================

// Realtime subscriptions
export function subscribeToData(key, callback) {
  if (isMockMode) {
    // Return initial value
    const data = getMockStorage(key, key === "config" ? DEFAULT_CONFIG : {});
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
    return getMockStorage(key, key === "config" ? DEFAULT_CONFIG : {});
  } else {
    try {
      const dbRef = ref(database, key);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return key === "config" ? DEFAULT_CONFIG : {};
    } catch (e) {
      console.error(`Firebase fetch error for ${key}:`, e);
      return key === "config" ? DEFAULT_CONFIG : {};
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
    const teams = getMockStorage("teams", {});
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
    const teams = getMockStorage("teams", {});
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
    const matches = getMockStorage("matches", {});
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
    const matches = getMockStorage("matches", {});
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
  // 1. Prepare clean matches (resetting scores, status, and winnerId)
  const cleanMatches = {};
  Object.keys(DEFAULT_MATCHES).forEach(id => {
    cleanMatches[id] = {
      ...DEFAULT_MATCHES[id],
      scoreA: 0,
      scoreB: 0,
      status: "scheduled",
      winnerId: ""
    };
  });

  if (isMockMode) {
    setMockStorage("config", DEFAULT_CONFIG);
    setMockStorage("teams", DEFAULT_TEAMS);
    setMockStorage("matches", cleanMatches);
    setMockStorage("bracket", DEFAULT_BRACKET);
    setMockStorage("matchDetails", {});
    setMockStorage("news", {});
    await recalculateLeaderboard();
  } else {
    await set(ref(database, "config"), DEFAULT_CONFIG);
    await set(ref(database, "teams"), DEFAULT_TEAMS);
    await set(ref(database, "matches"), cleanMatches);
    await set(ref(database, "bracket"), DEFAULT_BRACKET);
    await set(ref(database, "matchDetails"), {});
    await set(ref(database, "news"), {});
    await recalculateLeaderboard();
  }
}

function generateFakedMatchDetails() {
  const fakedDetails = {};
  const ARAM_CHAMPS = [
    "Ezreal", "Lux", "Jhin", "Kaisa", "Nidalee", "Graves", "Jinx", "Veigar", "Pyke", "Malphite",
    "Teemo", "Ashe", "Jayce", "Varus", "Ziggs", "Caitlyn", "Karthus", "Morgana", "MissFortune",
    "Brand", "Xerath", "Velkoz", "Syndra", "Karma", "Lulu", "Orianna", "Viktor", "Sylas", "Leona",
    "Ahri", "Akali", "Amumu", "Anivia", "Blitzcrank", "Darius", "Diana", "Ekko", "Fizz", "Garen"
  ];

  const ITEM_POOL = [3006, 3009, 3111, 3158, 3089, 3157, 6655, 3001, 3116, 3031, 3046, 6672, 3814, 6676, 3068, 3075, 3109, 3190];
  const SPELL_POOL = [4, 6, 7, 14, 32];
  const KEYSTONES = [8008, 8021, 8112, 8128, 8214, 8229, 8351, 8437, 8439];
  const PRIMARY_STYLES = [8000, 8100, 8200, 8300, 8400];

  // Helper to shuffle array
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const getFakedItems = () => {
    const items = shuffle(ITEM_POOL).slice(0, 4 + Math.floor(Math.random() * 2));
    while (items.length < 6) items.push(0);
    return items;
  };

  const getFakedRunes = () => {
    const keystoneId = KEYSTONES[Math.floor(Math.random() * KEYSTONES.length)];
    const primaryStyleId = PRIMARY_STYLES[Math.floor(Math.random() * PRIMARY_STYLES.length)];
    return { keystoneId, primaryStyleId };
  };

  Object.entries(FAKED_MATCHES).forEach(([matchId, match]) => {
    if (match.status !== "completed") return;

    const teamA = DEFAULT_TEAMS[match.teamAId];
    const teamB = DEFAULT_TEAMS[match.teamBId];
    if (!teamA || !teamB) return;

    const teamAPlayers = teamA.players || [];
    const teamBPlayers = teamB.players || [];

    const scoreA = match.scoreA;
    const scoreB = match.scoreB;
    const totalGames = scoreA + scoreB;

    const gamesDetails = [];

    const gameWinners = [];
    if (scoreA > scoreB) {
      if (totalGames === 2) gameWinners.push("A", "A");
      else if (totalGames === 3) gameWinners.push("A", "B", "A");
      else if (totalGames === 5) gameWinners.push("A", "B", "A", "B", "A");
    } else {
      if (totalGames === 2) gameWinners.push("B", "B");
      else if (totalGames === 3) gameWinners.push("B", "A", "B");
      else if (totalGames === 5) gameWinners.push("B", "A", "B", "A", "B");
    }

    for (let gameIdx = 0; gameIdx < totalGames; gameIdx++) {
      const winnerTeam = gameWinners[gameIdx];
      const winnerSide = winnerTeam === "A" ? 100 : 200;
      
      const gameChamps = shuffle(ARAM_CHAMPS);
      const participants = [];

      // Team A (Side 100)
      for (let i = 0; i < 5; i++) {
        const player = teamAPlayers[i] || { name: `PlayerA-${i}` };
        const win = winnerSide === 100;
        
        participants.push({
          playerName: player.name,
          teamId: 100,
          win: win,
          champion: gameChamps[i],
          kills: win ? Math.floor(Math.random() * 12) + 6 : Math.floor(Math.random() * 8) + 3,
          deaths: win ? Math.floor(Math.random() * 6) + 3 : Math.floor(Math.random() * 12) + 6,
          assists: win ? Math.floor(Math.random() * 18) + 12 : Math.floor(Math.random() * 14) + 6,
          gold: win ? Math.floor(Math.random() * 5000) + 11000 : Math.floor(Math.random() * 4000) + 7000,
          cs: Math.floor(Math.random() * 70) + 30,
          vision: 0,
          damageDealt: win ? Math.floor(Math.random() * 25000) + 20000 : Math.floor(Math.random() * 20000) + 10000,
          damageTaken: win ? Math.floor(Math.random() * 15000) + 15000 : Math.floor(Math.random() * 20000) + 10000,
          healing: Math.floor(Math.random() * 5000) + 500,
          tripleKills: Math.random() > 0.8 ? 1 : 0,
          quadraKills: 0,
          pentaKills: Math.random() > 0.95 ? 1 : 0,
          firstBlood: i === 0 && win,
          controlWards: 0,
          wardsPlaced: 0,
          wardsKilled: 0,
          turretsKilled: win ? (i === 1 ? 2 : 1) : 0,
          inhibitorsKilled: win ? (i === 2 ? 1 : 0) : 0,
          ccDuration: Math.floor(Math.random() * 30),
          items: getFakedItems(),
          summonerSpells: [4, shuffle(SPELL_POOL)[0]],
          runes: getFakedRunes()
        });
      }

      // Team B (Side 200)
      for (let i = 0; i < 5; i++) {
        const player = teamBPlayers[i] || { name: `PlayerB-${i}` };
        const win = winnerSide === 200;

        participants.push({
          playerName: player.name,
          teamId: 200,
          win: win,
          champion: gameChamps[i + 5],
          kills: win ? Math.floor(Math.random() * 12) + 6 : Math.floor(Math.random() * 8) + 3,
          deaths: win ? Math.floor(Math.random() * 6) + 3 : Math.floor(Math.random() * 12) + 6,
          assists: win ? Math.floor(Math.random() * 18) + 12 : Math.floor(Math.random() * 14) + 6,
          gold: win ? Math.floor(Math.random() * 5000) + 11000 : Math.floor(Math.random() * 4000) + 7000,
          cs: Math.floor(Math.random() * 70) + 30,
          vision: 0,
          damageDealt: win ? Math.floor(Math.random() * 25000) + 20000 : Math.floor(Math.random() * 20000) + 10000,
          damageTaken: win ? Math.floor(Math.random() * 15000) + 15000 : Math.floor(Math.random() * 20000) + 10000,
          healing: Math.floor(Math.random() * 5000) + 500,
          tripleKills: Math.random() > 0.8 ? 1 : 0,
          quadraKills: 0,
          pentaKills: Math.random() > 0.95 ? 1 : 0,
          firstBlood: i === 0 && win,
          controlWards: 0,
          wardsPlaced: 0,
          wardsKilled: 0,
          turretsKilled: win ? (i === 1 ? 2 : 1) : 0,
          inhibitorsKilled: win ? (i === 2 ? 1 : 0) : 0,
          ccDuration: Math.floor(Math.random() * 30),
          items: getFakedItems(),
          summonerSpells: [4, shuffle(SPELL_POOL)[0]],
          runes: getFakedRunes()
        });
      }

      gamesDetails.push({
        gameDuration: Math.floor(Math.random() * 600) + 900,
        teams: {
          100: { winner: winnerSide === 100, bans: [], barons: 0, dragons: 0, firstBlood: winnerSide === 100 },
          200: { winner: winnerSide === 200, bans: [], barons: 0, dragons: 0, firstBlood: winnerSide === 200 }
        },
        participants: participants
      });
    }

    fakedDetails[matchId] = gamesDetails;
  });

  return fakedDetails;
}

export async function seedFakedTournamentData() {
  const fakedDetails = generateFakedMatchDetails();

  if (isMockMode) {
    setMockStorage("matches", FAKED_MATCHES);
    setMockStorage("matchDetails", fakedDetails);
    await recalculateLeaderboard();
  } else {
    await set(ref(database, "matches"), FAKED_MATCHES);
    await set(ref(database, "matchDetails"), fakedDetails);
    await recalculateLeaderboard();
  }
}

// ==========================================
// DYNAMIC STANDINGS CALCULATION (ROUND ROBIN)
// ==========================================

export async function recalculateLeaderboard() {
  const teams = await fetchData("teams");
  const matches = await fetchData("matches");
  const allMatchDetails = isMockMode
    ? getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS)
    : (await get(ref(database, "matchDetails"))).val() || {};

  // Reset team stats
  Object.keys(teams).forEach((id) => {
    teams[id].stats = {
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      gameWins: 0,
      gameLosses: 0,
      kills: 0,
      deaths: 0,
      killDiff: 0,
      totalWinTime: 0
    };
  });

  // Calculate stats based on COMPLETED group matches
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

        // Process matchDetails for kills/deaths/totalWinTime
        const matchGames = allMatchDetails[match.id];
        if (matchGames) {
          const gamesArr = Array.isArray(matchGames) ? matchGames : [matchGames];
          gamesArr.forEach((game) => {
            if (!game || !game.participants) return;
            const { blueTeamId, redTeamId } = resolveGameTeamSides(game, match, teams);
            const winnerTeamId = getGameWinnerTeamId(game, match, teams);
            const gameDuration = game.gameDuration || 0;

            game.participants.forEach((p) => {
              const pTeamId = p.teamId === 100 ? blueTeamId : redTeamId;
              if (teams[pTeamId]?.stats) {
                teams[pTeamId].stats.kills = (teams[pTeamId].stats.kills || 0) + (p.kills || 0);
                teams[pTeamId].stats.deaths = (teams[pTeamId].stats.deaths || 0) + (p.deaths || 0);
              }
            });

            if (winnerTeamId && teams[winnerTeamId]?.stats) {
              teams[winnerTeamId].stats.totalWinTime = (teams[winnerTeamId].stats.totalWinTime || 0) + gameDuration;
            }
          });
        }
      }
    }
  });

  // Calculate killDiff for each team
  Object.values(teams).forEach((t) => {
    if (t.stats) {
      t.stats.killDiff = (t.stats.kills || 0) - (t.stats.deaths || 0);
    }
  });

  // Check if all group stage matches are completed
  const groupMatches = Object.values(matches).filter((m) => m.type === "group");
  const allGroupMatchesCompleted =
    groupMatches.length > 0 && groupMatches.every((m) => m.status === "completed");

  if (allGroupMatchesCompleted) {
    const compareTeams = (teamA, teamB) => {
      // Step 1: Points
      const ptsA = teamA.stats?.points || 0;
      const ptsB = teamB.stats?.points || 0;
      if (ptsA !== ptsB) return ptsB - ptsA;

      // Step 2: Head-to-head result between tied teams
      const h2hMatch = groupMatches.find(
        (m) =>
          m.status === "completed" &&
          ((m.teamAId === teamA.id && m.teamBId === teamB.id) ||
            (m.teamAId === teamB.id && m.teamBId === teamA.id))
      );
      if (h2hMatch && h2hMatch.winnerId) {
        if (h2hMatch.winnerId === teamA.id) return -1;
        if (h2hMatch.winnerId === teamB.id) return 1;
      }

      // Step 3: Game differential (gameWins - gameLosses)
      const gameDiffA = (teamA.stats?.gameWins || 0) - (teamA.stats?.gameLosses || 0);
      const gameDiffB = (teamB.stats?.gameWins || 0) - (teamB.stats?.gameLosses || 0);
      if (gameDiffA !== gameDiffB) return gameDiffB - gameDiffA;

      // Step 4: Total kill differential (kills - deaths)
      const killDiffA = teamA.stats?.killDiff || 0;
      const killDiffB = teamB.stats?.killDiff || 0;
      if (killDiffA !== killDiffB) return killDiffB - killDiffA;

      // Step 5: Total game completion time (faster wins favored)
      const timeA = teamA.stats?.totalWinTime || Infinity;
      const timeB = teamB.stats?.totalWinTime || Infinity;
      if (timeA !== timeB) return timeA - timeB;

      // Fallback
      return (teamA.name || "").localeCompare(teamB.name || "");
    };

    const groups = { A: [], B: [], C: [] };
    Object.values(teams).forEach((t) => {
      if (t.group && groups[t.group]) {
        groups[t.group].push(t);
      }
    });

    Object.keys(groups).forEach((g) => {
      groups[g].sort(compareTeams);
    });

    const top1Teams = [];
    const top2Teams = [];

    ["A", "B", "C"].forEach((g) => {
      if (groups[g][0]) top1Teams.push(groups[g][0]);
      if (groups[g][1]) top2Teams.push(groups[g][1]);
    });

    top1Teams.sort(compareTeams);
    top2Teams.sort(compareTeams);

    if (top1Teams.length >= 3 && top2Teams.length >= 3) {
      const top1_Rank1 = top1Teams[0];
      const top1_Rank2 = top1Teams[1];
      const top1_Rank3 = top1Teams[2];

      const top2_Rank1 = top2Teams[0];
      const top2_Rank2 = top2Teams[1];
      const top2_Rank3 = top2Teams[2];

      if (matches["match-playoff-1"]) {
        matches["match-playoff-1"].teamAId = top1_Rank2.id;
        matches["match-playoff-1"].teamBId = top1_Rank3.id;
      }

      if (matches["match-playoff-2"]) {
        matches["match-playoff-2"].teamAId = top1_Rank1.id;
        matches["match-playoff-2"].teamBId = top2_Rank1.id;
      }

      if (matches["match-playoff-3"]) {
        matches["match-playoff-3"].teamAId = top2_Rank2.id;
      }

      if (matches["match-playoff-4"]) {
        matches["match-playoff-4"].teamAId = top2_Rank3.id;
      }
    }
  }

  // Save the updated team data and matches data
  if (isMockMode) {
    setMockStorage("teams", teams);
    setMockStorage("matches", matches);
  } else {
    await set(ref(database, "teams"), teams);
    await set(ref(database, "matches"), matches);
  }
}

// ==========================================
// MATCH DETAILS OPERATIONS
// ==========================================

export async function saveMatchDetails(matchId, details) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
    allDetails[matchId] = details;
    setMockStorage("matchDetails", allDetails);
    return details;
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    await set(dbRef, details);
    return details;
  }
}
function cleanFirstBloodData(data, isCollection = false) {
  if (!data) return data;
  const cleanGame = (game) => {
    if (!game || !game.participants) return game;
    let foundFirstBlood = false;
    game.participants.forEach(p => {
      if (p.firstBlood) {
        if (foundFirstBlood) {
          p.firstBlood = false;
        } else {
          foundFirstBlood = true;
        }
      }
    });
    return game;
  };
  const cleanSeries = (series) => {
    if (!series) return series;
    if (Array.isArray(series)) {
      return series.map(cleanGame);
    }
    return cleanGame(series);
  };
  if (isCollection) {
    const cleanedCollection = {};
    Object.keys(data).forEach(matchId => {
      cleanedCollection[matchId] = cleanSeries(data[matchId]);
    });
    return cleanedCollection;
  }
  return cleanSeries(data);
}

export async function fetchMatchDetails(matchId) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
    return cleanFirstBloodData(allDetails[matchId] || null);
  } else {
    try {
      const dbRef = ref(database, `matchDetails/${matchId}`);
      const snapshot = await get(dbRef);
      return cleanFirstBloodData(snapshot.exists() ? snapshot.val() : null);
    } catch (e) {
      console.error(`Firebase fetch error for matchDetails/${matchId}:`, e);
      return null;
    }
  }
}

export function resolveGameTeamSides(gameDetails, match, teams = {}) {
  if (!gameDetails || !match) return { blueTeamId: match?.teamAId, redTeamId: match?.teamBId };

  if (gameDetails.blueTeamId && gameDetails.redTeamId) {
    return { blueTeamId: gameDetails.blueTeamId, redTeamId: gameDetails.redTeamId };
  }

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  const normalize = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const teamAPlayerNames = new Set();
  if (teamA?.players) {
    teamA.players.forEach(p => {
      if (p.name) teamAPlayerNames.add(normalize(p.name));
      if (p.jerseyName) teamAPlayerNames.add(normalize(p.jerseyName));
      if (p.riotId) teamAPlayerNames.add(normalize(p.riotId.split("#")[0]));
    });
  }

  const teamBPlayerNames = new Set();
  if (teamB?.players) {
    teamB.players.forEach(p => {
      if (p.name) teamBPlayerNames.add(normalize(p.name));
      if (p.jerseyName) teamBPlayerNames.add(normalize(p.jerseyName));
      if (p.riotId) teamBPlayerNames.add(normalize(p.riotId.split("#")[0]));
    });
  }

  if (Array.isArray(gameDetails.participants) && (teamAPlayerNames.size > 0 || teamBPlayerNames.size > 0)) {
    const blueParticipants = gameDetails.participants.filter(p => p.teamId === 100);
    let matchACount = 0;
    let matchBCount = 0;

    blueParticipants.forEach(p => {
      const normName = normalize(p.playerName);
      if (normName) {
        if ([...teamAPlayerNames].some(tn => normName.includes(tn) || tn.includes(normName))) matchACount++;
        if ([...teamBPlayerNames].some(tn => normName.includes(tn) || tn.includes(normName))) matchBCount++;
      }
    });

    if (matchACount > matchBCount) {
      return { blueTeamId: match.teamAId, redTeamId: match.teamBId };
    } else if (matchBCount > matchACount) {
      return { blueTeamId: match.teamBId, redTeamId: match.teamAId };
    }
  }

  return { blueTeamId: match.teamAId, redTeamId: match.teamBId };
}

export function getGameWinnerTeamId(gameDetails, match, teams = {}) {
  if (!gameDetails || !match) return null;
  if (gameDetails.winnerTeamId) return gameDetails.winnerTeamId;

  const { blueTeamId, redTeamId } = resolveGameTeamSides(gameDetails, match, teams);
  if (gameDetails.teams?.[100]?.winner) {
    return blueTeamId;
  } else if (gameDetails.teams?.[200]?.winner) {
    return redTeamId;
  }
  return null;
}

export async function submitCaptainGameScore(matchId, gameIndex, gameDetails) {
  // 1. Fetch match metadata
  let match;
  if (isMockMode) {
    const allMatches = getMockStorage("matches", DEFAULT_MATCHES);
    match = allMatches[matchId];
  } else {
    match = await fetchData(`matches/${matchId}`);
  }

  if (!match || !match.id) {
    throw new Error(`Match ${matchId} not found`);
  }

  // 2. Fetch existing match details
  let existingDetails;
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
    existingDetails = allDetails[matchId] || [];
  } else {
    existingDetails = await fetchData(`matchDetails/${matchId}`) || [];
  }

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
    const allDetails = getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
    allDetails[matchId] = existingDetails;
    setMockStorage("matchDetails", allDetails);
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    await set(dbRef, existingDetails);
  }

  // 4. Recalculate match scores based on existingDetails
  let teams = {};
  if (isMockMode) {
    teams = getMockStorage("teams", DEFAULT_TEAMS);
  } else {
    teams = (await fetchData("teams")) || {};
  }

  let scoreA = 0;
  let scoreB = 0;
  existingDetails.forEach(game => {
    if (game) {
      const winnerTeamId = getGameWinnerTeamId(game, match, teams);
      if (winnerTeamId === match.teamAId) {
        scoreA += 1;
      } else if (winnerTeamId === match.teamBId) {
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
    const allDetails = getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS);
    callback(cleanFirstBloodData(allDetails[matchId] || null));

    const handler = (newAllDetails) => {
      callback(cleanFirstBloodData(newAllDetails[matchId] || null));
    };

    subscribers.matchDetails.push(handler);
    return () => {
      subscribers.matchDetails = subscribers.matchDetails.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    return onValue(dbRef, (snapshot) => {
      callback(cleanFirstBloodData(snapshot.val() || null));
    }, (error) => {
      console.error(`Firebase subscription error for matchDetails/${matchId}:`, error);
    });
  }
}

export async function fetchAllMatchDetails() {
  if (isMockMode) {
    return cleanFirstBloodData(getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS), true);
  } else {
    try {
      const dbRef = ref(database, `matchDetails`);
      const snapshot = await get(dbRef);
      return cleanFirstBloodData(snapshot.exists() ? snapshot.val() : {}, true);
    } catch (e) {
      console.error(`Firebase fetch error for all matchDetails:`, e);
      return {};
    }
  }
}

export function subscribeToAllMatchDetails(callback) {
  if (isMockMode) {
    callback(cleanFirstBloodData(getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS), true));
    
    const handler = (newAllDetails) => {
      callback(cleanFirstBloodData(newAllDetails || {}, true));
    };
    
    subscribers.matchDetails.push(handler);
    return () => {
      subscribers.matchDetails = subscribers.matchDetails.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, `matchDetails`);
    return onValue(dbRef, (snapshot) => {
      callback(cleanFirstBloodData(snapshot.exists() ? snapshot.val() : {}, true));
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
