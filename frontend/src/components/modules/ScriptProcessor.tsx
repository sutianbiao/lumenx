"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, User, MapPin, Box, ChevronRight, ChevronLeft, Save, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useProjectStore } from "@/store/projectStore";

interface ScriptNode {
    type: "character" | "scene" | "prop";
    id?: string;
    name: string;
    desc: string;
    // Extended attributes
    age?: string;
    gender?: string;
    clothing?: string;
    visual_weight?: number;
}

export default function ScriptProcessor() {
    const currentProject = useProjectStore((state) => state.currentProject);
    const updateProject = useProjectStore((state) => state.updateProject);
    const analyzeProject = useProjectStore((state) => state.analyzeProject);
    const isAnalyzing = useProjectStore((state) => state.isAnalyzing);

    // Initialize from project data
    const [script, setScript] = useState(currentProject?.originalText || "");
    const [nodes, setNodes] = useState<ScriptNode[]>([]);

    // UI State
    const [selectedNode, setSelectedNode] = useState<ScriptNode | null>(null);
    const [showPanel, setShowPanel] = useState(true);

    // Sync from project
    useEffect(() => {
        if (currentProject) {
            setScript(currentProject.originalText || "");
            const newNodes: ScriptNode[] = [
                ...currentProject.characters.map((c: any) => ({
                    type: "character" as const,
                    id: c.id,
                    name: c.name,
                    desc: c.description,
                    age: c.age,
                    gender: c.gender,
                    clothing: c.clothing,
                    visual_weight: c.visual_weight
                })),
                ...currentProject.scenes.map((s: any) => ({
                    type: "scene" as const,
                    id: s.id,
                    name: s.name,
                    desc: s.description,
                    visual_weight: s.visual_weight
                })),
                ...currentProject.props.map((p: any) => ({
                    type: "prop" as const,
                    id: p.id,
                    name: p.name,
                    desc: p.description
                }))
            ];
            setNodes(newNodes);
        }
    }, [currentProject]); // Depend on the whole object to catch updates

    const handleAnalyze = async () => {
        if (!script) return;
        try {
            await analyzeProject(script);
        } catch (error) {
            console.error("Failed to analyze script:", error);
        }
    };

    // Simple highlighting logic (MVP)
    // In a real app, we'd use a rich text editor. Here we just highlight names in the text overlay?
    // Actually, let's just highlight the entities in the right panel for now, 
    // and maybe add a "Find in Text" feature later.

    const handleNodeUpdate = (updatedNode: ScriptNode) => {
        // Update local state
        setNodes(prev => prev.map(n => n.name === updatedNode.name ? updatedNode : n));
        setSelectedNode(updatedNode);

        // TODO: Sync back to backend/store if needed immediately, 
        // but typically we wait for a "Save" or auto-save.
        // For now, let's just update the store structure locally? 
        // It's a bit complex to map back to specific arrays without IDs, but we have IDs now.
    };

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            {/* Left: Script Editor */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${showPanel ? 'mr-0' : 'mr-0'}`}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-primary" size={18} />
                        剧本编辑器
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAnalyze}
                            disabled={!script || isAnalyzing}
                            className="glass-button px-4 py-1.5 text-sm flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/10"
                        >
                            {isAnalyzing ? <Wand2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                            {isAnalyzing ? "智能分析中..." : "提取实体"}
                        </button>
                        <button
                            onClick={() => setShowPanel(!showPanel)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                        >
                            {showPanel ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative p-6">
                    <textarea
                        value={script}
                        onChange={(e) => {
                            const newText = e.target.value;
                            setScript(newText);
                            if (currentProject) {
                                updateProject(currentProject.id, { originalText: newText });
                            }
                        }}
                        placeholder="在此粘贴小说或剧本内容..."
                        className="w-full h-full bg-transparent text-gray-300 font-mono text-base leading-relaxed resize-none focus:outline-none"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Right: Entity Intelligence Panel */}
            <AnimatePresence mode="popLayout">
                {showPanel && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 400, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="border-l border-white/10 bg-black/40 backdrop-blur-md flex flex-col h-full"
                    >
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-bold text-white">实体识别面板</h3>
                            <p className="text-xs text-gray-500">已识别 {nodes.length} 个关键要素</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {nodes.length === 0 && !isAnalyzing && (
                                <div className="text-center text-gray-500 mt-10 text-sm">
                                    点击“提取实体”开始分析
                                </div>
                            )}

                            {nodes.map((node, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedNode(node)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${selectedNode?.name === node.name
                                        ? "border-primary bg-primary/5"
                                        : "border-white/10 bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {node.type === "character" && <User size={14} className="text-blue-400" />}
                                            {node.type === "scene" && <MapPin size={14} className="text-green-400" />}
                                            {node.type === "prop" && <Box size={14} className="text-yellow-400" />}
                                            <span className="font-bold text-sm text-gray-200">{node.name}</span>
                                        </div>
                                        {node.visual_weight && (
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, w) => (
                                                    <div key={w} className={`w-1 h-3 rounded-full ${w < (node.visual_weight || 0) ? "bg-primary" : "bg-white/10"}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2">{node.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Attribute Card (Popover) */}
            <AnimatePresence>
                {selectedNode && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-[500px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${selectedNode.type === "character" ? "bg-blue-500/20 text-blue-400" :
                                            selectedNode.type === "scene" ? "bg-green-500/20 text-green-400" :
                                                "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                            {selectedNode.type}
                                        </span>
                                        <h2 className="text-xl font-bold text-white">{selectedNode.name}</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">实体属性配置</p>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white">✕</button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">视觉描述 (Visual Description)</label>
                                    <textarea
                                        value={selectedNode.desc}
                                        onChange={e => handleNodeUpdate({ ...selectedNode, desc: e.target.value })}
                                        className="glass-input w-full h-24 resize-none text-sm"
                                    />
                                </div>

                                {selectedNode.type === "character" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">年龄 (Age)</label>
                                            <input
                                                type="text"
                                                value={selectedNode.age || ""}
                                                onChange={e => handleNodeUpdate({ ...selectedNode, age: e.target.value })}
                                                className="glass-input w-full text-sm"
                                                placeholder="e.g. 18"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">性别 (Gender)</label>
                                            <input
                                                type="text"
                                                value={selectedNode.gender || ""}
                                                onChange={e => handleNodeUpdate({ ...selectedNode, gender: e.target.value })}
                                                className="glass-input w-full text-sm"
                                                placeholder="e.g. Female"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-gray-500 mb-1">服装 (Clothing)</label>
                                            <input
                                                type="text"
                                                value={selectedNode.clothing || ""}
                                                onChange={e => handleNodeUpdate({ ...selectedNode, clothing: e.target.value })}
                                                className="glass-input w-full text-sm"
                                                placeholder="e.g. Black Hoodie"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedNode.type !== "prop" && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">视觉权重 (Visual Weight)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(w => (
                                                <button
                                                    key={w}
                                                    onClick={() => handleNodeUpdate({ ...selectedNode, visual_weight: w })}
                                                    className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${(selectedNode.visual_weight || 3) === w
                                                        ? "bg-primary text-white"
                                                        : "bg-white/5 text-gray-500 hover:bg-white/10"
                                                        }`}
                                                >
                                                    {w}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-1 text-center">
                                            1: 背景路人 — 3: 重要配角 — 5: 核心主角 (需LoRA训练)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                                <button
                                    onClick={async () => {
                                        if (currentProject && selectedNode && selectedNode.id) {
                                            try {
                                                // Construct attributes to update
                                                const attributes: any = {
                                                    description: selectedNode.desc,
                                                    visual_weight: selectedNode.visual_weight
                                                };

                                                if (selectedNode.type === "character") {
                                                    attributes.age = selectedNode.age;
                                                    attributes.gender = selectedNode.gender;
                                                    attributes.clothing = selectedNode.clothing;
                                                }

                                                const updatedProject = await api.updateAssetAttributes(
                                                    currentProject.id,
                                                    selectedNode.id,
                                                    selectedNode.type,
                                                    attributes
                                                );

                                                updateProject(currentProject.id, updatedProject);
                                                console.log("Asset attributes updated successfully");
                                                // alert("配置已保存"); // Optional: Feedback
                                                setSelectedNode(null);
                                            } catch (error) {
                                                console.error("Failed to update asset attributes:", error);
                                                alert("保存失败，请重试");
                                            }
                                        } else {
                                            setSelectedNode(null);
                                        }
                                    }}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                                >
                                    <Save size={14} /> 保存配置
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
