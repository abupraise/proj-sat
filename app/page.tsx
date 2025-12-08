"use client";

import { useState, useEffect } from "react";
import { CesiumGlobe } from "@/components/cesium-globe";
import { PIPELINE_STEPS } from "@/lib/pipeline-script";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentStep = PIPELINE_STEPS[currentIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentIndex < PIPELINE_STEPS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, currentStep.durationMs]);

  const handlePrevious = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(PIPELINE_STEPS.length - 1, prev + 1));
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="relative h-screen overflow-hidden">
        <CesiumGlobe sceneId={currentStep.id} />

        <div className="relative z-10 flex flex-col items-center justify-between h-full pointer-events-none px-4 py-8">
          <div className="flex-1 flex items-center justify-center max-w-4xl w-full">
            {currentIndex === 0 && (
              <div className="text-center space-y-4 animate-in fade-in duration-1000">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                  Pipeline Security Scenario
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                  A fictional, educational visualization of monitoring pipelines
                </p>
                <p className="text-sm text-white/60 max-w-xl mx-auto pt-2">
                  This demonstration uses satellites, IoT devices, and drones in a
                  conceptual security scenario
                </p>
              </div>
            )}
          </div>

          <div className="w-full max-w-md">
            <Card className="w-full bg-white/10 backdrop-blur-md border-white/20 pointer-events-auto shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      Step {currentIndex + 1} of {PIPELINE_STEPS.length}
                    </span>
                    <div className="flex gap-1">
                      {PIPELINE_STEPS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                            idx === currentIndex
                              ? "bg-white"
                              : idx < currentIndex
                              ? "bg-white/50"
                              : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white">
                    {currentStep.title}
                  </h2>

                  <p className="text-white/80 text-sm leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    onClick={handlePlayPause}
                    className="bg-white text-slate-900 hover:bg-white/90 flex-shrink-0"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === PIPELINE_STEPS.length - 1}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-white/50 text-center leading-relaxed">
                    This scenario is fictional and does not represent real surveillance
                    capabilities or legal procedures. Educational purposes only.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
