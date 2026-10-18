"use client";

import React, { useState, useEffect } from "react";
import {
  CalculatorIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { submitInteractiveResponse } from "@/lib/api";

interface EnhancedComplianceCalculatorProps {
  scenarios: InteractiveScenario[];
  onComplete?: (score: number) => void;
  onScenarioComplete?: (scenarioId: number, response: any) => void;
}

interface InteractiveScenario {
  id: number;
  title: string;
  description: string;
  scenario_data: {
    company_type?: string;
    emissions?: number;
    allowances_held?: number;
    eua_price?: number;
    penalty_rate?: number;
  };
  optimal_choice?: string;
  explanation?: string;
  points_possible: number;
  is_active: boolean;
}

interface ScenarioResult {
  scenarioId: number;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  pointsEarned: number;
  timeTaken: number;
}

export default function EnhancedComplianceCalculator({
  scenarios,
  onComplete,
  onScenarioComplete,
}: EnhancedComplianceCalculatorProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);

  // Filter active scenarios
  const activeScenarios = scenarios.filter((s) => s.is_active);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentScenarioIndex]);

  if (activeScenarios.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border">
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No Scenarios Available
          </h3>
          <p className="mt-1 text-gray-500">
            No active compliance calculation scenarios are currently configured.
          </p>
        </div>
      </div>
    );
  }

  const currentScenario = activeScenarios[currentScenarioIndex];
  const scenarioData = currentScenario.scenario_data;

  const calculateCorrectPenalty = (scenario: InteractiveScenario): number => {
    const emissions = scenarioData.emissions || 0;
    const allowances = scenarioData.allowances_held || 0;
    const penaltyRate = scenarioData.penalty_rate || 100; // Default €100/tonne

    const shortage = Math.max(0, emissions - allowances);
    return shortage * penaltyRate;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const correctPenalty = calculateCorrectPenalty(currentScenario);
    const userAnswerNum = parseInt(userAnswer.replace(/[€,\s]/g, ""));
    const timeTaken = Date.now() - startTime;

    // Allow 5% margin of error for correct answer
    const marginOfError = correctPenalty * 0.05;
    const isCorrect = Math.abs(userAnswerNum - correctPenalty) <= marginOfError;

    const pointsEarned = isCorrect ? currentScenario.points_possible : 0;

    const result: ScenarioResult = {
      scenarioId: currentScenario.id,
      userAnswer: userAnswerNum,
      correctAnswer: correctPenalty,
      isCorrect,
      pointsEarned,
      timeTaken,
    };

    setResults((prev) => [...prev, result]);

    // Submit response to backend
    try {
      await submitInteractiveResponse(currentScenario.id, {
        user_answer: userAnswerNum,
        correct_answer: correctPenalty,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken_ms: timeTaken,
      });

      onScenarioComplete?.(currentScenario.id, result);
    } catch (error) {
      console.error("Failed to submit scenario response:", error);
    }

    setShowResult(true);
    setLoading(false);
  };

  const handleNext = () => {
    if (currentScenarioIndex < activeScenarios.length - 1) {
      setCurrentScenarioIndex((prev) => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setShowExplanation(false);
    } else {
      // Calculate final score
      const totalPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0);
      const maxPoints = activeScenarios.reduce(
        (sum, s) => sum + s.points_possible,
        0
      );
      const finalScore =
        maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      onComplete?.(finalScore);
    }
  };

  const shortage = Math.max(
    0,
    (scenarioData.emissions || 0) - (scenarioData.allowances_held || 0)
  );
  const correctPenalty = calculateCorrectPenalty(currentScenario);
  const currentResult = results.find(
    (r) => r.scenarioId === currentScenario.id
  );

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
            Calculate penalties for carbon emissions non-compliance
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Scenario {currentScenarioIndex + 1} of {activeScenarios.length}
          </span>
          <span>
            Points: {results.reduce((sum, r) => sum + r.pointsEarned, 0)} /{" "}
            {activeScenarios.reduce((sum, s) => sum + s.points_possible, 0)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((currentScenarioIndex + 1) / activeScenarios.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Scenario Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentScenario.title}
            </h3>
            <div className="text-sm text-blue-600 font-medium">
              {currentScenario.points_possible} points
            </div>
          </div>
          {scenarioData.company_type && (
            <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-600">
              {scenarioData.company_type}
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-4">{currentScenario.description}</p>

        {/* Compliance Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Emissions</div>
            <div className="text-xl font-bold text-gray-900">
              {(scenarioData.emissions || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">tonnes CO₂</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">EUAs Held</div>
            <div className="text-xl font-bold text-gray-900">
              {(scenarioData.allowances_held || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">allowances</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Shortage</div>
            <div
              className={`text-xl font-bold ${
                shortage > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {shortage.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">tonnes</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Penalty Rate</div>
            <div className="text-xl font-bold text-gray-900">
              €{scenarioData.penalty_rate || 100}
            </div>
            <div className="text-xs text-gray-500">per tonne</div>
          </div>
        </div>

        {/* Calculation Hint */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Calculation Formula:
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>
                  Shortage = Emissions - EUAs Held ={" "}
                  {(scenarioData.emissions || 0).toLocaleString()} -{" "}
                  {(scenarioData.allowances_held || 0).toLocaleString()} ={" "}
                  {shortage.toLocaleString()} tonnes
                </div>
                <div>
                  Penalty = Shortage × Penalty Rate ={" "}
                  {shortage.toLocaleString()} × €
                  {scenarioData.penalty_rate || 100} = ?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Input */}
      {!showResult && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calculate the total penalty amount (in euros):
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Calculating..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && currentResult && (
        <div className="mb-6">
          <div
            className={`p-4 rounded-lg border-2 ${
              currentResult.isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {currentResult.isCorrect ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`font-medium ${
                  currentResult.isCorrect ? "text-green-800" : "text-red-800"
                }`}
              >
                {currentResult.isCorrect ? "Correct!" : "Incorrect"}
              </span>
              <span
                className={`text-sm ${
                  currentResult.isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentResult.pointsEarned} / {currentScenario.points_possible}{" "}
                points
              </span>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div>
                Your answer: €{currentResult.userAnswer.toLocaleString()}
              </div>
              <div>
                Correct answer: €{currentResult.correctAnswer.toLocaleString()}
              </div>
              <div>
                Time taken: {Math.round(currentResult.timeTaken / 1000)}s
              </div>
            </div>

            {/* Explanation */}
            {currentScenario.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <LightBulbIcon className="h-4 w-4" />
                  {showExplanation ? "Hide" : "Show"} Explanation
                </button>

                {showExplanation && (
                  <div className="mt-2 p-3 bg-white rounded border text-sm text-gray-700">
                    {currentScenario.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {currentScenarioIndex < activeScenarios.length - 1
                ? "Next Scenario"
                : "Complete"}
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {results.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Progress Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Completed</div>
              <div className="font-bold text-gray-900">
                {results.length} / {activeScenarios.length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Correct</div>
              <div className="font-bold text-green-600">
                {results.filter((r) => r.isCorrect).length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Points Earned</div>
              <div className="font-bold text-blue-600">
                {results.reduce((sum, r) => sum + r.pointsEarned, 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Avg Time</div>
              <div className="font-bold text-gray-900">
                {results.length > 0
                  ? Math.round(
                      results.reduce((sum, r) => sum + r.timeTaken, 0) /
                        results.length /
                        1000
                    )
                  : 0}
                s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
