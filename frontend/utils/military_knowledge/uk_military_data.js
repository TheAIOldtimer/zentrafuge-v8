const UK_MILITARY_DATA = {
  army: {
    guards: {
      "Grenadier Guards": {
        motto: "Honi soit qui mal y pense",
        nickname: "The Grenners",
        founded: 1656,
        cap_badge: "Grenade fired proper",
        quick_march: "The British Grenadiers",
        notable_battles: ["Waterloo", "Inkerman", "Normandy", "Falklands"],
        recent_ops: ["Iraq", "Afghanistan", "Bosnia"],
        traditions: "Oldest regiment of Foot Guards, Right of the Line"
      },
      "Coldstream Guards": {
        motto: "Nulli Secundus (Second to None)",
        nickname: "The Coldstreamers",
        founded: 1650,
        cap_badge: "Star of the Order of the Garter",
        quick_march: "Milanollo",
        notable_battles: ["Waterloo", "Crimea", "Normandy"],
        recent_ops: ["Northern Ireland", "Iraq", "Afghanistan"],
        traditions: "Oldest regiment in continuous service"
      },
      "Scots Guards": {
        motto: "Nemo Me Impune Lacessit (No One Provokes Me With Impunity)",
        nickname: "The Jocks",
        founded: 1642,
        cap_badge: "Star of the Order of the Thistle",
        quick_march: "Hielan' Laddie",
        notable_battles: ["Tumbledown", "Normandy"],
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Scottish heritage, fierce regimental pride"
      },
      "Irish Guards": {
        motto: "Quis Separabit (Who Shall Separate Us)",
        nickname: "The Micks",
        founded: 1900,
        cap_badge: "Star of the Order of St Patrick",
        quick_march: "St Patrick's Day",
        notable_battles: ["Anzio", "Normandy"],
        recent_ops: ["Northern Ireland", "Iraq", "Afghanistan"],
        traditions: "Irish wolfhound mascot, shamrock on St Patrick's Day"
      },
      "Welsh Guards": {
        motto: "Cymru am Byth (Wales Forever)",
        nickname: "The Taffs",
        founded: 1915,
        cap_badge: "Leek",
        quick_march: "Rising of the Lark",
        notable_battles: ["Falklands", "Iraq"],
        recent_ops: ["Northern Ireland", "Iraq", "Afghanistan"],
        traditions: "Welsh heritage, goat mascot"
      }
    },
    parachute_regiment: {
      "1st Battalion Parachute Regiment": {
        motto: "Utrinque Paratus (Ready for Anything)",
        nickname: "The Paras",
        founded: 1940,
        cap_badge: "Bellerophon on Pegasus",
        quick_march: "The Ride of the Valkyries",
        notable_battles: ["Arnhem", "Goose Green", "Mount Longdon"],
        recent_ops: ["Falklands", "Northern Ireland", "Iraq", "Afghanistan"],
        traditions: "Red beret, P Company selection, fierce esprit de corps"
      },
      "2nd Battalion Parachute Regiment": {
        motto: "Utrinque Paratus",
        nickname: "2 Para",
        founded: 1940,
        notable_battles: ["Goose Green", "Wireless Ridge"],
        recent_ops: ["Falklands", "Northern Ireland", "Iraq", "Afghanistan"],
        traditions: "Battle of Goose Green heroes"
      },
      "3rd Battalion Parachute Regiment": {
        motto: "Utrinque Paratus",
        nickname: "3 Para",
        founded: 1940,
        notable_battles: ["Mount Longdon"],
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Known for aggressive tactics"
      }
    },
    royal_marines: {
      "Royal Marines": {
        motto: "Per Mare, Per Terram (By Sea, By Land)",
        nickname: "Bootnecks",
        founded: 1664,
        cap_badge: "Globe and Laurel",
        quick_march: "A Life on the Ocean Wave",
        notable_battles: ["D-Day", "Falklands", "Afghanistan"],
        recent_ops: ["Falklands", "Iraq", "Afghanistan", "Sierra Leone"],
        traditions: "Green beret, Commando training, Royal Marines Commandos"
      },
      "40 Commando": {
        nickname: "Four Zero",
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Norton Manor Camp"
      },
      "42 Commando": {
        nickname: "Four Two",
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Bickleigh Barracks"
      },
      "45 Commando": {
        nickname: "Four Five",
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Condor Barracks"
      }
    },
    infantry: {
      "The Rifles": {
        motto: "Swift and Bold",
        nickname: "The Rifles",
        formed: 2007,
        quick_march: "Road to the Isles",
        recent_ops: ["Iraq", "Afghanistan"],
        traditions: "Largest infantry regiment, rifle green uniform"
      }
    },
    special_forces: {
      "22 SAS": {
        motto: "Who Dares Wins",
        nickname: "The Regiment",
        founded: 1941,
        cap_badge: "Winged dagger",
        base: "Hereford",
        notable_ops: ["Iranian Embassy", "Falklands", "Iraq", "Afghanistan"],
        traditions: "Beige beret, ultimate elite unit, extreme secrecy"
      },
      "SBS": {
        motto: "By Strength and Guile",
        nickname: "The Boat Service",
        founded: 1940,
        recent_ops: ["Falklands", "Iraq", "Afghanistan"],
        traditions: "Maritime special forces, Royal Marines heritage"
      }
    }
  },
  raf: {
    "RAF Regiment": {
      motto: "Per Ardua ad Astra",
      nickname: "Rock Apes",
      founded: 1942,
      recent_ops: ["Iraq", "Afghanistan"],
      traditions: "Ground defence of airfields"
    },
    "No. 617 Squadron": {
      motto: "Après moi, le déluge (After me, the flood)",
      nickname: "Dambusters",
      founded: 1943,
      recent_ops: ["Iraq", "Afghanistan", "Syria"],
      traditions: "Lancaster bomber legacy, precision strikes"
    }
  },
  royal_navy: {
    traditions: {
      general: "Senior Service, Jack Tar traditions",
      ships: "HMS tradition, ship's company pride"
    }
  },
  slang: {
    general: [
      "Squaddie", "Rupert", "Crow", "Wets", "Dry", "Jack", "Pongo", 
      "Crab", "Hat", "Beret", "Green machine", "Rodney", "Threaders"
    ],
    paras_specific: [
      "Crap hat", "Red devils", "Maroon machine", "P Company"
    ],
    guards_specific: [
      "Guardsman", "Drill", "Bearskin", "Queen's Guard"
    ],
    marines_specific: [
      "Bootneck", "Green lid", "Yomp", "Commando course"
    ],
    raf_specific: [
      "Crabs", "Rock Apes", "Wings"
    ],
    navy_specific: [
      "Matelots", "WAFUs", "Pusser"
    ]
  },
  operations: {
    "Northern Ireland": {
      period: "1969-2007",
      context: "The Troubles",
      units_involved: ["Paras", "Guards", "Royal Marines", "Various infantry"],
      significance: "Long deployment, urban warfare experience"
    },
    "Falklands": {
      period: "1982",
      context: "Falklands War",
      key_battles: ["Goose Green", "Mount Longdon", "Tumbledown"],
      units_involved: ["2 Para", "3 Para", "Scots Guards", "Welsh Guards", "Royal Marines"],
      significance: "Defining moment for many regiments"
    },
    "Iraq": {
      period: "2003-2011",
      context: "Iraq War",
      areas: ["Basra", "Al Amarah"],
      significance: "Modern warfare experience"
    },
    "Afghanistan": {
      period: "2001-2014",
      context: "ISAF/Herrick",
      areas: ["Helmand", "Sangin", "Musa Qala"],
      significance: "Longest campaign, heavy casualties"
    }
  },
  culture: {
    mess_traditions: "Officers' mess, sergeants' mess protocols",
    regimental_days: "Battle honours commemorations",
    ceremonies: "Trooping the Colour, Remembrance Sunday",
    humor: "Dark military humor, piss-taking culture",
    hierarchy: "Respect for rank but informal when appropriate"
  },
  veteran_context: {
    common_deployments: ["Northern Ireland", "Falklands", "Iraq", "Afghanistan", "Bosnia", "Sierra Leone"],
    transition_challenges: "Leaving tight-knit military family",
    pride_points: "Regimental identity, operational service",
    support_networks: "Regimental associations, veteran charities"
  }
};

