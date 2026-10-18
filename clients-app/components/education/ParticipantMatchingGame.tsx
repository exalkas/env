"use client";

import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface ParticipantMatchingGameProps {
  onComplete?: (score: number) => void;
}

interface Participant {
  id: string;
  name: string;
  description: string;
  category: "compliance" | "financial" | "infrastructure" | "regulatory";
  color: string;
}

interface Role {
  id: string;
  title: string;
  description: string;
  correctParticipants: string[];
  explanation: string;
}

export default function ParticipantMatchingGame({
  onComplete,
}: ParticipantMatchingGameProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Participants based on existing question bank data
  const participants: Participant[] = [
    {
      id: "power-companies",
      name: "Power Companies",
      description: "Electricity generators using fossil fuels",
      category: "compliance",
      color: "bg-blue-100 border-blue-300 text-blue-800",
    },
    {
      id: "steel-manufacturers",
      name: "Steel Manufacturers",
      description: "Industrial facilities with high emissions",
      category: "compliance",
      color: "bg-blue-100 border-blue-300 text-blue-800",
    },
    {
      id: "financial-traders",
      name: "Financial Traders",
      description: "Banks and trading houses",
      category: "financial",
      color: "bg-green-100 border-green-300 text-green-800",
    },
    {
      id: "investment-funds",
      name: "Investment Funds",
      description: "Institutional investors",
      category: "financial",
      color: "bg-green-100 border-green-300 text-green-800",
    },
    {
      id: "registries",
      name: "Carbon Registries",
      description: "Track allowance ownership",
      category: "infrastructure",
      color: "bg-purple-100 border-purple-300 text-purple-800",
    },
    {
      id: "verifiers",
      name: "Verification Bodies",
      description: "Audit emissions reports",
      category: "infrastructure",
      color: "bg-purple-100 border-purple-300 text-purple-800",
    },
    {
      id: "exchanges",
      name: "Trading Exchanges",
      description: "ICE, EEX platforms",
      category: "infrastructure",
      color: "bg-purple-100 border-purple-300 text-purple-800",
    },
    {
      id: "regulators",
      name: "EU Regulators",
      description: "Set rules and monitor compliance",
      category: "regulatory",
      color: "bg-red-100 border-red-300 text-red-800",
    },
  ];

  // Roles to match participants to
  const roles: Role[] = [
    {
      id: "must-comply",
      title: "Must Comply with Emissions Limits",
      description: "Required to surrender EUAs for their emissions",
      correctParticipants: ["power-companies", "steel-manufacturers"],
      explanation:
        "Compliance entities like power companies and industrial facilities must surrender EUAs equal to their verified emissions each year.",
    },
    {
      id: "provide-liquidity",
      title: "Provide Market Liquidity",
      description: "Trade allowances for profit and risk management",
      correctParticipants: ["financial-traders", "investment-funds"],
      explanation:
        "Financial participants trade carbon allowances to provide liquidity, manage risk, and seek profit opportunities.",
    },
    {
      id: "market-infrastructure",
      title: "Support Market Infrastructure",
      description: "Enable and facilitate carbon trading",
      correctParticipants: ["registries", "verifiers", "exchanges"],
      explanation:
        "Infrastructure providers ensure the carbon market functions properly through tracking, verification, and trading platforms.",
    },
    {
      id: "regulate-monitor",
      title: "Regulate and Monitor",
      description: "Set rules and ensure compliance",
      correctParticipants: ["regulators"],
      explanation:
        "EU regulators establish the legal framework, set the cap, and monitor compliance with the ETS rules.",
    },
  ];

  const handleDragStart = (e: React.DragEvent, participantId: string) => {
    setDraggedItem(participantId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, roleId: string) => {
    e.preventDefault();
    if (draggedItem) {
      setMatches((prev) => ({
        ...prev,
        [roleId]: [...(prev[roleId] || []), draggedItem],
      }));
      setDraggedItem(null);
    }
  };

  const removeMatch = (roleId: string, participantId: string) => {
    setMatches((prev) => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter((id) => id !== participantId),
    }));
  };

  const getUsedParticipants = (): string[] => {
    return Object.values(matches).flat();
  };

  const checkAnswers = () => {
    let correctMatches = 0;
    let totalPossibleMatches = 0;

    roles.forEach((role) => {
      const userMatches = matches[role.id] || [];
      const correctParticipants = role.correctParticipants;
      totalPossibleMatches += correctParticipants.length;

      // Count correct matches
      correctParticipants.forEach((correctId) => {
        if (userMatches.includes(correctId)) {
          correctMatches++;
        }
      });
    });

    const finalScore = Math.round(
      (correctMatches / totalPossibleMatches) * 100
    );
    setScore(finalScore);
    setShowResults(true);
    onComplete?.(finalScore);
  };

  const isCorrectMatch = (roleId: string, participantId: string): boolean => {
    const role = roles.find((r) => r.id === roleId);
    return role?.correctParticipants.includes(participantId) || false;
  };

  const isRoleComplete = (roleId: string): boolean => {
    const role = roles.find((r) => r.id === roleId);
    const userMatches = matches[roleId] || [];
    return (
      role?.correctParticipants.every((id) => userMatches.includes(id)) || false
    );
  };

  const allRolesMatched = roles.every(
    (role) => (matches[role.id] || []).length > 0
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
          <UserGroupIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Carbon Market Participants
          </h2>
          <p className="text-gray-600">
            Match each participant type to their primary role in carbon markets
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How to Play:</h4>
            <p className="text-sm text-blue-800">
              Drag the participants from the left panel and drop them into the
              appropriate role categories on the right. Each participant may
              belong to multiple roles, and each role may have multiple
              participants.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Participants Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Participants
          </h3>
          <div className="space-y-3">
            {participants.map((participant) => {
              const isUsed = getUsedParticipants().includes(participant.id);
              return (
                <div
                  key={participant.id}
                  draggable={!showResults}
                  onDragStart={(e) => handleDragStart(e, participant.id)}
                  className={`p-4 rounded-lg border-2 cursor-move transition-all ${
                    participant.color
                  } ${isUsed ? "opacity-50" : "hover:shadow-md"} ${
                    draggedItem === participant.id
                      ? "shadow-lg transform scale-105"
                      : ""
                  } ${showResults ? "cursor-default" : ""}`}
                >
                  <div className="font-medium">{participant.name}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {participant.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Primary Roles
          </h3>
          <div className="space-y-4">
            {roles.map((role) => {
              const roleMatches = matches[role.id] || [];
              const isComplete = isRoleComplete(role.id);

              return (
                <div
                  key={role.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, role.id)}
                  className={`p-4 rounded-lg border-2 border-dashed min-h-[120px] transition-all ${
                    draggedItem
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 bg-gray-50"
                  } ${
                    showResults && isComplete
                      ? "bg-green-50 border-green-300"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{role.title}</h4>
                    {showResults && isComplete && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {role.description}
                  </p>

                  {/* Matched Participants */}
                  <div className="flex flex-wrap gap-2">
                    {roleMatches.map((participantId) => {
                      const participant = participants.find(
                        (p) => p.id === participantId
                      );
                      const isCorrect = isCorrectMatch(role.id, participantId);

                      return (
                        <div
                          key={participantId}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            showResults
                              ? isCorrect
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                              : participant?.color ||
                                "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <span>{participant?.name}</span>
                          {showResults &&
                            (isCorrect ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <XCircleIcon className="h-4 w-4" />
                            ))}
                          {!showResults && (
                            <button
                              onClick={() =>
                                removeMatch(role.id, participantId)
                              }
                              className="text-gray-600 hover:text-gray-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Show explanation after results */}
                  {showResults && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        {role.explanation}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Correct answers:{" "}
                        {role.correctParticipants
                          .map(
                            (id) => participants.find((p) => p.id === id)?.name
                          )
                          .join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Game Complete!
            </h3>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              Score: {score}%
            </div>
            <p className="text-gray-600">
              {score >= 80
                ? "Excellent! You have a strong understanding of carbon market participants."
                : score >= 60
                ? "Good job! Review the explanations to strengthen your knowledge."
                : "Keep learning! Understanding market participants is key to carbon trading."}
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!showResults && (
        <div className="mt-6 text-center">
          <button
            onClick={checkAnswers}
            disabled={!allRolesMatched}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Check My Answers
          </button>
          {!allRolesMatched && (
            <p className="text-sm text-gray-500 mt-2">
              Match at least one participant to each role to continue
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">
          Participant Categories:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-700">Compliance Entities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">
              Financial Participants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span className="text-sm text-gray-700">Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Regulatory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
