// Shared types and utilities for DevMenu sub-components

import { HistoryMilestone, ProtocolRule, GamingLocation, CalendarEvent, AiSettings, SkillerState, UserProfile } from '../../types';

export interface LogEntry {
    msg: string;
    type: 'info' | 'error' | 'success';
    time: string;
}

export interface ChatSession {
    id: string;
    date: string;
    messages: { role: 'user' | 'model'; text: string; timestamp: number }[];
}

export interface DevMenuTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

export interface DatabaseTabProps extends DevMenuTabProps {
    isSyncing: boolean;
    setIsSyncing: (v: boolean) => void;
    isDownloading: boolean;
    setIsDownloading: (v: boolean) => void;
    refreshData: () => void;
}

export interface BrainTabProps extends DevMenuTabProps {
    aiSettings: AiSettings;
    setAiSettings: (s: AiSettings) => void;
    skillerState: SkillerState | null;
}

export interface ChatsTabProps extends DevMenuTabProps {
    chatHistory: ChatSession[];
    setChatHistory: (sessions: ChatSession[]) => void;
}

export interface VisualsTabProps extends DevMenuTabProps {
    generatedImages: string[];
    setGeneratedImages: (imgs: string[]) => void;
}

export interface FeedTabProps extends DevMenuTabProps {
    adminMessages: string[];
    setAdminMessages: (msgs: string[]) => void;
    dailyFeed: { user: string; msg: string }[];
    setDailyFeed: (feed: { user: string; msg: string }[]) => void;
}
