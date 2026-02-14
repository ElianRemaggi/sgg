import React from "react";
import ShinyText from "../../components/ui/ShinyText";

const Loading: React.FC = () => {
    return (
        <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[80px] opacity-40"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[60px] opacity-20"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px] opacity-40"></div>
            </div>

            {/* Main Content - Centered */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4">
                <div className="relative group cursor-default">
                    {/* Interactive Glow Effect */}
                    <div className="absolute  inset-8 bg-primary/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>

                    <ShinyText
                        speed={2}
                        delay={0}
                        color="#70ff8d"
                        shineColor="#0f6b15"
                        spread={120}
                        direction="left"
                        yoyo={false}
                        pauseOnHover={false}
                        disabled={false}
                        className="text-6xl md:text-8xl font-bold drop-shadow-sm flex items-center justify-center gap-4"
                    >
                        <span className="material-symbols-outlined text-7xl md:text-9xl font-bold">fitness_center</span>
                        <span>GYM RAT</span>
                    </ShinyText>
                </div>
            </main>

            {/* Footer Status Section */}
            <footer className="relative z-10 flex flex-col items-center gap-6 pb-12">
                {/* Loader */}
                <div className="relative h-14 w-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[3px] border-primary/10"></div>
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin-slow"></div>
                    {/* Inner dot */}
                    <div className="w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
                </div>

                {/* Info Text */}
                <div className="flex flex-col items-center space-y-1.5 text-center">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase">
                        Initializing Workout Data
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-primary/50"></span>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                            v2.4.0
                        </p>
                        <span className="h-1 w-1 rounded-full bg-primary/50"></span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Loading;


