"use client";

import { useTour } from "./TourProvider";

export default function RestartTourButton() {
  const { startTour } = useTour();
  return (
    <button onClick={startTour} className="text-xs font-medium text-ochre shrink-0">
      Relancer →
    </button>
  );
}
