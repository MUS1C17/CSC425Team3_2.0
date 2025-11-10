declare module 'ogl';
declare module 'gsap';
declare module 'gsap/ScrollTrigger';
declare module 'gsap/SplitText';
declare module '@gsap/react';
declare module '@radix-ui/react-popover';

// Small module aliases used by some pages — re-export or declare minimal shapes
declare module '@/lib/types/question' {
  export interface Question {
    id: string;
    session_id: string;
    content: string;
    asked_by: string;
    created_at: string;
    updated_at: string;
    answers?: any[];
  }
  export type QuestionAttachment = any;
}

declare module '@/lib/types/answer' {
  export interface Answer {
    id: string;
    question_id: string;
    content: string;
    answered_by: string;
    created_at: string;
    updated_at: string;
  }
  export type AnswerAttachment = any;
}

declare module '@/lib/types/QuestionAttachment' {
  export type QuestionAttachment = any;
}

declare module '@/lib/types/AnswerAttachment' {
  export type AnswerAttachment = any;
}
