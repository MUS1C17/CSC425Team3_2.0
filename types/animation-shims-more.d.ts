// Additional shims for GSAP and OGL named exports used by the UI

// Ensure vector/renderer/polyline types exist
declare type Vec3 = any;
declare type Polyline = any;
declare type Renderer = any;

// GSAP named exports and helpers
declare module 'gsap' {
  export const gsap: any;
  export const TweenMax: any;
  export const TweenLite: any;
  export const TimelineMax: any;
  export const ScrollTrigger: any;
  export function registerPlugin(...args: any[]): void;
  export type TweenVars = any;
  export default any;
}

declare module 'gsap/ScrollTrigger' {
  export const ScrollTrigger: any;
  export default ScrollTrigger;
}

declare module 'gsap/SplitText' {
  export const SplitText: any;
  export default SplitText;
}

declare module '@gsap/react' {
  export const useGSAP: any;
  export default any;
}

// OGL named exports used by the project
declare module 'ogl' {
  export const Renderer: any;
  export const Program: any;
  export const Triangle: any;
  export const Mesh: any;
  export const Transform: any;
  export const Vec3: any;
  export const Color: any;
  export const Polyline: any;
  export default any;
}

// SplitText runtime helper shape
interface GSAPSplitText {
  chars?: any[];
  words?: any[];
  lines?: any[];
}
