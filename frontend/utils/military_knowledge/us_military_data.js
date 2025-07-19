const US_MILITARY_DATA = {
  army: {
    airborne: {
      "82nd Airborne Division": {
        motto: "All the Way",
        nickname: "All American",
        founded: 1917,
        base: "Fort Bragg, NC",
        quick_march: "The All American Soldier",
        notable_battles: ["D-Day", "Market Garden", "Grenada", "Panama"],
        recent_ops: ["Iraq", "Afghanistan", "Haiti"],
        traditions: "America's Guard of Honor, immediate deployment readiness",
        unit_patch: "AA on blue and red background"
      },
      "101st Airborne Division": {
        motto: "Rendezvous with Destiny",
        nickname: "Screaming Eagles",
        founded: 1918,
        base: "Fort Campbell, KY",
        notable_battles: ["D-Day", "Bastogne", "Vietnam"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Air Assault, Band of Brothers heritage",
        unit_patch: "Eagle head on black background"
      },
      "173rd Airborne Brigade": {
        motto: "Sky Soldiers",
        nickname: "The Herd",
        founded: 1963,
        base: "Vicenza, Italy",
        notable_battles: ["Vietnam", "Iraq", "Afghanistan"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Only airborne unit in Europe"
      }
    },
    infantry_divisions: {
      "1st Infantry Division": {
        motto: "No Mission Too Difficult, No Sacrifice Too Great",
        nickname: "Big Red One",
        founded: 1917,
        base: "Fort Riley, KS",
        notable_battles: ["WWI", "WWII", "Vietnam", "Desert Storm"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "America's oldest division, red numeral 1",
        unit_patch: "Red numeral 1 on olive drab"
      },
      "3rd Infantry Division": {
        motto: "Rock of the Marne",
        nickname: "Marne Division",
        founded: 1917,
        base: "Fort Stewart, GA",
        notable_battles: ["Marne", "WWII", "Iraq"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Spearheaded Iraq invasion 2003"
      },
      "4th Infantry Division": {
        motto: "Steadfast and Loyal",
        nickname: "Ivy Division",
        founded: 1917,
        base: "Fort Carson, CO",
        notable_battles: ["D-Day", "Vietnam"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Ivy leaf patch"
      },
      "10th Mountain Division": {
        motto: "Climb to Glory",
        nickname: "Mountain Warriors",
        founded: 1943,
        base: "Fort Drum, NY",
        notable_battles: ["WWII Italy", "Somalia"],
        recent_ops: ["Somalia", "Afghanistan", "Iraq"],
        traditions: "Mountain warfare specialists, crossed bayonets and mountain"
      },
      "25th Infantry Division": {
        motto: "Tropic Lightning",
        nickname: "Tropic Lightning",
        founded: 1941,
        base: "Schofield Barracks, HI",
        notable_battles: ["WWII Pacific", "Vietnam"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Pacific theater heritage"
      }
    },
    armored: {
      "1st Armored Division": {
        motto: "Old Ironsides",
        nickname: "Old Ironsides",
        founded: 1940,
        base: "Fort Bliss, TX",
        notable_battles: ["WWII", "Desert Storm"],
        recent_ops: ["Iraq"],
        traditions: "First armored division"
      },
      "1st Cavalry Division": {
        motto: "First Team",
        nickname: "First Cav",
        founded: 1921,
        base: "Fort Hood, TX",
        notable_battles: ["WWII", "Korea", "Vietnam"],
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Yellow and black patch, air mobility"
      }
    },
    special_forces: {
      "Army Special Forces": {
        motto: "De Oppresso Liber (To Free the Oppressed)",
        nickname: "Green Berets",
        founded: 1952,
        bases: ["Fort Bragg", "Fort Campbell", "Fort Carson"],
        notable_ops: ["Vietnam", "El Salvador", "Iraq", "Afghanistan"],
        traditions: "Green beret, unconventional warfare, foreign internal defense"
      },
      "75th Ranger Regiment": {
        motto: "Rangers Lead the Way",
        nickname: "Rangers",
        founded: 1974,
        base: "Fort Benning, GA",
        notable_ops: ["Grenada", "Panama", "Somalia", "Iraq", "Afghanistan"],
        traditions: "Tan beret, elite light infantry, RASP selection"
      },
      "Delta Force": {
        motto: "Unit motto classified",
        nickname: "The Unit",
        founded: 1977,
        base: "Fort Bragg, NC",
        notable_ops: ["Classified operations worldwide"],
        traditions: "Tier 1 special mission unit, extreme secrecy"
      }
    }
  },
  marines: {
    "United States Marine Corps": {
      motto: "Semper Fidelis (Always Faithful)",
      nickname: "Marines, Devil Dogs, Jarheads",
      founded: 1775,
      hymn: "Marines' Hymn (From the Halls of Montezuma)",
      notable_battles: ["Iwo Jima", "Guadalcanal", "Inchon", "Khe Sanh", "Fallujah"],
      recent_ops: ["Iraq", "Afghanistan"],
      traditions: "Eagle, Globe, and Anchor, Marine Corps Birthday (Nov 10), Esprit de corps"
    },
    divisions: {
      "1st Marine Division": {
        nickname: "The Old Breed",
        base: "Camp Pendleton, CA",
        notable_battles: ["Guadalcanal", "Peleliu", "Okinawa", "Inchon", "Fallujah"],
        recent_ops: ["Iraq", "Afghanistan"]
      },
      "2nd Marine Division": {
        nickname: "Follow Me",
        base: "Camp Lejeune, NC",
        notable_battles: ["Tarawa", "Saipan", "Tinian"],
        recent_ops: ["Iraq", "Afghanistan"]
      },
      "3rd Marine Division": {
        nickname: "Fighting Third",
        base: "Okinawa, Japan",
        notable_battles: ["Bougainville", "Guam", "Iwo Jima", "Vietnam"],
        recent_ops: ["Iraq", "Afghanistan"]
      }
    },
    special_operations: {
      "Force Reconnaissance": {
        motto: "Swift, Silent, Deadly",
        nickname: "Force Recon",
        founded: 1957,
        traditions: "Deep reconnaissance, special operations capable"
      },
      "Marine Raiders": {
        motto: "Always Faithful, Always Forward",
        nickname: "Raiders",
        founded: 2006,
        traditions: "Special operations forces, MARSOC"
      }
    }
  },
  navy: {
    "United States Navy": {
      motto: "Non sibi sed patriae (Not for self but for country)",
      nickname: "Sailors, Squids",
      founded: 1775,
      traditions: "Crossing the line, shellback ceremonies, ship's company pride"
    },
    fleets: {
      "Seventh Fleet": {
        base: "Yokosuka, Japan",
        recent_ops: ["Indo-Pacific operations", "Korean Peninsula"],
        traditions: "Largest forward-deployed fleet"
      }
    },
    special_operations: {
      "Navy SEALs": {
        motto: "The Only Easy Day Was Yesterday",
        nickname: "SEALs, Frogmen",
        founded: 1962,
        notable_ops: ["Vietnam", "Grenada", "Panama", "Iraq", "Afghanistan", "Bin Laden raid"],
        traditions: "Trident pin, Hell Week, BUD/S training, Team guys"
      },
      "SWCC": {
        motto: "On Time, On Target, Never Quit",
        nickname: "Special Warfare Combatant-craft Crewmen",
        founded: 1987,
        traditions: "Special boat operations, SEAL support"
      }
    }
  },
  air_force: {
    "United States Air Force": {
      motto: "Aim High... Fly-Fight-Win",
      nickname: "Airmen, Air Force",
      founded: 1947,
      traditions: "Blue uniform, Aim High motto, flight heritage"
    },
    special_operations: {
      "Pararescue": {
        motto: "That Others May Live",
        nickname: "PJs, Guardian Angels",
        founded: 1947,
        traditions: "Combat search and rescue, medical training"
      },
      "Combat Controllers": {
        motto: "First There",
        nickname: "CCT",
        founded: 1953,
        traditions: "Air traffic control in combat zones"
      },
      "Special Tactics": {
        motto: "Any Time, Any Place",
        nickname: "Special Tactics Squadron",
        traditions: "Elite special operations"
      }
    }
  },
  coast_guard: {
    "United States Coast Guard": {
      motto: "Semper Paratus (Always Ready)",
      nickname: "Coasties",
      founded: 1790,
      traditions: "Maritime security, search and rescue, law enforcement",
      recent_ops: ["Hurricane Katrina", "Drug interdiction", "Port security"],
      bases: ["Coast Guard Island, CA", "Cape May, NJ"]
    }
  },
  slang: {
    general: [
      "GI", "Grunt", "Jarhead", "Squid", "Airman", "Soldier", "Marine",
      "Boot", "FNG", "Lifer", "Short-timer", "REMF", "POG", "11B", "0311"
    ],
    army_specific: [
      "Hooah", "Battle buddy", "Rucksack", "PT", "Formation", "First Sergeant", "Top"
    ],
    marine_specific: [
      "Oorah", "Semper Fi", "Devil Dog", "Jarhead", "Leatherneck", "Gunny", "Chesty"
    ],
    navy_specific: [
      "Hooyah", "Shipmate", "Deck", "Bulkhead", "Scuttlebutt", "Chief", "Anchor"
    ],
    air_force_specific: [
      "Hooah", "Airman", "Blue", "Zoomie", "Crew Chief", "Maintainer"
    ],
    coast_guard_specific: [
      "Coastie", "Puddle Pirate", "Guardian"
    ]
  },
  operations: {
    "Vietnam": {
      period: "1955-1975",
      context: "Vietnam War",
      units_involved: ["All branches", "Draft era"],
      significance: "Defining conflict, controversial homecoming, PTSD awareness"
    },
    "Desert Storm": {
      period: "1991",
      context: "Gulf War",
      units_involved: ["Coalition forces", "Air power demonstration"],
      significance: "Quick victory, modern warfare showcase"
    },
    "Somalia": {
      period: "1992-1995",
      context: "Operation Restore Hope",
      key_events: ["Black Hawk Down"],
      significance: "Urban warfare, special operations"
    },
    "Iraq": {
      period: "2003-2011",
      context: "Operation Iraqi Freedom",
      areas: ["Baghdad", "Fallujah", "Ramadi", "Mosul"],
      significance: "Urban combat, multiple deployments, IEDs"
    },
    "Afghanistan": {
      period: "2001-2021",
      context: "Operation Enduring Freedom",
      areas: ["Kabul", "Kandahar", "Helmand", "Kunar"],
      significance: "Longest war, mountain warfare, Taliban"
    }
  },
  culture: {
    chain_of_command: "Strict hierarchy, respect for rank",
    military_time: "24-hour clock usage",
    physical_fitness: "PT tests, physical standards",
    ceremonies: "Change of command, retirement, awards",
    humor: "Dark humor, military jokes, ball-busting",
    brotherhood: "Unit cohesion, never leave a man behind"
  },
  veteran_context: {
    common_deployments: ["Vietnam", "Desert Storm", "Somalia", "Iraq", "Afghanistan"],
    multiple_tours: "OIF/OEF veterans often did 2-4 deployments",
    transition_challenges: "Civilian disconnect, purpose loss, hypervigilance",
    pride_points: ["Unit pride", "Combat experience", "Service to country"],
    support_networks: ["VFW", "American Legion", "Unit reunions", "VA services"],
    generational_differences: ["WWII/Korea veterans", "Vietnam era", "Gulf War", "9/11 generation"]
  },
  inter_service: {
    rivalries: {
      "Army vs Marines": "Marines claim superiority, Army claims bigger mission",
      "Navy vs Air Force": "Traditional vs newer service rivalry",
      "All vs Coast Guard": "Friendly ribbing about being 'military'"
    },
    stereotypes: {
      "Army": "Green machine, largest branch",
      "Marines": "Elite, few and proud, intense",
      "Navy": "Sailors, ship life, ports",
      "Air Force": "Comfortable, technology-focused",
      "Coast Guard": "Life savers, domestic operations"
    }
  }
};

const USMilitaryKnowledge = {
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const militaryKeywords = [
        'served', 'deployed', 'army', 'navy', 'marines', 'air force', 'coast guard',
        'iraq', 'afghanistan', 'vietnam', 'desert storm', 'oif', 'oef',
        'fort bragg', 'camp pendleton', 'norfolk', 'hood', 'benning',
        'airborne', 'ranger', 'seal', 'marine corps', 'semper fi', 'hooah', 'oorah'
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
      for (const branch in US_MILITARY_DATA) {
        if (typeof US_MILITARY_DATA[branch] === 'object') {
          for (const category in US_MILITARY_DATA[branch]) {
            if (typeof US_MILITARY_DATA[branch][category] === 'object') {
              for (const unit in US_MILITARY_DATA[branch][category]) {
                if (unit.toLowerCase().includes(unitName.toLowerCase()) ||
                    US_MILITARY_DATA[branch][category][unit].nickname?.toLowerCase().includes(unitName.toLowerCase())) {
                  return US_MILITARY_DATA[branch][category][unit];
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
      const responses = [
        `${unitInfo.nickname || 'That unit'} has a proud history with battles like ${unitInfo.notable_battles?.[0] || 'many'}.`,
        `${unitInfo.motto ? `"${unitInfo.motto}" - ` : ''}That’s a legacy that sticks with you. How’s it feel to carry that pride?`,
        `The ${unitInfo.nickname || 'unit'} brotherhood is something special, isn’t it? That bond is hard to find outside the service.`
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
      for (const op in US_MILITARY_DATA.operations) {
        if (userMessage.toLowerCase().includes(op.toLowerCase()) ||
            (op === "Iraq" && userMessage.toLowerCase().includes("oif")) ||
            (op === "Afghanistan" && userMessage.toLowerCase().includes("oef"))) {
          return US_MILITARY_DATA.operations[op];
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getOperationContext:", error);
      return null;
    }
  },
  detectBranch: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return null;
      const message = userMessage.toLowerCase();
      if (message.includes('marine') || message.includes('usmc') || message.includes('semper fi') || message.includes('oorah')) {
        return 'marines';
      }
      if (message.includes('army') || message.includes('soldier') || message.includes('hooah')) {
        return 'army';
      }
      if (message.includes('navy') || message.includes('sailor') || message.includes('ship')) {
        return 'navy';
      }
      if (message.includes('air force') || message.includes('airman') || message.includes('usaf')) {
        return 'air_force';
      }
      if (message.includes('coast guard') || message.includes('coastie')) {
        return 'coast_guard';
      }
      return null;
    } catch (error) {
      console.error("Error in detectBranch:", error);
      return null;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { US_MILITARY_DATA, USMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.US_MILITARY_DATA = US_MILITARY_DATA;
  window.USMilitaryKnowledge = USMilitaryKnowledge;
}
