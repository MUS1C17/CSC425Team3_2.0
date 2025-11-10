export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  group_members?: GroupMember[];
  sessions?: Session[];
}

export interface Session {
  id: string;
  group_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  groups?: Pick<Group, "name">;
  questions?: Question[];
  session_members?: SessionMember[];
}

export interface Question {
  id: string;
  session_id: string;
  content: string;
  asked_by: string;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  answered_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  profiles?: Pick<Profile, "first_name" | "last_name">;
}

export interface SessionMember {
  session_id: string;
  user_id: string;
  role: "host" | "participant";
  created_at: string;
  profiles?: Pick<Profile, "first_name" | "last_name">;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      users: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "created_at" | "updated_at">;
        Update: Partial<Omit<Group, "id">>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "created_at" | "updated_at">;
        Update: Partial<Omit<Session, "id">>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, "created_at" | "updated_at">;
        Update: Partial<Omit<Question, "id">>;
      };
      answers: {
        Row: Answer;
        Insert: Omit<Answer, "created_at" | "updated_at">;
        Update: Partial<Omit<Answer, "id">>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, "created_at">;
        Update: Partial<GroupMember>;
      };
      session_members: {
        Row: SessionMember;
        Insert: Omit<SessionMember, "created_at">;
        Update: Partial<SessionMember>;
      };
    };
  };
};