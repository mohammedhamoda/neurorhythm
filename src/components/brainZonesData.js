// brainZonesData.js

// 1. General Notes per Diagnosis
export const ROLE_GENERAL_NOTES = {
  'Schizophrenia': "Temporal accuracy reflects the degree to which external rhythmic structure organizes perceptual timing.",
  'Autism Spectrum Disorder': "Accuracy reflects the effectiveness of structured pattern integration rather than tolerance to randomness.",
  'Depression': "Accuracy reflects the degree of activation and maintenance of rhythmic engagement.",
  'ADHD': "Accuracy reflects the efficiency of attention regulation under temporal load.",
  'Anxiety': "Accuracy reflects the balance between anticipatory monitoring and rhythmic stability."
};

// 2. Default Footer (Fallback)
export const GENERAL_ANALYSIS_FOOTER = "Rhythmic accuracy was mapped to functional brain timing states linked to symptom expression";

// 3. Detailed Brain Zones Configuration
export const BRAIN_ZONES = {
  'Schizophrenia': [
    {
      limit: 20,
      state: "Severe Temporal Fragmentation",
      features: [
        "Breakdown of sequential timing control",
        "Dominance of internally generated percepts",
        "Minimal alignment with external rhythmic structure",
        "High moment-to-moment variability"
      ],
      interpretation: "External rhythmic information fails to constrain internal timing processes, resulting in fragmented sensory–motor coordination consistent with severe perceptual interference."
    },
    {
      limit: 40,
      state: "Unstable External Anchoring",
      features: [
        "Intermittent synchronization with rhythm",
        "Short-lived predictive timing windows",
        "Frequent loss of beat continuity"
      ],
      interpretation: "External temporal cues are intermittently processed but fail to remain dominant, leading to unstable rhythm following."
    },
    {
      limit: 60,
      state: "Emerging Temporal Structuring",
      features: [
        "Improved alignment with rhythmic cues",
        "Reduced perceptual fragmentation",
        "Partial maintenance of beat continuity"
      ],
      interpretation: "Temporal organization begins to stabilize, allowing more reliable engagement with external timing signals."
    },
    {
      limit: 80,
      state: "Coherent Temporal Tracking",
      features: [
        "Sustained beat synchronization",
        "Reduced internal disruption",
        "Consistent timing prediction"
      ],
      interpretation: "External temporal structure is effectively integrated, supporting coherent sensory–motor coordination."
    },
    {
      limit: 100,
      state: "Highly Organized Temporal Control",
      features: [
        "Precise rhythmic entrainment",
        "Strong dominance of external timing cues",
        "Minimal perceptual interference"
      ],
      interpretation: "Temporal systems demonstrate high coherence and stability, enabling accurate and sustained synchronization."
    }
  ],
  'Autism Spectrum Disorder': [
    {
      limit: 20,
      state: "Pattern Overload",
      features: [
        "Difficulty extracting stable rhythmic rules",
        "Excessive focus on micro-variations",
        "Reduced global pattern integration"
      ],
      interpretation: "The system prioritizes local details over global rhythm structure, limiting effective pattern regulation."
    },
    {
      limit: 40,
      state: "Inconsistent Rule Formation",
      features: [
        "Partial recognition of rhythmic regularities",
        "Disruption when structure shifts",
        "Narrow tolerance for variation"
      ],
      interpretation: "Pattern rules are detected but not robustly generalized across changing conditions."
    },
    {
      limit: 60,
      state: "Structured Pattern Engagement",
      features: [
        "Reliable tracking of predictable rhythm",
        "Sensitivity to rule-consistent change",
        "Stable engagement when structure is preserved"
      ],
      interpretation: "Rhythmic processing benefits from internally consistent pattern evolution."
    },
    {
      limit: 80,
      state: "Adaptive Pattern Integration",
      features: [
        "Strong internal representation of rhythm rules",
        "Effective handling of structured variation",
        "Sustained engagement"
      ],
      interpretation: "Pattern regulation systems efficiently integrate predictable change."
    },
    {
      limit: 100,
      state: "Optimized Rule-Based Synchronization",
      features: [
        "Precise pattern tracking",
        "High tolerance for structured variation",
        "Efficient rhythm abstraction"
      ],
      interpretation: "Rhythmic behavior reflects strong rule-based integration and adaptive control."
    }
  ],
  'Depression': [
    {
      limit: 20,
      state: "Marked Engagement Suppression",
      features: [
        "Reduced initiation of rhythmic responses",
        "Prolonged response latency",
        "Low interaction energy"
      ],
      interpretation: "External rhythmic input fails to sufficiently activate engagement mechanisms."
    },
    {
      limit: 40,
      state: "Delayed Engagement Onset",
      features: [
        "Gradual improvement over repetitions",
        "Reduced responsiveness to early cues",
        "Improved stability with repetition"
      ],
      interpretation: "Engagement systems activate slowly but remain responsive to sustained stimulation."
    },
    {
      limit: 60,
      state: "Moderate Engagement Mobilization",
      features: [
        "Improved response consistency",
        "Increased interaction continuity",
        "Reduced latency"
      ],
      interpretation: "Rhythmic stimulation supports partial activation of engagement mechanisms."
    },
    {
      limit: 80,
      state: "Sustained Engagement State",
      features: [
        "Stable rhythmic participation",
        "Consistent timing output",
        "Maintained attention"
      ],
      interpretation: "Engagement systems are sufficiently activated to support continuous interaction."
    },
    {
      limit: 100,
      state: "High Engagement Activation",
      features: [
        "Rapid response initiation",
        "Strong rhythmic consistency",
        "Sustained interaction energy"
      ],
      interpretation: "External rhythm effectively mobilizes engagement and timing systems."
    }
  ],
  'ADHD': [
    {
      limit: 20,
      state: "Attentional Dispersion",
      features: [
        "Inconsistent focus on rhythmic cues",
        "Frequent timing lapses",
        "Poor temporal continuity"
      ],
      interpretation: "Attention allocation fluctuates rapidly, limiting stable rhythm tracking."
    },
    {
      limit: 40,
      state: "Reactive Attention",
      features: [
        "Strong response to salient changes",
        "Reduced stability over time",
        "Variable timing output"
      ],
      interpretation: "Attention responds to stimulation but lacks sustained regulation."
    },
    {
      limit: 60,
      state: "Conditionally Stable Attention",
      features: [
        "Improved focus under optimal stimulation",
        "Decline with excessive tempo pressure",
        "Moderate consistency"
      ],
      interpretation: "Attentional systems stabilize within a limited stimulation range."
    },
    {
      limit: 80,
      state: "Regulated Attention Engagement",
      features: [
        "Sustained rhythmic focus",
        "Controlled response variability",
        "Efficient tempo adaptation"
      ],
      interpretation: "Attention regulation supports consistent interaction when stimulation is structured."
    },
    {
      limit: 100,
      state: "Optimally Tuned Attention",
      features: [
        "High focus stability",
        "Precise rhythmic responses",
        "Minimal attentional drift"
      ],
      interpretation: "Attentional control is well-matched to task demands."
    }
  ],
  'Anxiety': [
    {
      limit: 20,
      state: "Heightened Anticipatory Disruption",
      features: [
        "Premature responses to expected change",
        "Increased timing variability",
        "Difficulty maintaining rhythm continuity"
      ],
      interpretation: "Anticipatory processes dominate rhythmic behavior, disrupting stability."
    },
    {
      limit: 40,
      state: "Anticipation-Driven Variability",
      features: [
        "Improved performance after change occurs",
        "Reduced stability before transitions",
        "Rapid fluctuation in timing"
      ],
      interpretation: "Performance is shaped more by expectation than by current rhythm."
    },
    {
      limit: 60,
      state: "Balanced Anticipation Control",
      features: [
        "Improved tolerance to tempo change",
        "Faster post-change stabilization",
        "Moderate consistency"
      ],
      interpretation: "Anticipatory mechanisms are present but increasingly regulated."
    },
    {
      limit: 80,
      state: "Efficient Anticipation Regulation",
      features: [
        "Controlled responses to upcoming change",
        "Rapid recovery after tempo shifts",
        "Stable rhythmic output"
      ],
      interpretation: "The system manages anticipation without destabilizing rhythm."
    },
    {
      limit: 100,
      state: "Resilient Temporal Regulation",
      features: [
        "Minimal anticipatory disruption",
        "Strong rhythmic continuity",
        "Rapid adaptive recovery"
      ],
      interpretation: "Temporal regulation remains stable despite expected change."
    }
  ],
  // Fallback for when no role is selected or role is unknown
  'default': [
    {
      limit: 20,
      state: "Low Synchronization",
      features: ["Frequent misses", "High variability", "Difficulty tracking beat"],
      interpretation: "Performance indicates significant difficulty aligning with the external rhythm."
    },
    {
      limit: 50,
      state: "Inconsistent Tracking",
      features: ["Intermittent hits", "Variable timing", "Reactive rather than predictive"],
      interpretation: "Rhythm tracking is emerging but lacks consistency."
    },
    {
      limit: 80,
      state: "Stable Performance",
      features: ["Consistent hits", "Good timing", "Steady engagement"],
      interpretation: "Demonstrates solid ability to maintain rhythmic synchronization."
    },
    {
      limit: 100,
      state: "Optimal Synchronization",
      features: ["High precision", "Predictive timing", "Flow state achieved"],
      interpretation: "Excellent temporal regulation and motor control."
    }
  ]
};

// 4. Helper Function to Retrieve State
export const getBrainState = (role, accuracy) => {
  const currentZoneConfig = BRAIN_ZONES[role] || BRAIN_ZONES['default'];
  
  // Find the first zone where the accuracy is less than or equal to the limit
  // OR return the last zone (highest accuracy) if none match (e.g., exactly 100 or potential float issues)
  return currentZoneConfig.find(z => accuracy <= z.limit) || currentZoneConfig[currentZoneConfig.length - 1];
};