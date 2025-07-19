// au_military_data.js - Australian Defence Force Knowledge Module for Zentrafuge
// For veteran users only - provides authentic military cultural context

const AU_MILITARY_DATA = {
  
  // Australian Army
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
        traditions: "Maroon beret, airborne operations, integrated into RAR"
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
  
  // Royal Australian Navy
  navy: {
    "Royal Australian Navy": {
      motto: "Ready Aye Ready",
      nickname: "RAN",
      founded: 1911,
      traditions: "HMAS ship prefix, naval heritage",
      notable_ops: ["WWII", "Korea", "Vietnam", "Gulf War", "East Timor"]
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
  
  // Royal Australian Air Force
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
      }
    }
  },
  
  // ANZAC Heritage and Traditions
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
  
  // Australian operations and deployments
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
  
  // Australian military culture
  culture: {
    mateship: "Core Australian military value, looking after your mates",
    irreverence: "Healthy disrespect for authority, larrikin spirit",
    professionalism: "Small but highly professional force",
    anzac_tradition: "ANZAC Day, Dawn Service, Lest We Forget",
    regional_focus: "Asia-Pacific orientation, regional partnerships"
  },
  
  // Military slang and terminology
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
  
  // Training establishments
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
  
  // Veteran context
  veteran_context: {
    common_deployments: ["Vietnam", "East Timor", "Iraq", "Afghanistan", "Various peacekeeping"],
    transition_support: ["DVA", "RSL", "Legacy", "Unit associations"],
    cultural_aspects: ["ANZAC tradition", "Mateship", "Regional focus"],
    generational_differences: ["WWII/Korea veterans", "Vietnam generation", "Modern ADF"],
    pride_points: ["Professional military", "ANZAC heritage", "Punching above weight", "Regional leadership"]
  },
  
  // State connections
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

// Helper functions for the AI to use this data
const AUMilitaryKnowledge = {
  
  // Identify potential military background from user input
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      
      const militaryKeywords = [
        'served', 'deployed', 'army', 'navy', 'air force', 'adf', 'defence force',
        'vietnam', 'afghanistan', 'iraq', 'east timor', 'korea', 'malaya',
        'rar', 'sasr', 'commando', 'anzac', 'digger', 'gallipoli', 'kokoda',
        'long tan', 'kapyong', 'duntroon', 'kapooka', 'holsworthy'
      ];
      
      return militaryKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
    } catch (error) {
      console.error("Error in detectMilitaryService:", error);
      return false;
    }
  },
  
  // Get unit information
  getUnitInfo: function(unitName) {
    try {
      if (!unitName || typeof unitName !== 'string') return null;
      
      // Search through all branches for the unit
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
  
  // Get contextual response for military veterans
  getMilitaryResponse: function(userContext, unitInfo) {
    try {
      if (!unitInfo) return null;
      
      const responses = [
        `${unitInfo.nickname ? unitInfo.nickname + ' - ' : ''}That's a unit with real Australian military heritage.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" - ` : ''}Those are words that carry the ANZAC spirit.`,
        `The Australian Defence Force family - there's something special about that mateship and professional pride.`,
        `Serving Australia - whether it's the ANZAC tradition or modern operations, that service means something.`
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error("Error in getMilitaryResponse:", error);
      return null;
    }
  },
  
  // Check if user mentions specific operations
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
  
  // Detect ANZAC heritage references
  detectANZACHeritage: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      
      const anzacKeywords = ['anzac', 'gallipoli', 'dawn service', 'lest we forget', 'anzac day'];
      return anzacKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
    } catch (error) {
      console.error("Error in detectANZACHeritage:", error);
      return false;
    }
  },
  
  // Detect generation/era of service
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

// Export for use in Zentrafuge
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AU_MILITARY_DATA, AUMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.AU_MILITARY_DATA = AU_MILITARY_DATA;
  window.AUMilitaryKnowledge = AUMilitaryKnowledge;
}
