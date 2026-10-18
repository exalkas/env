"use client";

import React, { useState } from "react";
import {
  PlayIcon,
  PuzzlePieceIcon,
  CalculatorIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import ComplianceCalculator from "./ComplianceCalculator";
import ParticipantMatchingGame from "./ParticipantMatchingGame";
import EUAPriceAnalysisGame from "./EUAPriceAnalysisGame";
import AllocationAuctionStrategy from "./AllocationAuctionStrategy";
import TradingTimelineSimulation from "./TradingTimelineSimulation";
import CarbonLeakageAnalysis from "./CarbonLeakageAnalysis";

interface InteractiveLessonWrapperProps {
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
        component_name: string;
        default_config: any;
      };
      scenarios: any[];
    };
  };
  onComplete: (score: number) => void;
}

export default function InteractiveLessonWrapper({
  lesson,
  onComplete,
}: InteractiveLessonWrapperProps) {
  const [showInteractive, setShowInteractive] = useState(false);
  const [interactiveCompleted, setInteractiveCompleted] = useState(false);
  const [interactiveScore, setInteractiveScore] = useState(0);

  // Determine which interactive component to show based on database configuration
  const getInteractiveComponent = () => {
    // Use database-driven interactive content if available
    if (lesson.interactive_content?.type?.type_key) {
      return lesson.interactive_content.type.type_key;
    }

    // Fallback to content-based detection for backward compatibility
    const title = lesson.title.toLowerCase();
    const content = lesson.content.toLowerCase();
    const combinedText = `${title} ${content}`;

    if (
      title.includes("compliance") ||
      title.includes("penalties") ||
      content.includes("penalty") ||
      content.includes("calculation")
    ) {
      return "compliance_calculator";
    } else if (
      title.includes("participants") ||
      title.includes("market participants") ||
      content.includes("participants") ||
      content.includes("market structure")
    ) {
      return "participant_matching";
    }

    return null;
  };

  const handleInteractiveComplete = (score: number) => {
    setInteractiveScore(score);
    setInteractiveCompleted(true);
    onComplete(score);
  };

  const interactiveType = getInteractiveComponent();

  // Show regular text lesson if no interactive component available
  if (lesson.lesson_type !== "interactive" || !interactiveType) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lesson.title}
              </h1>
              <p className="text-gray-600">
                {lesson.lesson_type === "text"
                  ? "Reading"
                  : lesson.lesson_type.charAt(0).toUpperCase() +
                    lesson.lesson_type.slice(1)}{" "}
                • {lesson.duration_minutes} minutes
              </p>
            </div>
          </div>

          <div
            className="prose max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />

          <div className="mt-8 text-center">
            <button
              onClick={() => onComplete(100)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Lesson Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
            {interactiveType === "compliance_calculator" ? (
              <CalculatorIcon className="h-6 w-6 text-green-600" />
            ) : interactiveType === "participant_matching" ? (
              <PuzzlePieceIcon className="h-6 w-6 text-green-600" />
            ) : interactiveType === "price_analysis" ? (
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            ) : interactiveType === "allocation_auction" ? (
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            ) : interactiveType === "trading_timeline" ? (
              <CalendarIcon className="h-6 w-6 text-green-600" />
            ) : interactiveType === "carbon_leakage" ? (
              <GlobeAltIcon className="h-6 w-6 text-green-600" />
            ) : (
              <PuzzlePieceIcon className="h-6 w-6 text-green-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-gray-600">
              Interactive Lesson • {lesson.duration_minutes} minutes
            </p>
          </div>
        </div>

        {/* Lesson Content */}
        <div
          className="prose max-w-none text-gray-900 mb-6"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />

        {/* Interactive Launch Button */}
        {!showInteractive && !interactiveCompleted && (
          <div className="text-center">
            <button
              onClick={() => setShowInteractive(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <PlayIcon className="h-5 w-5" />
              {interactiveType === "compliance_calculator"
                ? "Start Compliance Calculator"
                : interactiveType === "participant_matching"
                ? "Start Participant Matching Game"
                : interactiveType === "price_analysis"
                ? "Start Price Analysis Challenge"
                : interactiveType === "allocation_auction"
                ? "Start Strategy Challenge"
                : interactiveType === "trading_timeline"
                ? "Start Trading Simulation"
                : interactiveType === "carbon_leakage"
                ? "Start Leakage Analysis"
                : lesson.interactive_content?.type?.display_name
                ? `Start ${lesson.interactive_content.type.display_name}`
                : "Start Interactive Exercise"}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Complete the interactive exercise to proceed
            </p>
          </div>
        )}

        {/* Completion Status */}
        {interactiveCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">
                  Interactive Exercise Complete!
                </h3>
                <p className="text-sm text-green-700">
                  Your score: {interactiveScore}% •
                  {interactiveScore >= 80
                    ? " Excellent work!"
                    : interactiveScore >= 60
                    ? " Good job!"
                    : " Keep practicing!"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Component */}
      {showInteractive && !interactiveCompleted && (
        <div className="bg-white rounded-lg shadow-sm border">
          {interactiveType === "compliance_calculator" && (
            <ComplianceCalculator onComplete={handleInteractiveComplete} />
          )}
          {interactiveType === "participant_matching" && (
            <ParticipantMatchingGame onComplete={handleInteractiveComplete} />
          )}
          {interactiveType === "price_analysis" && (
            <EUAPriceAnalysisGame onComplete={handleInteractiveComplete} />
          )}
          {interactiveType === "allocation_auction" && (
            <AllocationAuctionStrategy onComplete={handleInteractiveComplete} />
          )}
          {interactiveType === "trading_timeline" && (
            <TradingTimelineSimulation onComplete={handleInteractiveComplete} />
          )}
          {interactiveType === "carbon_leakage" && (
            <CarbonLeakageAnalysis onComplete={handleInteractiveComplete} />
          )}
        </div>
      )}

      {/* Show Results Again Button */}
      {interactiveCompleted && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setShowInteractive(true);
              setInteractiveCompleted(false);
            }}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Try Interactive Exercise Again
          </button>
        </div>
      )}
    </div>
  );
}
