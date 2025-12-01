export type Answer = {
  id: number;
  question_id: number;
  author_id: string;
  answer: string;
  created_at: string;
  deleted_at?: string | null;
};
