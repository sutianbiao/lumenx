"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layout, Image as ImageIcon, Box, Type, Move,
    ZoomIn, ZoomOut, Layers, Settings, Play,
    ChevronRight, ChevronLeft, Trash2, Copy, Wand2, Users, FileText, RefreshCw, Loader2, X, Lock, Unlock
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { api, API_URL } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";

export default function StoryboardComposer() {
    const currentProject = useProjectStore((state) => state.currentProject);
    const selectedFrameId = useProjectStore((state) => state.selectedFrameId);
    const setSelectedFrameId = useProjectStore((state) => state.setSelectedFrameId);
    const updateProject = useProjectStore((state) => state.updateProject);

    const [isRendering, setIsRendering] = useState<Set<string>>(new Set()); // Store multiple frame IDs being rendered
    const [isReparsing, setIsReparsing] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<{ url: string; prompt: string } | null>(null); // Track zoomed image URL and prompt

    const handleReparse = async () => {
        if (!currentProject) return;
        if (!confirm("Re-analyzing will overwrite current scenes, characters, and frames based on the text. Continue?")) return;

        setIsReparsing(true);
        try {
            const updatedProject = await api.reparseProject(currentProject.id, currentProject.originalText);
            updateProject(currentProject.id, updatedProject);
            alert("Script re-analyzed successfully!");
        } catch (error) {
            console.error("Reparse failed:", error);
            alert("Failed to re-analyze script.");
        } finally {
            setIsReparsing(false);
        }
    };

    const handleImageClick = (imageUrl: string, prompt: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomedImage({ url: imageUrl, prompt });
    };

    const handleRenderFrame = async (frame: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentProject) return;

        setIsRendering(prev => new Set(prev).add(frame.id));
        try {
            // Construct composition data with references
            const compositionData: any = {
                character_ids: frame.character_ids,
                prop_ids: frame.prop_ids,
                scene_id: frame.scene_id,
                reference_image_urls: []
            };

            // 1. Add Scene Image
            if (frame.scene_id) {
                const scene = currentProject.scenes?.find((s: any) => s.id === frame.scene_id);
                if (scene && scene.image_url) {
                    compositionData.reference_image_urls.push(scene.image_url);
                }
            }

            // 2. Add Character Images
            if (frame.character_ids && frame.character_ids.length > 0) {
                frame.character_ids.forEach((charId: string) => {
                    const char = currentProject.characters?.find((c: any) => c.id === charId);
                    if (char) {
                        // Prefer avatar for close-ups if available, or main image
                        if (char.avatar_url) compositionData.reference_image_urls.push(char.avatar_url);
                        else if (char.image_url) compositionData.reference_image_urls.push(char.image_url);
                    }
                });
            }

            // 3. Add Prop Images
            if (frame.prop_ids && frame.prop_ids.length > 0) {
                frame.prop_ids.forEach((propId: string) => {
                    const prop = currentProject.props?.find((p: any) => p.id === propId);
                    if (prop && prop.image_url) {
                        compositionData.reference_image_urls.push(prop.image_url);
                    }
                });
            }

            // Construct Enhanced Prompt using Art Direction (or fallback to legacy)
            const artDirection = currentProject?.art_direction;
            let globalStylePrompt = "";

            if (artDirection?.style_config) {
                // Use Art Direction style
                globalStylePrompt = artDirection.style_config.positive_prompt;
            } else {
                // Fallback to legacy style system
                const styles = useProjectStore.getState().styles;
                const selectedStyleId = useProjectStore.getState().selectedStyleId;
                const currentStyle = styles.find(s => s.id === selectedStyleId);
                globalStylePrompt = currentStyle?.prompt || "";
            }

            // Combine: [Global Style] + [Action] + [Dialogue] + [Visual Details]
            const parts = [
                globalStylePrompt,
                frame.action_description,
                frame.dialogue ? `Dialogue context: "${frame.dialogue}"` : "",
                frame.image_prompt // Manual overrides or extra details
            ].filter(Boolean);

            const finalPrompt = parts.join(" . ");

            await api.renderFrame(currentProject.id, frame.id, compositionData, finalPrompt);

            // Fetch updated project to get new image URL and timestamp
            const updatedProject = await api.getProject(currentProject.id);
            useProjectStore.getState().updateProject(currentProject.id, updatedProject);

        } catch (error) {
            console.error("Render failed:", error);
            alert("Render failed. See console for details.");
        } finally {
            setIsRendering(prev => {
                const next = new Set(prev);
                next.delete(frame.id);
                return next;
            });
        }
    };

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden">
            {/* Left Column: Script Viewer */}
            <div className="w-1/3 min-w-[300px] max-w-[500px] border-r border-white/10 flex flex-col bg-[#111]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <FileText size={16} className="text-primary" /> Original Script
                    </h3>
                    <button
                        onClick={handleReparse}
                        disabled={isReparsing}
                        className="flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors disabled:opacity-50"
                        title="Re-extract entities from script"
                    >
                        <RefreshCw size={12} className={isReparsing ? "animate-spin" : ""} />
                        {isReparsing ? "Analyzing..." : "Re-Analyze"}
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    <textarea
                        className="flex-1 w-full h-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm text-gray-300 resize-none focus:outline-none focus:border-primary/50 leading-relaxed"
                        value={currentProject?.originalText || ""}
                        onChange={(e) => updateProject(currentProject!.id, { originalText: e.target.value })}
                        placeholder="Paste your script here..."
                    />
                </div>
            </div>

            {/* Center Column: Frame List */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111]">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <Layout size={16} className="text-primary" /> Storyboard Frames
                    </h3>
                    <div className="text-xs text-gray-500">
                        {currentProject?.frames?.length || 0} Frames
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {currentProject?.frames?.map((frame: any, index: number) => (
                            <motion.div
                                key={frame.id}
                                layoutId={frame.id}
                                onClick={() => setSelectedFrameId(frame.id)}
                                className={`group relative flex gap-6 p-4 rounded-xl border transition-all cursor-pointer ${selectedFrameId === frame.id
                                    ? "bg-white/5 border-primary ring-1 ring-primary"
                                    : "bg-[#161616] border-white/5 hover:border-white/20"
                                    }`}
                            >
                                {/* Frame Number */}
                                <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400 shadow-lg z-10">
                                    {index + 1}
                                </div>

                                {/* Image Preview */}
                                <div className="w-64 aspect-video bg-black/40 rounded-lg border border-white/5 overflow-hidden flex-shrink-0 relative">
                                    {frame.rendered_image_url || frame.image_url ? (
                                        <ImageWithRetry
                                            key={frame.id + (frame.updated_at || 0)} // Force remount on refresh
                                            src={getAssetUrl(frame.rendered_image_url || frame.image_url) + `?t=${frame.updated_at || 0}`}
                                            alt={`Frame ${index + 1}`}
                                            className="w-full h-full object-cover cursor-zoom-in"
                                            onClick={(e: React.MouseEvent) => handleImageClick(
                                                getAssetUrl(frame.rendered_image_url || frame.image_url) + `?t=${frame.updated_at || 0}`,
                                                frame.image_prompt || frame.action_description, // Pass prompt
                                                e
                                            )}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                                            <ImageIcon size={24} className="opacity-20" />
                                            <span className="text-[10px]">No Image</span>
                                        </div>
                                    )

                                    }

                                    {/* Hover Actions - pointer-events-none to allow image click */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                        {/* Lock Button */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!currentProject) return;
                                                try {
                                                    await api.toggleFrameLock(currentProject.id, frame.id);
                                                    const updated = await api.getProject(currentProject.id);
                                                    updateProject(currentProject.id, updated);
                                                } catch (error) {
                                                    console.error("Toggle lock failed:", error);
                                                }
                                            }}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 pointer-events-auto"
                                            title={frame.locked ? "解锁" : "锁定"}
                                        >
                                            {frame.locked ? <Unlock size={14} /> : <Lock size={14} />}
                                        </button>



                                        {/* Render Button - only show if not locked */}
                                        {!frame.locked && (
                                            <button
                                                onClick={(e) => handleRenderFrame(frame, e)}
                                                disabled={isRendering.has(frame.id)}
                                                className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                                            >
                                                {isRendering.has(frame.id) ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 size={14} />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action</span>
                                                {frame.camera_movement && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                                                        {frame.camera_movement}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">
                                                {frame.action_description}
                                            </p>
                                        </div>
                                    </div>

                                    {frame.dialogue && (
                                        <div className="mt-auto pt-3 border-t border-white/5">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Dialogue</span>
                                            <p className="text-sm text-gray-400 italic">"{frame.dialogue}"</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Image Zoom Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setZoomedImage(null)}
                    >
                        <div className="relative max-w-5xl w-full flex gap-8 pointer-events-auto" onClick={e => e.stopPropagation()}>
                            {/* Image */}
                            <div className="flex-1 flex items-center justify-center">
                                <motion.img
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.9 }}
                                    src={zoomedImage.url}
                                    alt="Zoomed"
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                />
                            </div>

                            {/* Prompt Info */}
                            <div className="w-80 bg-[#1a1a1a] border border-white/10 rounded-xl p-6 flex flex-col gap-4 h-fit">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Wand2 size={18} />
                                    <h3 className="font-bold text-white">Generation Prompt</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[60vh]">
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-black/30 p-3 rounded-lg border border-white/5">
                                        {zoomedImage.prompt || "No prompt available"}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    This prompt was constructed from the Global Style, Action Description, and Dialogue.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ImageWithRetry({ src, alt, className, onClick }: { src: string, alt: string, className?: string, onClick?: (e: React.MouseEvent) => void }) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const imgRef = useRef<HTMLImageElement>(null);

    // Reset state when src changes
    useEffect(() => {
        setIsLoading(true);
        setError(false);
        setRetryCount(0);
    }, [src]);

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            if (imgRef.current.naturalWidth > 0) {
                setIsLoading(false);
            }
        }
    }, [src]);

    useEffect(() => {
        if (error && retryCount < 10) {
            const timer = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setError(false);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return () => clearTimeout(timer);
        }
    }, [error, retryCount]);

    // Construct src with retry param to bypass cache if retrying
    const displaySrc = retryCount > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}` : src;

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm z-10">
                    <RefreshCw className="animate-spin text-white/50" size={24} />
                </div>
            )}
            <img
                ref={imgRef}
                src={displaySrc}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setError(true);
                    setIsLoading(true); // Keep showing loader while retrying
                }}
                onClick={onClick}
            />
            {error && retryCount >= 10 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm z-20 p-2 text-center">
                    <span className="text-xs text-red-400 font-bold">Failed to load</span>
                    <span className="text-[10px] text-red-400/70 break-all">{src}</span>
                </div>
            )}
        </div>
    );
}
