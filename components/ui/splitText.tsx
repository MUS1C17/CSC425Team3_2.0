import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

type TweenVars = {
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
};

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: TweenVars;
  to?: TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
}

// Type augmentation for GSAP split text instance
interface GSAPSplitTextInstance {
  chars: Element[];
  words: Element[];
  lines: Element[];
  revert: () => void;
}

interface SplitTextElement extends HTMLElement {
  _rbsplitInstance?: GSAPSplitTextInstance;
}

function SplitText({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps): React.ReactElement {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(() => {
      const el = containerRef.current;
      if (!el || !text || !fontsLoaded) {
        return undefined;
      }

      const $el = el as HTMLElement & SplitTextElement;
      
      if ($el._rbsplitInstance) {
        try {
          $el._rbsplitInstance.revert();
        } catch (_) {}
        $el._rbsplitInstance = undefined;
      }
      
      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;
      const targets: Element[] = [];
      const assignTargets = (self: GSAPSplitTextInstance): void => {
        if (splitType.includes("chars") && self.chars?.length) {
          targets.push(...self.chars);
        }
        if (!targets.length && splitType.includes("words") && self.words?.length) {
          targets.push(...self.words);
        }
        if (!targets.length && splitType.includes("lines") && self.lines?.length) {
          targets.push(...self.lines);
        }
        if (!targets.length) {
          targets.push(...(self.chars || self.words || self.lines || []));
        }
      };
      const splitInstance: GSAPSplitTextInstance = new GSAPSplitText($el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: function(self: GSAPSplitTextInstance) {
          assignTargets(self as GSAPSplitTextInstance);
          const animation = gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: $el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: function() {
                animationCompletedRef.current = true;
                if (onLetterAnimationComplete) onLetterAnimationComplete();
              },
              willChange: "transform, opacity",
              force3D: true,
            },
          );
          return animation;
        },
      });
      ($el as SplitTextElement)._rbsplitInstance = splitInstance as GSAPSplitTextInstance;
      return () => {
        ScrollTrigger.getAll().forEach((st: { trigger: Element; kill: () => void }) => {
          if (st.trigger === $el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch (_) {}
        if ($el) $el._rbsplitInstance = undefined;
      };
    }, {
      scope: containerRef,
      dependencies: [text, delay, duration, ease, splitType, from, to, threshold, rootMargin, fontsLoaded, onLetterAnimationComplete] as const
    });

  const renderContent = () => {
    const style: React.CSSProperties = {
      textAlign,
      wordWrap: "break-word",
      willChange: "transform, opacity",
    };
    const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
    switch (tag) {
      case "h1":
        return (
          <h1 ref={containerRef} style={style} className={classes}>
            {text}
          </h1>
        );
      case "h2":
        return (
          <h2 ref={containerRef} style={style} className={classes}>
            {text}
          </h2>
        );
      case "h3":
        return (
          <h3 ref={containerRef} style={style} className={classes}>
            {text}
          </h3>
        );
      case "h4":
        return (
          <h4 ref={containerRef} style={style} className={classes}>
            {text}
          </h4>
        );
      case "h5":
        return (
          <h5 ref={containerRef} style={style} className={classes}>
            {text}
          </h5>
        );
      case "h6":
        return (
          <h6 ref={containerRef} style={style} className={classes}>
            {text}
          </h6>
        );
      default:
        return (
          <p ref={containerRef} style={style} className={classes}>
            {text}
          </p>
        );
    }
  };

  return renderContent();
}

export default React.memo(SplitText);
