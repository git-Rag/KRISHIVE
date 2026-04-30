"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MicButton } from "@/components/home/MicButton";

const slides = [
  { src: "/hero-farm-1.svg", alt: "Indian farm landscape with crops and irrigation" },
  { src: "/hero-farm-2.svg", alt: "Farmer standing in a cultivated field" },
  { src: "/hero-farm-3.svg", alt: "Rural irrigation and healthy crop fields" },
];

type HeroShowcaseProps = {
  headline: string;
  subtext: string;
  micLabel: string;
  isRecording: boolean;
  onMicClick: () => void;
};

export function HeroShowcase({ headline, subtext, micLabel, isRecording, onMicClick }: HeroShowcaseProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Farming showcase" className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6">
      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-[#d8d2bf] sm:h-[360px]">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 640px) 100vw, 1200px"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            className={`object-cover transition-opacity duration-700 ${index === current ? "opacity-100" : "opacity-0"}`}
          />
        ))}

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b5e20]/50 via-[#1b5e20]/20 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h2 className="max-w-xl text-2xl font-semibold leading-tight text-white sm:text-4xl">{headline}</h2>
          <p className="mt-3 max-w-lg text-sm text-[#f1f4ef] sm:text-lg">{subtext}</p>
          <div className="mt-5">
            <MicButton isRecording={isRecording} onClick={onMicClick} label={micLabel} prominent />
          </div>
        </div>
      </div>
    </section>
  );
}
