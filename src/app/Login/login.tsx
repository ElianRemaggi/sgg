import React from "react";
import ShinyText from "../../components/ui/ShinyText";

const Loading: React.FC = () => {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Top App Bar (iOS style) */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
                <div className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-start">
                    <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
                </div>
                <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Login</h2>
            </div>

            <div className="flex flex-col items-center px-4 pt-8">
                {/* Icon/Logo Placeholder */}
                <div className="mb-6 flex items-center justify-center size-20 rounded-2xl bg-primary/10 border-2 border-primary/20">
                    <span className="material-symbols-outlined text-primary text-5xl">fitness_center</span>
                </div>
                {/* Headline Text */}
                <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight px-4 text-center pb-2">Bienvenido de nuevo</h1>
                {/* Body Text */}
                <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-8 pt-1 px-4 text-center">Tu meta comienza aquí. Ingresa para seguir tu progreso.</p>
            </div>

            {/* Form Section */}
            <div className="flex flex-col gap-2 max-w-[480px] mx-auto w-full">
                {/* Email Field */}
                <div className="flex flex-wrap items-end gap-4 px-4 py-2">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-slate-700 dark:text-white text-sm font-medium leading-normal pb-2 px-1">Email</p>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-[#326744] bg-white dark:bg-[#193322] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92c9a4] p-[15px] text-base font-normal leading-normal"
                            placeholder="ejemplo@correo.com"
                            type="email"
                            defaultValue=""
                        />
                    </label>
                </div>

                {/* Password Field */}
                <div className="flex flex-wrap items-end gap-4 px-4 py-2">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-slate-700 dark:text-white text-sm font-medium leading-normal pb-2 px-1">Contraseña</p>
                        <div className="flex w-full flex-1 items-stretch">
                            <input
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-[#326744] bg-white dark:bg-[#193322] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92c9a4] p-[15px] border-r-0 pr-2 text-base font-normal leading-normal"
                                placeholder="••••••••"
                                type="password"
                                defaultValue=""
                            />
                            <div className="text-slate-400 dark:text-[#92c9a4] flex border border-slate-300 dark:border-[#326744] bg-white dark:bg-[#193322] items-center justify-center pr-[15px] rounded-r-xl border-l-0">
                                <span className="material-symbols-outlined cursor-pointer">visibility</span>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Forgot Password Link */}
                <div className="px-4 text-right">
                    <a className="text-primary text-sm font-medium hover:underline" href="#">¿Olvidaste tu contraseña?</a>
                </div>

                {/* Login Button */}
                <div className="px-4 py-6">
                    <button className="w-full h-14 bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg rounded-xl transition-colors shadow-lg shadow-primary/20">
                        Ingresar
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center px-8 py-4">
                    <div className="flex-grow border-t border-slate-300 dark:border-white/10"></div>
                    <span className="px-4 text-slate-400 text-xs uppercase tracking-widest font-bold">O entrar con</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-white/10"></div>
                </div>

                {/* Social Login */}
                <div className="flex justify-center gap-4 px-4 pb-8">
                    <button className="flex items-center justify-center size-14 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                        <img
                            alt="Google Logo"
                            className="size-6"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBieNBn8yoaYc6Yo_sOWMoQK4XiOYELCcwOKvFmVNn_9O3yxqsE4G5tq_2y-A4IZ3qPktMcxds9X_rE4G0kIHf7LWVlP47yV8TfUM5v5zapskIEqbeND2j4n2sUC4FFMdpsCttjXBVLzWGLKlZUXmNd4NVKZYjKY2xADMY3ydG345bfmTwDDq8elwEQKVe2rw8-UfNtJCI_Z0jetKG9qp-_UAI0_jc-XRBFT5ItWskd2aeE0cesG_VknY-pBAa6taOYftijvz0nSp81"
                        />
                    </button>
                    <button className="flex items-center justify-center size-14 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-900 dark:text-white text-3xl">ios</span>
                    </button>
                </div>

                {/* Register Link */}
                <div className="mt-auto pb-10 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        ¿No tienes cuenta?
                        <a className="text-primary font-bold ml-1 hover:underline" href="#">Registrarme</a>
                    </p>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default Loading;