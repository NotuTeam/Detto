"use client";

import { useMemo } from "react";

const DECOR_COUNT = 7;

function pickFromSeed(seed: number, offset: number): number {
  return ((seed * 7 + offset * 13) % DECOR_COUNT) + 1;
}

function getPair(seed: number): [number, number] {
  const a = pickFromSeed(seed, 0);
  const b =
    pickFromSeed(seed, 1) === a ? (a % DECOR_COUNT) + 1 : pickFromSeed(seed, 1);
  return [a, b];
}

interface PageBlobsProps {
  seed: number;
}

export function PageBlobs({ seed }: PageBlobsProps) {
  const [img1, img2] = useMemo(() => getPair(seed), [seed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <img
        src={`/decor/${img1}.png`}
        alt=""
        className="absolute -top-20 -right-20 w-64 h-64 object-contain opacity-25"
      />
      <img
        src={`/decor/${img2}.png`}
        alt=""
        className="absolute -bottom-16 -left-16 w-48 h-48 object-contain opacity-20"
      />
    </div>
  );
}

interface CardDecorProps {
  seed: number;
}

export function CardDecor({ seed }: CardDecorProps) {
  const img = useMemo(() => pickFromSeed(seed, 0), [seed]);

  return (
    <img
      src={`/decor/${img}.png`}
      alt=""
      aria-hidden="true"
      className="absolute -top-4 -right-4 w-24 h-24 object-contain opacity-[0.12] pointer-events-none"
    />
  );
}
