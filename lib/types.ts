export type Role = "student" | "mentor" | "admin";

export type QuestionType = "multiple_choice" | "true_false" | "discursive";

export type Option = { id: string; label: string };

export type Track = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  community_url: string | null;
  published: boolean;
};

export type ModuleRow = {
  id: string;
  track_id: string;
  slug: string;
  order_index: number;
  phase_label: string | null;
  title: string;
  content_md: string;
  pass_threshold: number;
  published: boolean;
};

export type Question = {
  id: string;
  module_id: string;
  order_index: number;
  type: QuestionType;
  prompt: string;
  options: Option[] | null;
  points: number;
  min_chars: number | null;
};

export type Progress = {
  id: string;
  user_id: string;
  module_id: string;
  unlocked: boolean;
  completed: boolean;
};

export type AttemptStatus = "in_progress" | "pending_review" | "passed" | "failed";

export type Attempt = {
  id: string;
  user_id: string;
  module_id: string;
  status: AttemptStatus;
  score: number | null;
  started_at: string;
  submitted_at: string | null;
};

export type ReviewStatus = "auto" | "pending" | "approved" | "rejected";

export type AttemptAnswer = {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  boolean_answer: boolean | null;
  answer_text: string | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  review_status: ReviewStatus;
  reviewer_feedback: string | null;
};
