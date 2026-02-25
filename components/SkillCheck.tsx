import React, { useState, useEffect, useCallback } from 'react';
import { X, Trophy, Gamepad2, ChevronRight, Copy, Check, RotateCcw, Zap, Timer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    game: string;
}

const QUIZ_QUESTIONS_CS: QuizQuestion[] = [
    {
        question: 'Kolik stojí AWP v Counter-Strike 2?',
        options: ['$4150', '$4750', '$5000', '$4500'],
        correct: 1,
        game: 'CS2'
    },
    {
        question: 'Který champion v League of Legends má ultimátku "Requiem"?',
        options: ['Veigar', 'Karthus', 'Brand', 'Malzahar'],
        correct: 1,
        game: 'LoL'
    },
    {
        question: 'Jaký je maximální level hrdiny v Dota 2?',
        options: ['25', '30', '35', '40'],
        correct: 1,
        game: 'Dota 2'
    },
    {
        question: 'Kolik hráčů je v jednom týmu ve Valorant?',
        options: ['4', '5', '6', '3'],
        correct: 1,
        game: 'Valorant'
    },
    {
        question: 'Který materiál je v Minecraftu nejtvrdší?',
        options: ['Diamond', 'Netherite', 'Obsidian', 'Bedrock'],
        correct: 1,
        game: 'Minecraft'
    },
    {
        question: 'Jak se jmenuje hlavní postava v sérií The Witcher?',
        options: ['Dandelion', 'Vesemir', 'Geralt', 'Eskel'],
        correct: 2,
        game: 'Witcher'
    },
    {
        question: 'Kolik V-Bucks stojí Battle Pass ve Fortnite?',
        options: ['800', '950', '1000', '1200'],
        correct: 1,
        game: 'Fortnite'
    },
    {
        question: 'Ve kterém roce vyšla první verze Minecraftu?',
        options: ['2009', '2010', '2011', '2012'],
        correct: 2,
        game: 'Minecraft'
    },
    {
        question: 'Kolik agentů měl Valorant při launchi?',
        options: ['8', '10', '11', '12'],
        correct: 2,
        game: 'Valorant'
    },
    {
        question: 'Jaká je nejdražší skin kolekce v CS2?',
        options: ['Asiimov', 'Dragon Lore', 'Howl', 'Karambit Fade'],
        correct: 1,
        game: 'CS2'
    },
];

const QUIZ_QUESTIONS_EN: QuizQuestion[] = [
    {
        question: 'How much does the AWP cost in Counter-Strike 2?',
        options: ['$4150', '$4750', '$5000', '$4500'],
        correct: 1,
        game: 'CS2'
    },
    {
        question: 'Which League of Legends champion has the ultimate ability "Requiem"?',
        options: ['Veigar', 'Karthus', 'Brand', 'Malzahar'],
        correct: 1,
        game: 'LoL'
    },
    {
        question: 'What is the maximum hero level in Dota 2?',
        options: ['25', '30', '35', '40'],
        correct: 1,
        game: 'Dota 2'
    },
    {
        question: 'How many players are on a team in Valorant?',
        options: ['4', '5', '6', '3'],
        correct: 1,
        game: 'Valorant'
    },
    {
        question: 'Which material is the hardest in Minecraft?',
        options: ['Diamond', 'Netherite', 'Obsidian', 'Bedrock'],
        correct: 1,
        game: 'Minecraft'
    },
    {
        question: "What is the main character's name in The Witcher series?",
        options: ['Dandelion', 'Vesemir', 'Geralt', 'Eskel'],
        correct: 2,
        game: 'Witcher'
    },
    {
        question: 'How many V-Bucks does the Fortnite Battle Pass cost?',
        options: ['800', '950', '1000', '1200'],
        correct: 1,
        game: 'Fortnite'
    },
    {
        question: 'In which year was Minecraft first released?',
        options: ['2009', '2010', '2011', '2012'],
        correct: 2,
        game: 'Minecraft'
    },
    {
        question: 'How many agents did Valorant have at launch?',
        options: ['8', '10', '11', '12'],
        correct: 2,
        game: 'Valorant'
    },
    {
        question: 'Which is the most expensive skin collection in CS2?',
        options: ['Asiimov', 'Dragon Lore', 'Howl', 'Karambit Fade'],
        correct: 1,
        game: 'CS2'
    },
];

