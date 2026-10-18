import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimated_duration: number;
  modules_count: number;
  is_active: boolean;
  created_at: string;
  user_progress?: {
    id: number;
    progress_percentage: number;
    completed_modules: number;
    total_modules: number;
    last_accessed: string;
    is_completed: boolean;
  };
}

interface LearningPathCardProps {
  path: LearningPath;
  variant: "available" | "enrolled";
  onEnroll?: (pathId: number) => void;
  isEnrolling?: boolean;
  enrollingId?: number | null;
}

const getLevelBadgeColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-orange-100 text-orange-800";
    case "expert":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export default function LearningPathCard({
  path,
  variant,
  onEnroll,
  isEnrolling = false,
  enrollingId = null,
}: LearningPathCardProps) {
  const isCurrentlyEnrolling = enrollingId === path.id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="p-6 flex flex-col flex-grow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(
              path.level
            )}`}
          >
            {path.level.toLowerCase()}
          </span>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              {path.modules_count} modules
            </div>
            {variant === "enrolled" && path.user_progress?.is_completed && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {path.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
          {path.description}
        </p>

        {/* Progress Bar (only for enrolled paths) */}
        {variant === "enrolled" && path.user_progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{path.user_progress.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${path.user_progress.progress_percentage}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {path.user_progress.completed_modules} of{" "}
                {path.user_progress.total_modules} modules
              </span>
              <span>
                Last accessed:{" "}
                {new Date(
                  path.user_progress.last_accessed
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Duration - positioned above button */}
        <div className="flex items-center text-sm text-gray-500 mb-4 mt-auto">
          <ClockIcon className="h-4 w-4 mr-1" />
          {formatDuration(path.estimated_duration)}
        </div>

        {/* Action Button */}
        {variant === "available" ? (
          <button
            onClick={() => onEnroll?.(path.id)}
            disabled={isCurrentlyEnrolling}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCurrentlyEnrolling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enrolling...
              </>
            ) : (
              "Enroll Now"
            )}
          </button>
        ) : (
          <Link
            href={`/education/learning-paths/${path.id}`}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {path.user_progress?.is_completed ? "Review" : "Continue Learning"}
          </Link>
        )}
      </div>
    </div>
  );
}
