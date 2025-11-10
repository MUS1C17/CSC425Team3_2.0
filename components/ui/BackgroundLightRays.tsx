"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LightRays from "@/components/ui/lightray";

type BackgroundLightRaysProps = React.ComponentProps<typeof LightRays> & {
  className?: string;
};

export default function BackgroundLightRays({ className, ...props }: BackgroundLightRaysProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <LightRays
      {...props}
      className={
        //we force a true viewport background, regardless of parent containers
        `fixed inset-0 -z-10 pointer-events-none ${className ?? ""}`
      }
    />,
    document.body,
  );
}
