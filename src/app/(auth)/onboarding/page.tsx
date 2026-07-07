"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PageBlobs } from "@/components/ui/DecorativeBlobs";

import Moment from "@/assets/illustration/moment.svg";
import Calender from "@/assets/illustration/calender.svg";
import Memories from "@/assets/illustration/memories.svg";

const slides = [
  {
    illustration: Moment,
    title: "Every Moment, A Story",
    description:
      "Keep your journey together in one place that belongs only to the two of you.",
    dotColor: "var(--accent)",
  },
  {
    illustration: Calender,
    title: "A Calendar for Two",
    description:
      "Plan your dates, and never let a moment that matters slip by.",
    dotColor: "var(--warning)",
  },
  {
    illustration: Memories,
    title: "Memories That Stay",
    description:
      "Upload photos, log every date, and trace your story back through time.",
    dotColor: "var(--success)",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function next() {
    if (step < slides.length - 1) {
      setStep((s) => s + 1);
    } else {
      router.push("/auth");
    }
  }

  function skip() {
    router.push("/auth");
  }

  const current = slides[step];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      <PageBlobs seed={3} />

      {/* Skip button */}
      <div className="w-full max-w-95 flex justify-end relative z-10">
        <button
          onClick={skip}
          className="text-[0.85rem] font-medium transition-colors cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-95 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Illustration */}
            <Image
              src={current.illustration}
              alt={current.title}
              width={280}
              height={280}
              className="mb-8 w-auto h-80"
              priority
            />

            {/* Title */}
            <h1
              className="font-bold tracking-[-0.03em] mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 5vw, 2rem)",
                lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              {current.title}
            </h1>

            {/* Description */}
            <p
              className="max-w-75"
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + Next */}
      <div className="w-full max-w-95 flex flex-col items-center gap-6 relative z-10">
        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={i + 1}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                i === step ? "w-8" : "w-2",
              )}
              style={{
                background: i === step ? s.dotColor : "var(--border-subtle)",
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button variant="primary" fullWidth onClick={next}>
          {step === slides.length - 1 ? "Get Started" : "Next"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
