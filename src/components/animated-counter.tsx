"use client";

import CountUp from "react-countup";

export function AnimatedCounter({
  value,
  prefix,
  decimals,
  duration = 1,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  return (
    <CountUp
      end={value}
      duration={duration}
      separator=","
      prefix={prefix}
      decimals={decimals}
      enableScrollSpy
    />
  );
} 