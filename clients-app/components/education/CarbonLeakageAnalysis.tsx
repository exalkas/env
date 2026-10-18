"use client";

import React, { useState } from "react";
import {
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

interface CarbonLeakageAnalysisProps {
  onComplete?: (score: number) => void;
}

interface ProductionScenario {
  id: number;
  title: string;
  product: string;
  euProduction: ProductionData;
  alternativeCountries: ProductionData[];
  marketFactors: MarketFactor[];
  analysisQuestion: string;
  options: AnalysisOption[];
  correctAnswer: string;
  explanation: string;
  policyImplications: string;
}

interface ProductionData {
  country: string;
  flag: string;
  carbonIntensity: number; // tonnes CO2/tonne product
  laborCost: number; // €/hour
  energyCost: number; // €/MWh
  transportCost: number; // €/tonne to EU
  euaPrice: number; // €/tonne CO2 (0 for non-ETS countries)
  totalCostPerTonne: number;
  environmentalStandards: "high" | "medium" | "low";
}

interface MarketFactor {
  factor: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

interface AnalysisOption {
  id: string;
  conclusion: string;
  reasoning: string;
  leakageRisk: "high" | "medium" | "low";
}

export default function CarbonLeakageAnalysis({
  onComplete,
}: CarbonLeakageAnalysisProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnalyses, setSelectedAnalyses] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const scenarios: ProductionScenario[] = [
    {
      id: 1,
      title: "Steel Production Analysis",
      product: "Carbon Steel",
      euProduction: {
        country: "Germany",
        flag: "🇩🇪",
        carbonIntensity: 2.1,
        laborCost: 35,
        energyCost: 120,
        transportCost: 0,
        euaPrice: 85,
        totalCostPerTonne: 650, // Base + carbon cost
        environmentalStandards: "high",
      },
      alternativeCountries: [
        {
          country: "China",
          flag: "🇨🇳",
          carbonIntensity: 2.8,
          laborCost: 8,
          energyCost: 60,
          transportCost: 45,
          euaPrice: 0,
          totalCostPerTonne: 420,
          environmentalStandards: "medium",
        },
        {
          country: "India",
          flag: "🇮🇳",
          carbonIntensity: 3.2,
          laborCost: 4,
          energyCost: 55,
          transportCost: 50,
          euaPrice: 0,
          totalCostPerTonne: 380,
          environmentalStandards: "low",
        },
        {
          country: "Turkey",
          flag: "🇹🇷",
          carbonIntensity: 2.5,
          laborCost: 12,
          energyCost: 85,
          transportCost: 25,
          euaPrice: 0,
          totalCostPerTonne: 485,
          environmentalStandards: "medium",
        },
      ],
      marketFactors: [
        {
          factor: "EU ETS Carbon Cost",
          description: "German steel faces €178/tonne carbon cost (2.1 × €85)",
          impact: "negative",
        },
        {
          factor: "Quality Standards",
          description: "EU customers prefer high-quality German steel",
          impact: "positive",
        },
        {
          factor: "Transport Emissions",
          description: "Shipping from Asia adds 0.3 tonnes CO2 per tonne steel",
          impact: "negative",
        },
        {
          factor: "Supply Chain Risk",
          description:
            "Asian suppliers have longer lead times and disruption risk",
          impact: "negative",
        },
      ],
      analysisQuestion:
        "What is the primary carbon leakage risk for EU steel production?",
      options: [
        {
          id: "high_leakage",
          conclusion:
            "High leakage risk - EU production will decline significantly",
          reasoning:
            "Cost difference of €230-270/tonne makes imports much cheaper despite transport costs",
          leakageRisk: "high",
        },
        {
          id: "moderate_leakage",
          conclusion:
            "Moderate leakage risk - Some production will shift but quality matters",
          reasoning:
            "While imports are cheaper, quality requirements and supply chain reliability limit leakage",
          leakageRisk: "medium",
        },
        {
          id: "low_leakage",
          conclusion: "Low leakage risk - EU production remains competitive",
          reasoning:
            "Transport costs and quality premiums offset most of the carbon cost disadvantage",
          leakageRisk: "low",
        },
      ],
      correctAnswer: "high_leakage",
      explanation:
        "Steel is a commodity with large cost differences (€230-270/tonne). Transport costs of €25-50 cannot offset this gap, creating high leakage risk.",
      policyImplications:
        "This scenario supports the need for Carbon Border Adjustment Mechanism (CBAM) to protect EU steel industry while maintaining climate ambition.",
    },
    {
      id: 2,
      title: "Cement Manufacturing Comparison",
      product: "Portland Cement",
      euProduction: {
        country: "Italy",
        flag: "🇮🇹",
        carbonIntensity: 0.9,
        laborCost: 28,
        energyCost: 110,
        transportCost: 0,
        euaPrice: 85,
        totalCostPerTonne: 105,
        environmentalStandards: "high",
      },
      alternativeCountries: [
        {
          country: "Morocco",
          flag: "🇲🇦",
          carbonIntensity: 1.1,
          laborCost: 6,
          energyCost: 70,
          transportCost: 35,
          euaPrice: 0,
          totalCostPerTonne: 78,
          environmentalStandards: "medium",
        },
        {
          country: "Egypt",
          flag: "🇪🇬",
          carbonIntensity: 1.2,
          laborCost: 5,
          energyCost: 45,
          transportCost: 40,
          euaPrice: 0,
          totalCostPerTonne: 72,
          environmentalStandards: "low",
        },
        {
          country: "Algeria",
          flag: "🇩🇿",
          carbonIntensity: 1.3,
          laborCost: 7,
          energyCost: 35,
          transportCost: 30,
          euaPrice: 0,
          totalCostPerTonne: 69,
          environmentalStandards: "low",
        },
      ],
      marketFactors: [
        {
          factor: "Transport Weight",
          description:
            "Cement is heavy and expensive to transport long distances",
          impact: "positive",
        },
        {
          factor: "Regional Demand",
          description: "Construction demand is typically local/regional",
          impact: "positive",
        },
        {
          factor: "Quality Specifications",
          description: "Building standards require specific cement qualities",
          impact: "positive",
        },
        {
          factor: "Carbon Cost Impact",
          description: "ETS adds €76/tonne to Italian cement (0.9 × €85)",
          impact: "negative",
        },
      ],
      analysisQuestion:
        "How significant is carbon leakage risk for EU cement production?",
      options: [
        {
          id: "minimal_leakage",
          conclusion:
            "Minimal leakage risk - Local production advantages dominate",
          reasoning:
            "High transport costs and local demand patterns protect EU cement despite carbon costs",
          leakageRisk: "low",
        },
        {
          id: "targeted_leakage",
          conclusion:
            "Targeted leakage risk - Border regions and special applications",
          reasoning:
            "Leakage mainly in coastal areas and specific cement types where transport is viable",
          leakageRisk: "medium",
        },
        {
          id: "significant_leakage",
          conclusion:
            "Significant leakage risk - Cost differential drives imports",
          reasoning:
            "Even with transport costs, North African cement is €27-36/tonne cheaper",
          leakageRisk: "high",
        },
      ],
      correctAnswer: "targeted_leakage",
      explanation:
        "Cement has natural transport barriers, but cost differences of €27-36/tonne create leakage risk in coastal areas and for specialized applications.",
      policyImplications:
        "Selective leakage supports targeted CBAM coverage for cement, focusing on border regions and trade-exposed facilities.",
    },
    {
      id: 3,
      title: "Aluminum Production Economics",
      product: "Primary Aluminum",
      euProduction: {
        country: "Norway",
        flag: "🇳🇴",
        carbonIntensity: 4.2, // Low due to clean hydro power
        laborCost: 45,
        energyCost: 40, // Cheap hydro
        transportCost: 0,
        euaPrice: 85,
        totalCostPerTonne: 1920,
        environmentalStandards: "high",
      },
      alternativeCountries: [
        {
          country: "China",
          flag: "🇨🇳",
          carbonIntensity: 12.8, // High due to coal power
          laborCost: 8,
          energyCost: 60,
          transportCost: 120,
          euaPrice: 0,
          totalCostPerTonne: 1650,
          environmentalStandards: "low",
        },
        {
          country: "Middle East",
          flag: "🇸🇦",
          carbonIntensity: 9.5, // Gas-based power
          laborCost: 15,
          energyCost: 25, // Cheap gas
          transportCost: 85,
          euaPrice: 0,
          totalCostPerTonne: 1580,
          environmentalStandards: "medium",
        },
        {
          country: "Russia",
          flag: "🇷🇺",
          carbonIntensity: 8.9,
          laborCost: 12,
          energyCost: 30,
          transportCost: 95,
          euaPrice: 0,
          totalCostPerTonne: 1620,
          environmentalStandards: "low",
        },
      ],
      marketFactors: [
        {
          factor: "Energy Intensity",
          description:
            "Aluminum production requires massive electricity input (13-15 MWh/tonne)",
          impact: "neutral",
        },
        {
          factor: "Clean Energy Advantage",
          description:
            "Norwegian hydro power gives low carbon intensity advantage",
          impact: "positive",
        },
        {
          factor: "Global Commodity",
          description:
            "Aluminum is a global commodity with standardized pricing",
          impact: "negative",
        },
        {
          factor: "Carbon Cost Burden",
          description: "ETS adds €357/tonne to Norwegian aluminum (4.2 × €85)",
          impact: "negative",
        },
      ],
      analysisQuestion:
        "What makes aluminum unique in carbon leakage analysis?",
      options: [
        {
          id: "paradox_leakage",
          conclusion:
            "Leakage Paradox - Clean production loses to dirty imports",
          reasoning:
            "Norwegian clean aluminum faces carbon costs while Chinese coal-based aluminum does not",
          leakageRisk: "high",
        },
        {
          id: "quality_premium",
          conclusion:
            "Premium Protection - Clean aluminum commands market premium",
          reasoning:
            "Environmental quality of Norwegian aluminum justifies price premium",
          leakageRisk: "low",
        },
        {
          id: "policy_solution",
          conclusion: "Policy Gap - Current system penalizes clean production",
          reasoning:
            "ETS design flaw: clean producers pay more than dirty competitors",
          leakageRisk: "high",
        },
      ],
      correctAnswer: "paradox_leakage",
      explanation:
        'This creates the "green paradox" where clean EU production is penalized by carbon pricing while dirtier imports face no carbon costs, despite being 3x more carbon intensive.',
      policyImplications:
        "Strongest case for CBAM - current system perversely incentivizes higher global emissions by penalizing clean production.",
    },
    {
      id: 4,
      title: "Chemical Industry Trade-offs",
      product: "Petrochemicals",
      euProduction: {
        country: "Netherlands",
        flag: "🇳🇱",
        carbonIntensity: 1.8,
        laborCost: 40,
        energyCost: 100,
        transportCost: 0,
        euaPrice: 85,
        totalCostPerTonne: 890,
        environmentalStandards: "high",
      },
      alternativeCountries: [
        {
          country: "USA",
          flag: "🇺🇸",
          carbonIntensity: 2.1,
          laborCost: 32,
          energyCost: 45, // Cheap shale gas
          transportCost: 65,
          euaPrice: 0,
          totalCostPerTonne: 750,
          environmentalStandards: "high",
        },
        {
          country: "Saudi Arabia",
          flag: "🇸🇦",
          carbonIntensity: 2.5,
          laborCost: 18,
          energyCost: 20, // Very cheap feedstock
          transportCost: 75,
          euaPrice: 0,
          totalCostPerTonne: 680,
          environmentalStandards: "medium",
        },
        {
          country: "Singapore",
          flag: "🇸🇬",
          carbonIntensity: 2.0,
          laborCost: 25,
          energyCost: 80,
          transportCost: 85,
          euaPrice: 0,
          totalCostPerTonne: 795,
          environmentalStandards: "high",
        },
      ],
      marketFactors: [
        {
          factor: "Feedstock Access",
          description: "US shale gas and Saudi oil provide cheap raw materials",
          impact: "negative",
        },
        {
          factor: "Technical Expertise",
          description:
            "Dutch chemical cluster has advanced technology and logistics",
          impact: "positive",
        },
        {
          factor: "Integration Benefits",
          description: "Integrated European chemical value chains reduce costs",
          impact: "positive",
        },
        {
          factor: "Carbon Cost Impact",
          description: "ETS adds €153/tonne to Dutch chemicals (1.8 × €85)",
          impact: "negative",
        },
      ],
      analysisQuestion:
        "What determines chemical industry leakage vulnerability?",
      options: [
        {
          id: "feedstock_driven",
          conclusion: "Feedstock Economics Drive Location Decisions",
          reasoning:
            "Access to cheap gas/oil feedstock outweighs carbon costs in location decisions",
          leakageRisk: "high",
        },
        {
          id: "cluster_protection",
          conclusion: "Industrial Clusters Provide Natural Protection",
          reasoning:
            "Integrated value chains and technical expertise maintain EU competitiveness",
          leakageRisk: "low",
        },
        {
          id: "segment_specific",
          conclusion: "Varies by Product Segment and Market Position",
          reasoning:
            "High-value specialty chemicals less vulnerable than commodity petrochemicals",
          leakageRisk: "medium",
        },
      ],
      correctAnswer: "segment_specific",
      explanation:
        "Chemical industry leakage varies dramatically by product: commodity chemicals face high leakage risk while specialty chemicals benefit from clustering and technical expertise.",
      policyImplications:
        "Requires nuanced CBAM approach - broad coverage but with differentiation based on product complexity and value-add.",
    },
  ];

  const handleAnalysisSelection = (analysisId: string) => {
    setSelectedAnalyses((prev) => ({
      ...prev,
      [scenarios[currentScenario].id]: analysisId,
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    scenarios.slice(0, currentScenario + 1).forEach((scenario) => {
      if (selectedAnalyses[scenario.id] === scenario.correctAnswer) {
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
  const selectedAnalysis = selectedAnalyses[currentScenarioData.id];
  const selectedOption = currentScenarioData.options.find(
    (opt) => opt.id === selectedAnalysis
  );
  const isCorrect = selectedAnalysis === currentScenarioData.correctAnswer;

  const formatCurrency = (amount: number) => {
    return `€${amount}`;
  };

  const getLeakageRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
          <GlobeAltIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Carbon Leakage Analysis Challenge
          </h2>
          <p className="text-gray-600">
            Compare production costs across countries and assess leakage risks
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Analysis {currentScenario + 1} of {scenarios.length}
          </span>
          <span>
            Score: {score}/{Math.min(currentScenario + 1, scenarios.length)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentScenario + 1) / scenarios.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Scenario Title */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {currentScenarioData.title}
        </h3>
        <p className="text-blue-800">
          Analyzing production costs and carbon leakage risk for{" "}
          <strong>{currentScenarioData.product}</strong>
        </p>
      </div>

      {/* Production Cost Comparison */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Production Cost Analysis
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* EU Production */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">
                {currentScenarioData.euProduction.flag}
              </span>
              <div>
                <h5 className="font-bold text-blue-900">
                  {currentScenarioData.euProduction.country}
                </h5>
                <span className="text-xs text-blue-700">EU ETS Covered</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Carbon Intensity:</span>
                <span className="font-medium">
                  {currentScenarioData.euProduction.carbonIntensity} t CO₂/t
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Labor Cost:</span>
                <span className="font-medium">
                  {formatCurrency(currentScenarioData.euProduction.laborCost)}
                  /hr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Energy Cost:</span>
                <span className="font-medium">
                  {formatCurrency(currentScenarioData.euProduction.energyCost)}
                  /MWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Carbon Cost:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(
                    Math.round(
                      currentScenarioData.euProduction.carbonIntensity *
                        currentScenarioData.euProduction.euaPrice
                    )
                  )}
                  /t
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-blue-700 font-bold">Total Cost:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(
                    currentScenarioData.euProduction.totalCostPerTonne
                  )}
                  /t
                </span>
              </div>
            </div>
          </div>

          {/* Alternative Countries */}
          {currentScenarioData.alternativeCountries.map((country, index) => (
            <div key={index} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{country.flag}</span>
                <div>
                  <h5 className="font-bold text-gray-900">{country.country}</h5>
                  <span className="text-xs text-gray-600">
                    No Carbon Pricing
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbon Intensity:</span>
                  <span className="font-medium">
                    {country.carbonIntensity} t CO₂/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Labor Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(country.laborCost)}/hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Energy Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(country.energyCost)}/MWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transport Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(country.transportCost)}/t
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-bold">Total Cost:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(country.totalCostPerTonne)}/t
                  </span>
                </div>
                <div className="text-center">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      country.totalCostPerTonne <
                      currentScenarioData.euProduction.totalCostPerTonne
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {country.totalCostPerTonne <
                    currentScenarioData.euProduction.totalCostPerTonne
                      ? `€${
                          currentScenarioData.euProduction.totalCostPerTonne -
                          country.totalCostPerTonne
                        } cheaper`
                      : `€${
                          country.totalCostPerTonne -
                          currentScenarioData.euProduction.totalCostPerTonne
                        } more expensive`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Factors */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Market Factors
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentScenarioData.marketFactors.map((factor, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                factor.impact === "positive"
                  ? "bg-green-50 border-green-200"
                  : factor.impact === "negative"
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded ${
                    factor.impact === "positive"
                      ? "bg-green-100 text-green-600"
                      : factor.impact === "negative"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {factor.impact === "positive"
                    ? "+"
                    : factor.impact === "negative"
                    ? "-"
                    : "~"}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    {factor.factor}
                  </h5>
                  <p className="text-sm text-gray-700">{factor.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Question */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {currentScenarioData.analysisQuestion}
        </h4>
        <div className="space-y-3">
          {currentScenarioData.options.map((option) => (
            <div
              key={option.id}
              onClick={() => !showResults && handleAnalysisSelection(option.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAnalysis === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${showResults ? "cursor-default" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    {option.conclusion}
                  </h5>
                  <p className="text-gray-700 text-sm mb-3">
                    {option.reasoning}
                  </p>
                  <div
                    className={`text-xs px-3 py-1 rounded border inline-block ${getLeakageRiskColor(
                      option.leakageRisk
                    )}`}
                  >
                    {option.leakageRisk.toUpperCase()} LEAKAGE RISK
                  </div>
                </div>
                {showResults && selectedAnalysis === option.id && (
                  <div className="ml-4">
                    {isCorrect ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>
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
                <ScaleIcon className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    isCorrect ? "text-green-900" : "text-yellow-900"
                  }`}
                >
                  {isCorrect ? "Accurate Analysis!" : "Alternative Perspective"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    isCorrect ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  Correct assessment:{" "}
                  <strong>
                    {
                      currentScenarioData.options.find(
                        (opt) => opt.id === currentScenarioData.correctAnswer
                      )?.conclusion
                    }
                  </strong>
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>Analysis:</strong> {currentScenarioData.explanation}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Policy Implications:</strong>{" "}
                  {currentScenarioData.policyImplications}
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
              Previous Analysis
            </button>
          )}
        </div>
        <div>
          {!showResults && selectedAnalysis ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Submit Analysis
            </button>
          ) : showResults ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {currentScenario < scenarios.length - 1
                ? "Next Analysis"
                : "Complete Challenge"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Instructions */}
      {currentScenario === 0 && !selectedAnalysis && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Carbon Leakage Analysis Guide:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Compare production costs between EU and alternative countries
                </li>
                <li>
                  Consider carbon intensity differences and their climate impact
                </li>
                <li>
                  Evaluate market factors like transport costs, quality
                  requirements, and supply chains
                </li>
                <li>
                  Assess overall leakage risk: high (significant production
                  shifts), medium (selective leakage), low (protected by other
                  factors)
                </li>
                <li>
                  Consider policy implications for Carbon Border Adjustment
                  Mechanism (CBAM)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
