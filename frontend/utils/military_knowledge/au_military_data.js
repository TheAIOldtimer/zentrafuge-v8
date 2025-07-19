const AU_MILITARY_DATA = {
  army: {
    infantry: {
      "Royal Australian Regiment": {
        motto: "Duty First",
        nickname: "RAR",
        founded: 1948,
        regimental_march: "The Keel Row",
        notable_battles: ["Korea", "Malaya", "Borneo", "Vietnam", "Afghanistan"],
        recent_ops: ["East Timor", "Iraq", "Afghanistan"],
        traditions: "Australia's regular infantry regiment",
        battalions: ["1 RAR", "2 RAR", "3 RAR", "4 RAR", "5 RAR", "6 RAR", "7 RAR", "8/9 RAR"]
      },
      "Parachute Battalion": {
        motto: "Ready",
        nickname: "Para Battalion",
        founded: 1951,
        disbanded: 2006,
        notable_battles: ["Borneo", "Vietnam"],
        traditions: "Maroon beret, airborne operations, legacy integrated into 3 RAR"
      }
    },
    special_forces: {
      "Special Air Service Regiment": {
        motto: "Who Dares Wins",
        nickname: "SASR, The Regiment",
        founded: 1957,
        base: "Campbell Barracks, Perth",
        cap_badge: "Winged dagger",
        notable_ops: ["Borneo", "Vietnam", "East Timor", "Iraq", "Afghanistan"],
        traditions: "Sandy beret, selection course, extreme secrecy"
      },
      "2nd Commando Regiment": {
        motto: "Foras Admonitio (Without Warning)",
        nickname: "2 Cdo",
        founded: 2009,
        notable_ops: ["East Timor", "Iraq", "Afghanistan"],
        traditions: "Green beret, commando training, special operations"
      }
    },
    armoured: {
      "Royal Australian Armoured Corps": {
        motto: "Paratus et Fidelis (Ready and Faithful)",
        nickname: "RAAC",
        founded: 1941,
        notable_battles: ["WWII", "Korea", "Vietnam", "Iraq"],
        recent_ops: ["East Timor", "Iraq", "Afghanistan"],
        traditions: "Black beret, armoured warfare"
      }
    },
    artillery: {
      "Royal Regiment of Australian Artillery": {
        motto: "Ubique (Everywhere)",
        nickname: "RAA, Gunners",
        founded: 1899,
        notable_battles: ["Boer War", "WWI", "WWII", "Korea", "Vietnam"],
        recent_ops: ["East Timor", "Iraq", "Afghanistan"],
        traditions: "Red beret, artillery support"
      }
    },
    engineers: {
      "Royal Australian Engineers": {
        motto: "Ubique Quo Fas et Gloria Ducunt",
        nickname: "RAE, Sappers",
        founded: 1902,
        notable_battles: ["WWI", "WWII", "Korea", "Vietnam"],
        recent_ops: ["East Timor", "Iraq", "Afghanistan"],
        traditions: "Dark blue beret, engineering support"
      }
    }
  },
  navy: {
    "Royal Australian Navy": {
      motto: "Ready Aye Ready",
      nickname: "RAN",
      founded: 1911,
      traditions: "HMAS ship prefix, naval heritage",
      notable_ops: ["WWII", "Korea", "Vietnam", "Gulf War", "East Timor"]
    },
    ships: {
      "HMAS Anzac": {
        nickname: "Anzac Spirit",
        notable_ops: ["Gulf War", "East Timor", "Iraq"],
        traditions: "Anzac-class frigate, modern naval operations"
      }
    },
    clearance_divers: {
      "RAN Clearance Divers": {
        motto: "Lentus Emergit (Slow to Surface)",
        nickname: "CDs",
        founded: 1951,
        traditions: "Mine clearance, underwater operations, special operations support"
      }
    }
  },
  air_force: {
    "Royal Australian Air Force": {
      motto: "Per Ardua ad Astra (Through Adversity to the Stars)",
      nickname: "RAAF",
      founded: 1921,
      traditions: "Commonwealth air force heritage, light blue uniform"
    },
    squadrons: {
      "No. 75 Squadron": {
        nickname: "Tiger Squadron",
        motto: "Onslaught",
        notable_ops: ["WWII", "Korea", "Malaya", "Vietnam"],
        traditions: "Fighter squadron heritage"
      },
      "No. 2 Squadron": {
        nickname: "The Bomber Squadron",
        motto: "Hic Labor Hoc Opus",
        notable_ops: ["Iraq", "Afghanistan"],
        aircraft: "F/A-18 Hornet",
        traditions: "Strike operations"
      },
      "No. 3 Squadron": {
        nickname: "Hornet Squadron",
        motto: "Operta Aperta (Hidden Things Are Revealed)",
        aircraft: "F-35A Lightning II",
        traditions: "Modern fighter operations"
      }
    }
  },
  anzac: {
    heritage: {
      "ANZAC": {
        meaning: "Australian and New Zealand Army Corps",
        founded: 1915,
        significance: "Gallipoli landing, national identity",
        date: "April 25, 1915",
        traditions: "ANZAC Day, Dawn Service, Lest We Forget"
      },
      "ANZAC Spirit": {
        values: ["Courage", "Mateship", "Sacrifice", "Endurance"],
        legacy: "Defining Australian military character"
      }
    }
  },
  operations: {
    "Gallipoli": {
      period: "1915",
      context: "WWI Dardanelles Campaign",
      significance: "Birth of ANZAC legend, national identity",
      key_battles: ["Landing at Anzac Cove", "Lone Pine", "The Nek"],
      legacy: "ANZAC Day, national commemoration"
    },
    "Kokoda": {
      period: "1942",
      context: "WWII Pacific Theatre",
      significance: "Defence of Australia, jungle warfare",
      units_involved: ["39th Battalion", "2/14th Battalion"],
      legacy: "Kokoda spirit, citizen soldiers"
    },
    "Korea": {
      period: "1950-1953",
      context: "Korean War",
      key_battles: ["Kapyong", "Maryang San"],
      units_involved: ["3 RAR", "1 RAR"],
      significance: "Cold War commitment, UN operations"
    },
    "Malaya": {
      period: "1950-1960",
      context: "Malayan Emergency",
      significance: "Counter-insurgency, jungle warfare",
      units_involved: ["RAR battalions", "SASR"],
      legacy: "Jungle warfare expertise"
    },
    "Borneo": {
      period: "1962-1966",
      context: "Indonesian Confrontation",
      significance: "Secret war, special operations",
      units_involved: ["SASR", "RAR battalions"],
      legacy: "Special forces reputation"
    },
    "Vietnam": {
      period: "1962-1973",
      context: "Vietnam War",
      areas: ["Phuoc Tuy Province", "Long Tan"],
      key_battles: ["Long Tan", "Coral-Balmoral"],
      units_involved: ["1 ATF", "SASR", "RAR battalions"],
      significance: "Controversial war, professional performance"
    },
    "East Timor": {
      period: "1999-2013",
      context: "INTERFET/UN peacekeeping",
      significance: "Regional leadership, peacekeeping success",
      legacy: "Australia as regional power"
    },
    "Iraq": {
      period: "2003-2009",
      context: "Iraq War",
      areas: ["Al Muthanna Province"],
      significance: "Coalition operations, reconstruction"
    },
    "Afghanistan": {
      period: "2001-2021",
      context: "Operation Slipper",
      areas: ["Uruzgan Province", "Kandahar"],
      units_involved: ["SASR", "2 Cdo", "RAR battalions"],
      significance: "Longest war, special operations focus"
    }
  },
  culture: {
    mateship: "Core Australian military value, looking after your mates",
    irreverence: "Healthy disrespect for authority, larrikin spirit",
    professionalism: "Small but highly professional force",
    anzac_tradition: "ANZAC Day, Dawn Service, Lest We Forget",
    regional_focus: "Asia-Pacific orientation, regional partnerships"
  },
  slang: {
    general: [
      "Digger", "Aussie", "Mate", "Blue", "Cobber", "ADF",
      "Nasho", "Choco", "Pongo", "Sailor", "Airman"
    ],
    army_specific: [
      "Digger", "Infantry", "Grunt", "Blackhats", "Gunners", "Sappers",
      "Bush tele", "Scoff", "Brew", "Diggers", "The Regiment"
    ],
    navy_specific: [
      "Pusser", "Stoker", "Bunting tosser", "Grog", "Runs ashore"
    ],
    air_force_specific: [
      "Zoomies", "Ground walloper", "Air crew"
    ],
    anzac_specific: [
      "Lest We Forget", "They shall grow not old", "Simpson and his donkey"
    ]
  },
  training: {
    "Royal Military College Duntroon": {
      location: "Canberra, ACT",
      nickname: "Duntroon, RMC",
      purpose: "Officer training",
      traditions: "Australia's Sandhurst, military leadership"
    },
    "Kapooka": {
      location: "Wagga Wagga, NSW",
      nickname: "Kapooka",
      purpose: "Recruit training",
      traditions: "Basic military training, soldier development"
    },
    "RAAF Base Williamtown": {
      location: "Newcastle, NSW",
      purpose: "Fighter pilot training",
      traditions: "Air combat, F/A-18 operations"
    }
  },
  veteran_context: {
    common_deployments: ["Vietnam", "East Timor", "Iraq", "Afghanistan", "Various peacekeeping"],
    transition_support: ["DVA", "RSL", "Legacy", "Unit associations"],
    cultural_aspects: ["ANZAC tradition", "Mateship", "Regional focus"],
    generational_differences: ["WWII/Korea veterans", "Vietnam generation", "Modern ADF"],
    pride_points: ["Professional military", "ANZAC heritage", "Punching above weight", "Regional leadership"]
  },
  regional: {
    new_south_wales: {
      bases: ["Holsworthy", "Randwick", "Singleton"],
      units: ["Various RAR battalions"],
      culture: "Major army presence, training centres"
    },
    victoria: {
      bases: ["Puckapunyal", "Watsonia"],
      culture: "Military history, reserve units"
    },
    queensland: {
      bases: ["Townsville", "Enoggera"],
      units: ["3 RAR", "1 RAR"],
      culture: "Tropical training, northern focus"
    },
    south_australia: {
      bases: ["Edinburgh", "Woodside"],
      culture: "Naval focus, training establishments"
    },
    western_australia: {
      bases: ["Campbell Barracks", "RAAF Pearce"],
      units: ["SASR"],
      culture: "Special forces, western operations"
    },
    northern_territory: {
      bases: ["Robertson Barracks", "Larrakeyah"],
      culture: "Northern Australia focus, indigenous connections"
    }
  }
};

