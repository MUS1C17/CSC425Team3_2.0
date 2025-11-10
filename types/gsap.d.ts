// GSAP module and namespace declarations

declare module 'gsap' {
  interface TweenVars {
    opacity?: number;
    y?: number;
    duration?: number;
    ease?: string | ((t: number) => number);
    stagger?: number;
    scrollTrigger?: {
      trigger: Element;
      start?: string;
      once?: boolean;
      fastScrollEnd?: boolean;
      anticipatePin?: number;
    };
    onComplete?: () => void;
    willChange?: string;
    force3D?: boolean;
  }

  const gsap: {
    fromTo: (
      targets: Element | Element[],
      from: TweenVars,
      to: TweenVars
    ) => void;
    registerPlugin: (...plugins: any[]) => void;
  };

  export { gsap };
}

declare module 'gsap/ScrollTrigger' {
  interface ScrollTriggerInstance {
    trigger: Element;
    kill: () => void;
  }

  const ScrollTrigger: {
    getAll: () => ScrollTriggerInstance[];
  };

  export { ScrollTrigger as default };
}

declare module 'gsap/SplitText' {
  interface GSAPSplitTextInstance {
    chars?: Element[];
    words?: Element[];
    lines?: Element[];
    revert: () => void;
  }

  interface GSAPSplitTextOptions {
    type: string;
    smartWrap?: boolean;
    autoSplit?: boolean;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    reduceWhiteSpace?: boolean;
    onSplit?: (self: GSAPSplitTextInstance) => void;
  }

  class SplitText implements GSAPSplitTextInstance {
    constructor(el: HTMLElement, options: GSAPSplitTextOptions);
    chars?: Element[];
    words?: Element[];
    lines?: Element[];
    revert: () => void;
  }

  export { SplitText as default, GSAPSplitTextInstance };
}

declare module '@gsap/react' {
  const useGSAP: (
    callback: () => void,
    config: {
      dependencies: any[];
      scope?: React.RefObject<any>;
    }
  ) => void;

  export { useGSAP };
}

// Helper type for optional GSAP text split instances
interface WithGSAPSplitText {
  _rbsplitInstance?: import('gsap/SplitText').GSAPSplitTextInstance;
}