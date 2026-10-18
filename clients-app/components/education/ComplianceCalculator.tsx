"use client";

import React, { useState, useEffect } from "react";
import {
  CalculatorIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface ComplianceCalculatorProps {
  onComplete?: (score: number) => void;
}

interface ComplianceScenario {
  id: number;
  title: string;
  description: string;
  companyEmissions: number;
  allocatedEUAs: number;
  penaltyRate: number; // €100 per tonne
}

export default function ComplianceCalculator({
  onComplete,
}: ComplianceCalculatorProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);

  // Compliance scenarios based on existing question bank data
  const scenarios: ComplianceScenario[] = [
    {
      id: 1,
      title: "Basic Penalty Calculation",
      description:
        "A steel company emitted 12,000 tonnes of CO2 but only has 11,900 EUAs.",
      companyEmissions: 12000,
      allocatedEUAs: 11900,
      penaltyRate: 100,
    },
    {
      id: 2,
      title: "Power Plant Compliance",
      description:
        "A power plant emitted 50,000 tonnes of CO2 and has 49,750 EUAs available.",
      companyEmissions: 50000,
      allocatedEUAs: 49750,
      penaltyRate: 100,
    },
    {
      id: 3,
      title: "Manufacturing Facility",
      description:
        "A cement plant emitted 8,500 tonnes of CO2 with 8,200 EUAs in their account.",
      companyEmissions: 8500,
      allocatedEUAs: 8200,
      penaltyRate: 100,
    },
  ];

  const calculateCorrectPenalty = (scenario: ComplianceScenario): number => {
    const shortage = Math.max(
      0,
      scenario.companyEmissions - scenario.allocatedEUAs
    );
    return shortage * scenario.penaltyRate;
  };

  const handleSubmit = () => {
    const scenario = scenarios[currentScenario];
    const correctPenalty = calculateCorrectPenalty(scenario);
    const userAnswerNum = parseInt(userAnswer.replace(/[€,\s]/g, ""));

    const isCorrect = Math.abs(userAnswerNum - correctPenalty) < 50; // Allow small margin

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setCompletedScenarios((prev) => [...prev, scenario.id]);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario((prev) => prev + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      // Calculate final score as percentage
      const finalScore = Math.round((score / scenarios.length) * 100);
      onComplete?.(finalScore);
    }
  };

  const currentScenarioData = scenarios[currentScenario];
  const shortage = Math.max(
    0,
    currentScenarioData.companyEmissions - currentScenarioData.allocatedEUAs
  );
  const correctPenalty = calculateCorrectPenalty(currentScenarioData);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
          <CalculatorIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            EU ETS Compliance Calculator
          </h2>
          <p className="text-gray-600">
            Calculate penalties for non-compliance scenarios
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
            Score: {score}/{scenarios.length}
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

      {/* Scenario Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {currentScenarioData.title}
        </h3>
        <p className="text-gray-700 mb-4">{currentScenarioData.description}</p>

        {/* Compliance Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Company Emissions</div>
            <div className="text-xl font-bold text-gray-900">
              {currentScenarioData.companyEmissions.toLocaleString()} tonnes CO₂
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Available EUAs</div>
            <div className="text-xl font-bold text-gray-900">
              {currentScenarioData.allocatedEUAs.toLocaleString()} EUAs
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Penalty Rate</div>
            <div className="text-xl font-bold text-gray-900">
              €{currentScenarioData.penaltyRate}/tonne
            </div>
          </div>
        </div>

        {/* Calculation Steps */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Calculation Steps:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>
              Calculate shortage:{" "}
              {currentScenarioData.companyEmissions.toLocaleString()} -{" "}
              {currentScenarioData.allocatedEUAs.toLocaleString()} ={" "}
              {shortage.toLocaleString()} tonnes
            </li>
            <li>
              Calculate penalty: {shortage.toLocaleString()} × €
              {currentScenarioData.penaltyRate} = ?
            </li>
            <li>
              Additional requirement: Must purchase {shortage.toLocaleString()}{" "}
              EUAs for next year
            </li>
          </ol>
        </div>
      </div>

      {/* Answer Input */}
      {!showResult && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What is the total penalty amount? (Enter amount in euros)
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter penalty amount"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Calculate
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="mb-6">
          <div
            className={`p-4 rounded-lg ${
              completedScenarios.includes(currentScenarioData.id)
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {completedScenarios.includes(currentScenarioData.id) ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    completedScenarios.includes(currentScenarioData.id)
                      ? "text-green-900"
                      : "text-red-900"
                  }`}
                >
                  {completedScenarios.includes(currentScenarioData.id)
                    ? "Correct!"
                    : "Not quite right"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    completedScenarios.includes(currentScenarioData.id)
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  The correct penalty is{" "}
                  <strong>€{correctPenalty.toLocaleString()}</strong>
                </p>
                {!completedScenarios.includes(currentScenarioData.id) && (
                  <p className="text-sm text-red-700 mt-2">
                    Remember: Penalty = Shortage × €100 per tonne
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Learning Points */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">
              Key Compliance Points:
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>
                Companies must surrender EUAs equal to their verified emissions
              </li>
              <li>
                Penalty for non-compliance: €100 per tonne of excess emissions
              </li>
              <li>Must still purchase required EUAs for the following year</li>
              <li>Penalties are adjusted annually for inflation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentScenario > 0 && (
            <button
              onClick={() => {
                setCurrentScenario((prev) => prev - 1);
                setUserAnswer("");
                setShowResult(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Previous
            </button>
          )}
        </div>
        <div>
          {showResult && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {currentScenario < scenarios.length - 1
                ? "Next Scenario"
                : "Complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
