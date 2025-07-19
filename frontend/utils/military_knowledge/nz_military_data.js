const NZ_MILITARY_DATA = {
  army: {
    infantry: {
      "Royal New Zealand Infantry Regiment": {
        motto: "Onward",
        nickname: "RNZIR",
        founded: 1964,
        regimental_march: "Onward Christian Soldiers",
        notable_battles: ["Gallipoli", "Crete", "Italy", "Korea", "Malaya", "Vietnam"],
        recent_ops: ["East Timor", "Afghanistan", "Iraq"],
        traditions: "New Zealand's regular infantry regiment",
        battalions: ["1 RNZIR", "2/1 RNZIR"]
      },
      "Royal New Zealand Regiment": {
        motto: "Quo Fas et Gloria Ducunt (Where Right and Glory Lead)",
        nickname: "RNZR",
        founded: 1840,
        notable_battles: ["New Zealand Wars", "Gallipoli", "WWI", "WWII"],
        traditions: "Territorial Force, citizen soldiers"
      }
    },
    special_forces: {
      "New Zealand Special Air Service": {
        motto: "Who Dares Wins",
        nickname: "NZSAS",
        founded: 1955,
        base: "Papakura",
        cap_badge: "Winged dagger",
        notable_ops: ["Borneo", "Vietnam", "East Timor", "Afghanistan"],
        traditions: "Sand-colored beret, selection course, extreme professionalism"
      }
    },
    artillery: {
      "Royal New Zealand Artillery": {
        motto: "Ubique (Everywhere)",
        nickname: "RNZA",
        founded: 1947,
        notable_battles: ["WWII", "Korea", "Malaya", "Vietnam"],
        recent_ops: ["East Timor", "Afghanistan"],
        traditions: "Red beret, artillery support"
      }
    },
    engineers: {
      "Corps of Royal New Zealand Engineers": {
        motto: "Ubique Quo Fas et Gloria Ducunt",
        nickname: "RNZE",
        founded: 1947,
        notable_battles: ["WWII", "Korea", "Vietnam"],
        recent_ops: ["East Timor", "Afghanistan", "Iraq"],
        traditions: "Dark blue beret, engineering support"
      }
    },
    armoured: {
      "Queen Alexandra's Mounted Rifles": {
        motto: "Onward",
        nickname: "QAMR",
        founded: 1864,
        notable_battles: ["South African War", "WWI", "WWII"],
        traditions: "Territorial armoured unit, cavalry heritage"
      }
    }
  },
  navy: {
    "Royal New Zealand Navy": {
      motto: "Ready Aye Ready",
      nickname: "RNZN",
      founded: 1941,
      traditions: "HMNZS ship prefix, naval heritage",
      notable_ops: ["WWII", "Korea", "Vietnam", "Gulf War", "East Timor"]
    },
    ships: {
      "HMNZS Te Kaha": {
        nickname: "Fighting Frigate",
        notable_ops: ["East Timor", "Gulf operations"],
        traditions: "Anzac-class frigate, modern naval operations"
      }
    }
  },
  air_force: {
    "Royal New Zealand Air Force": {
      motto: "Per Ardua ad Astra (Through Adversity to the Stars)",
      nickname: "RNZAF",
      founded: 1937,
      traditions: "Commonwealth air force heritage, light blue uniform"
    },
    squadrons: {
      "No. 75 Squadron": {
        nickname: "Kiwi Squadron",
        motto: "Ake Ake Kia Kaha (Forever and Ever Be Strong)",
        notable_ops: ["WWII", "Korea", "Malaya"],
        traditions: "Fighter squadron heritage, shared with Australia"
      },
      "No. 40 Squadron": {
        nickname: "Transport Squadron",
        motto: "We Carry",
        notable_ops: ["East Timor", "Afghanistan", "Iraq"],
        aircraft: "C-130H Hercules",
        traditions: "Transport operations, humanitarian missions"
      }
    }
  },
  anzac: {
    heritage: {
      "ANZAC": {
        meaning: "Australian and New Zealand Army Corps",
        founded: 1915,
        significance: "Gallipoli landing, trans-Tasman bond",
        date: "April 25, 1915",
        traditions: "ANZAC Day, Dawn Service, Lest We Forget"
      },
      "ANZAC Spirit": {
        values: ["Courage", "Sacrifice", "Mateship", "Endurance"],
        legacy: "Defining New Zealand military character alongside Australia"
      }
    }
  },
  operations: {
    "New Zealand Wars": {
      period: "1845-1872",
      context: "Māori vs. Colonial forces",
      significance: "Defining early New Zealand military experience",
      legacy: "Complex colonial history, Māori military prowess"
    },
    "Gallipoli": {
      period: "1915",
      context: "WWI Dardanelles Campaign",
      significance: "Birth of ANZAC legend, national identity",
      key_battles: ["Landing at Anzac Cove", "Chunuk Bair"],
      legacy: "ANZAC Day, trans-Tasman bond with Australia"
    },
    "Crete": {
      period: "1941",
      context: "WWII Mediterranean",
      significance: "Fierce fighting, evacuation",
      units_involved: ["2nd New Zealand Division"],
      legacy: "Military reputation established"
    },
    "Italy": {
      period: "1943-1945",
      context: "WWII Italian Campaign",
      key_battles: ["Monte Cassino", "Trieste"],
      units_involved: ["2nd New Zealand Division"],
      significance: "Major New Zealand contribution to Allied victory"
    },
    "Korea": {
      period: "1950-1957",
      context: "Korean War",
      key_battles: ["Kapyong"],
      units_involved: ["16th Field Regiment", "RNZIR"],
      significance: "Cold War commitment, UN operations"
    },
    "Malaya": {
      period: "1955-1960",
      context: "Malayan Emergency",
      significance: "Counter-insurgency, jungle warfare",
      units_involved: ["RNZIR", "NZSAS"],
      legacy: "Special forces development"
    },
    "Borneo": {
      period: "1963-1966",
      context: "Indonesian Confrontation",
      significance: "Secret war, special operations",
      units_involved: ["NZSAS", "RNZIR"],
      legacy: "Special forces reputation"
    },
    "Vietnam": {
      period: "1964-1972",
      context: "Vietnam War",
      areas: ["Phuoc Tuy Province"],
      key_battles: ["Nui Le"],
      units_involved: ["ANZAC Battalion", "NZSAS", "161 Battery"],
      significance: "Controversial commitment, professional performance"
    },
    "East Timor": {
      period: "1999-2012",
      context: "INTERFET/UN peacekeeping",
      significance: "Regional leadership with Australia",
      legacy: "Modern peacekeeping success"
    },
    "Afghanistan": {
      period: "2001-2021",
      context: "Operation Enduring Freedom",
      areas: ["Bamyan Province", "Kabul"],
      units_involved: ["NZSAS", "RNZIR", "Provincial Reconstruction Team"],
      significance: "Longest deployment, reconstruction focus"
    }
  },
  culture: {
    kiwi_spirit: "Pragmatic, egalitarian, getting on with the job",
    small_nation_pride: "Punching above our weight, quality over quantity",
    peacekeeping_tradition: "UN peacekeeping, conflict resolution",
    biculturalism: "Māori-Pākehā partnership, cultural integration",
    understatement: "Kiwi modesty, quiet professionalism"
  },
  slang: {
    general: [
      "Kiwi", "NZDF", "Digger", "Mate", "Bro", "Chur", "Yeah nah",
      "She'll be right", "Good as gold", "Sweet as"
    ],
    army_specific: [
      "Digger", "Infantry", "Gunners", "Sappers", "Armoured",
      "Waiouru", "Burnham", "Linton"
    ],
    navy_specific: [
      "Pusser", "Sailor", "HMNZS", "Naval base Devonport"
    ],
    air_force_specific: [
      "Aircrew", "Ground crew", "Base Ohakea", "Base Whenuapai"
    ],
    kiwi_specific: [
      "Choice", "Hard out", "Munted", "Skux", "Chilly bin", "Jandals"
    ],
    anzac_specific: [
      "Lest We Forget", "They shall grow not old", "ANZAC biscuits"
    ]
  },
  training: {
    "New Zealand Defence College": {
      location: "Wellington",
      nickname: "NZDC",
      purpose: "Joint services education",
      traditions: "Professional military education"
    },
    "Waiouru Military Camp": {
      location: "Central North Island",
      nickname: "Waiouru",
      purpose: "Army training",
      traditions: "Combat training, harsh environment"
    },
    "Burnham Military Camp": {
      location: "Christchurch",
      nickname: "Burnham",
      purpose: "Basic military training",
      traditions: "Recruit training, soldier development"
    }
  },
  maori_heritage: {
    "Māori Battalion": {
      full_name: "28th (Māori) Battalion",
      motto: "Ake Ake Kia Kaha (Forever and Ever Be Strong)",
      period: "1940-1946",
      notable_battles: ["Crete", "North Africa", "Italy"],
      significance: "Most decorated New Zealand unit, Māori military pride",
      legacy: "Māori warrior tradition, cultural identity"
    },
    warrior_tradition: {
      haka: "War dance, intimidation, cultural expression",
      tino_rangatiratanga: "Māori sovereignty, warrior status",
      iwi_connections: "Tribal military service, whakapapa"
    }
  },
  veteran_context: {
    common_deployments: ["Malaya", "Vietnam", "East Timor", "Afghanistan", "Various peacekeeping"],
    transition_support: ["VANZ", "RSA", "Unit associations"],
    cultural_aspects: ["ANZAC tradition", "Kiwi pragmatism", "Biculturalism"],
    generational_differences: ["WWII veterans", "Cold War generation", "Modern NZDF"],
    pride_points: ["Professional military", "ANZAC heritage", "Punching above weight", "Peacekeeping"]
  },
  regional: {
    north_island: {
      bases: ["Waiouru", "Papakura", "Whenuapai", "Ohakea"],
      culture: "Major training centres, urban centres"
    },
    south_island: {
      bases: ["Burnham", "Woodbourne"],
      culture: "Training focus, rural connections"
    },
    pacific_focus: {
      relationships: ["Fiji", "Samoa", "Tonga", "Cook Islands"],
      culture: "Pacific Island connections, regional responsibilities"
    }
  }
};