const AUMilitaryKnowledge = {
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const militaryKeywords = [
        'served', 'deployed', 'army', 'navy', 'air force', 'adf', 'defence force',
        'vietnam', 'afghanistan', 'iraq', 'east timor', 'korea', 'malaya',
        'rar', 'sasr', 'commando', 'anzac', 'digger', 'gallipoli', 'kokoda',
        'long tan', 'kapyong', 'duntroon', 'kapooka', 'holsworthy'
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
      for (const branch in AU_MILITARY_DATA) {
        if (typeof AU_MILITARY_DATA[branch] === 'object') {
          for (const category in AU_MILITARY_DATA[branch]) {
            if (typeof AU_MILITARY_DATA[branch][category] === 'object') {
              for (const unit in AU_MILITARY_DATA[branch][category]) {
                if (unit.toLowerCase().includes(unitName.toLowerCase()) ||
                    (AU_MILITARY_DATA[branch][category][unit].nickname?.toLowerCase().includes(unitName.toLowerCase()))) {
                  return AU_MILITARY_DATA[branch][category][unit];
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
      const isANZAC = AUMilitaryKnowledge.detectANZACHeritage(userContext);
      const responses = [
        `${unitInfo.nickname || unitInfo} – a unit with a proud history in battles like ${unitInfo.notable_battles?.[0] || 'many'}.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" – ` : ''}That’s the ANZAC spirit right there. What’s it like carrying that legacy?`,
        isANZAC
          ? `The ${unitInfo.nickname || 'ADF'} and ANZAC mateship – there’s nothing like it, is there? Lest we forget.`
          : `The ${unitInfo.nickname || 'unit'} is all about mateship and getting the job done. That’s proper Aussie pride.`
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
      for (const op in AU_MILITARY_DATA.operations) {
        if (userMessage.toLowerCase().includes(op.toLowerCase())) {
          return AU_MILITARY_DATA.operations[op];
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
      const anzacKeywords = ['anzac', 'gallipoli', 'dawn service', 'lest we forget', 'anzac day'];
      return anzacKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    } catch (error) {
      console.error("Error in detectANZACHeritage:", error);
      return false;
    }
  },
  detectServiceEra: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return 'general';
      const message = userMessage.toLowerCase();
      if (message.includes('vietnam') || message.includes('long tan')) {
        return 'vietnam';
      }
      if (message.includes('afghanistan') || message.includes('iraq') || message.includes('east timor')) {
        return 'modern';
      }
      if (message.includes('korea') || message.includes('malaya')) {
        return 'cold_war';
      }
      return 'general';
    } catch (error) {
      console.error("Error in detectServiceEra:", error);
      return 'general';
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AU_MILITARY_DATA, AUMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.AU_MILITARY_DATA = AU_MILITARY_DATA;
  window.AUMilitaryKnowledge = AUMilitaryKnowledge;
}
