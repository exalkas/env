import { API_URL } from "../config";
import { fetchWithAuth } from "../utils/auth";

// Types
export interface LearningPath {
  id: number;
  title: string;
  level: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  estimated_duration: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  lesson_type: string;
  estimated_duration: number;
  sort_order: number;
  is_active: boolean;
  video_url?: string;
  video_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  learning_path_id?: number;
  module_id?: number;
  lesson_id?: number;
  title: string;
  description: string;
  questions: any[];
  time_limit?: number;
  passing_score: number;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// New Question Bank Types
export type QuestionType =
  | "multiple_choice"
  | "multiple_select"
  | "true_false"
  | "fill_in_blank"
  | "numeric"
  | "essay"
  | "matching"
  | "ordering";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  explanation?: string;
}

export interface Question {
  id: number;
  title: string;
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  points: number;
  difficulty_level: QuestionDifficulty;
  category: string;
  tags: string[];
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionBank {
  questions: Question[];
  total: number;
  page: number;
  page_size: number;
}

export interface AssessmentQuestion {
  id: number;
  assessment_id: number;
  question_id: number;
  sort_order: number;
  points: number;
  question: Question;
}

export interface UserAssessmentAttempt {
  id: number;
  user_id: number;
  assessment_id: number;
  started_at: string;
  completed_at?: string;
  score?: number;
  total_points?: number;
  points_earned?: number;
  status: "in_progress" | "completed" | "abandoned";
  time_spent?: number;
}

export interface UserQuestionResponse {
  id: number;
  attempt_id: number;
  question_id: number;
  response_data: any;
  points_earned: number;
  is_correct: boolean;
  time_spent?: number;
  answered_at: string;
}

export interface AssessmentResults {
  attempt: UserAssessmentAttempt;
  responses: UserQuestionResponse[];
  assessment: Assessment;
  questions: Question[];
  total_questions: number;
  correct_answers: number;
  percentage_score: number;
  passed: boolean;
}

export interface AssessmentStats {
  total_questions: number;
  total_assessments: number;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  question_types: Record<QuestionType, number>;
  difficulty_distribution: Record<QuestionDifficulty, number>;
  category_distribution: Record<string, number>;
}

// Learning Paths API
export const getLearningPaths = async (params?: {
  is_active?: boolean;
  difficulty_level?: string;
  skip?: number;
  limit?: number;
}): Promise<LearningPath[]> => {
  const searchParams = new URLSearchParams();
  if (params?.is_active !== undefined)
    searchParams.append("is_active", params.is_active.toString());
  if (params?.difficulty_level)
    searchParams.append("difficulty_level", params.difficulty_level);
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const url = `${API_URL}/education/learning-paths/${
    searchParams.toString() ? `?${searchParams}` : ""
  }`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Failed to fetch learning paths");
  }

  return response.json();
};

export const getLearningPath = async (id: number): Promise<LearningPath> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/learning-paths/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch learning path");
  }

  return response.json();
};

export const createLearningPath = async (
  data: Omit<LearningPath, "id" | "created_at" | "updated_at">
): Promise<LearningPath> => {
  const response = await fetchWithAuth(`${API_URL}/education/learning-paths/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create learning path");
  }

  return response.json();
};

// Modules API
export const getModules = async (
  learningPathId?: number
): Promise<Module[]> => {
  const url = learningPathId
    ? `${API_URL}/education/learning-paths/${learningPathId}/modules`
    : `${API_URL}/education/modules/`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Failed to fetch modules");
  }

  return response.json();
};

export const getModule = async (id: number): Promise<Module> => {
  const response = await fetchWithAuth(`${API_URL}/education/modules/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch module");
  }

  return response.json();
};

export interface ModuleCreateData {
  title: string;
  description?: string;
  estimated_duration?: number;
  sort_order: number;
  is_active: boolean;
}

export const createModule = async (
  learningPathId: number,
  data: ModuleCreateData
): Promise<Module> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/learning-paths/${learningPathId}/modules`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create module");
  }

  return response.json();
};

// Lessons API
export const getLessons = async (moduleId?: number): Promise<Lesson[]> => {
  const url = moduleId
    ? `${API_URL}/education/modules/${moduleId}/lessons`
    : `${API_URL}/education/lessons/`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Failed to fetch lessons");
  }

  return response.json();
};

export const getLesson = async (id: number): Promise<Lesson> => {
  const response = await fetchWithAuth(`${API_URL}/education/lessons/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch lesson");
  }

  return response.json();
};

