"use client";

import React, { useState } from "react";
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface AllocationAuctionStrategyProps {
  onComplete?: (score: number) => void;
}

interface StrategicScenario {
  id: number;
  title: string;
  companyProfile: {
    name: string;
    sector: string;
    annualEmissions: number;
    freeAllocation: number;
    budget: number;
  };
  marketContext: {
    currentPrice: number;
    priceOutlook: string;
    volatility: string;
    timeToCompliance: string;
  };
  options: StrategyOption[];
  bestStrategy: string;
  explanation: string;
  riskAnalysis: string;
}

interface StrategyOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  risk: "low" | "medium" | "high";
  timeframe: string;
  pros: string[];
  cons: string[];
}

export default function AllocationAuctionStrategy({
  onComplete,
}: AllocationAuctionStrategyProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedStrategies, setSelectedStrategies] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const scenarios: StrategicScenario[] = [
    {
      id: 1,
      title: "Steel Manufacturer Crisis",
      companyProfile: {
        name: "EuroSteel AG",
        sector: "Steel Manufacturing",
        annualEmissions: 2500000, // tonnes
        freeAllocation: 1800000, // tonnes
        budget: 35000000, // €35M
      },
      marketContext: {
        currentPrice: 85, // €/tonne
        priceOutlook: "Bullish - expected to reach €95-105 by compliance",
        volatility: "High - recent 20% swings due to energy crisis",
        timeToCompliance: "4 months until surrender deadline",
      },
      options: [
        {
          id: "immediate_purchase",
          name: "Immediate Full Purchase",
          description: "Buy all 700,000 tonnes needed at current market price",
          cost: 59500000, // 700k * €85
          risk: "low",
          timeframe: "Immediate",
          pros: ["Guaranteed compliance", "Price certainty", "No timing risk"],
          cons: [
            "High upfront cost",
            "Miss potential savings if prices fall",
            "Large budget impact",
          ],
        },
        {
          id: "gradual_acquisition",
          name: "Gradual Monthly Purchases",
          description: "Buy 175,000 tonnes per month over 4 months",
          cost: 64750000, // Estimated with rising prices
          risk: "medium",
          timeframe: "4 months",
          pros: [
            "Spread price risk",
            "Better cash flow",
            "Some market timing benefit",
          ],
          cons: [
            "Higher average cost likely",
            "Execution risk",
            "Requires active management",
          ],
        },
        {
          id: "forward_contracts",
          name: "Forward Contract Strategy",
          description: "Lock in €92/tonne for delivery in 3 months",
          cost: 64400000, // 700k * €92
          risk: "low",
          timeframe: "3 months",
          pros: [
            "Price certainty",
            "Avoid peak prices",
            "Professional execution",
          ],
          cons: [
            "Premium to current price",
            "Counterparty risk",
            "Less flexibility",
          ],
        },
        {
          id: "options_hedge",
          name: "Options Hedging + Spot",
          description: "Buy call options at €100 strike + purchase 50% spot",
          cost: 62250000, // Complex calculation with premium
          risk: "high",
          timeframe: "2-4 months",
          pros: [
            "Upside protection",
            "Participate in downside",
            "Sophisticated approach",
          ],
          cons: [
            "Complex to execute",
            "Premium cost",
            "Requires derivatives expertise",
          ],
        },
      ],
      bestStrategy: "forward_contracts",
      explanation:
        "Given the bullish outlook and high volatility, forward contracts at €92 provide price certainty below expected peak prices while avoiding execution complexity.",
      riskAnalysis:
        "The €7 premium over current price is justified by avoiding the risk of prices reaching €95-105 and the operational certainty it provides.",
    },
    {
      id: 2,
      title: "Power Company Optimization",
      companyProfile: {
        name: "Nordic Power Solutions",
        sector: "Electricity Generation",
        annualEmissions: 8200000,
        freeAllocation: 3500000,
        budget: 180000000, // €180M
      },
      marketContext: {
        currentPrice: 78,
        priceOutlook:
          "Neutral to bearish - renewable capacity additions may pressure prices",
        volatility:
          "Medium - seasonal patterns but structural oversupply concerns",
        timeToCompliance: "8 months until surrender deadline",
      },
      options: [
        {
          id: "wait_and_see",
          name: "Wait for Lower Prices",
          description: "Delay purchases expecting prices to fall to €65-70",
          cost: 315700000, // 4.7M * €67 (optimistic average)
          risk: "high",
          timeframe: "6-8 months",
          pros: [
            "Potential significant savings",
            "Benefit from oversupply",
            "Maximum cash flow delay",
          ],
          cons: [
            "Price risk if wrong",
            "Compliance deadline pressure",
            "Operational stress",
          ],
        },
        {
          id: "auction_participation",
          name: "Active Auction Bidding",
          description:
            "Participate in monthly auctions targeting 600k tonnes/month",
          cost: 360360000, // 4.7M * €76.67 (slight discount to spot)
          risk: "medium",
          timeframe: "8 months",
          pros: [
            "Transparent pricing",
            "Regular supply",
            "Market-based approach",
          ],
          cons: [
            "Allocation uncertainty",
            "Price volatility",
            "Administrative burden",
          ],
        },
        {
          id: "mixed_approach",
          name: "Secure Base + Market Timing",
          description: "Lock 60% now at €78, trade remaining 40% tactically",
          cost: 368240000, // 2.82M*78 + 1.88M*80 (estimate)
          risk: "medium",
          timeframe: "1-8 months",
          pros: [
            "Balanced risk",
            "Partial price protection",
            "Flexibility retained",
          ],
          cons: [
            "Partial exposure to upside",
            "Still requires trading skill",
            "Complex execution",
          ],
        },
        {
          id: "full_hedge_low",
          name: "Full Immediate Purchase",
          description: "Buy all 4.7M tonnes at current €78 price",
          cost: 366600000, // 4.7M * €78
          risk: "low",
          timeframe: "Immediate",
          pros: ["Complete certainty", "Done deal", "Focus on operations"],
          cons: [
            "Miss savings if bearish view correct",
            "Large immediate outlay",
            "No flexibility",
          ],
        },
      ],
      bestStrategy: "mixed_approach",
      explanation:
        "With bearish outlook but medium volatility, securing 60% provides downside protection while keeping 40% for potential savings if oversupply materializes.",
      riskAnalysis:
        "Balances the risk of being wrong about price direction while ensuring compliance is achievable within budget constraints.",
    },
    {
      id: 3,
      title: "Cement Company Expansion",
      companyProfile: {
        name: "Mediterranean Cement Corp",
        sector: "Cement Manufacturing",
        annualEmissions: 1200000,
        freeAllocation: 720000,
        budget: 25000000, // €25M - tight budget
      },
      marketContext: {
        currentPrice: 88,
        priceOutlook:
          "Uncertain - policy changes and economic slowdown create mixed signals",
        volatility: "Very High - prices swinging €75-95 monthly",
        timeToCompliance: "6 months until surrender deadline",
      },
      options: [
        {
          id: "budget_constrained",
          name: "Phased Purchase Within Budget",
          description:
            "Buy 284k tonnes within €25M budget, reduce emissions for remainder",
          cost: 25000000, // Full budget
          risk: "high",
          timeframe: "6 months",
          pros: [
            "Stays within budget",
            "Operational flexibility",
            "Preserves cash",
          ],
          cons: [
            "Production constraints",
            "Compliance risk",
            "Customer impact",
          ],
        },
        {
          id: "debt_financing",
          name: "Debt-Financed Full Purchase",
          description: "Borrow €17M to buy all 480k tonnes at current prices",
          cost: 42240000, // 480k * €88
          risk: "medium",
          timeframe: "1 month",
          pros: ["Full compliance", "No production limits", "Price certainty"],
          cons: ["Debt burden", "Interest costs", "Financial leverage risk"],
        },
        {
          id: "operational_hedge",
          name: "Emissions Reduction + Strategic Purchase",
          description: "Invest €8M in efficiency, buy 380k tonnes",
          cost: 41440000, // 8M investment + 380k*88
          risk: "medium",
          timeframe: "3-6 months",
          pros: [
            "Long-term cost reduction",
            "Sustainability benefits",
            "Lower carbon exposure",
          ],
          cons: [
            "Implementation risk",
            "Upfront investment",
            "Technical complexity",
          ],
        },
        {
          id: "partnership_deal",
          name: "Supply Partnership Agreement",
          description: "Long-term contract with trading house at €85/tonne",
          cost: 40800000, // 480k * €85
          risk: "low",
          timeframe: "2 months",
          pros: [
            "Price discount",
            "Relationship benefits",
            "Simplified execution",
          ],
          cons: [
            "Long-term commitment",
            "Counterparty dependence",
            "Less flexibility",
          ],
        },
      ],
      bestStrategy: "operational_hedge",
      explanation:
        "With tight budget constraints, combining emissions reduction with strategic purchases provides long-term value while managing immediate compliance needs.",
      riskAnalysis:
        "The efficiency investment pays back over time while reducing future EUA exposure, making it the most sustainable strategy despite execution complexity.",
    },
  ];

  const handleStrategySelection = (strategyId: string) => {
    setSelectedStrategies((prev) => ({
      ...prev,
      [scenarios[currentScenario].id]: strategyId,
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    scenarios.slice(0, currentScenario + 1).forEach((scenario) => {
      if (selectedStrategies[scenario.id] === scenario.bestStrategy) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario((prev) => prev + 1);
      setShowResults(false);
    } else {
      const finalScore = Math.round((score / scenarios.length) * 100);
      onComplete?.(finalScore);
    }
  };

  const currentScenarioData = scenarios[currentScenario];
  const selectedStrategy = selectedStrategies[currentScenarioData.id];
  const selectedOption = currentScenarioData.options.find(
    (opt) => opt.id === selectedStrategy
  );
  const isCorrect = selectedStrategy === currentScenarioData.bestStrategy;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTonnes = (amount: number) => {
    return new Intl.NumberFormat("en-EU").format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
          <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Allocation & Auction Strategy Challenge
          </h2>
          <p className="text-gray-600">
            Make strategic decisions for carbon compliance under budget
            constraints
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Scenario {currentScenario + 1} of {scenarios.length}
          </span>
          <span>
            Score: {score}/{Math.min(currentScenario + 1, scenarios.length)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentScenario + 1) / scenarios.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Scenario Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Company Profile */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Company Profile: {currentScenarioData.companyProfile.name}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-blue-700">Sector:</span>
              <span className="font-medium text-blue-900">
                {currentScenarioData.companyProfile.sector}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Annual Emissions:</span>
              <span className="font-medium text-blue-900">
                {formatTonnes(
                  currentScenarioData.companyProfile.annualEmissions
                )}{" "}
                tonnes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Free Allocation:</span>
              <span className="font-medium text-blue-900">
                {formatTonnes(
                  currentScenarioData.companyProfile.freeAllocation
                )}{" "}
                tonnes
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-blue-700">EUAs Needed:</span>
              <span className="font-bold text-blue-900">
                {formatTonnes(
                  currentScenarioData.companyProfile.annualEmissions -
                    currentScenarioData.companyProfile.freeAllocation
                )}{" "}
                tonnes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Available Budget:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(currentScenarioData.companyProfile.budget)}
              </span>
            </div>
          </div>
        </div>

        {/* Market Context */}
        <div className="bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">
            Market Context
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-orange-700 block">Current EUA Price:</span>
              <span className="font-bold text-2xl text-orange-900">
                €{currentScenarioData.marketContext.currentPrice}/tonne
              </span>
            </div>
            <div>
              <span className="text-orange-700 block">Price Outlook:</span>
              <span className="font-medium text-orange-900">
                {currentScenarioData.marketContext.priceOutlook}
              </span>
            </div>
            <div>
              <span className="text-orange-700 block">Volatility:</span>
              <span className="font-medium text-orange-900">
                {currentScenarioData.marketContext.volatility}
              </span>
            </div>
            <div>
              <span className="text-orange-700 block">Time to Compliance:</span>
              <span className="font-medium text-orange-900">
                {currentScenarioData.marketContext.timeToCompliance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Options */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Strategic Options
        </h3>
        <div className="space-y-4">
          {currentScenarioData.options.map((option) => (
            <div
              key={option.id}
              onClick={() => !showResults && handleStrategySelection(option.id)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedStrategy === option.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${showResults ? "cursor-default" : ""}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {option.name}
                  </h4>
                  <p className="text-gray-700 text-sm mb-2">
                    {option.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      Cost: {formatCurrency(option.cost)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        option.risk === "low"
                          ? "bg-green-100 text-green-800"
                          : option.risk === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {option.risk.toUpperCase()} RISK
                    </span>
                    <span className="text-gray-600">
                      Timeline: {option.timeframe}
                    </span>
                  </div>
                </div>
                {showResults && selectedStrategy === option.id && (
                  <div className="ml-4">
                    {isCorrect ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>

              {selectedStrategy === option.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <h5 className="font-medium text-green-900 mb-2">
                      Advantages:
                    </h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      {option.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-900 mb-2">
                      Disadvantages:
                    </h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      {option.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                <TrophyIcon className="h-6 w-6 text-green-600 mt-0.5" />
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
                    ? "Excellent Strategic Choice!"
                    : "Alternative Strategy Analysis"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    isCorrect ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  Optimal strategy:{" "}
                  <strong>
                    {
                      currentScenarioData.options.find(
                        (opt) => opt.id === currentScenarioData.bestStrategy
                      )?.name
                    }
                  </strong>
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>Strategic Rationale:</strong>{" "}
                  {currentScenarioData.explanation}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Risk Analysis:</strong>{" "}
                  {currentScenarioData.riskAnalysis}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentScenario > 0 && (
            <button
              onClick={() => {
                setCurrentScenario((prev) => prev - 1);
                setShowResults(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Previous Scenario
            </button>
          )}
        </div>
        <div>
          {!showResults && selectedStrategy ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Analyze Strategy
            </button>
          ) : showResults ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {currentScenario < scenarios.length - 1
                ? "Next Scenario"
                : "Complete Challenge"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Instructions */}
      {currentScenario === 0 && !selectedStrategy && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Strategic Decision Challenge:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Analyze each company's unique situation: budget, timeline,
                  risk tolerance
                </li>
                <li>
                  Consider market outlook and volatility when timing purchases
                </li>
                <li>Balance cost optimization with compliance certainty</li>
                <li>
                  Evaluate operational vs. financial strategies for carbon
                  management
                </li>
                <li>Select the most appropriate strategy for each scenario</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
