"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface GenerativeAvatarProps {
  name: string;
}

export function GenerativeAvatar({ name }: GenerativeAvatarProps) {
  // Extract initials
  const initials = useMemo(() => {
    if (!name) return "OC"; // Omega Competence default
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [name]);

  // Generate a dynamic gradient based on string length and characters
  const gradientAngle = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  }, [name]);

  const hasName = name.trim().length > 0;

  return (
    <div className="relative flex items-center justify-center w-20 h-20 rounded-full group mx-auto mb-6">
      {/* Outer Glow Halo */}
      <motion.div 
        animate={{ 
          scale: hasName ? [1, 1.15, 1] : 1,
          opacity: hasName ? 0.6 : 0.2
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-[20px]"
        style={{
          background: `linear-gradient(${gradientAngle}deg, var(--primary), #3b82f6)`
        }}
      />
      
      {/* Deep Glass Sphere */}
      <motion.div 
        animate={{ rotate: gradientAngle }}
        transition={{ type: "spring", stiffness: 40, damping: 20 }}
        className="absolute inset-0 rounded-full overflow-hidden border border-white/20 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5),_0_8px_20px_rgba(0,0,0,0.4)]"
      >
        <div 
          className="absolute inset-0 opacity-80 backdrop-blur-xl"
          style={{
            background: `linear-gradient(${gradientAngle + 45}deg, var(--primary), #8b5cf6, #3b82f6)`,
            backgroundSize: "200% 200%",
          }}
        />
        {/* Subtle glass reflection */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[2px]" />
      </motion.div>

      {/* Initials Text */}
      <AnimatePresence mode="popLayout">
        <motion.span 
          key={initials}
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5, filter: "blur(5px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative z-10 text-2xl font-black text-white tracking-widest drop-shadow-md"
        >
          {initials}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
