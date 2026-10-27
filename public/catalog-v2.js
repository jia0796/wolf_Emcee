// Approved catalog illustrations shared by encyclopedia, recap and online card fronts; layouts stay separate.
export const CATALOG_ART_V2=Object.freeze({
  "awakenedWitch": {"full": "art/catalog-v2/awakenedWitch-v1.webp", "thumbnail": "art/catalog-v2/awakenedWitch-thumb-v1.webp"},
  "awakenedKing": {"full": "art/catalog-v2/awakenedKing-v1.webp", "thumbnail": "art/catalog-v2/awakenedKing-thumb-v1.webp"},
  "evilKnight": {
    "full": "art/catalog-v2/evilKnight-v1.webp",
    "thumbnail": "art/catalog-v2/evilKnight-thumb-v1.webp"
  },
  "gargoyle": {
    "full": "art/catalog-v2/gargoyle-v1.webp",
    "thumbnail": "art/catalog-v2/gargoyle-thumb-v1.webp"
  },
  "gravekeeper": {
    "full": "art/catalog-v2/gravekeeper-v2.webp",
    "thumbnail": "art/catalog-v2/gravekeeper-thumb-v2.webp"
  },
  "blood": {
    "full": "art/catalog-v2/blood-v1.webp",
    "thumbnail": "art/catalog-v2/blood-thumb-v1.webp"
  },
  "demon": {
    "full": "art/catalog-v2/demon-v2.webp",
    "thumbnail": "art/catalog-v2/demon-thumb-v2.webp"
  },
  "idiot": {
    "full": "art/catalog-v2/idiot-v1.webp",
    "thumbnail": "art/catalog-v2/idiot-thumb-v1.webp"
  },
  "mixed": {
    "full": "art/catalog-v2/mixed-v1.webp",
    "thumbnail": "art/catalog-v2/mixed-thumb-v1.webp"
  },
  "nightmare": {
    "full": "art/catalog-v2/nightmare-v1.webp",
    "thumbnail": "art/catalog-v2/nightmare-thumb-v1.webp"
  },
  "dream": {
    "full": "art/catalog-v2/dream-v1.webp",
    "thumbnail": "art/catalog-v2/dream-thumb-v1.webp"
  },
  "elder": {
    "full": "art/catalog-v2/elder-v1.webp",
    "thumbnail": "art/catalog-v2/elder-thumb-v1.webp"
  },
  "younger": {
    "full": "art/catalog-v2/younger-v1.webp",
    "thumbnail": "art/catalog-v2/younger-thumb-v1.webp"
  },
  "merchant": {
    "full": "art/catalog-v2/merchant-v1.webp",
    "thumbnail": "art/catalog-v2/merchant-thumb-v1.webp"
  },
  "king": {
    "full": "art/catalog-v2/king-v1.webp",
    "thumbnail": "art/catalog-v2/king-thumb-v1.webp"
  },
  "wolf": {
    "full": "art/catalog-v2/wolf-v1.webp",
    "thumbnail": "art/catalog-v2/wolf-thumb-v1.webp"
  },
  "seer": {
    "full": "art/catalog-v2/seer-v1.webp",
    "thumbnail": "art/catalog-v2/seer-thumb-v1.webp"
  },
  "witch": {
    "full": "art/catalog-v2/witch-v1.webp",
    "thumbnail": "art/catalog-v2/witch-thumb-v1.webp"
  },
  "hunter": {
    "full": "art/catalog-v2/hunter-v1.webp",
    "thumbnail": "art/catalog-v2/hunter-thumb-v1.webp"
  },
  "magician": {
    "full": "art/catalog-v2/magician-v1.webp",
    "thumbnail": "art/catalog-v2/magician-thumb-v1.webp"
  },
  "villager": {
    "full": "art/catalog-v2/villager-v1.webp",
    "thumbnail": "art/catalog-v2/villager-thumb-v1.webp"
  },
  "mechanical": {
    "full": "art/catalog-v2/mechanical-v2.webp",
    "thumbnail": "art/catalog-v2/mechanical-thumb-v2.webp"
  },
  "medium": {
    "full": "art/catalog-v2/medium-v1.webp",
    "thumbnail": "art/catalog-v2/medium-thumb-v1.webp"
  },
  "guard": {
    "full": "art/catalog-v2/guard-v2.webp",
    "thumbnail": "art/catalog-v2/guard-thumb-v2.webp"
  },
  "seedWolf": {
    "full": "art/catalog-v2/seedWolf-v2.webp",
    "thumbnail": "art/catalog-v2/seedWolf-thumb-v2.webp"
  },
  "hiddenWolf": {
    "full": "art/catalog-v2/hiddenWolf-v1.webp",
    "thumbnail": "art/catalog-v2/hiddenWolf-thumb-v1.webp"
  },
  "beauty": {
    "full": "art/catalog-v2/beauty-v1.webp",
    "thumbnail": "art/catalog-v2/beauty-thumb-v1.webp"
  },
  "duelist": {
    "full": "art/catalog-v2/duelist-v1.webp",
    "thumbnail": "art/catalog-v2/duelist-thumb-v1.webp"
  },
  "dancer": {
    "full": "art/catalog-v2/dancer-v2.webp",
    "thumbnail": "art/catalog-v2/dancer-thumb-v2.webp"
  },
  "mask": {
    "full": "art/catalog-v2/mask-v2.webp",
    "thumbnail": "art/catalog-v2/mask-thumb-v2.webp"
  },
  "fragrance": {
    "full": "art/catalog-v2/fragrance-v1.webp",
    "thumbnail": "art/catalog-v2/fragrance-thumb-v1.webp"
  },
  "awakenedSeer": {
    "full": "art/catalog-v2/awakenedSeer-v1.webp",
    "thumbnail": "art/catalog-v2/awakenedSeer-thumb-v1.webp"
  },
  "stoneGargoyle": {
    "full": "art/catalog-v2/stoneGargoyle-v1.webp",
    "thumbnail": "art/catalog-v2/stoneGargoyle-thumb-v1.webp"
  },
  "awakenedBeauty": {
    "full": "art/catalog-v2/awakenedBeauty-v1.webp",
    "thumbnail": "art/catalog-v2/awakenedBeauty-thumb-v1.webp"
  },
  "awakenedHunter": {
    "full": "art/catalog-v2/awakenedHunter-v1.webp",
    "thumbnail": "art/catalog-v2/awakenedHunter-thumb-v1.webp"
  }
});
export function libraryImage(role,fallback,{thumbnail=false}={}){return CATALOG_ART_V2[role]?.[thumbnail?'thumbnail':'full']||fallback;}
