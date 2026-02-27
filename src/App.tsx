/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  PieChart, 
  ArrowRight, 
  Info, 
  ChevronRight,
  Star,
  ShieldCheck,
  Building2,
  Wallet,
  Download,
  Mail,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { STATE_TAX_RATES, DEFAULT_FUNDS, Fund } from './constants';
import { fetchTopFunds } from './services/geminiService';
import { jsPDF } from 'jspdf';

// --- Types ---

interface CalculationResult {
  salePrice: number;
  debt: number;
  federalTax: number;
  stateTax: number;
  netProceeds: number;
  investedAmount: number;
}

interface ProjectionData {
  year: number;
  income: number;
  totalValue: number;
}

// --- Components ---

const AppTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-zinc-900 text-white text-[10px] leading-relaxed rounded-lg shadow-2xl pointer-events-none text-center font-medium"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, value, onChange, prefix = "$", icon: Icon, tooltip }: any) => {
  const formatValue = (val: number) => {
    if (val === 0) return "";
    return new Intl.NumberFormat('en-US').format(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === "") {
      onChange(0);
      return;
    }
    const numericValue = parseInt(rawValue, 10);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          {Icon && <Icon size={12} />}
          {label}
        </label>
        {tooltip && (
          <AppTooltip text={tooltip}>
            <Info size={12} className="text-zinc-400 hover:text-emerald-500 cursor-help transition-colors" />
          </AppTooltip>
        )}
      </div>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
          {prefix}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatValue(value)}
          onChange={handleChange}
          placeholder="0"
          className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 pl-8 pr-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, color = "emerald" }: any) => (
  <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-sm">
    <p className="text-xs font-medium text-zinc-500 uppercase tracking-tight mb-1">{label}</p>
    <p className={`text-2xl font-bold text-${color}-600 tabular-nums`}>{value}</p>
    {subValue && <p className="text-[10px] text-zinc-400 mt-1">{subValue}</p>}
  </div>
);

