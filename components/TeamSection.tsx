import React, { useState, useEffect } from 'react';
import { Users, Shield, Swords, Heart, Crosshair, Search, Crown, MapPin } from 'lucide-react';
import { TEAM_DATA, TeamMember } from '../data/team';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';
import { useAppContext } from '../context/AppContext';

const CLASS_ICONS: Record<string, React.ReactNode> = {
    Commander: <Crown className="w-4 h-4" />,
    Tank: <Shield className="w-4 h-4" />,
    Support: <Heart className="w-4 h-4" />,
    DPS: <Swords className="w-4 h-4" />,
    Healer: <Heart className="w-4 h-4" />,
    Scout: <Search className="w-4 h-4" />,
};

const RANK_COLORS: Record<string, string> = {
    Boss: 'from-yellow-500 to-amber-600',
    Officer: 'from-sz-red to-red-700',
    Veteran: 'from-blue-500 to-blue-700',
    Recruit: 'from-green-500 to-green-700',
};

const RANK_BORDER: Record<string, string> = {
    Boss: 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]',
    Officer: 'border-sz-red/40 shadow-[0_0_20px_rgba(227,30,36,0.15)]',
    Veteran: 'border-blue-500/30',
    Recruit: 'border-green-500/30',
};

interface TeamSectionProps {
    visible?: boolean;
}

const TeamSection: React.FC<TeamSectionProps> = ({ visible = true }) => {
    const { t } = useAppContext();
    const headingRef = useScrollReveal<HTMLDivElement>();
    const cardsRef = useStaggerReveal<HTMLDivElement>({ staggerDelay: 120 });

    if (!visible) return null;

    const boss = TEAM_DATA.find(m => m.rank === 'Boss');
    const crew = TEAM_DATA.filter(m => m.rank !== 'Boss');

    const renderCard = (member: TeamMember, isBoss: boolean = false) => (
        <div
            key={member.id}
            className={`relative group bg-zinc-900/60 border rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${RANK_BORDER[member.rank]} ${isBoss ? 'col-span-full max-w-xl mx-auto w-full' : ''}`}
        >
            {/* Top gradient bar */}
            <div className={`h-1 bg-gradient-to-r ${RANK_COLORS[member.rank]}`} />

            {/* Card content */}
            <div className={`p-6 ${isBoss ? 'md:flex md:items-start md:gap-8' : ''}`}>
                {/* Avatar + rank */}
                <div className={`flex flex-col items-center ${isBoss ? 'md:w-40 md:shrink-0' : 'mb-4'}`}>
                    <div className={`w-20 h-20 rounded-full bg-black/60 border-2 flex items-center justify-center text-4xl mb-3 transition-transform group-hover:scale-110 ${isBoss ? 'border-yellow-500/60 w-24 h-24 text-5xl shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-white/10'}`}>
                        {member.emoji}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r ${RANK_COLORS[member.rank]} text-white shadow-lg`}>
                        {member.rank}
                    </span>
                </div>

                {/* Info */}
                <div className={`${isBoss ? 'flex-1 md:text-left text-center' : 'text-center'}`}>
                    <h3 className={`font-orbitron font-black uppercase tracking-tight ${isBoss ? 'text-2xl text-yellow-400' : 'text-lg text-white'}`}>
                        {member.nickname}
                    </h3>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-0.5">
                        {member.name} — {member.role}
                    </p>

                    {/* Class + Location */}
                    <div className={`flex items-center gap-3 mt-3 ${isBoss ? 'md:justify-start justify-center' : 'justify-center'}`}>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-sz-red bg-sz-red/10 px-2 py-1 rounded">
                            {CLASS_ICONS[member.class]} {member.class}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <MapPin className="w-3 h-3" /> {member.location}
                        </span>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed">{member.bio}</p>

                    {/* Skills */}
                    <div className={`flex flex-wrap gap-1.5 mt-4 ${isBoss ? 'md:justify-start justify-center' : 'justify-center'}`}>
                        {member.skills.map(skill => (
                            <span key={skill} className="text-[9px] font-mono font-bold uppercase px-2 py-1 rounded bg-white/5 text-gray-500 border border-white/5">
                                {skill}
                            </span>
                        ))}
                    </div>

                    {/* XP bar */}
                    <div className={`mt-4 ${isBoss ? 'md:max-w-xs' : ''}`}>
                        <div className="flex justify-between text-[9px] font-mono text-gray-600 mb-1">
                            <span>XP since {member.joinedYear}</span>
                            <span>{new Date().getFullYear() - member.joinedYear}+ yrs</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${RANK_COLORS[member.rank]} transition-all duration-1000`}
                                style={{ width: `${Math.min(100, ((new Date().getFullYear() - member.joinedYear) / 20) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Grid bg */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.8)_1px,transparent_1px)] bg-[length:50px_50px] opacity-20 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                {/* Header */}
                <div ref={headingRef} className="scroll-reveal sr-glitch text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-sz-red/10 border border-sz-red/30 px-3 py-1 rounded mb-4">
                        <Users className="w-4 h-4 text-sz-red" />
                        <span className="text-sz-red font-mono text-xs uppercase font-bold tracking-widest">Party Roster</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-orbitron font-black text-white uppercase tracking-tighter">
                        Náš <span className="text-sz-red text-glow">Tým</span>
                    </h2>
                    <p className="text-gray-500 font-mono text-sm mt-4 max-w-lg mx-auto">
                        Lidi, co stojí za SkillZone. Od 2005 budujeme to nejlepší místo pro gamery v Praze.
                    </p>
                </div>

                {/* Cards */}
                <div ref={cardsRef} className="sr-stagger scroll-reveal">
                    {/* All members in one grid — boss gets gold accent but no separate row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TEAM_DATA.map(m => renderCard(m))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamSection;