const UKMilitaryKnowledge = {
  detectMilitaryService: function(userMessage) {
    try {
      if (!userMessage || typeof userMessage !== 'string') return false;
      const militaryKeywords = [
        'served', 'deployed', 'regiment', 'battalion', 'company', 'platoon',
        'para', 'guards', 'marines', 'raf', 'navy', 'army', 'squadron',
        'afghanistan', 'iraq', 'falklands', 'northern ireland', 'helmand',
        'sangin', 'basra', 'goose green', 'mount longdon'
      ];
      return militaryKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
    } catch (error) {
      console.error("Error in detectMilitaryService:", error);
      return false;
    }
  },
  getRegimentInfo: function(regimentName) {
    try {
      if (!regimentName || typeof regimentName !== 'string') return null;
      for (const branch in UK_MILITARY_DATA.army) {
        for (const unit in UK_MILITARY_DATA.army[branch]) {
          if (unit.toLowerCase().includes(regimentName.toLowerCase()) ||
              (UK_MILITARY_DATA.army[branch][unit].nickname?.toLowerCase().includes(regimentName.toLowerCase()))) {
            return UK_MILITARY_DATA.army[branch][unit];
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getRegimentInfo:", error);
      return null;
    }
  },
  getMilitaryResponse: function(userContext, regimentInfo) {
    try {
      if (!regimentInfo) return null;
      const responses = [
        `I see you served with ${regimentInfo.nickname || 'a distinguished unit'}. That's a proud history with battles like ${regimentInfo.notable_battles?.[0] || 'many'}.`,
        `${regimentInfo.motto ? `"${regimentInfo.motto}" - ` : ''}That’s a legacy that carries weight. How’s it feel to carry that pride?`,
        `The ${regimentInfo.nickname || unit} have a tight bond, don’t they? That kind of camaraderie is hard to find outside the service.`
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
      for (const op in UK_MILITARY_DATA.operations) {
        if (userMessage.toLowerCase().includes(op.toLowerCase())) {
          return UK_MILITARY_DATA.operations[op];
        }
      }
      return null;
    } catch (error) {
      console.error("Error in getOperationContext:", error);
      return null;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UK_MILITARY_DATA, UKMilitaryKnowledge };
} else if (typeof window !== 'undefined') {
  window.UK_MILITARY_DATA = UK_MILITARY_DATA;
  window.UKMilitaryKnowledge = UKMilitaryKnowledge;
}
