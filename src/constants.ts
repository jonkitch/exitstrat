export interface TaxRate {
  state: string;
  rate: number; // Capital gains rate or top income rate depending on state
}

export const STATE_TAX_RATES: TaxRate[] = [
  { state: "Alabama", rate: 0.05 },
  { state: "Alaska", rate: 0 },
  { state: "Arizona", rate: 0.025 },
  { state: "Arkansas", rate: 0.059 },
  { state: "California", rate: 0.133 },
  { state: "Colorado", rate: 0.044 },
  { state: "Connecticut", rate: 0.0699 },
  { state: "Delaware", rate: 0.066 },
  { state: "Florida", rate: 0 },
  { state: "Georgia", rate: 0.0549 },
  { state: "Hawaii", rate: 0.0725 },
  { state: "Idaho", rate: 0.058 },
  { state: "Illinois", rate: 0.0495 },
  { state: "Indiana", rate: 0.0305 },
  { state: "Iowa", rate: 0.06 },
  { state: "Kansas", rate: 0.057 },
  { state: "Kentucky", rate: 0.05 },
  { state: "Louisiana", rate: 0.0425 },
  { state: "Maine", rate: 0.0715 },
  { state: "Maryland", rate: 0.0575 },
  { state: "Massachusetts", rate: 0.05 },
  { state: "Michigan", rate: 0.0425 },
  { state: "Minnesota", rate: 0.0985 },
  { state: "Mississippi", rate: 0.05 },
  { state: "Missouri", rate: 0.048 },
  { state: "Montana", rate: 0.059 },
  { state: "Nebraska", rate: 0.0584 },
  { state: "Nevada", rate: 0 },
  { state: "New Hampshire", rate: 0 },
  { state: "New Jersey", rate: 0.1075 },
  { state: "New Mexico", rate: 0.059 },
  { state: "New York", rate: 0.0882 },
  { state: "North Carolina", rate: 0.0475 },
  { state: "North Dakota", rate: 0.025 },
  { state: "Ohio", rate: 0.0399 },
  { state: "Oklahoma", rate: 0.0475 },
  { state: "Oregon", rate: 0.099 },
  { state: "Pennsylvania", rate: 0.0307 },
  { state: "Rhode Island", rate: 0.0599 },
  { state: "South Carolina", rate: 0.07 },
  { state: "South Dakota", rate: 0 },
  { state: "Tennessee", rate: 0 },
  { state: "Texas", rate: 0 },
  { state: "Utah", rate: 0.0485 },
  { state: "Vermont", rate: 0.0875 },
  { state: "Virginia", rate: 0.0575 },
  { state: "Washington", rate: 0.07 }, // WA has a 7% capital gains tax on gains over $250k
  { state: "West Virginia", rate: 0.065 },
  { state: "Wisconsin", rate: 0.0765 },
  { state: "Wyoming", rate: 0 }
];

export interface Fund {
  id: string;
  name: string;
  ticker: string;
  yield: number; // Annual dividend yield
  growth: number; // Annual expected growth
  rating: number; // 1-5
  description: string;
}

export const DEFAULT_FUNDS: Fund[] = [
  {
    id: "schd",
    name: "Schwab US Dividend Equity ETF",
    ticker: "SCHD",
    yield: 0.034,
    growth: 0.07,
    rating: 4.8,
    description: "High quality dividend payers with strong growth potential."
  },
  {
    id: "jepi",
    name: "JPMorgan Equity Premium Income ETF",
    ticker: "JEPI",
    yield: 0.075,
    growth: 0.03,
    rating: 4.5,
    description: "Generates income through selling options on the S&P 500."
  },
  {
    id: "vnq",
    name: "Vanguard Real Estate ETF",
    ticker: "VNQ",
    yield: 0.042,
    growth: 0.05,
    rating: 4.2,
    description: "Broad exposure to US real estate investment trusts (REITs)."
  },
  {
    id: "vym",
    name: "Vanguard High Dividend Yield ETF",
    ticker: "VYM",
    yield: 0.03,
    growth: 0.08,
    rating: 4.6,
    description: "Tracks high dividend yielding US stocks."
  }
];
