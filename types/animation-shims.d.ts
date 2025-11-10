// Minimal ambient type shims for animation libraries used in the UI

// Generic vector/renderer/polyline shapes used in small canvas/ogl helpers
declare type Vec3 = any;
declare type Polyline = any;
declare type Renderer = any;

// GSAP minimal typings used by splitText and tween helpers
declare namespace gsap {
  // Accept any tween vars shape used across the codebase
  export type TweenVars = any;
}

// SplitText runtime helper shape
declare interface GSAPSplitText {
  chars?: any[];
  words?: any[];
  lines?: any[];
}

// Provide modules for packages that don't ship types or are referenced as modules
declare module 'gsap' {
  export = gsap;
}

declare module 'gsap/ScrollTrigger' {
  const ScrollTrigger: any;
  export default ScrollTrigger;
}

declare module 'gsap/SplitText' {
  const SplitText: any;
  export default SplitText;
}

// Keep existing broad declarations for other small modules
declare module '@gsap/react' {
  const _default: any;
  export default _default;
}

declare module 'ogl' {
  const _default: any;
  export default _default;
}
