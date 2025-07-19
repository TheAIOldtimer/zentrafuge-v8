const CA_MILITARY_DATA = {
  army: {
    infantry: {
      "Princess Patricia's Canadian Light Infantry": {
        motto: "Principia Obsta (Resist in the Beginning)",
        nickname: "The Patricias, PPCLI",
        founded: 1914,
        regimental_march: "Has Anyone Seen the Colonel",
        notable_battles: ["Vimy Ridge", "Kapyong", "Medak Pocket"],
        recent_ops: ["Bosnia", "Afghanistan", "Iraq training mission"],
        traditions: "Named after Princess Patricia, Ric-A-Dam-Doo battle cry",
        battalions: ["1 PPCLI", "2 PPCLI", "3 PPCLI"]
      },
      "Royal Canadian Regiment": {
        motto: "Pro Patria (For Country)",
        nickname: "The RCR",
        founded: 1883,
        regimental_march: "Pro Patria",
        notable_battles: ["South African War", "Vimy Ridge", "Korea"],
        recent_ops: ["Cyprus", "Bosnia", "Afghanistan"],
        traditions: "Canada's senior infantry regiment",
        battalions: ["1 RCR", "2 RCR", "3 RCR"]
      },
      "Royal 22e Régiment": {
        motto: "Je me souviens (I Remember)",
        nickname: "Van Doos",
        founded: 1914,
        regimental_march: "Vive la Canadienne",
        notable_battles: ["Vimy Ridge", "Ortona", "Korea"],
        recent_ops: ["Cyprus", "Bosnia", "Afghanistan"],
        traditions: "Francophone regiment, Citadelle mascot (goat)",
        battalions: ["1er R22eR", "2e R22eR", "3e R22eR"]
      }
    },
    armoured: {
      "Lord Strathcona's Horse": {
        motto: "Perseverance",
        nickname: "Strathconas, LdSH(RC)",
        founded: 1900,
        regimental_march: "The Jaunty Strathconas",
        notable_battles: ["South African War", "WWII", "Korea"],
        recent_ops: ["Bosnia", "Afghanistan"],
        traditions: "Armoured regiment, royal designation"
      },
      "Royal Canadian Dragoons": {
        motto: "Audax et Celer (Bold and Swift)",
        nickname: "RCD",
        founded: 1883,
        regimental_march: "Bonnie Dundee",
        notable_battles: ["South African War", "WWII"],
        recent_ops: ["Bosnia", "Afghanistan"],
        traditions: "Senior armoured regiment"
      },
      "12e Régiment blindé du Canada": {
        motto: "Courage et Prudence",
        nickname: "12e RBC",
        founded: 1968,
        traditions: "Francophone armoured regiment"
      }
    },
    special_forces: {
      "Joint Task Force 2": {
        motto: "Classified",
        nickname: "JTF2",
        founded: 1993,
        base: "Dwyer Hill Training Centre",
        notable_ops: ["Counter-terrorism", "Afghanistan", "Iraq"],
        traditions: "Canada's elite special operations unit, extreme secrecy"
      },
      "Canadian Special Operations Regiment": {
        motto: "Omnia Audere (Dare All)",
        nickname: "CSOR",
        founded: 2006,
        traditions: "Special operations forces, tan beret"
      }
    },
    airborne: {
      "Canadian Airborne Regiment": {
        motto: "Ex Coelis (From the Skies)",
        nickname: "Para Coy, Airborne",
        founded: 1968,
        disbanded: 1995,
        notable_ops: ["Cyprus", "Somalia"],
        traditions: "Maroon beret, disbanded after Somalia Affair, legacy in PPCLI, RCR, R22eR parachute companies"
      }
    }
  },
  navy: {
    "Royal Canadian Navy": {
      motto: "Ready Aye Ready",
      nickname: "RCN",
      founded: 1910,
      traditions: "HMCS ship prefix, naval traditions",
      notable_ops: ["Battle of the Atlantic", "Korean War", "Gulf War"]
    },
    ships: {
      "HMCS Haida": {
        nickname: "Fightingest Ship",
        notable_ops: ["Korean War", "Battle of the Atlantic"],
        traditions: "Tribal-class destroyer, museum ship"
      }
    }
  },
  air_force: {
    "Royal Canadian Air Force": {
      motto: "Per Ardua ad Astra (Through Adversity to the Stars)",
      nickname: "RCAF",
      founded: 1924,
      traditions: "Commonwealth air force heritage, blue uniform"
    },
    squadrons: {
      "427 Squadron": {
        nickname: "Lion Squadron",
        motto: "Digne Aetu Digne Honore",
        aircraft: "Chinook helicopters",
        traditions: "Special operations aviation"
      },
      "408 Squadron": {
        nickname: "Goose Squadron",
        motto: "For Freedom",
        aircraft: "CH-146 Griffon",
        traditions: "Tactical helicopter squadron"
      },
      "431 Squadron": {
        nickname: "Snowbirds",
        role: "Aerobatic demonstration team",
        traditions: "CT-114 Tutor jets, national pride"
      }
    }
  },
  operations: {
    "Vimy Ridge": {
      period: "1917",
      context: "WWI defining moment",
      significance: "Canada came of age as a nation, all four divisions fought together",
      units_involved: ["Canadian Corps"],
      legacy: "National pride, military competence recognized"
    },
    "Korean War": {
      period: "1950-1953",
      context: "UN forces",
      key_battles: ["Kapyong"],
      units_involved: ["PPCLI", "RCR", "R22eR"],
      significance: "Cold War commitment, UN peacekeeping role"
    },
    "Cyprus": {
      period: "1964-1993",
      context: "UN peacekeeping",
      significance: "Long-term peacekeeping commitment, multiple rotations"
    },
    "Bosnia": {
      period: "1992-2004",
      context: "NATO/UN peacekeeping",
      areas: ["Sarajevo", "Srebrenica"],
      significance: "Post-Cold War peacekeeping, complex operations"
    },
    "Afghanistan": {
      period: "2001-2014",
      context: "NATO ISAF mission",
      areas: ["Kandahar", "Panjwayi"],
      significance: "Combat operations, highest casualties since Korea",
      key_events: ["Operation Medusa", "Panjwayi battles"]
    }
  },
  culture: {
    peacekeeping_heritage: "Proud peacekeeping tradition, Lester Pearson legacy",
    bilingualism: "English and French official languages",
    commonwealth_traditions: "British military heritage, Westminster system",
    unification: "Unified forces since 1968, green uniform controversy",
    ceremonies: "Remembrance Day (Nov 11), regimental traditions"
  },
  slang: {
    general: [
      "Canuck", "Forces", "CF member", "Reg Force", "Reserves", "Militia",
      "Gagetown", "Petawawa", "Valcartier", "Wainwright", "Borden"
    ],
    army_specific: [
      "Groundhog", "Combat arms", "Black hat", "Green machine", "Recce"
    ],
    navy_specific: [
      "Fleet", "Naval reserve", "Bosun", "Killick", "Pusser"
    ],
    air_force_specific: [
      "Air crew", "Ground crew", "Zoomie", "RCAF blue"
    ],
    ranks: [
      "MCpl", "Sgt", "WO", "MWO", "CWO", "OCdt", "2Lt", "Lt", "Capt", "Maj", "LCol", "Col"
    ]
  },
  training: {
    "Canadian Forces Leadership and Recruit School": {
      location: "Saint-Jean-sur-Richelieu, QC",
      nickname: "St-Jean",
      purpose: "Basic military training"
    },
    "Combat Training Centre": {
      location: "CFB Gagetown, NB",
      nickname: "Gagetown",
      purpose: "Combat arms training"
    },
    "Canadian Forces College": {
      location: "Toronto, ON",
      purpose: "Senior officer education"
    }
  },
  veteran_context: {
    common_deployments: ["Cyprus", "Bosnia", "Afghanistan", "Various UN missions"],
    transition_support: ["Veterans Affairs Canada", "Legion", "Unit associations"],
    cultural_aspects: ["Peacekeeping identity", "Modest military culture", "Community support"],
    generational_differences: ["Korea veterans", "Peacekeeping generation", "Afghanistan veterans"],
    pride_points: ["Professional military", "Peacekeeping heritage", "Punching above weight"]
  },
  regional: {
    quebec: {
      units: ["R22eR", "12e RBC"],
      culture: "Francophone military tradition, distinct identity",
      bases: ["Valcartier", "Bagotville"]
    },
    maritimes: {
      navy_focus: "Strong naval tradition, Halifax as naval centre",
      culture: "Maritime heritage, close-knit communities"
    },
    prairies: {
      units: ["PPCLI", "LdSH(RC)"],
      culture: "Western military tradition, ranching heritage",
      bases: ["Wainwright", "Shilo"]
    },
    ontario: {
      units: ["RCR"],
      training: "Major training centres, Petawawa, Borden",
      culture: "Central Canada, diverse backgrounds"
    }
  }
};