interface SkillCheckProps {
    onClose: () => void;
}

const SkillCheck: React.FC<SkillCheckProps> = ({ onClose }) => {
    const { language } = useAppContext();
    const questions = language === 'cs' ? QUIZ_QUESTIONS_CS : QUIZ_QUESTIONS_EN;

    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [finished, setFinished] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shake, setShake] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);
    const [streak, setStreak] = useState(0);

    // Timer countdown
    useEffect(() => {
        if (finished || selected !== null) return;
        if (timeLeft <= 0) {
            // Time's up — mark as wrong
            setSelected(-1);
            setShowResult(true);
            setStreak(0);
            return;
        }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, finished, selected]);

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        setShowResult(true);

        if (idx === questions[currentQ].correct) {
            setScore(s => s + 1);
            setStreak(s => s + 1);
        } else {
            setStreak(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const nextQuestion = () => {
        if (currentQ + 1 >= questions.length) {
            setFinished(true);
        } else {
            setCurrentQ(q => q + 1);
            setSelected(null);
            setShowResult(false);
            setTimeLeft(15);
        }
    };

    const restart = () => {
        setCurrentQ(0);
        setScore(0);
        setSelected(null);
        setShowResult(false);
        setFinished(false);
        setCopied(false);
        setShake(false);
        setTimeLeft(15);
        setStreak(0);
    };

    // Generate promo code based on score
    const promoCode = score >= 7
        ? 'SKILLZONE-PRO-30'
        : score >= 4
            ? 'SKILLZONE-GG-15'
            : 'SKILLZONE-NOOB-5';

    const promoLabel = score >= 7
        ? (language === 'cs' ? '30 minut ZDARMA!' : '30 minutes FREE!')
        : score >= 4
            ? (language === 'cs' ? '15 minut ZDARMA!' : '15 minutes FREE!')
            : (language === 'cs' ? '5 minut ZDARMA!' : '5 minutes FREE!');

    const copyCode = () => {
        navigator.clipboard.writeText(promoCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const progressPct = ((currentQ + (showResult ? 1 : 0)) / questions.length) * 100;
    const q = questions[currentQ];

    const getRank = () => {
        if (score === 10) return { title: 'LEGENDARY', color: 'text-yellow-400' };
        if (score >= 8) return { title: 'DIAMOND', color: 'text-blue-400' };
        if (score >= 6) return { title: 'GOLD', color: 'text-yellow-500' };
        if (score >= 4) return { title: 'SILVER', color: 'text-gray-400' };
        return { title: 'BRONZE', color: 'text-amber-700' };
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Panel */}
            <div
                className={`relative w-full max-w-lg bg-zinc-900 border border-sz-red/40 rounded-lg shadow-[0_0_60px_rgba(227,30,36,0.3)] overflow-hidden ${shake ? 'animate-[glitch_0.3s_ease]' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                    <div className="flex items-center gap-3">
                        <Gamepad2 className="w-5 h-5 text-sz-red" />
                        <span className="font-orbitron font-bold text-white text-sm uppercase tracking-wider">
                            Skill_Check <span className="text-sz-red">v2.0</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!finished && (
                            <span className="text-xs font-mono text-gray-500">
                                {currentQ + 1}/{questions.length}
                            </span>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {!finished && (
                    <div className="h-1 bg-black/50">
                        <div
                            className="h-full bg-sz-red transition-all duration-500 ease-out"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {!finished ? (
                        <>
                            {/* Game Badge + Timer */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-sz-red/30 text-sz-red font-mono">
                                    {q.game}
                                </span>
                                <div className="flex items-center gap-2">
                                    {streak >= 3 && (
                                        <span className="text-yellow-400 text-xs font-bold font-mono flex items-center gap-1 animate-pulse">
                                            <Zap className="w-3 h-3" /> {streak}x STREAK
                                        </span>
                                    )}
                                    <div className={`flex items-center gap-1 text-xs font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                                        <Timer className="w-3 h-3" /> {timeLeft}s
                                    </div>
                                </div>
                            </div>

                            {/* Question */}
                            <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">
                                {q.question}
                            </h3>

                            {/* Options */}
                            <div className="space-y-3">
                                {q.options.map((opt, idx) => {
                                    let cls = 'border-white/10 hover:border-white/30 text-gray-300 hover:text-white';
                                    if (showResult) {
                                        if (idx === q.correct) {
                                            cls = 'border-green-500 bg-green-500/10 text-green-400';
                                        } else if (idx === selected && idx !== q.correct) {
                                            cls = 'border-red-500 bg-red-500/10 text-red-400';
                                        } else {
                                            cls = 'border-white/5 text-gray-600';
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(idx)}
                                            disabled={showResult}
                                            className={`w-full text-left p-4 border rounded transition-all duration-200 font-mono text-sm flex items-center gap-3 disabled:cursor-default ${cls}`}
                                        >
                                            <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${showResult && idx === q.correct
                                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                                    : showResult && idx === selected
                                                        ? 'border-red-500 bg-red-500/20 text-red-400'
                                                        : 'border-white/20 text-gray-500'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next button */}
                            {showResult && (
                                <button
                                    onClick={nextQuestion}
                                    className="mt-6 w-full py-3 bg-sz-red hover:bg-sz-red-dark text-white font-bold font-orbitron uppercase rounded flex items-center justify-center gap-2 transition-colors"
                                >
                                    {currentQ + 1 >= questions.length
                                        ? (language === 'cs' ? 'Zobrazit výsledky' : 'Show Results')
                                        : (language === 'cs' ? 'Další otázka' : 'Next Question')
                                    }
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    ) : (
                        /* Results Screen */
                        <div className="text-center">
                            <div className="mb-6">
                                <Trophy className={`w-16 h-16 mx-auto ${getRank().color} mb-4`} />
                                <div className={`text-3xl font-orbitron font-black ${getRank().color} uppercase mb-1`}>
                                    {getRank().title}
                                </div>
                                <div className="text-gray-500 font-mono text-sm">
                                    {language === 'cs' ? 'Tvoje hodnocení' : 'Your Rank'}
                                </div>
                            </div>

                            {/* Score Display */}
                            <div className="bg-black/50 border border-white/10 p-6 rounded-lg mb-6">
                                <div className="text-5xl font-orbitron font-black text-white mb-2">
                                    {score}<span className="text-gray-600">/{questions.length}</span>
                                </div>
                                <div className="text-gray-500 text-sm font-mono">
                                    {language === 'cs' ? 'Správných odpovědí' : 'Correct Answers'}
                                </div>

                                {/* Score bar */}
                                <div className="mt-4 h-2 bg-black rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${(score / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div className="bg-sz-red/10 border border-sz-red/30 p-5 rounded-lg mb-4">
                                <div className="text-sz-red text-xs font-mono uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                    <Zap className="w-3 h-3" /> {promoLabel}
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <code className="text-white font-orbitron font-bold text-lg bg-black/50 px-4 py-2 rounded border border-sz-red/50">
                                        {promoCode}
                                    </code>
                                    <button
                                        onClick={copyCode}
                                        className="p-2 bg-sz-red hover:bg-sz-red-dark text-white rounded transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="mt-3 text-gray-500 text-xs font-mono">
                                    {language === 'cs'
                                        ? 'Ukaž tento kód na recepci a získej bonus!'
                                        : 'Show this code at reception for your bonus!'}
                                </p>
                            </div>

                            {/* Restart */}
                            <button
                                onClick={restart}
                                className="mt-2 text-gray-500 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                {language === 'cs' ? 'Zkusit znovu' : 'Try Again'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Score indicator */}
                {!finished && (
                    <div className="px-6 pb-4 flex justify-between items-center text-xs font-mono text-gray-600">
                        <span>{language === 'cs' ? 'Skóre' : 'Score'}: <span className="text-sz-red font-bold">{score}</span></span>
                        <span className="text-[10px] uppercase tracking-widest">SkillZone.cz</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillCheck;
