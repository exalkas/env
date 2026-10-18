"use client";

import React, { useState } from "react";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface TradingTimelineSimulationProps {
  onComplete?: (score: number) => void;
}

interface YearlyDecision {
  year: number;
  complianceDeadline: string;
  currentAllowances: number;
  requiredAllowances: number;
  marketPrice: number;
  marketTrend: "rising" | "falling" | "stable";
  specialEvents: string[];
  decisions: DecisionOption[];
  optimalDecision: string;
  explanation: string;
}

interface DecisionOption {
  id: string;
  action: string;
  description: string;
  cost: number;
  allowancesAcquired: number;
  riskLevel: "low" | "medium" | "high";
  futureImplications: string;
}

interface CompanyState {
  allowanceBank: number;
  totalSpent: number;
  complianceStreak: number;
  riskExposure: number;
}

export default function TradingTimelineSimulation({
  onComplete,
}: TradingTimelineSimulationProps) {
  const [currentYear, setCurrentYear] = useState(0);
  const [yearlyDecisions, setYearlyDecisions] = useState<
    Record<number, string>
  >({});
  const [companyState, setCompanyState] = useState<CompanyState>({
    allowanceBank: 50000, // Starting with some banked allowances
    totalSpent: 0,
    complianceStreak: 0,
    riskExposure: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [gamePhase, setGamePhase] = useState<"playing" | "complete">("playing");

  const timelineData: YearlyDecision[] = [
    {
      year: 2024,
      complianceDeadline: "April 30, 2025",
      currentAllowances: 50000,
      requiredAllowances: 180000,
      marketPrice: 85,
      marketTrend: "rising",
      specialEvents: [
        "Energy crisis drives up power demand",
        "New EU climate targets announced",
        "MSR intake rate increases to 24%",
      ],
      decisions: [
        {
          id: "buy_immediate",
          action: "Buy Required Allowances Now",
          description: "Purchase 130,000 EUAs at current €85/tonne",
          cost: 11050000,
          allowancesAcquired: 130000,
          riskLevel: "low",
          futureImplications: "Locked in current prices, no timing risk",
        },
        {
          id: "gradual_purchase",
          action: "Gradual Acquisition Strategy",
          description: "Buy 32,500 EUAs per quarter over next year",
          cost: 11700000, // Estimated higher due to rising prices
          allowancesAcquired: 130000,
          riskLevel: "medium",
          futureImplications:
            "Exposed to price increases but spread timing risk",
        },
        {
          id: "minimal_buy_bet",
          action: "Minimal Purchase + Wait",
          description: "Buy only 80,000 EUAs now, gamble on future price drops",
          cost: 6800000,
          allowancesAcquired: 80000,
          riskLevel: "high",
          futureImplications: "Major compliance risk if prices continue rising",
        },
        {
          id: "overhedge_strategy",
          action: "Over-hedge for Future Years",
          description: "Buy 180,000 EUAs now for this and next year",
          cost: 15300000,
          allowancesAcquired: 180000,
          riskLevel: "low",
          futureImplications:
            "Protected against future price rises, large upfront cost",
        },
      ],
      optimalDecision: "buy_immediate",
      explanation:
        "With rising trend and energy crisis, immediate purchase at €85 avoids higher future costs while ensuring compliance.",
    },
    {
      year: 2025,
      complianceDeadline: "April 30, 2026",
      currentAllowances: 0, // Will be calculated based on previous decision
      requiredAllowances: 175000,
      marketPrice: 95,
      marketTrend: "stable",
      specialEvents: [
        "Maritime sector added to EU ETS increases demand",
        "Economic slowdown reduces industrial emissions slightly",
        "Major renewable energy capacity comes online",
      ],
      decisions: [
        {
          id: "auction_strategy",
          action: "Primary Auction Participation",
          description: "Bid in monthly auctions for required allowances",
          cost: 16625000, // 175k * €95
          allowancesAcquired: 175000,
          riskLevel: "medium",
          futureImplications: "Transparent pricing but allocation uncertainty",
        },
        {
          id: "secondary_market",
          action: "Secondary Market Purchase",
          description: "Buy from trading platforms at market price",
          cost: 16800000, // Slight premium
          allowancesAcquired: 175000,
          riskLevel: "low",
          futureImplications: "Immediate execution, slight price premium",
        },
        {
          id: "forward_hedge_2026",
          action: "Forward Contracts for 2026",
          description: "Lock in €92/tonne for 2026 compliance (early hedge)",
          cost: 16100000,
          allowancesAcquired: 175000,
          riskLevel: "low",
          futureImplications:
            "Early planning reduces 2026 risk, good if prices rise",
        },
        {
          id: "banking_strategy",
          action: "Minimal Purchase + Banking",
          description: "Buy 120,000 EUAs, plan to buy banked allowances later",
          cost: 11400000,
          allowancesAcquired: 120000,
          riskLevel: "high",
          futureImplications:
            "Compliance shortfall, must buy from market later",
        },
      ],
      optimalDecision: "forward_hedge_2026",
      explanation:
        "With stable prices and mixed market signals, locking in €92 for future provides good value and reduces 2026 planning pressure.",
    },
    {
      year: 2026,
      complianceDeadline: "April 30, 2027",
      currentAllowances: 0,
      requiredAllowances: 170000,
      marketPrice: 102,
      marketTrend: "rising",
      specialEvents: [
        "Unexpected cold winter increases power demand",
        "Nuclear plant maintenance reduces clean capacity",
        "Carbon border adjustment starts affecting imports",
      ],
      decisions: [
        {
          id: "panic_buy",
          action: "Emergency Market Purchase",
          description: "Buy all required allowances at high market price",
          cost: 17340000, // 170k * €102
          allowancesAcquired: 170000,
          riskLevel: "medium",
          futureImplications: "Expensive but ensures compliance",
        },
        {
          id: "partial_compliance",
          action: "Partial Purchase + Penalty Risk",
          description: "Buy 120,000 EUAs, risk penalty on remainder",
          cost: 12240000, // Plus potential €100/tonne penalty
          allowancesAcquired: 120000,
          riskLevel: "high",
          futureImplications: "Penalty of €5M plus reputation damage",
        },
        {
          id: "trade_banked",
          action: "Use Banked Allowances",
          description: "Draw from allowance bank built in previous years",
          cost: 0,
          allowancesAcquired: 170000, // From bank
          riskLevel: "low",
          futureImplications: "Only viable if over-hedged in previous years",
        },
        {
          id: "efficiency_investment",
          action: "Emergency Efficiency Investment",
          description:
            "Invest €8M in efficiency to reduce need to 140,000 EUAs",
          cost: 22280000, // 8M investment + 140k*€102
          allowancesAcquired: 140000,
          riskLevel: "medium",
          futureImplications: "High cost but long-term emission reductions",
        },
      ],
      optimalDecision: "trade_banked",
      explanation:
        "If previous over-hedging strategy was chosen, using banked allowances is optimal. Otherwise, emergency purchase despite high cost.",
    },
    {
      year: 2027,
      complianceDeadline: "April 30, 2028",
      currentAllowances: 0,
      requiredAllowances: 165000,
      marketPrice: 88,
      marketTrend: "falling",
      specialEvents: [
        "Economic recession reduces industrial activity",
        "Massive renewable deployment creates oversupply",
        "MSR begins releasing allowances back to market",
      ],
      decisions: [
        {
          id: "buy_the_dip",
          action: "Buy at Reduced Prices",
          description: "Take advantage of lower prices for full compliance",
          cost: 14520000, // 165k * €88
          allowancesAcquired: 165000,
          riskLevel: "low",
          futureImplications: "Good value purchase in down market",
        },
        {
          id: "wait_for_lower",
          action: "Wait for Further Price Drops",
          description: "Delay purchase expecting prices to fall to €75-80",
          cost: 12937500, // 165k * €78.5 average
          allowancesAcquired: 165000,
          riskLevel: "medium",
          futureImplications: "Potential savings but timing risk remains",
        },
        {
          id: "build_bank_2028",
          action: "Over-purchase for Banking",
          description: "Buy 200,000 EUAs to build bank for future",
          cost: 17600000, // 200k * €88
          allowancesAcquired: 200000,
          riskLevel: "medium",
          futureImplications: "Builds security for future years at low prices",
        },
        {
          id: "minimal_hedge",
          action: "Minimal Current Year Purchase",
          description: "Buy only 100,000 EUAs, plan heavy banking withdrawal",
          cost: 8800000,
          allowancesAcquired: 100000,
          riskLevel: "high",
          futureImplications:
            "Requires significant banked allowances from past",
        },
      ],
      optimalDecision: "build_bank_2028",
      explanation:
        "Low prices present opportunity to build allowance bank for future years when prices may recover.",
    },
  ];

  const handleDecision = (decisionId: string) => {
    setYearlyDecisions((prev) => ({
      ...prev,
      [currentYear]: decisionId,
    }));

    // Update company state based on decision
    const currentDecision = timelineData[currentYear].decisions.find(
      (d) => d.id === decisionId
    );
    if (currentDecision) {
      setCompanyState((prev) => ({
        allowanceBank:
          prev.allowanceBank +
          currentDecision.allowancesAcquired -
          timelineData[currentYear].requiredAllowances,
        totalSpent: prev.totalSpent + currentDecision.cost,
        complianceStreak:
          currentDecision.allowancesAcquired >=
          timelineData[currentYear].requiredAllowances
            ? prev.complianceStreak + 1
            : 0,
        riskExposure:
          currentDecision.riskLevel === "high"
            ? prev.riskExposure + 1
            : prev.riskExposure,
      }));
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentYear < timelineData.length - 1) {
      setCurrentYear((prev) => prev + 1);
      setShowResults(false);

      // Update current allowances for next year
      timelineData[currentYear + 1].currentAllowances = Math.max(
        0,
        companyState.allowanceBank
      );
    } else {
      setGamePhase("complete");
      // Calculate final score
      let score = 0;
      timelineData.forEach((year, index) => {
        if (yearlyDecisions[index] === year.optimalDecision) {
          score += 25;
        }
      });
      score += Math.max(0, 10 - companyState.riskExposure * 2); // Penalty for high risk
      score += companyState.complianceStreak * 2; // Bonus for compliance streak

      onComplete?.(Math.min(100, score));
    }
  };

  const currentYearData = timelineData[currentYear];
  const selectedDecision = yearlyDecisions[currentYear];
  const selectedOption = currentYearData?.decisions.find(
    (d) => d.id === selectedDecision
  );
  const isCorrect = selectedDecision === currentYearData?.optimalDecision;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-EU").format(amount);
  };

  if (gamePhase === "complete") {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border">
        <div className="text-center">
          <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Simulation Complete!
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(companyState.totalSpent)}
              </div>
              <div className="text-sm text-blue-800">Total Spent</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {companyState.complianceStreak}/4
              </div>
              <div className="text-sm text-green-800">Years Compliant</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
          <CalendarIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Trading Timeline Simulation
          </h2>
          <p className="text-gray-600">
            Manage multi-year compliance decisions in changing market conditions
          </p>
        </div>
      </div>

      {/* Progress & Company State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Year {currentYear + 1} of {timelineData.length} •{" "}
              {currentYearData.year}
            </span>
            <span>
              Compliance Deadline: {currentYearData.complianceDeadline}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${((currentYear + 1) / timelineData.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Company Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Allowance Bank:</span>
              <span className="font-medium">
                {formatNumber(companyState.allowanceBank)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Spent:</span>
              <span className="font-medium">
                {formatCurrency(companyState.totalSpent)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Compliance Streak:</span>
              <span className="font-medium">
                {companyState.complianceStreak} years
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Year Overview */}
      <div className="bg-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-900">
            {currentYearData.year} Market Situation
          </h3>
          <div className="flex items-center gap-2">
            {currentYearData.marketTrend === "rising" ? (
              <ArrowTrendingUpIcon className="h-5 w-5 text-red-600" />
            ) : currentYearData.marketTrend === "falling" ? (
              <ArrowTrendingDownIcon className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 bg-gray-400 rounded-full" />
            )}
            <span className="font-medium text-indigo-900">
              €{currentYearData.marketPrice}/tonne
            </span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                currentYearData.marketTrend === "rising"
                  ? "bg-red-100 text-red-800"
                  : currentYearData.marketTrend === "falling"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {currentYearData.marketTrend}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-indigo-900 mb-2">
              Compliance Requirements
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">Current Allowances:</span>
                <span className="font-medium">
                  {formatNumber(currentYearData.currentAllowances)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Required Allowances:</span>
                <span className="font-medium">
                  {formatNumber(currentYearData.requiredAllowances)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-indigo-700">Shortage:</span>
                <span className="font-bold text-red-600">
                  {formatNumber(
                    Math.max(
                      0,
                      currentYearData.requiredAllowances -
                        currentYearData.currentAllowances
                    )
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-indigo-900 mb-2">Market Events</h4>
            <ul className="space-y-1 text-sm">
              {currentYearData.specialEvents.map((event, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-indigo-800"
                >
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>{event}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Decision Options */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Strategic Options for {currentYearData.year}
        </h3>
        <div className="space-y-4">
          {currentYearData.decisions.map((decision) => (
            <div
              key={decision.id}
              onClick={() => !showResults && handleDecision(decision.id)}
              className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDecision === decision.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${showResults ? "cursor-default" : ""}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {decision.action}
                  </h4>
                  <p className="text-gray-700 text-sm mb-2">
                    {decision.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      Cost: {formatCurrency(decision.cost)}
                    </span>
                    <span className="font-medium">
                      EUAs: {formatNumber(decision.allowancesAcquired)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        decision.riskLevel === "low"
                          ? "bg-green-100 text-green-800"
                          : decision.riskLevel === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {decision.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                {showResults && selectedDecision === decision.id && (
                  <div className="ml-4">
                    {isCorrect ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>

              {selectedDecision === decision.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Future Implications:</strong>{" "}
                    {decision.futureImplications}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="mb-6">
          <div
            className={`p-6 rounded-lg ${
              isCorrect
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    isCorrect ? "text-green-900" : "text-yellow-900"
                  }`}
                >
                  {isCorrect
                    ? "Optimal Strategy Choice!"
                    : "Alternative Approach Taken"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    isCorrect ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  Recommended strategy:{" "}
                  <strong>
                    {
                      currentYearData.decisions.find(
                        (d) => d.id === currentYearData.optimalDecision
                      )?.action
                    }
                  </strong>
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>Strategic Analysis:</strong>{" "}
                  {currentYearData.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentYear > 0 && (
            <button
              onClick={() => {
                setCurrentYear((prev) => prev - 1);
                setShowResults(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Previous Year
            </button>
          )}
        </div>
        <div>
          {!showResults && selectedDecision ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Confirm Decision
            </button>
          ) : showResults ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              {currentYear < timelineData.length - 1
                ? "Next Year"
                : "Complete Simulation"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Game Instructions */}
      {currentYear === 0 && !selectedDecision && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Multi-Year Strategy Simulation:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Make strategic decisions across 4 years (2024-2027) of
                  changing market conditions
                </li>
                <li>
                  Balance immediate compliance needs with long-term cost
                  optimization
                </li>
                <li>
                  Consider market trends, special events, and their impact on
                  EUA prices
                </li>
                <li>
                  Build and manage your allowance bank for flexibility in
                  volatile markets
                </li>
                <li>
                  Each decision affects your company&apos;s financial position
                  and future options
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