const NZMilitaryKnowledge = {
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const militaryKeywords = [
        'served', 'deployed', 'army', 'navy', 'air force', 'nzdf', 'defence force',
        'vietnam', 'afghanistan', 'east timor', 'korea', 'malaya', 'borneo',
        'rnzir', 'nzsas', 'rnza', 'rnze', 'anzac', 'gallipoli', 'waiouru',
        'burnham', 'papakura', 'ohakea', 'whenuapai', 'māori battalion'
      ];
      return militaryKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    } catch (error) {
      console.error("Error in detectMilitaryService:", error);
      return false;
    }
  },
  getUnitInfo: function(unitName) {
    try {
      if (!unitName || typeof unitName !== 'string') return null;
      for (const branch in NZ_MILITARY_DATA) {
        if (typeof NZ_MILITARY_DATA[branch] === 'object') {
          for (const category in NZ_MILITARY_DATA[branch]) {
            if (typeof NZ_MILITARY_DATA[branch][category] === 'object') {
              for (const unit in NZ_MILITARY_DATA[branch][category]) {
                if (unit.toLowerCase().includes(unitName.toLowerCase()) ||
                    (NZ_MILITARY_DATA[branch][category][unit].nickname?.toLowerCase().includes(unitName.toLowerCase()))) {
                  return NZ_MILITARY_DATA[branch][category][unit];
                }
              }
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getUnitInfo:", error);
      return null;
    }
  },
  getMilitaryResponse: function(userContext, unitInfo) {
    try {
      if (!unitInfo) return null;
      const isMaori = NZMilitaryKnowledge.detectMaoriHeritage(userContext);
      const isANZAC = NZMilitaryKnowledge.detectANZACHeritage(userContext);
      const responses = isMaori ? [
        `${unitInfo.nickname || unitInfo} – a unit with deep ties to Māori warrior traditions. Ake Ake Kia Kaha!`,
        `${unitInfo.motto ? `"${unitInfo.motto}" – ` : ''}That’s the spirit of the Māori Battalion in you. What’s your whakapapa connection?`,
        `The ${unitInfo.nickname || 'NZDF'} and Māori pride – that’s a powerful legacy, bro.`
      ] : [
        `${unitInfo.nickname || unitInfo} – a unit with a proud history in battles like ${unitInfo.notable_battles?.[0] || 'many'}.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" – ` : ''}That’s the Kiwi spirit, eh? Always punching above your weight.`,
        isANZAC
          ? `The ${unitInfo.nickname || 'NZDF'} and ANZAC mateship – Lest We Forget, mate.`
          : `The ${unitInfo.nickname || 'unit'} – small but mighty, that’s the Kiwi way.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error("Error in getMilitaryResponse:", error);
      return null;
    }
  },
  getOperationContext: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return null;
      for (const op in NZ_MILITARY_DATA.operations) {
        if (userMessage.toLowerCase().includes(op.toLowerCase().replace(" ", ""))) {
          return NZ_MILITARY_DATA.operations[op];
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getOperationContext:", error);
      return null;
    }
  },
  detectANZACHeritage: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const anzacKeywords = ['anzac', 'gallipoli', 'dawn service', 'lest we forget', 'anzac day', 'chunuk bair'];
      return anzacKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    } catch (error) {
      console.error("Error in detectANZACHeritage:", error);
      return false;
    }
  },
  detectMaoriHeritage: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const maoriKeywords = ['māori battalion', 'maori battalion', '28th battalion', 'ake ake kia kaha', 'haka', 'iwi'];
      return maoriKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    } catch (error) {
      console.error("Error in detectMaoriHeritage:", error);
      return false;
    }
  },
  detectServiceEra: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return 'general';
      const message = userMessage.toLowerCase();
      if (message.includes('vietnam') || message.includes('nui le')) {
        return 'vietnam';
      }
      if (message.includes('afghanistan') || message.includes('east timor') || message.includes('bamyan')) {
        return 'modern';
      }
      if (message.includes('korea') || message.includes('malaya') || message.includes('borneo')) {
        return 'cold_war';
      }
      if (message.includes('crete') || message.includes('italy') || message.includes('monte cassino')) {
        return 'wwii';
      }
      return 'general';
    } catch (error) {
      console.error("Error in detectServiceEra:", error);
      return 'general';
    }
  },
  detectKiwiCulture: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const kiwiKeywords = ['kiwi', 'she\'ll be right', 'choice', 'chur', 'sweet as', 'yeah nah'];
      return kiwiKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    } catch (error) {
      console.error("Error in detectKiwiCulture:", error);
      return false;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NZ_MILITARY_DATA, NZMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.NZ_MILITARY_DATA = NZ_MILITARY_DATA;
  window.NZMilitaryKnowledge = NZMilitaryKnowledge;
}
