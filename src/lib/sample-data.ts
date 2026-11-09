// Default habit list, daily quotes and mood names.

/** Glow-up 2027 habits. `sample` pre-fills earlier days of the week (1 = done). */
export const HABITS = [
  { id: "skin", name: "Skincare + SPF", sample: "1111111" },
  { id: "move", name: "Walk or strength train", sample: "1011010" },
  { id: "prot", name: "Protein at every meal", sample: "1101101" },
  { id: "sun", name: "Morning sun + quiet time", sample: "1111011" },
  { id: "money", name: "Money check-in", sample: "1110111" },
  { id: "bed", name: "Phone down, in bed by 10:30", sample: "0110110" },
] as const;

export const QUOTES = [
  "She believed she could, so she did.",
  "Bloom where you are planted.",
  "Romanticize the little things.",
  "Grace in every step, gold in every goal.",
  "Soft heart, strong mind, big plans.",
  "Your pretty little life is a beautiful work in progress.",
  "Be the energy you want to attract.",
  "Little by little, a little becomes a lot.",
];

export const MOODS = ["Radiant", "Happy", "Calm", "Tired", "Low"] as const;
