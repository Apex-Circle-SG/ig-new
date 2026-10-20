import type { Metadata } from 'next';

export type DiscoveryHub = {
  id: string;
  path: string;
  title: string;
  description: string;
  lead: string;
  category?: string;
  sections: { title: string; paragraphs: string[] }[];
  comparisons: { name: string; path: string; fit: string; tradeoff: string }[];
  experiment: string;
  nextPath: string;
  nextLabel: string;
};

export const discoveryHubs: DiscoveryHub[] = [
  {
    id: 'remote-contracts',
    path: '/opportunities/remote-contracts/',
    title: 'Remote contract jobs: compare scope, location and pay',
    description:
      'Explore current remote contract listings and learn how to compare location rules, project scope, payment terms and the real time a contract requires.',
    lead: 'A remote contract can be a defined project, a temporary assignment or an ongoing engagement. Start with what you would deliver, where you are eligible to work and when you would actually be paid. The label alone cannot tell you whether an offer fits your situation.',
    sections: [
      {
        title: 'Remote describes the workplace, not your eligibility',
        paragraphs: [
          'Read the country or region on each listing before investing time in an application. A role may require local residency, particular working hours or work authorisation even when every meeting happens online. Ask the employer to resolve an unclear location rather than assuming “remote” means worldwide.',
          'A contract label also leaves questions open. Ask who signs the agreement, whether the engagement is employment or independent contracting, and whether payment is hourly, monthly or tied to accepted milestones. We preserve source-listed arrangements; we do not decide your legal or tax status.',
        ],
      },
      {
        title: 'Compare the whole commitment',
        paragraphs: [
          'Put preparation, meetings, delivery, revisions and administration into your time estimate. A headline project fee is difficult to compare with a salary until you know the hours, expenses, benefits and gaps between engagements. If a currency or pay period is missing, ask before treating two numbers as comparable.',
          'For example, a hypothetical $500 project with $100 in direct costs and 20 total working hours leaves $20 per hour before tax and any other charges. That is a planning calculation, not an estimate of typical contract earnings. Extra revisions change the result without changing the original quote.',
        ],
      },
      {
        title: 'Ask for an acceptance process before you start',
        paragraphs: [
          'Agree what counts as finished, who approves it, how many revision rounds are included and what happens when a dependency is late. For a migration project, access to a usable sample may be a dependency; for a design engagement, approved copy and brand assets may be dependencies. A short written scope exposes these issues early.',
          'Use the original provider to confirm that a role is still open. Avoid sending sensitive identity or banking information in an initial enquiry. InsightGinie links to sources and does not act as your employer, collect application fees or hold your payment.',
        ],
      },
    ],
    comparisons: [
      {
        name: 'Contract assignment',
        path: '/opportunities/?category=jobs&arrangement=Contract',
        fit: 'You want to compare explicitly source-labelled contract roles.',
        tradeoff: 'Contract duration, worker status and payment basis need checking.',
      },
      {
        name: 'Part-time employment',
        path: '/opportunities/?category=jobs&arrangement=Part-time',
        fit: 'You need fewer scheduled hours rather than a separate project business.',
        tradeoff: 'Part-time does not necessarily mean flexible hours or independent work.',
      },
      {
        name: 'A scoped creative service',
        path: '/earn/creative-services/',
        fit: 'You can package a clear deliverable for an individual client.',
        tradeoff: 'You must find a buyer and agree the scope; these are methods, not vacancies.',
      },
    ],
    experiment:
      'Choose one listing whose geography fits you. Write a five-line brief covering the deliverable, your evidence of relevant work, the missing requirements, the likely time commitment and the question you need answered before applying. A focused enquiry is more useful than applying to every remote-labelled role.',
    nextPath: '/tools/cash-runway/',
    nextLabel: 'Estimate how long your cash buffer could last',
  },
  {
    id: 'paid-research',
    path: '/earn/paid-research/',
    category: 'Paid participation',
    title: 'Paid research and website testing: find your first suitable study',
    description:
      'Compare paid interviews, usability testing, academic studies and mock juries. Check screening, privacy, location and the time involved before participating.',
    lead: 'Researchers sometimes pay for a particular perspective: how you use a product, make a decision or solve a work problem. The useful question is not “which platform pays the most?” but “which study genuinely needs someone with my background?” This is occasional participation, not a guaranteed stream of assignments.',
    sections: [
      {
        title: 'Match the format to the way you communicate',
        paragraphs: [
          'A recorded usability test can ask you to try a task while explaining your thoughts. A research interview is a conversation about relevant experiences. Academic studies may use questionnaires, experiments or decision-making tasks. A mock jury asks eligible participants for reactions to case material; it is different from serving on a court jury.',
          'These formats have different practical demands. Speaking aloud needs clear audio and a quiet space; a scheduled interview needs a time slot you can keep; a task with screen recording needs a clean desktop. Pick a format you can complete carefully rather than signing up for every programme.',
        ],
      },
      {
        title: 'Screening is a matching process',
        paragraphs: [
          'Use an accurate profile and answer eligibility questions honestly. A study seeking users of a particular business tool may have no use for someone who has only heard of it. Location, professional background, device access and availability can all limit which invitations fit you.',
          'Count the time you spend searching, screening and preparing, including applications that lead nowhere. A listed incentive applies to the specified activity under its terms, not to every minute you spend trying to qualify. Waitlists and a lack of matching invitations are possible even on a reachable platform.',
        ],
      },
      {
        title: 'Protect the information a study does not need',
        paragraphs: [
          'Before recording, close private tabs and notifications. Use sample data where the task allows it, and avoid exposing passwords, customer records or confidential employer material. Ask the researcher what will be recorded and how the session will be used if the instructions are unclear.',
          'Read the incentive, completion conditions and payment route before accepting. Research participation is not a reason to pay a stranger an entry fee or share account credentials. Check the original provider’s current requirements; InsightGinie does not recruit participants or process incentives.',
        ],
      },
    ],
    comparisons: [
      {
        name: 'Website testing',
        path: '/earn/website-user-testing/',
        fit: 'You can explain what you are thinking while trying an interface.',
        tradeoff: 'Device, audio, profile and individual test requirements apply.',
      },
      {
        name: 'Research interviews',
        path: '/earn/research-interviews/',
        fit: 'You have relevant first-hand consumer or professional experience.',
        tradeoff: 'Screening and session scheduling do not guarantee selection.',
      },
      {
        name: 'Academic studies',
        path: '/earn/academic-studies/',
        fit: 'You prefer structured tasks or experiments.',
        tradeoff: 'Country eligibility, verification, waitlists and study demand matter.',
      },
      {
        name: 'Mock juries',
        path: '/earn/mock-jury/',
        fit: 'You meet a programme’s local eligibility and can review case material.',
        tradeoff: 'These offers can be geographically restricted and case-dependent.',
      },
    ],
    experiment:
      'Choose one provider, check that you are eligible and prepare an honest profile. Keep a simple log of screening minutes, session minutes, any reward and payment status. After a few attempts, judge whether the format is useful for you rather than relying on another participant’s best result.',
    nextPath: '/platforms/',
    nextLabel: 'Compare the original earning platforms',
  },
  {
    id: 'creative-services',
    path: '/earn/creative-services/',
    category: 'Creative services',
    title: 'Creative freelance services: turn a skill into a clear offer',
    description:
      'Explore slide design, editing, narration, tutoring and other creative services. Plan a small paid offer with a defined buyer, scope, costs and revision limit.',
    lead: 'A useful freelance offer makes a customer’s next step easier: a clearer slide deck, an edited speech, a finished audio file or a focused lesson. Start with one customer problem and a delivery you can demonstrate. The guides below describe businesses to test, not clients waiting to hire you.',
    sections: [
      {
        title: 'Sell a deliverable a customer can recognise',
        paragraphs: [
          '“I can help with content” leaves the buyer to invent the project. An offer such as “clean up ten supplied slides for a consistent layout, with one revision round” makes the scope easier to discuss. That is an example to test, not a claim that customers already want it.',
          'Build a small sample using original or authorised material. Show what you changed and what is included. For narration, demonstrate usable audio rather than a microphone purchase; for tutoring, demonstrate a lesson with a specific learning objective rather than promising broad transformation.',
        ],
      },
      {
        title: 'Measure delivery time before choosing a price',
        paragraphs: [
          'Include briefing, preparation, the work itself, file handling, revisions and follow-up. A finished hour of audio is not necessarily an hour of work, and a short final video can require substantial selection and editing. Measure a complete sample so you can discuss scope with evidence.',
          'Use a simple planning equation: money received minus direct costs, divided by total working hours. A hypothetical $500 project with $100 of costs and 20 hours of work leaves $20 per hour before tax and other charges. It is an illustration, not a market rate or a promise of what you can charge.',
        ],
      },
      {
        title: 'Make boundaries part of the offer',
        paragraphs: [
          'Ask who supplies the input files, what rights you have to use them, how approval works and what happens when the customer changes the brief. State the delivery format, deadline, revision allowance and payment milestones in writing. If a marketplace is involved, inspect its current fees and membership rules.',
          'Do not promise business results that your delivery cannot control. Better-looking slides do not guarantee investment, and a polished profile does not guarantee bookings. Look for a customer willing to pay for a bounded result, then use their feedback to decide whether to repeat the offer.',
        ],
      },
    ],
    comparisons: [
      {
        name: 'Presentation cleanup',
        path: '/earn/presentation-polish/',
        fit: 'You can improve structure and visual consistency in supplied slides.',
        tradeoff: 'The slide count, copy ownership and revision limit need agreement.',
      },
      {
        name: 'Audiobook narration',
        path: '/earn/audiobook-narration/',
        fit: 'You can deliver clean, edited and technically suitable audio.',
        tradeoff: 'Production time, auditions, geography and payment models vary.',
      },
      {
        name: 'Online tutoring',
        path: '/earn/online-tutoring/',
        fit: 'You can teach a specific skill at a clearly defined level.',
        tradeoff: 'Preparation, trial lessons, platform commissions and bookings affect returns.',
      },
      {
        name: 'Expert sessions',
        path: '/earn/paid-expert-consulting/',
        fit: 'You have relevant experience with a narrow problem.',
        tradeoff: 'Credibility, conflicts of interest and customer acquisition still matter.',
      },
    ],
    experiment:
      'Write a one-paragraph offer for a buyer you understand. Include the input you need, the output you will deliver, one exclusion, one revision limit and a delivery window. Make one honest sample and time the entire process before investing in branding or paid promotion.',
    nextPath: '/ideas/',
    nextLabel: 'Find more small service ideas to test',
  },
  {
    id: 'digital-products',
    path: '/earn/digital-products/',
    category: 'Creative products',
    title: 'Digital products to sell: templates, assets and realistic costs',
    description:
      'Compare spreadsheets, Notion templates, stock media, game assets and workbooks. Test a useful product, understand licensing and calculate a realistic break-even point.',
    lead: 'A digital product packages useful work so another person can use it without a custom project each time. That can mean a spreadsheet, a reusable workflow, a media asset or an original workbook. Reusable delivery is attractive, but creating a listing does not establish demand or make the business maintenance-free.',
    sections: [
      {
        title: 'Start with a repeatable problem',
        paragraphs: [
          'Choose a problem you can describe without naming your favourite software. A freelancer may need to check whether a quoted project covers their costs; a small team may need a consistent handover checklist. Those are hypotheses to investigate with potential users, not proof that a template will sell.',
          'Make a small version that performs one job well. Include an example, instructions and the assumptions behind any calculation. Ask someone unfamiliar with the file to use it unaided. If you must explain every step on a call, the product may need better instructions or a narrower purpose.',
        ],
      },
      {
        title: 'The first sale is not the same as breaking even',
        paragraphs: [
          'Separate creation time, listing and transaction costs, promotion, refunds and customer support. A digital file avoids shipping boxes, but it can still require updates, compatibility checks and answers to buyer questions. Use the provider’s current terms rather than a fee percentage remembered from an old article.',
          'For an illustrative break-even calculation, assume ten hours of work valued at $20 per hour, a $10 product and hypothetical fees of 10%. Each sale leaves $9 before tax and other costs. Twenty-two sales produce $198; twenty-three produce $207. Refunds, support and other expenses would raise that target. This is not a forecast or a real platform fee quote.',
        ],
      },
      {
        title: 'Understand what you have the right to sell',
        paragraphs: [
          'Use original assets or material whose licence permits the intended distribution. A product may need clear commercial-use terms, file compatibility information and permission for identifiable people or property in media. Do not assume a downloadable file can be repackaged and resold.',
          'Choose a selling route that fits the asset. A template marketplace, a stock library and a game-asset store have different buyers and review processes. Check payout eligibility, listing rules and the customer support expected from you. Search visibility, approval and sales remain uncertain.',
        ],
      },
    ],
    comparisons: [
      {
        name: 'Specialist spreadsheets',
        path: '/earn/sell-spreadsheets/',
        fit: 'You can simplify one recurring decision or calculation.',
        tradeoff: 'Accuracy, instructions, compatibility and support are part of the product.',
      },
      {
        name: 'Workspace templates',
        path: '/earn/sell-notion-templates/',
        fit: 'You can package a focused, reusable workflow.',
        tradeoff: 'Seller verification, platform terms and updates may apply.',
      },
      {
        name: 'Game assets',
        path: '/earn/game-assets/',
        fit: 'You can make a coherent original collection of reusable assets.',
        tradeoff: 'Licensing, documentation, formats and discoverability need work.',
      },
      {
        name: 'Stock media',
        path: '/earn/stock-photos/',
        fit: 'You can create useful, well-described photographs or clips.',
        tradeoff: 'Technical review, releases and competition affect acceptance and sales.',
      },
    ],
    experiment:
      'Choose one audience and one problem. Build a small original prototype, test it with a potential user and record the time spent. Calculate how many sales would repay the effort under explicit assumptions. A useful test result is stronger evidence than publishing many similar products.',
    nextPath: '/tools/break-even/',
    nextLabel: 'Explore a break-even planning tool',
  },
];

export function discoveryHub(id: string) {
  const hub = discoveryHubs.find((hub) => hub.id === id);
  if (!hub) throw new Error('Unknown discovery hub');
  return hub;
}

export function discoveryMetadata(id: string): Metadata {
  const hub = discoveryHub(id);
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: hub.path },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url: hub.path,
      type: 'website',
      siteName: 'InsightGinie',
      locale: 'en_US',
      images: ['/opengraph-image/'],
    },
  };
}

export function earningHubPath(category: string) {
  return discoveryHubs.find((hub) => hub.category === category)?.path;
}
