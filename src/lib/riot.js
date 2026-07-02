import { useState, useEffect } from "react";

const FALLBACK_VERSION = "16.13.1";

// Module-level cache to prevent multiple fetches across components/remounts
let cache = {
  version: null,
  championMap: null,
  summonerMap: null,
  runeMap: null,
  promise: null
};

export async function getLatestDDragonVersion() {
  if (cache.version) return cache.version;
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    if (!res.ok) throw new Error("Failed to fetch versions");
    const versions = await res.json();
    cache.version = versions[0];
    return cache.version;
  } catch (e) {
    console.error("Error fetching latest DDragon version, falling back:", e);
    return cache.version || FALLBACK_VERSION;
  }
}

async function fetchDDragonMetadata() {
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    try {
      const activeVersion = await getLatestDDragonVersion();

      // Fetch champions map
      const cRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${activeVersion}/data/en_US/champion.json`);
      if (cRes.ok) {
        const cData = await cRes.json();
        const map = {};
        Object.values(cData.data).forEach(champ => {
          map[champ.key] = champ.id;
        });
        cache.championMap = map;
      }

      // Fetch summoner spells map
      const sRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${activeVersion}/data/en_US/summoner.json`);
      if (sRes.ok) {
        const sData = await sRes.json();
        const map = {};
        Object.values(sData.data).forEach(spell => {
          map[spell.key] = spell.image.full;
        });
        cache.summonerMap = map;
      }

      // Fetch runes Reforged map
      const rRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${activeVersion}/data/en_US/runesReforged.json`);
      if (rRes.ok) {
        const rData = await rRes.json();
        const map = {};
        rData.forEach(style => {
          map[style.id] = style.icon;
          style.slots.forEach(slot => {
            slot.runes.forEach(rune => {
              map[rune.id] = rune.icon;
            });
          });
        });
        cache.runeMap = map;
      }
    } catch (e) {
      console.error("Error loading DDragon metadata:", e);
      if (!cache.version) cache.version = FALLBACK_VERSION;
      if (!cache.championMap) cache.championMap = {};
      if (!cache.summonerMap) cache.summonerMap = {};
      if (!cache.runeMap) cache.runeMap = {};
    }
    return {
      version: cache.version,
      championMap: cache.championMap,
      summonerMap: cache.summonerMap,
      runeMap: cache.runeMap
    };
  })();

  return cache.promise;
}

export function useDDragon() {
  const [data, setData] = useState({
    version: cache.version || FALLBACK_VERSION,
    championMap: cache.championMap || {},
    summonerMap: cache.summonerMap || {},
    runeMap: cache.runeMap || {},
    loading: !cache.championMap
  });

  useEffect(() => {
    let active = true;
    if (cache.championMap) {
      // Already cached
      return;
    }

    fetchDDragonMetadata().then(res => {
      if (active) {
        setData({
          version: res.version,
          championMap: res.championMap,
          summonerMap: res.summonerMap,
          runeMap: res.runeMap,
          loading: false
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const getChampionIcon = (championName) => {
    if (!championName) return "https://placehold.co/40x40";
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/champion/${cleanName}.png`;
  };

  const getChampionIconById = (championId) => {
    const name = data.championMap[championId];
    return name ? getChampionIcon(name) : "https://placehold.co/40x40";
  };

  const getItemIcon = (itemId) => {
    if (!itemId || itemId === 0) return null;
    return `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/item/${itemId}.png`;
  };

  const getSummonerSpellIcon = (spellId) => {
    const filename = data.summonerMap[spellId];
    if (!filename) return "https://placehold.co/18x18";
    return `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/spell/${filename}`;
  };

  const getRuneIcon = (runeOrStyleId) => {
    const iconPath = data.runeMap[runeOrStyleId];
    if (!iconPath) return "https://placehold.co/18x18";
    return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`;
  };

  return {
    version: data.version,
    championMap: data.championMap,
    summonerMap: data.summonerMap,
    runeMap: data.runeMap,
    loading: data.loading,
    getChampionIcon,
    getChampionIconById,
    getItemIcon,
    getSummonerSpellIcon,
    getRuneIcon
  };
}
