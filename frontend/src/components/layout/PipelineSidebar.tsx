"use client";

import { motion } from "framer-motion";
import {
    FileText,
    LayoutGrid,
    Palette,
    Film,
    Music,
    Download,
    ChevronRight
} from "lucide-react";
import clsx from "clsx";

import { LucideIcon } from "lucide-react";

interface Step {
    id: string;
    label: string;
    icon: any; // Using any for LucideIcon to avoid type strictness issues with different versions
}

interface PipelineSidebarProps {
    activeStep: string;
    onStepChange: (stepId: string) => void;
    steps: Step[];
}

export default function PipelineSidebar({ activeStep, onStepChange, steps }: PipelineSidebarProps) {
    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 h-screen border-r border-glass-border bg-black/40 backdrop-blur-xl flex flex-col z-50"
        >
            <div className="p-6 border-b border-glass-border">
                <h1 className="font-display text-xl font-bold tracking-tight text-white">
                    AI-Manga <span className="text-primary">Studio</span>
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {steps.map((step, index) => {
                    const isActive = activeStep === step.id;
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.id}
                            onClick={() => onStepChange(step.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-full bg-primary"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}

                            <Icon size={20} className={clsx("transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />

                            <div className="flex flex-col items-start text-sm">
                                <span className="font-medium">{step.label}</span>
                                <span className="text-[10px] opacity-50 font-mono">STEP 0{index + 1}</span>
                            </div>

                            {isActive && (
                                <ChevronRight size={16} className="ml-auto opacity-50" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-glass-border">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">Project Alpha</span>
                        <span className="text-xs text-gray-500">v0.1.0</span>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}
