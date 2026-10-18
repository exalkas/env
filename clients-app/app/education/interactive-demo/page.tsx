"use client";

import React, { useState } from "react";
import {
  ComplianceCalculator,
  ParticipantMatchingGame,
  EUAPriceAnalysisGame,
  AllocationAuctionStrategy,
  TradingTimelineSimulation,
  CarbonLeakageAnalysis,
  InteractiveLessonWrapper,
} from "@/components/education";
import {
  CalculatorIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

type DemoType =
  | "calculator"
  | "matching"
  | "price-analysis"
  | "allocation-strategy"
  | "timeline-simulation"
  | "leakage-analysis"
  | "wrapper"
  | null;

export default function InteractiveDemo() {
  const [activeDemo, setActiveDemo] = useState<DemoType>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleScore = (component: string, score: number) => {
    setScores((prev) => ({ ...prev, [component]: score }));
  };

  // Interactive component configurations
  const demoComponents = [
    {
      id: "calculator",
      title: "Compliance Calculator",
      module: "Module 4: Compliance",
      icon: <CalculatorIcon className="h-6 w-6 text-blue-600" />,
      iconBg: "bg-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      description:
        "Interactive calculator for EU ETS penalty scenarios. Solve real-world compliance problems and learn penalty calculations.",
      features: [
        "3 realistic penalty scenarios",
        "Step-by-step calculation guidance",
        "Instant feedback and explanations",
        "Score tracking and progress",
      ],
    },
    {
      id: "matching",
      title: "Participant Matching Game",
      module: "Module 1: Introduction",
      icon: <UserGroupIcon className="h-6 w-6 text-green-600" />,
      iconBg: "bg-green-100",
      buttonColor: "bg-green-600 hover:bg-green-700",
      description:
        "Drag-and-drop game to match market participants with their roles. Visual learning for understanding market structure.",
      features: [
        "8 participant types to match",
        "4 primary roles in carbon markets",
        "Color-coded categories",
        "Detailed explanations after completion",
      ],
    },
    {
      id: "price-analysis",
      title: "EUA Price Analysis Challenge",
      module: "Module 3: Market Mechanisms",
      icon: <ChartBarIcon className="h-6 w-6 text-purple-600" />,
      iconBg: "bg-purple-100",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      description:
        "Analyze complex market scenarios and predict EUA price movements. Multi-factor analysis with time pressure.",
      features: [
        "5 complex market scenarios",
        "Real-time analysis with timer",
        "Market factors evaluation",
        "Historical context explanations",
      ],
    },
    {
      id: "allocation-strategy",
      title: "Allocation & Auction Strategy",
      module: "Module 2: Allocation",
      icon: <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />,
      iconBg: "bg-emerald-100",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      description:
        "Make strategic decisions for carbon compliance under budget constraints. Analyze company profiles and market conditions.",
      features: [
        "3 company scenarios with budgets",
        "Strategic option evaluation",
        "Risk assessment framework",
        "Cost-benefit analysis training",
      ],
    },
    {
      id: "timeline-simulation",
      title: "Trading Timeline Simulation",
      module: "Module 5: Trading & Compliance",
      icon: <CalendarIcon className="h-6 w-6 text-indigo-600" />,
      iconBg: "bg-indigo-100",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      description:
        "Manage multi-year compliance decisions in changing market conditions. Build and manage allowance banks strategically.",
      features: [
        "4-year timeline simulation",
        "Market trend analysis",
        "Allowance banking strategy",
        "Long-term planning skills",
      ],
    },
    {
      id: "leakage-analysis",
      title: "Carbon Leakage Analysis",
      module: "Module 6: Policy & Impact",
      icon: <GlobeAltIcon className="h-6 w-6 text-sky-600" />,
      iconBg: "bg-sky-100",
      buttonColor: "bg-sky-600 hover:bg-sky-700",
      description:
        "Compare production costs across countries and assess carbon leakage risks. Understand global trade implications.",
      features: [
        "4 industry comparison analyses",
        "International cost comparisons",
        "Policy implications assessment",
        "CBAM understanding development",
      ],
    },
  ];

  // Sample lesson data for the wrapper demo
  const sampleLessons = {
    compliance: {
      id: 1,
      module_id: 4,
      title: "EU ETS Compliance and Penalties",
      content: `
        <h3>Understanding Compliance in the EU ETS</h3>
        <p>The EU Emissions Trading System requires companies to surrender allowances equal to their verified emissions each year. 
        Failure to comply results in financial penalties and additional obligations.</p>
        
        <h4>Key Compliance Requirements:</h4>
        <ul>
          <li><strong>Annual Surrendering:</strong> Companies must surrender EUAs by April 30th each year</li>
          <li><strong>Verification:</strong> Emissions must be verified by accredited bodies</li>
          <li><strong>Reporting:</strong> Annual emissions reports are mandatory</li>
          <li><strong>Registry Accounts:</strong> All transactions must be recorded</li>
        </ul>

        <h4>Non-Compliance Penalties:</h4>
        <p>When companies fail to surrender sufficient allowances, they face:</p>
        <ul>
          <li><strong>Financial Penalty:</strong> €100 per tonne of excess emissions</li>
          <li><strong>Additional Obligation:</strong> Must still purchase and surrender the required allowances</li>
          <li><strong>Name and Shame:</strong> Non-compliant companies are publicly listed</li>
          <li><strong>Future Restrictions:</strong> May face additional scrutiny in future periods</li>
        </ul>

        <p>The penalty system ensures environmental integrity while providing strong incentives for compliance.</p>
      `,
      lesson_type: "interactive" as const,
      duration_minutes: 25,
    },
    priceAnalysis: {
      id: 3,
      module_id: 3,
      title: "Market Price Analysis and Volatility",
      content: `
        <h3>Understanding EUA Price Dynamics</h3>
        <p>EUA prices are influenced by multiple market factors including weather, policy changes, economic conditions, and supply/demand balances. 
        Learning to analyze these factors is crucial for effective carbon market participation.</p>
        
        <h4>Key Price Drivers:</h4>
        <ul>
          <li><strong>Weather Conditions:</strong> Cold winters increase heating demand and power generation</li>
          <li><strong>Policy Changes:</strong> New regulations, cap adjustments, and MSR mechanics</li>
          <li><strong>Economic Activity:</strong> Industrial production levels affect demand</li>
          <li><strong>Energy Markets:</strong> Gas and coal prices influence power sector demand</li>
          <li><strong>Renewable Deployment:</strong> Clean energy reduces fossil fuel generation</li>
        </ul>

        <p>Successful market analysis requires understanding how these factors interact and their relative impact on price movements.</p>
      `,
      lesson_type: "interactive" as const,
      duration_minutes: 30,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/education"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Interactive Learning Components Demo
              </h1>
              <p className="text-gray-600 mt-2">
                Explore all six interactive learning experiences for Carbon
                Markets 101
              </p>
            </div>
          </div>
        </div>

        {!activeDemo && (
          <>
            {/* Component Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {demoComponents.map((component) => (
                <div
                  key={component.id}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 ${component.iconBg} rounded-lg`}
                    >
                      {component.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {component.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {component.module}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{component.description}</p>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Features:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {component.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  {scores[component.id] && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Last Score: {scores[component.id]}%
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setActiveDemo(component.id as DemoType)}
                    className={`w-full px-4 py-2 ${component.buttonColor} text-white rounded-lg font-medium`}
                  >
                    Try {component.title}
                  </button>
                </div>
              ))}
            </div>

            {/* Lesson Integration Demo */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interactive Lesson Integration
                  </h3>
                  <p className="text-sm text-gray-600">
                    Full lesson experience with auto-detection
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                See how interactive components are automatically integrated into
                regular lessons based on content analysis. The system detects
                lesson content and shows the appropriate interactive exercise.
              </p>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Auto-Detection Features:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Smart content analysis for component selection</li>
                  <li>• Seamless integration with lesson flow</li>
                  <li>• Progress tracking and score integration</li>
                  <li>
                    • Fallback to regular text for non-interactive lessons
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setActiveDemo("wrapper")}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Demo Lesson Integration
              </button>
            </div>
          </>
        )}

        {/* Active Demo Display */}
        {activeDemo && activeDemo !== "wrapper" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {demoComponents.find((c) => c.id === activeDemo)?.title} Demo
                </h2>
                <button
                  onClick={() => setActiveDemo(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Back to Overview
                </button>
              </div>
            </div>
            <div className="p-0">
              {activeDemo === "calculator" && (
                <ComplianceCalculator
                  onComplete={(score) => handleScore("calculator", score)}
                />
              )}
              {activeDemo === "matching" && (
                <ParticipantMatchingGame
                  onComplete={(score) => handleScore("matching", score)}
                />
              )}
              {activeDemo === "price-analysis" && (
                <EUAPriceAnalysisGame
                  onComplete={(score) => handleScore("price-analysis", score)}
                />
              )}
              {activeDemo === "allocation-strategy" && (
                <AllocationAuctionStrategy
                  onComplete={(score) =>
                    handleScore("allocation-strategy", score)
                  }
                />
              )}
              {activeDemo === "timeline-simulation" && (
                <TradingTimelineSimulation
                  onComplete={(score) =>
                    handleScore("timeline-simulation", score)
                  }
                />
              )}
              {activeDemo === "leakage-analysis" && (
                <CarbonLeakageAnalysis
                  onComplete={(score) => handleScore("leakage-analysis", score)}
                />
              )}
            </div>
          </div>
        )}

        {/* Lesson Wrapper Demo */}
        {activeDemo === "wrapper" && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-900">
                  Interactive Lesson Integration Demo
                </h2>
                <button
                  onClick={() => setActiveDemo(null)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Overview
                </button>
              </div>
              <p className="text-blue-800 mt-2">
                Try different lesson types to see how the system automatically
                detects and loads appropriate interactive components.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <InteractiveLessonWrapper
                  lesson={sampleLessons.compliance}
                  onComplete={(score) =>
                    handleScore("wrapper-compliance", score)
                  }
                />
              </div>
              <div>
                <InteractiveLessonWrapper
                  lesson={sampleLessons.priceAnalysis}
                  onComplete={(score) => handleScore("wrapper-price", score)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