export default function App() {
  // --- State ---
  const [salePrice, setSalePrice] = useState<number>(5000000);
  const [debt, setDebt] = useState<number>(500000);
  const [selectedState, setSelectedState] = useState<string>("California");
  const [investPercent, setInvestPercent] = useState<number>(80);
  const [funds, setFunds] = useState<Fund[]>(DEFAULT_FUNDS);
  const [selectedFundId, setSelectedFundId] = useState<string>(DEFAULT_FUNDS[0].id);
  const [isLoadingFunds, setIsLoadingFunds] = useState(false);

  // --- Effects ---
  useEffect(() => {
    async function loadFunds() {
      setIsLoadingFunds(true);
      const fetched = await fetchTopFunds();
      if (fetched && fetched.length > 0) {
        setFunds(fetched);
        setSelectedFundId(fetched[0].id);
      }
      setIsLoadingFunds(false);
    }
    loadFunds();
  }, []);

  // --- Calculations ---
  const calculation = useMemo((): CalculationResult => {
    // Federal Capital Gains: 20% for high earners + 3.8% Net Investment Income Tax (NIIT)
    // We assume the sale of a business is a long-term capital gain.
    const federalRate = 0.238; 
    const stateRate = STATE_TAX_RATES.find(s => s.state === selectedState)?.rate || 0;
    
    const taxableGain = Math.max(0, salePrice); // Simplified: assuming cost basis is 0 for maximum tax burden visibility
    const federalTax = taxableGain * federalRate;
    const stateTax = taxableGain * stateRate;
    
    const netProceeds = salePrice - federalTax - stateTax - debt;
    const investedAmount = netProceeds * (investPercent / 100);

    return {
      salePrice,
      debt,
      federalTax,
      stateTax,
      netProceeds,
      investedAmount
    };
  }, [salePrice, debt, selectedState, investPercent]);

  const selectedFund = useMemo(() => 
    funds.find(f => f.id === selectedFundId) || funds[0], 
  [funds, selectedFundId]);

  const projections = useMemo((): ProjectionData[] => {
    const data: ProjectionData[] = [];
    let currentValue = calculation.investedAmount;
    
    for (let year = 1; year <= 10; year++) {
      const annualIncome = currentValue * selectedFund.yield;
      // Reinvesting? The prompt says "salary returns", implying they take the income.
      // So growth only applies to the principal.
      const growth = currentValue * selectedFund.growth;
      currentValue += growth;
      
      data.push({
        year,
        income: annualIncome,
        totalValue: currentValue
      });
    }
    return data;
  }, [calculation.investedAmount, selectedFund]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const generateReportText = () => {
    const report = `
EXITSTRATEGY: BUSINESS SALE & INCOME PLANNER REPORT
Generated on: ${new Date().toLocaleDateString()}

--- SALE SUMMARY ---
Gross Sale Price: ${formatCurrency(salePrice)}
State of Sale: ${selectedState}
Business Debt: ${formatCurrency(debt)}
Estimated Federal Tax (23.8%): ${formatCurrency(calculation.federalTax)}
Estimated State Tax: ${formatCurrency(calculation.stateTax)}
--------------------------------------
NET PROCEEDS: ${formatCurrency(calculation.netProceeds)}

--- INVESTMENT STRATEGY ---
Investment Allocation: ${investPercent}%
Total Capital Invested: ${formatCurrency(calculation.investedAmount)}
Selected Fund: ${selectedFund.name} (${selectedFund.ticker})
Dividend Yield: ${(selectedFund.yield * 100).toFixed(2)}%
Expected Growth: ${(selectedFund.growth * 100).toFixed(2)}%

--- 10-YEAR PROJECTION ---
Year 1 Annual Income: ${formatCurrency(projections[0].income)}
Year 10 Annual Income: ${formatCurrency(projections[9].income)}
Portfolio Value (Year 10): ${formatCurrency(projections[9].totalValue)}
Total Net Growth: ${formatCurrency(projections[9].totalValue - calculation.investedAmount)}

Disclaimer: This report is for informational purposes only. Consult with a financial advisor.
    `.trim();
    return report;
  };

  const handleDownloadReport = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExitStrategy_Report_${selectedFund.ticker}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`ExitStrategy Report: ${selectedFund.name}`);
    const body = encodeURIComponent(generateReportText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text("EXITSTRATEGY REPORT", margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    const addSection = (title: string, data: { label: string; value: string }[]) => {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Zinc 900
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      data.forEach(item => {
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, margin, y);
        doc.setTextColor(15, 23, 42);
        doc.text(item.value, margin + 60, y);
        y += 6;
      });
      y += 10;
    };

    addSection("SALE SUMMARY", [
      { label: "Gross Sale Price:", value: formatCurrency(salePrice) },
      { label: "State of Sale:", value: selectedState },
      { label: "Business Debt:", value: formatCurrency(debt) },
      { label: "Federal Tax (Est):", value: formatCurrency(calculation.federalTax) },
      { label: "State Tax (Est):", value: formatCurrency(calculation.stateTax) },
      { label: "NET PROCEEDS:", value: formatCurrency(calculation.netProceeds) }
    ]);

    addSection("INVESTMENT STRATEGY", [
      { label: "Allocation:", value: `${investPercent}%` },
      { label: "Capital Invested:", value: formatCurrency(calculation.investedAmount) },
      { label: "Selected Fund:", value: `${selectedFund.name} (${selectedFund.ticker})` },
      { label: "Dividend Yield:", value: `${(selectedFund.yield * 100).toFixed(2)}%` }
    ]);

    addSection("10-YEAR PROJECTION", [
      { label: "Year 1 Income:", value: formatCurrency(projections[0].income) },
      { label: "Year 10 Income:", value: formatCurrency(projections[9].income) },
      { label: "Portfolio Value (Y10):", value: formatCurrency(projections[9].totalValue) },
      { label: "Total Net Growth:", value: formatCurrency(projections[9].totalValue - calculation.investedAmount) }
    ]);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Disclaimer: This report is for informational purposes only. Consult with a financial advisor.", margin, y + 20);

    doc.save(`ExitStrategy_Report_${selectedFund.ticker}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <TrendingUp size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ExitStrategy</h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-500">
            <span className="text-emerald-600">Planner</span>
            <span className="hover:text-zinc-800 cursor-pointer transition-colors">Tax Guide</span>
            <span className="hover:text-zinc-800 cursor-pointer transition-colors">Fund Analysis</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <Building2 size={16} />
                Sale Details
              </h2>
              
              <div className="space-y-5">
                <InputField 
                  label="Business Sale Price" 
                  value={salePrice} 
                  onChange={setSalePrice} 
                  icon={DollarSign}
                  tooltip="The total gross amount you expect to receive from the sale of your business before any deductions."
                />
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      State of Sale
                    </label>
                    <AppTooltip text="State taxes vary significantly. We apply the top marginal rate for capital gains in your selected state.">
                      <Info size={12} className="text-zinc-400 hover:text-emerald-500 cursor-help transition-colors" />
                    </AppTooltip>
                  </div>
                  <select 
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                  >
                    {STATE_TAX_RATES.map(s => (
                      <option key={s.state} value={s.state}>{s.state}</option>
                    ))}
                  </select>
                </div>

                <InputField 
                  label="Outstanding Business Debt" 
                  value={debt} 
                  onChange={setDebt} 
                  icon={Briefcase}
                  tooltip="Any outstanding business loans, lines of credit, or liabilities that must be settled at the time of sale."
                />
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Federal Tax (Est. 23.8%)</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(calculation.federalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">State Tax ({selectedState})</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(calculation.stateTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Debt Payoff</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(calculation.debt)}</span>
                </div>
                <div className="pt-4 flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-900">Net Proceeds</span>
                  <span className="text-2xl font-black text-emerald-600">{formatCurrency(calculation.netProceeds)}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <PieChart size={16} />
                Investment Strategy
              </h2>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        % to Invest
                      </label>
                      <AppTooltip text="The portion of your net proceeds you intend to put into income-generating assets vs. keeping as cash.">
                        <Info size={12} className="text-zinc-400 hover:text-emerald-500 cursor-help transition-colors" />
                      </AppTooltip>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{investPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={investPercent}
                    onChange={(e) => setInvestPercent(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                    <span>CASH OUT</span>
                    <span>FULLY INVESTED</span>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <Wallet className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Investable Capital</p>
                      <p className="text-xl font-black text-emerald-900">{formatCurrency(calculation.investedAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <FileText size={16} />
                Report Actions
              </h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <FileText size={14} />
                  DOWNLOAD PDF
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleDownloadReport}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 text-white rounded-xl font-bold text-[10px] hover:bg-zinc-800 transition-all"
                  >
                    <Download size={12} />
                    TXT
                  </button>
                  <button 
                    onClick={handleEmailReport}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-bold text-[10px] hover:bg-zinc-50 transition-all"
                  >
                    <Mail size={12} />
                    EMAIL
                  </button>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-zinc-400 text-center leading-relaxed">
                Generate a formatted summary of your exit strategy and projections.
              </p>
            </section>
          </div>

          {/* Right Column: Results & Projections */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Fund Selection */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Star size={16} />
                  Top Income Funds
                </h2>
                {isLoadingFunds && (
                  <span className="text-[10px] font-bold text-emerald-600 animate-pulse">UPDATING FROM LIVE SOURCES...</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {funds.map((fund) => (
                  <motion.button
                    key={fund.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFundId(fund.id)}
                    className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                      selectedFundId === fund.id 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' 
                        : 'bg-white border-zinc-100 text-zinc-900 hover:border-emerald-200 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${selectedFundId === fund.id ? 'text-emerald-100' : 'text-zinc-400'}`}>
                          {fund.ticker}
                        </p>
                        <h3 className="font-bold text-lg leading-tight">{fund.name}</h3>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${selectedFundId === fund.id ? 'bg-white/20' : 'bg-zinc-100'}`}>
                        <Star size={10} fill="currentColor" />
                        {fund.rating}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedFundId === fund.id ? 'text-emerald-100' : 'text-zinc-400'}`}>Yield</p>
                        <p className="text-xl font-black">{(fund.yield * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedFundId === fund.id ? 'text-emerald-100' : 'text-zinc-400'}`}>Est. Growth</p>
                        <p className="text-xl font-black">{(fund.growth * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    <p className={`mt-4 text-xs leading-relaxed ${selectedFundId === fund.id ? 'text-emerald-50' : 'text-zinc-500'}`}>
                      {fund.description}
                    </p>

                    {selectedFundId === fund.id && (
                      <div className="absolute top-0 right-0 p-2">
                        <ShieldCheck size={24} className="text-white/20" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Projections Chart */}
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-zinc-900">10-Year Income Projection</h2>
                    <AppTooltip text="Projected annual dividend payouts based on the selected fund's yield and principal growth.">
                      <Info size={16} className="text-zinc-400 hover:text-emerald-500 cursor-help transition-colors" />
                    </AppTooltip>
                  </div>
                  <p className="text-sm text-zinc-500">Based on {selectedFund.name} ({selectedFund.ticker}) performance history.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Year 1 Income</p>
                    <p className="text-xl font-black text-emerald-600">{formatCurrency(projections[0].income)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Year 10 Income</p>
                    <p className="text-xl font-black text-emerald-600">{formatCurrency(projections[9].income)}</p>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), 'Annual Salary']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Total Value Growth */}
            <section className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-black">Investment Growth</h2>
                    <AppTooltip text="The estimated total value of your invested principal over 10 years, assuming dividends are taken as income.">
                      <Info size={16} className="text-zinc-500 hover:text-emerald-400 cursor-help transition-colors" />
                    </AppTooltip>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    While you draw an annual salary of <span className="text-emerald-400 font-bold">{formatCurrency(projections[0].income)}</span>, 
                    your principal continues to grow at an estimated <span className="text-emerald-400 font-bold">{(selectedFund.growth * 100).toFixed(1)}%</span> annually.
                  </p>
                  
                  <div className="mt-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Initial Investment</p>
                      <p className="text-3xl font-black">{formatCurrency(calculation.investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Value After 10 Years</p>
                      <p className="text-3xl font-black text-emerald-400">{formatCurrency(projections[9].totalValue)}</p>
                    </div>
                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp size={20} />
                        <span className="text-lg font-bold">+{formatCurrency(projections[9].totalValue - calculation.investedAmount)} Net Growth</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] bg-zinc-800/50 rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projections.filter((_, i) => i % 2 === 0 || i === 9)}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                      />
                      <Bar 
                        dataKey="totalValue" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-white">
                <TrendingUp size={14} />
              </div>
              <span className="font-bold">ExitStrategy</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              ExitStrategy provides estimates based on current tax laws and historical fund performance. 
              Always consult with a tax professional and financial advisor before making significant financial decisions.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Tax Assumptions</h4>
            <ul className="text-xs text-zinc-500 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5" />
                Federal Capital Gains: 20%
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5" />
                NIIT (Net Investment Income Tax): 3.8%
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5" />
                State-specific top marginal rates applied to total sale.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Resources</h4>
            <div className="flex flex-wrap gap-2">
              {['IRS Pub 544', 'SEC Yield Guide', 'Capital Gains FAQ', 'REIT Analysis'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 cursor-pointer transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-zinc-400 font-medium">© 2026 ExitStrategy Financial. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer">Privacy Policy</span>
            <span className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer">Terms of Service</span>
            <span className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
