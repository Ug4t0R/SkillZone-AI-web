// RichTextEditor — WYSIWYG editor with emoji picker for DevMenu
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Code, List, Link, Smile, X } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
    /** If true, renders as a simple code/monospace editor (no rich formatting) */
    codeMode?: boolean;
}

// ─── EMOJI DATA ──────────────────────────────────────────────────────

const EMOJI_CATEGORIES: Record<string, string[]> = {
    '🎮 Gaming': ['🎮', '🕹️', '🏆', '⚔️', '🎯', '🔥', '💀', '👾', '🎲', '🃏', '🏅', '💣', '🧨', '🎪', '🎰', '⭐', '🌟', '💫', '✨', '🔫'],
    '😀 Smileys': ['😀', '😂', '🤣', '😎', '🤩', '😍', '🥳', '😏', '😤', '😡', '🤯', '😱', '🥶', '🤮', '💀', '👻', '🤡', '🙃', '😈', '👀'],
    '👍 Hands': ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤘', '🤙', '💪', '🖕', '🫡', '✊', '👊', '🫶', '👋', '🤞', '🫰', '👌', '🤌', '🤏'],
    '🏷️ Symbols': ['❤️', '💔', '💯', '✅', '❌', '⚠️', '🚀', '💡', '🔑', '🎵', '📌', '📢', '🔔', '💬', '💭', '🏴', '🚩', '⏰', '🔗', '📎'],
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = '120px', codeMode = false }) => {
    const [showEmoji, setShowEmoji] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmoji(false);
            }
        };
        if (showEmoji) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmoji]);

    const insertAtCursor = useCallback((text: string) => {
        const el = textareaRef.current;
        if (!el) {
            onChange(value + text);
            return;
        }
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newVal = value.slice(0, start) + text + value.slice(end);
        onChange(newVal);
        // Restore cursor after insertion
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + text.length;
            el.focus();
        });
    }, [value, onChange]);

    const wrapSelection = useCallback((before: string, after: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end);
        const wrapped = before + (selected || 'text') + after;
        const newVal = value.slice(0, start) + wrapped + value.slice(end);
        onChange(newVal);
        requestAnimationFrame(() => {
            if (selected) {
                el.selectionStart = start;
                el.selectionEnd = start + wrapped.length;
            } else {
                el.selectionStart = start + before.length;
                el.selectionEnd = start + before.length + 4;
            }
            el.focus();
        });
    }, [value, onChange]);

    return (
        <div className="border border-white/10 rounded-lg overflow-hidden bg-black focus-within:border-sz-red/50 transition-colors">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-800/80 border-b border-white/5">
                {!codeMode && (
                    <>
                        <ToolbarBtn icon={<Bold className="w-3.5 h-3.5" />} title="Bold" onClick={() => wrapSelection('**', '**')} />
                        <ToolbarBtn icon={<Italic className="w-3.5 h-3.5" />} title="Italic" onClick={() => wrapSelection('_', '_')} />
                        <ToolbarBtn icon={<Code className="w-3.5 h-3.5" />} title="Code" onClick={() => wrapSelection('`', '`')} />
                        <ToolbarBtn icon={<List className="w-3.5 h-3.5" />} title="List" onClick={() => insertAtCursor('\n- ')} />
                        <ToolbarBtn icon={<Link className="w-3.5 h-3.5" />} title="Link" onClick={() => wrapSelection('[', '](url)')} />
                        <div className="w-px h-5 bg-white/10 mx-1" />
                    </>
                )}
                <div className="relative" ref={emojiRef}>
                    <ToolbarBtn
                        icon={<Smile className="w-3.5 h-3.5" />}
                        title="Emoji"
                        active={showEmoji}
                        onClick={() => setShowEmoji(!showEmoji)}
                    />
                    {showEmoji && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl shadow-black/50 w-[320px] animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Category Tabs */}
                            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setEmojiCategory(cat)}
                                        className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${emojiCategory === cat ? 'border-sz-red text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                                    >
                                        {cat.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                            {/* Emoji Grid */}
                            <div className="p-2 grid grid-cols-10 gap-0.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                                {EMOJI_CATEGORIES[emojiCategory]?.map((emoji, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            insertAtCursor(emoji);
                                            setShowEmoji(false);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center text-lg hover:bg-white/10 rounded transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Area */}
            <textarea
                ref={textareaRef}
                className={`w-full bg-transparent p-3 text-white outline-none resize-y custom-scrollbar ${codeMode ? 'font-mono text-xs' : 'text-sm'}`}
                style={{ minHeight }}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
};

// ─── TOOLBAR BUTTON ──────────────────────────────────────────────────

const ToolbarBtn: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void; active?: boolean }> = ({ icon, title, onClick, active }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded transition-colors ${active ? 'bg-sz-red/20 text-sz-red' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
        {icon}
    </button>
);

export default RichTextEditor;
