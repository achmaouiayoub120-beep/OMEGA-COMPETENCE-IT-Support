"use client";

import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { useMemo } from "react";

interface HoloLockProps {
  score: number; // 0 to 4
}

export function HoloLock({ score }: HoloLockProps) {
  // SVG Circle parameters
  const size = 56;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const percentage = (score / 4) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Dynamic Palettes
  const colors = useMemo(() => {
    switch (score) {
      case 0:
      case 1:
        return { ring: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", bg: "rgba(239, 68, 68, 0.1)" }; // Neon Red
      case 2:
      case 3:
        return { ring: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", bg: "rgba(245, 158, 11, 0.1)" }; // Brilliant Gold
      case 4:
        return { ring: "#10b981", glow: "rgba(16, 185, 129, 0.6)", bg: "rgba(16, 185, 129, 0.15)" }; // Emerald
      default:
        return { ring: "var(--border)", glow: "transparent", bg: "transparent" };
    }
  }, [score]);

  const isUnlocked = score === 4;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      {/* Background ambient glow */}
      <motion.div 
        animate={{ backgroundColor: colors.bg, boxShadow: `0 0 20px ${colors.glow}` }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 rounded-full blur-[8px]"
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="rgba(0,0,0,0.2)"
          className="backdrop-blur-sm"
        />
        
        {/* Animated Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{ filter: `drop-shadow(0 0 4px ${colors.ring})` }}
        />
      </svg>

      {/* Center Icon with Spring Reveal */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          key={isUnlocked ? "unlocked" : "locked"}
          initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {isUnlocked ? (
            <Unlock className="w-5 h-5" style={{ color: colors.ring, filter: `drop-shadow(0 0 8px ${colors.ring})` }} strokeWidth={2.5} />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground transition-colors duration-300" style={{ color: score > 0 ? colors.ring : undefined }} strokeWidth={2} />
          )}
        </motion.div>
      </div>

      {/* Particle Burst on Unlock */}
      {isUnlocked && (
        <motion.div 
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: colors.ring }}
        />
      )}
    </div>
  );
}
