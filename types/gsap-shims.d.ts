// GSAP types used by the splitText component
interface GSAPSplitOptions {
  type: string;
  smartWrap?: boolean;
  autoSplit?: boolean;
  linesClass?: string;
  wordsClass?: string;
  charsClass?: string;
  reduceWhiteSpace?: boolean;
  onSplit?: (self: GSAPSplitTextInstance) => void;
}

interface GSAPSplitTextInstance {
  chars: Element[];
  words: Element[];
  lines: Element[];
  revert: () => void;
}

interface ScrollTriggerConfig {
  trigger: Element;
  start: string;
  once?: boolean;
  fastScrollEnd?: boolean;
  anticipatePin?: number;
}

declare module 'gsap/SplitText' {
  export default class SplitText {
    constructor(el: HTMLElement, options: GSAPSplitOptions);
    chars: Element[];
    words: Element[];
    lines: Element[];
    revert: () => void;
  }
}

declare module 'gsap/ScrollTrigger' {
  const ScrollTrigger: {
    getAll: () => Array<{ trigger: Element, kill: () => void }>;
  };
  export default ScrollTrigger;
}

// Ensure consistent types for gsap namespace
declare const gsap: {
  fromTo: (targets: Element | Element[], 
    from: Record<string, any>, 
    to: Record<string, any> & {
      scrollTrigger?: ScrollTriggerConfig;
      onComplete?: () => void;
    }
  ) => void;
  registerPlugin: (...plugins: any[]) => void;
}