export const createLesson = async (
  moduleId: number,
  data: Omit<Lesson, "id" | "module_id" | "created_at" | "updated_at">
): Promise<Lesson> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/modules/${moduleId}/lessons`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create lesson");
  }

  return response.json();
};

// Assessments API
export const getAssessments = async (params?: {
  is_active?: boolean;
  learning_path_id?: number;
  skip?: number;
  limit?: number;
}): Promise<Assessment[]> => {
  const searchParams = new URLSearchParams();
  if (params?.is_active !== undefined)
    searchParams.append("is_active", params.is_active.toString());
  if (params?.learning_path_id)
    searchParams.append("learning_path_id", params.learning_path_id.toString());
  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const url = `${API_URL}/education/assessments/${
    searchParams.toString() ? `?${searchParams}` : ""
  }`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Failed to fetch assessments");
  }

  return response.json();
};

export const getAssessment = async (id: number): Promise<Assessment> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch assessment");
  }

  return response.json();
};

export const createAssessment = async (
  data: Omit<Assessment, "id" | "created_at" | "updated_at">
): Promise<Assessment> => {
  const response = await fetchWithAuth(`${API_URL}/education/assessments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create assessment");
  }

  return response.json();
};

// Question Bank API Functions

export const getQuestions = async (params?: {
  skip?: number;
  limit?: number;
  question_type?: QuestionType;
  difficulty?: QuestionDifficulty;
  category?: string;
  search?: string;
  is_active?: boolean;
  tags?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}): Promise<QuestionBank> => {
  const searchParams = new URLSearchParams();

  if (params?.skip) searchParams.append("skip", params.skip.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.question_type)
    searchParams.append("question_type", params.question_type);
  if (params?.difficulty) searchParams.append("difficulty", params.difficulty);
  if (params?.category) searchParams.append("category", params.category);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.is_active !== undefined)
    searchParams.append("is_active", params.is_active.toString());
  if (params?.tags) searchParams.append("tags", params.tags);
  if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.append("sort_order", params.sort_order);

  const url = `${API_URL}/education/questions/${
    searchParams.toString() ? `?${searchParams}` : ""
  }`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  return response.json();
};

export const getQuestion = async (id: number): Promise<Question> => {
  const response = await fetchWithAuth(`${API_URL}/education/questions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch question");
  }

  return response.json();
};

export const createQuestion = async (data: {
  title: string;
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  points: number;
  difficulty_level: QuestionDifficulty;
  category: string;
  tags: string[];
  is_active: boolean;
  options?: Omit<QuestionOption, "id">[];
}): Promise<Question> => {
  const response = await fetchWithAuth(`${API_URL}/education/questions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.detail || `HTTP ${response.status}: Failed to create question`
    );
    (error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
    throw error;
  }

  return response.json();
};

export const updateQuestion = async (
  id: number,
  data: {
    title?: string;
    question_text?: string;
    question_type?: QuestionType;
    explanation?: string;
    points?: number;
    difficulty_level?: QuestionDifficulty;
    category?: string;
    tags?: string[];
    is_active?: boolean;
    options?: Omit<QuestionOption, "id">[];
  }
): Promise<Question> => {
  const response = await fetchWithAuth(`${API_URL}/education/questions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.detail || `HTTP ${response.status}: Failed to update question`
    );
    (error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
    throw error;
  }

  return response.json();
};

export const deleteQuestion = async (id: number): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/education/questions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete question");
  }
};

// Assessment Questions API
export const getAssessmentQuestions = async (
  assessmentId: number
): Promise<AssessmentQuestion[]> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${assessmentId}/questions`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch assessment questions");
  }

  return response.json();
};

export const addQuestionToAssessment = async (
  assessmentId: number,
  data: {
    question_id: number;
    sort_order: number;
    points?: number;
  }
): Promise<AssessmentQuestion> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${assessmentId}/questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to add question to assessment");
  }

  return response.json();
};

export const removeQuestionFromAssessment = async (
  assessmentId: number,
  questionId: number
): Promise<void> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${assessmentId}/questions/${questionId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || "Failed to remove question from assessment"
    );
  }
};

// Assessment Taking API
export const startAssessmentAttempt = async (
  assessmentId: number
): Promise<{
  attempt_id: number;
  assessment: Assessment;
  questions: Question[];
  time_limit?: number;
}> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${assessmentId}/take`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to start assessment");
  }

  return response.json();
};

export const submitAssessmentAttempt = async (
  assessmentId: number,
  data: {
    attempt_id: number;
    responses: {
      question_id: number;
      response_data: any;
      time_spent?: number;
    }[];
  }
): Promise<UserAssessmentAttempt> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/assessments/${assessmentId}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit assessment");
  }

  return response.json();
};

export const getAssessmentResults = async (
  attemptId: number
): Promise<AssessmentResults> => {
  const response = await fetchWithAuth(
    `${API_URL}/education/attempts/${attemptId}/results`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch assessment results");
  }

  return response.json();
};

// Analytics API
export const getAssessmentStats = async (): Promise<AssessmentStats> => {
  const response = await fetchWithAuth(`${API_URL}/education/stats/overview`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment statistics");
  }

  return response.json();
};
