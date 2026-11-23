"use client";

import { useTour } from "./TourProvider";

export default function RestartTourButton() {
  const { startTour } = useTour();
  return (
    <button onClick={startTour} className="text-xs font-medium text-ochre shrink-0 h-9 px-1">
      Relancer →
    </button>
  );
}
