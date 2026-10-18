"use client";

import React, { useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import ComplianceCalculator from "./ComplianceCalculator";
import ParticipantMatchingGame from "./ParticipantMatchingGame";
import EUAPriceAnalysisGame from "./EUAPriceAnalysisGame";
import AllocationAuctionStrategy from "./AllocationAuctionStrategy";
import TradingTimelineSimulation from "./TradingTimelineSimulation";
import CarbonLeakageAnalysis from "./CarbonLeakageAnalysis";

interface DatabaseInteractiveWrapperProps {
  lesson: {
    id: number;
    module_id: number;
    title: string;
    content: string;
    lesson_type: "text" | "video" | "interactive" | "quiz";
    duration_minutes: number;
    interactive_content?: {
      type: {
        id: number;
        type_key: string;
        display_name: string;
        description: string;
        component_name: string;
        default_config: any;
      };
      scenarios: Array<{
        id: number;
        lesson_id: number;
        type_id: number;
        title: string;
        description: string;
        scenario_data: any;
        optimal_choice?: string;
        explanation?: string;
        order_index: number;
        points_possible: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
    };
  };
  onComplete: (score: number) => void;
}

export default function DatabaseInteractiveWrapper({
  lesson,
  onComplete,
}: DatabaseInteractiveWrapperProps) {
  const [showInteractive, setShowInteractive] = useState(false);
  const [interactiveCompleted, setInteractiveCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);

  const handleInteractiveComplete = (score: number) => {
    setFinalScore(score);
    setInteractiveCompleted(true);
    setCompletionTime(Date.now());
    onComplete(score);
  };

  const handleScenarioComplete = (scenarioId: number, response: any) => {
    console.log(`Scenario ${scenarioId} completed:`, response);
  };

  // If no interactive content is configured, fall back to original lesson content
  if (
    !lesson.interactive_content ||
    !lesson.interactive_content.scenarios.length
  ) {
    return (
      <div className="space-y-6">
        {/* Regular lesson content */}
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>

        {/* Interactive placeholder */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-medium text-yellow-900">
                Interactive Content Coming Soon
              </h3>
              <p className="text-sm text-yellow-700">
                This lesson is marked as interactive but scenarios are still
                being configured.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const interactiveType = lesson.interactive_content.type;
  const scenarios = lesson.interactive_content.scenarios;

  const getInteractiveComponent = () => {
    switch (interactiveType.type_key) {
      case "compliance_calculator":
        return <ComplianceCalculator onComplete={handleInteractiveComplete} />;

      case "participant_matching":
        return (
          <ParticipantMatchingGame onComplete={handleInteractiveComplete} />
        );

      case "price_analysis":
        return <EUAPriceAnalysisGame onComplete={handleInteractiveComplete} />;

      case "allocation_auction":
        return (
          <AllocationAuctionStrategy onComplete={handleInteractiveComplete} />
        );

      case "trading_timeline":
        return (
          <TradingTimelineSimulation onComplete={handleInteractiveComplete} />
        );

      case "carbon_leakage":
        return <CarbonLeakageAnalysis onComplete={handleInteractiveComplete} />;

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="font-medium text-gray-900 mb-2">
              Unknown Interactive Type
            </h3>
            <p className="text-gray-600">
              Component &quot;{interactiveType.component_name}&quot; not found
            </p>
          </div>
        );
    }
  };

  const getInteractiveIcon = () => {
    switch (interactiveType.type_key) {
      case "compliance_calculator":
        return "🧮";
      case "participant_matching":
        return "🎯";
      case "price_analysis":
        return "📊";
      case "allocation_auction":
        return "💰";
      case "trading_timeline":
        return "⏱️";
      case "carbon_leakage":
        return "🌍";
      default:
        return "🎮";
    }
  };

  return (
    <div className="space-y-6">
      {/* Lesson Content */}
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
      </div>

      {/* Interactive Section */}
      <div className="border-t pt-6">
        {!showInteractive && !interactiveCompleted && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-3xl mr-4">{getInteractiveIcon()}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {interactiveType.display_name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {interactiveType.description}
                  </p>
                  <div className="text-sm text-blue-600 space-y-1">
                    <div>📚 {scenarios.length} scenarios configured</div>
                    <div>
                      ⭐{" "}
                      {scenarios.reduce((sum, s) => sum + s.points_possible, 0)}{" "}
                      points possible
                    </div>
                    <div>
                      ⏱️ Estimated time: {lesson.duration_minutes} minutes
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInteractive(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Start Interactive
              </button>
            </div>
          </div>
        )}

        {/* Interactive Component */}
        {showInteractive && !interactiveCompleted && (
          <div className="bg-white rounded-lg shadow-sm border">
            {getInteractiveComponent()}
          </div>
        )}

        {/* Completion Summary */}
        {interactiveCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
                  <TrophyIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Interactive Exercise Completed!
                  </h3>
                  <p className="text-green-700">
                    You scored {finalScore}% on the{" "}
                    {interactiveType.display_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {finalScore}%
                </div>
                <div className="text-sm text-green-600">Final Score</div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="font-medium text-green-900 mb-2">
                Performance Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-green-600">Scenarios</div>
                  <div className="font-bold text-green-900">
                    {scenarios.length}
                  </div>
                </div>
                <div>
                  <div className="text-green-600">Score</div>
                  <div className="font-bold text-green-900">{finalScore}%</div>
                </div>
                <div>
                  <div className="text-green-600">Type</div>
                  <div className="font-bold text-green-900">
                    {interactiveType.display_name}
                  </div>
                </div>
                <div>
                  <div className="text-green-600">Status</div>
                  <div className="font-bold text-green-900">
                    {finalScore >= 70 ? "Passed" : "Completed"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowInteractive(true);
                  setInteractiveCompleted(false);
                  setFinalScore(0);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  // Scroll to next section or continue lesson
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium"
              >
                Continue Lesson
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
