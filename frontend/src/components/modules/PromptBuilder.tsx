import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useLayoutEffect } from "react";
import { X, ChevronDown, Video } from "lucide-react";

export type PromptSegment =
    | { type: "text"; value: string; id: string }
    | { type: "camera"; value: string; label: string; id: string };

interface PromptBuilderProps {
    segments: PromptSegment[];
    onChange: (segments: PromptSegment[]) => void;
    onSubmit?: () => void;
}

export interface PromptBuilderRef {
    insertCamera: () => void;
}

const CAMERA_GROUPS = [
    {
        label: "Basic Movement (基础运镜)",
        options: [
            { label: "⬅️ 水平左移 (Pan Left)", value: "camera pans left" },
            { label: "➡️ 水平右移 (Pan Right)", value: "camera pans right" },
            { label: "⬆️ 向上推移 (Tilt Up)", value: "camera pans up" },
            { label: "⬇️ 向下推移 (Tilt Down)", value: "camera pans down" },
            { label: "🔍+ 镜头推进 (Zoom In)", value: "zoom in, close up" },
            { label: "🔍- 镜头拉远 (Zoom Out)", value: "zoom out, wide angle" },
        ]
    },
    {
        label: "Cinematic (高级/电影感运镜)",
        options: [
            { label: "🔄 环绕拍摄 (Orbit)", value: "camera orbits around, 360 degree view" },
            { label: "👀 第一人称 (FPV)", value: "FPV view, first person perspective" },
            { label: "✈️ 无人机航拍 (Drone)", value: "drone shot, aerial view, fly over" },
            { label: "🎦 手持晃动 (Handheld)", value: "handheld camera, shaky cam, realistic" },
            { label: "🏃 跟随运镜 (Tracking)", value: "tracking shot, following the subject" },
            { label: "📍 固定机位 (Static)", value: "static camera, no movement, tripod shot" },
        ]
    }
];

// Helper to find option across groups
const findCameraOption = (value: string) => {
    for (const group of CAMERA_GROUPS) {
        const found = group.options.find(opt => opt.value === value);
        if (found) return found;
    }
    return null;
};

