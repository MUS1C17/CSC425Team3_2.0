export type AnswerAttachment = {
  id: string;
  answer_id: number | null;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  position: number;
  uploaded_by: string;
  created_at: string;
  publicUrl?: string;
};