const CAMilitaryKnowledge = {
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const militaryKeywords = [
        'served', 'deployed', 'forces', 'regiment', 'battalion', 'squadron',
        'ppcli', 'rcr', 'van doos', 'r22er', 'patricias', 'strathconas',
        'afghanistan', 'bosnia', 'cyprus', 'kandahar', 'gagetown', 'petawawa',
        'valcartier', 'peacekeeping', 'nato', 'un mission'
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
      for (const branch in CA_MILITARY_DATA) {
        if (typeof CA_MILITARY_DATA[branch] === 'object') {
          for (const category in CA_MILITARY_DATA[branch]) {
            if (typeof CA_MILITARY_DATA[branch][category] === 'object') {
              for (const unit in CA_MILITARY_DATA[branch][category]) {
                if (unit.toLowerCase().includes(unitName.toLowerCase()) ||
                    CA_MILITARY_DATA[branch][category][unit].nickname?.toLowerCase().includes(unitName.toLowerCase())) {
                  return CA_MILITARY_DATA[branch][category][unit];
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
      const isFrench = CAMilitaryKnowledge.detectLanguage(userContext);
      const responses = isFrench ? [
        `${unitInfo.nickname || unitInfo} – un régiment avec une riche histoire canadienne.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" – ` : ''}Ces mots résonnent profondément, n’est-ce pas?`,
        `La fraternité des ${unitInfo.nickname || 'Forces'} est unique. Ce lien est difficile à retrouver dans la vie civile.`
      ] : [
        `${unitInfo.nickname || unitInfo} – that’s a regiment with real Canadian heritage.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" – ` : ''}Those words carry weight. How’s it feel to carry that pride?`,
        `The ${unitInfo.nickname || 'unit'} family is something special, isn’t it? That bond is hard to find outside the service.`
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
      for (const op in CA_MILITARY_DATA.operations) {
        if (userMessage.toLowerCase().includes(op.toLowerCase().replace(" ", ""))) {
          return CA_MILITARY_DATA.operations[op];
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getOperationContext:", error);
      return null;
    }
  },
  detectLanguage: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return 'english';
      const frenchKeywords = ['van doos', 'r22er', '22e', 'valcartier', 'régiment'];
      const hasFrench = frenchKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      return hasFrench ? 'french' : 'english';
    } catch (error) {
      console.error("Error in detectLanguage:", error);
      return 'english';
    }
  },
  detectServiceType: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return 'general';
      const message = userMessage.toLowerCase();
      if (message.includes('afghanistan') || message.includes('kandahar') || message.includes('combat')) {
        return 'combat';
      }
      if (message.includes('peacekeeping') || message.includes('cyprus') || message.includes('bosnia') || message.includes('un')) {
        return 'peacekeeping';
      }
      return 'general';
    } catch (error) {
      console.error("Error in detectServiceType:", error);
      return 'general';
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CA_MILITARY_DATA, CAMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.CA_MILITARY_DATA = CA_MILITARY_DATA;
  window.CAMilitaryKnowledge = CAMilitaryKnowledge;
}