const PromptBuilder = forwardRef<PromptBuilderRef, PromptBuilderProps>(({ segments, onChange, onSubmit }, ref) => {
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isComposing = useRef(false);

    // Initialize with one text segment if empty
    useEffect(() => {
        if (segments.length === 0) {
            onChange([{ type: "text", value: "", id: Math.random().toString(36).substr(2, 9) }]);
        }
    }, []);

    // Restore cursor position after render
    useLayoutEffect(() => {
        if (activeSegmentId && !isComposing.current) {
            const el = document.getElementById(`segment-${activeSegmentId}`);
            if (el && el.childNodes.length > 0) {
                const range = document.createRange();
                const sel = window.getSelection();
                try {
                    // Ensure cursor position is within bounds
                    const textNode = el.childNodes[0];
                    const safePosition = Math.min(cursorPosition, textNode.textContent?.length || 0);

                    range.setStart(textNode, safePosition);
                    range.collapse(true);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                } catch (e) {
                    // Fallback if something goes wrong
                    console.warn("Failed to set cursor position", e);
                }
            } else if (el) {
                // Empty element
                el.focus();
            }
        }
    }, [segments, activeSegmentId, cursorPosition]);

    useImperativeHandle(ref, () => ({
        insertCamera: () => {
            const currentSegmentIndex = segments.findIndex(s => s.id === activeSegmentId);
            const defaultCamera = { value: "camera pans left", label: "水平左移 (Pan Left)" };

            if (currentSegmentIndex === -1) {
                // If no active segment, append to end
                const newId = Math.random().toString(36).substr(2, 9);
                const textId = Math.random().toString(36).substr(2, 9);
                onChange([
                    ...segments,
                    { type: "camera", value: defaultCamera.value, label: defaultCamera.label, id: newId },
                    { type: "text", value: "", id: textId }
                ]);
                setTimeout(() => setActiveSegmentId(textId), 0);
                return;
            }

            const currentSegment = segments[currentSegmentIndex];
            if (currentSegment.type === "text") {
                // Split text segment
                const preText = currentSegment.value.substring(0, cursorPosition);
                const postText = currentSegment.value.substring(cursorPosition);

                const cameraId = Math.random().toString(36).substr(2, 9);
                const postTextId = Math.random().toString(36).substr(2, 9);

                const newSegments = [...segments];
                newSegments.splice(currentSegmentIndex, 1,
                    { ...currentSegment, value: preText },
                    { type: "camera", value: defaultCamera.value, label: defaultCamera.label, id: cameraId },
                    { type: "text", value: postText, id: postTextId }
                );

                onChange(newSegments);
                setTimeout(() => setActiveSegmentId(postTextId), 0);
            }
        }
    }));

    const handleTextChange = (id: string, newValue: string) => {
        onChange(segments.map(s => s.id === id ? { ...s, value: newValue } : s));
    };

    const handleCameraChange = (id: string, newValue: string, newLabel: string) => {
        onChange(segments.map(s => s.id === id ? { ...s, value: newValue, label: newLabel } : s));
    };

    const removeSegment = (index: number) => {
        const newSegments = [...segments];

        // If removing a camera segment (which is what this is mostly for)
        if (newSegments[index].type === "camera") {
            // Merge surrounding text segments
            const prev = newSegments[index - 1];
            const next = newSegments[index + 1];

            if (prev && prev.type === "text" && next && next.type === "text") {
                // Merge next into prev
                newSegments.splice(index - 1, 3, { ...prev, value: prev.value + next.value });
                // Focus the merged segment
                setTimeout(() => {
                    const el = document.getElementById(`segment-${prev.id}`);
                    if (el) {
                        el.focus();
                        // Place cursor at the join point
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (el.childNodes[0]) {
                            range.setStart(el.childNodes[0], prev.value.length);
                            range.collapse(true);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }
                }, 0);
            } else {
                newSegments.splice(index, 1);
            }
        } else {
            // Removing text segment (should rarely happen directly, usually via merge)
            newSegments.splice(index, 1);
        }

        onChange(newSegments);
    };

    return (
        <div
            ref={containerRef}
            className="glass-input w-full min-h-[8rem] p-4 text-base leading-relaxed cursor-text whitespace-pre-wrap"
            onClick={(e) => {
                if (e.target === containerRef.current) {
                    // Focus the last text segment
                    const lastSegment = segments[segments.length - 1];
                    if (lastSegment && lastSegment.type === "text") {
                        setActiveSegmentId(lastSegment.id);
                        const el = document.getElementById(`segment-${lastSegment.id}`);
                        el?.focus();
                        // Move cursor to end
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (el && el.childNodes[0]) {
                            range.setStart(el.childNodes[0], el.textContent?.length || 0);
                            range.collapse(true);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }
                }
            }}
        >
            {segments.map((segment, index) => {
                if (segment.type === "text") {
                    return (
                        <span
                            key={segment.id}
                            className="inline outline-none min-w-[4px]"
                            contentEditable
                            id={`segment-${segment.id}`}
                            suppressContentEditableWarning
                            onCompositionStart={() => {
                                isComposing.current = true;
                            }}
                            onCompositionEnd={(e) => {
                                isComposing.current = false;
                                const selection = window.getSelection();
                                if (selection) {
                                    setCursorPosition(selection.focusOffset);
                                }
                                handleTextChange(segment.id, e.currentTarget.textContent || "");
                            }}
                            onInput={(e) => {
                                if (!isComposing.current) {
                                    const selection = window.getSelection();
                                    if (selection) {
                                        setCursorPosition(selection.focusOffset);
                                    }
                                    handleTextChange(segment.id, e.currentTarget.textContent || "");
                                }
                            }}
                            onFocus={() => setActiveSegmentId(segment.id)}
                            onBlur={() => {
                                // Don't clear active segment immediately
                            }}
                            onKeyUp={(e) => {
                                const selection = window.getSelection();
                                if (selection) {
                                    setCursorPosition(selection.focusOffset);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Backspace" && cursorPosition === 0 && index > 0) {
                                    // Backspace at start of text segment -> delete previous camera segment
                                    e.preventDefault();
                                    removeSegment(index - 1);
                                }
                            }}
                        >
                            {segment.value}
                        </span>
                    );
                } else {
                    return (
                        <span key={segment.id} className="relative group inline-flex align-middle mx-1 select-none">
                            <span className="flex items-center gap-1 bg-primary/20 border border-primary/50 text-primary px-2 py-0.5 rounded text-sm cursor-pointer hover:bg-primary/30 transition-colors">
                                <Video size={12} />
                                <span>{segment.label}</span>
                                <ChevronDown size={12} />
                            </span>
                            <select
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                value={segment.value}
                                onChange={(e) => {
                                    const selected = findCameraOption(e.target.value);
                                    if (selected) {
                                        // Remove icon from label for display
                                        const labelWithoutIcon = selected.label.substring(selected.label.indexOf(" ") + 1);
                                        handleCameraChange(segment.id, selected.value, labelWithoutIcon);
                                    }
                                }}
                            >
                                {CAMERA_GROUPS.map(group => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.options.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSegment(index);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 z-10"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    );
                }
            })}
        </div>
    );
});

PromptBuilder.displayName = "PromptBuilder";

export default PromptBuilder;
