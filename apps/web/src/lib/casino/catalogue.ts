const dia =
  'https://www.dia.govt.nz/diawebsite.nsf/wpg_URL/Services-Casino-and-Non-Casino-Gaming-Rules-of-Casino-Table-Games';
export const casinoLabs = [
  {
    id: 'baccarat',
    group: 'Card games',
    title: 'Baccarat · Banker & third-card lab',
    description:
      'Deal a shoe, follow every drawing decision, and calculate exact Player, Banker and Tie odds from the cards remaining.',
    source: 'Approved baccarat drawing rules',
    url: 'https://www.gra.gov.sg/docs/default-source/game-rules/rws/baccarat-games/rws-game-rules---rws-baccarat-v3.pdf',
  },
  {
    id: 'blackjack',
    group: 'Card games',
    title: 'Blackjack · Dealer odds & decision lab',
    description:
      'Play hands, split pairs and compare actions. Inspect the hidden dealer card with exact finite-shoe probabilities.',
    source: 'DIA blackjack rules and approved variants',
    url: dia + '#Blackjack',
  },
  {
    id: 'video-poker',
    group: 'Card games',
    title: 'Video poker · Find your best hold',
    description:
      'Play Jacks or Better and enumerate every replacement combination across all 32 possible holds.',
    source: 'Conditional expectation in Jacks or Better — mathematical paper',
    url: 'https://arxiv.org/abs/1602.04171',
  },
  {
    id: 'three-card-poker',
    group: 'Card games',
    title: 'Three-card poker · Play or fold?',
    description:
      'Play Ante and Pair Plus, understand dealer qualification, and compare all possible dealer hands.',
    source: 'DIA three-card poker rules',
    url: dia + '#ThreeCardPoker',
  },
  {
    id: 'casino-war',
    group: 'Card games',
    title: 'Casino War · The cost of a tie',
    description:
      'Deal high cards, choose surrender or war, and see how additional wagers change the calculation.',
    source: 'Massachusetts Casino War rules',
    url: 'https://massgaming.com/wp-content/uploads/Rules-Casino-War-10-08-2020.pdf',
  },
  {
    id: 'sic-bo',
    group: 'Dice games',
    title: 'Sic Bo · Three-dice probability table',
    description:
      'Roll three dice, explore 216 ordered outcomes, and compare totals, faces, doubles, triples and combinations.',
    source: 'DIA Tai Sai rules and paytable variants',
    url: dia + '#TaiSai',
  },
  {
    id: 'craps',
    group: 'Dice games',
    title: 'Craps · Points, Come bets & true odds',
    description:
      'Follow come-out and point rounds, place Come contracts, add true odds and inspect proposition bets.',
    source: 'OLG PlaySmart — craps bets and odds',
    url: 'https://www.playsmart.ca/table-games/craps/how-to-play/how-to-play-craps-details/',
  },
  {
    id: 'slots',
    group: 'Wheel & reel games',
    title: 'Slot mathematics · Build the reels',
    description:
      'Design a three-reel teaching game, change symbol weights and payouts, and compare observed and theoretical returns.',
    source:
      'Original InsightGinie teaching model; formulas and assumptions are shown on this page.',
    url: '',
  },
  {
    id: 'session-lab',
    group: 'Probability & session tools',
    title: 'Session comparison · Chance over time',
    description:
      'Compare games and staking patterns on repeatable outcomes. Inspect balance paths, drawdowns and stopping limits.',
    source: 'Original InsightGinie simulation; game rules and policies are documented in each lab.',
    url: '',
  },
] as const;
export type CasinoLabId = (typeof casinoLabs)[number]['id'];
