// Example content for the cards that aren't built yet (money and business),
// plus the habit list and daily quotes.

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

export const BUDGET = {
  income: 5200,
  spent: 3214,
  categories: [
    { name: "Beauty & self-care", spent: 84, limit: 120 },
    { name: "Dining out", spent: 156, limit: 200 },
    { name: "Groceries", spent: 342, limit: 450 },
  ],
  savings: { name: "Paris fund", saved: 1240, goal: 3000 },
  nextBill: { name: "Phone bill", amount: 65, inDays: 5 },
};

export const BUSINESS = {
  revenue: 4860,
  goal: 6000,
  lastSixMonths: [3200, 3900, 3600, 4400, 5100, 4860],
  debtPaidOff: 48250,
  debtGoal: 75000,
  clients: 12,
  callsBooked: 5,
  community: 1284,
  launch: { name: "Debt-Free by Spring workshop", inDays: 5, time: "6:00 pm" },
};
