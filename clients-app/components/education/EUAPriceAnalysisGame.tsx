"use client";

import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface EUAPriceAnalysisGameProps {
  onComplete?: (score: number) => void;
}

interface MarketScenario {
  id: number;
  title: string;
  timeframe: string;
  factors: MarketFactor[];
  correctPrediction: "bullish" | "bearish" | "neutral";
  explanation: string;
  historicalContext: string;
}

interface MarketFactor {
  category: "weather" | "policy" | "economic" | "supply" | "demand";
  description: string;
  impact: "positive" | "negative" | "neutral";
  strength: "weak" | "moderate" | "strong";
  icon: string;
}

export default function EUAPriceAnalysisGame({
  onComplete,
}: EUAPriceAnalysisGameProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userPredictions, setUserPredictions] = useState<
    Record<number, "bullish" | "bearish" | "neutral">
  >({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 1.5 minutes per scenario
  const [score, setScore] = useState(0);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Market scenarios with realistic complexity
  const scenarios: MarketScenario[] = [
    {
      id: 1,
      title: "Winter Energy Crisis Scenario",
      timeframe: "December 2024 - February 2025",
      factors: [
        {
          category: "weather",
          description:
            "Exceptionally cold winter across Europe, temperatures 15% below normal",
          impact: "positive",
          strength: "strong",
          icon: "❄️",
        },
        {
          category: "supply",
          description:
            "Three major nuclear plants offline for maintenance in France",
          impact: "positive",
          strength: "strong",
          icon: "⚡",
        },
        {
          category: "economic",
          description:
            "Natural gas prices spike 40% due to geopolitical tensions",
          impact: "positive",
          strength: "strong",
          icon: "⛽",
        },
        {
          category: "policy",
          description: "EU announces emergency coal plant approvals for winter",
          impact: "negative",
          strength: "weak",
          icon: "🏛️",
        },
      ],
      correctPrediction: "bullish",
      explanation:
        "Strong bullish factors (cold weather + nuclear outages + gas crisis) outweigh weak bearish policy factor. High heating demand drives power generation and EUA demand.",
      historicalContext:
        "Similar conditions in Winter 2022 saw EUA prices rise from €80 to €95 within 6 weeks.",
    },
    {
      id: 2,
      title: "Green Deal Policy Implementation",
      timeframe: "September 2025 - March 2026",
      factors: [
        {
          category: "policy",
          description:
            "EU implements stricter 2030 cap reduction (4.5% annually vs 2.2%)",
          impact: "positive",
          strength: "strong",
          icon: "📜",
        },
        {
          category: "policy",
          description: "Maritime and buildings sectors added to EU ETS",
          impact: "positive",
          strength: "moderate",
          icon: "🚢",
        },
        {
          category: "economic",
          description: "Economic recession reduces industrial production by 8%",
          impact: "negative",
          strength: "moderate",
          icon: "📉",
        },
        {
          category: "supply",
          description:
            "Banking from previous years provides 200M surplus allowances",
          impact: "negative",
          strength: "weak",
          icon: "🏦",
        },
      ],
      correctPrediction: "bullish",
      explanation:
        "Structural policy changes (tighter cap + sector expansion) create long-term bullish pressure that outweighs cyclical economic downturn.",
      historicalContext:
        "Market Structure Reforms like MSR introduction historically drove multi-year bull markets despite short-term volatility.",
    },
    {
      id: 3,
      title: "Renewable Energy Transition Acceleration",
      timeframe: "January 2026 - December 2026",
      factors: [
        {
          category: "supply",
          description:
            "Record renewable capacity additions: 180 GW solar + wind installed",
          impact: "negative",
          strength: "strong",
          icon: "🌞",
        },
        {
          category: "demand",
          description:
            "Industrial demand drops as companies relocate to avoid carbon costs",
          impact: "negative",
          strength: "moderate",
          icon: "🏭",
        },
        {
          category: "economic",
          description:
            "Energy storage breakthrough makes renewables baseload viable",
          impact: "negative",
          strength: "moderate",
          icon: "🔋",
        },
        {
          category: "policy",
          description:
            "MSR (Market Stability Reserve) intake increases to 24% due to surplus",
          impact: "positive",
          strength: "moderate",
          icon: "⚖️",
        },
      ],
      correctPrediction: "bearish",
      explanation:
        "Massive renewable deployment and demand destruction from carbon leakage overwhelm MSR support. Structural oversupply emerges.",
      historicalContext:
        "Phase 3 renewable boom (2008-2012) crashed EUA prices from €30 to €3 despite policy interventions.",
    },
    {
      id: 4,
      title: "Global Carbon Market Integration",
      timeframe: "June 2027 - December 2027",
      factors: [
        {
          category: "policy",
          description:
            "Article 6 linking allows California and Quebec credits into EU ETS",
          impact: "negative",
          strength: "moderate",
          icon: "🌍",
        },
        {
          category: "demand",
          description:
            "Voluntary corporate demand surge: 500M tonnes additional purchases",
          impact: "positive",
          strength: "strong",
          icon: "🏢",
        },
        {
          category: "economic",
          description:
            "EU economy growing 3.2% annually, manufacturing renaissance",
          impact: "positive",
          strength: "moderate",
          icon: "📈",
        },
        {
          category: "supply",
          description:
            "Aviation allocation reduced by 50% due to efficiency gains",
          impact: "neutral",
          strength: "weak",
          icon: "✈️",
        },
      ],
      correctPrediction: "neutral",
      explanation:
        "Supply increase from linking roughly balances demand increase from voluntary markets and economic growth. Price volatility but no clear trend.",
      historicalContext:
        "Complex multi-factor scenarios often result in sideways price action with higher volatility, like 2019-2021 period.",
    },
    {
      id: 5,
      title: "Climate Emergency Response",
      timeframe: "March 2028 - September 2028",
      factors: [
        {
          category: "weather",
          description:
            "Extreme heat waves cause record power demand and coal plant restarts",
          impact: "positive",
          strength: "strong",
          icon: "🔥",
        },
        {
          category: "policy",
          description:
            "Emergency climate measures: immediate 50% cap reduction announced",
          impact: "positive",
          strength: "strong",
          icon: "🚨",
        },
        {
          category: "demand",
          description:
            "AI data centers drive 30% increase in electricity consumption",
          impact: "positive",
          strength: "moderate",
          icon: "🤖",
        },
        {
          category: "economic",
          description:
            "Green investment boom creates manufacturing shortage of clean tech",
          impact: "positive",
          strength: "moderate",
          icon: "💚",
        },
      ],
      correctPrediction: "bullish",
      explanation:
        "Perfect storm of demand increases (heat, AI, manufacturing) plus aggressive policy response creates extreme bullish conditions.",
      historicalContext:
        "Crisis-driven policy responses historically create the strongest bull markets, like post-COVID green recovery driving EUAs from €25 to €100.",
    },
  ];

  // Timer effect
  useEffect(() => {
    if (analysisStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeLeft, analysisStarted, showResults]);

  const handlePrediction = (prediction: "bullish" | "bearish" | "neutral") => {
    setUserPredictions((prev) => ({
      ...prev,
      [scenarios[currentScenario].id]: prediction,
    }));
  };

  const handleSubmit = () => {
    if (!analysisStarted) {
      setAnalysisStarted(true);
      setTimeLeft(90);
      return;
    }

    let correctCount = 0;
    scenarios.slice(0, currentScenario + 1).forEach((scenario) => {
      if (userPredictions[scenario.id] === scenario.correctPrediction) {
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
      setTimeLeft(90);
    } else {
      // Game complete
      const finalScore = Math.round((score / scenarios.length) * 100);
      onComplete?.(finalScore);
    }
  };

  const currentScenarioData = scenarios[currentScenario];
  const hasUserPrediction = userPredictions[currentScenarioData.id];
  const isCorrect =
    userPredictions[currentScenarioData.id] ===
    currentScenarioData.correctPrediction;

  const getFactorColor = (impact: string, strength: string) => {
    const baseColor =
      impact === "positive" ? "green" : impact === "negative" ? "red" : "gray";
    const intensity =
      strength === "strong" ? "600" : strength === "moderate" ? "500" : "400";
    return `bg-${baseColor}-50 border-${baseColor}-${intensity} text-${baseColor}-800`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
          <ChartBarIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            EUA Price Analysis Challenge
          </h2>
          <p className="text-gray-600">
            Analyze complex market scenarios and predict price movements
          </p>
        </div>
      </div>

      {/* Progress & Timer */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
          <span>
            Scenario {currentScenario + 1} of {scenarios.length}
          </span>
          <div className="flex items-center gap-4">
            <span>
              Score: {score}/{Math.min(currentScenario + 1, scenarios.length)}
            </span>
            {analysisStarted && (
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span
                  className={
                    timeLeft < 20 ? "text-red-600 font-bold" : "text-gray-600"
                  }
                >
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentScenario + 1) / scenarios.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {currentScenarioData.title}
            </h3>
            <p className="text-sm text-gray-600">
              {currentScenarioData.timeframe}
            </p>
          </div>
          {!analysisStarted && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Analysis Time</div>
              <div className="text-lg font-bold text-purple-600">1:30</div>
            </div>
          )}
        </div>

        {/* Market Factors */}
        <h4 className="font-medium text-gray-900 mb-3">Market Intelligence</h4>
        <div className="space-y-3 mb-6">
          {currentScenarioData.factors.map((factor, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getFactorColor(
                factor.impact,
                factor.strength
              )}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{factor.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {factor.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {factor.impact === "positive" ? (
                        <ArrowUpIcon className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs font-medium">
                        {factor.strength.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm">{factor.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prediction Interface */}
        {analysisStarted && !showResults && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Your Price Prediction:
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: "bearish",
                  label: "Bearish 📉",
                  color: "red",
                },
                {
                  key: "neutral",
                  label: "Neutral ➡️",
                  color: "gray",
                },
                {
                  key: "bullish",
                  label: "Bullish 📈",
                  color: "green",
                },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handlePrediction(option.key as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    hasUserPrediction === option.key
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="border-t pt-4">
            <div
              className={`p-4 rounded-lg mb-4 ${
                isCorrect
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      isCorrect ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {isCorrect ? "Correct Analysis!" : "Different Perspective"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      isCorrect ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    Correct prediction:{" "}
                    <strong>
                      {currentScenarioData.correctPrediction.toUpperCase()}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Analysis:</strong> {currentScenarioData.explanation}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Historical Context:</strong>{" "}
                    {currentScenarioData.historicalContext}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          {currentScenario > 0 && !showResults && (
            <button
              onClick={() => {
                setCurrentScenario((prev) => prev - 1);
                setShowResults(false);
                setTimeLeft(90);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Previous Scenario
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {!analysisStarted && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Start Analysis
            </button>
          )}
          {analysisStarted && !showResults && hasUserPrediction && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Submit Prediction
            </button>
          )}
          {showResults && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              {currentScenario < scenarios.length - 1
                ? "Next Scenario"
                : "Complete Challenge"}
            </button>
          )}
        </div>
      </div>

      {/* Game Instructions */}
      {!analysisStarted && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">How to Play:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Analyze all market factors carefully - consider impact
                  strength and direction
                </li>
                <li>
                  You have 1.5 minutes per scenario to make your prediction
                </li>
                <li>
                  Factor categories: Weather, Policy, Economic, Supply, Demand
                </li>
                <li>
                  Consider both short-term volatility and structural changes
                </li>
                <li>
                  Historical context will be provided after each prediction
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
