export type Question = {
  id: number;
  session_id: number;
  author_id: string;
  title: string;
  description: string | null;
  created_at: string;
  deleted_at?: string | null;
};
