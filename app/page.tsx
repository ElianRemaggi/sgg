import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />

        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />

        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
        <div className="relative flex h-full min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-[430px] mx-auto shadow-2xl">
          {/* TopAppBar */}
          <div className="flex items-center p-4 pb-2 justify-between">
            <div className="text-white flex size-12 shrink-0 items-center cursor-pointer">
              <span className="material-symbols-outlined text-white">
                arrow_back_ios
              </span>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
              FitTrack Pro
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-5xl">
                fitness_center
              </span>
            </div>
          </div>

          {/* HeadlineText */}
          <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight px-6 text-center pb-3">
            Bienvenido
          </h1>
          <p className="text-[#9db9a6] text-center px-6 text-sm mb-6">
            Ingresa tus credenciales para continuar con tu entrenamiento.
          </p>

          {/* Form Section */}
          <div className="px-2 space-y-1">
            {/* TextField Email */}
            <div className="flex w-full flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Correo electrónico
                </p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#3b5443] bg-[#1c271f] focus:border-primary h-14 placeholder:text-[#9db9a6] p-[15px] text-base font-normal leading-normal"
                  placeholder="ejemplo@correo.com"
                  type="email"
                />
              </label>
            </div>

            {/* TextField Password */}
            <div className="flex w-full flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Contraseña
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#3b5443] bg-[#1c271f] focus:border-primary h-14 placeholder:text-[#9db9a6] p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                    placeholder="••••••••"
                    type="password"
                  />
                  <div className="text-[#9db9a6] flex border border-[#3b5443] bg-[#1c271f] items-center justify-center pr-[15px] rounded-r-lg border-l-0 cursor-pointer">
                    <span className="material-symbols-outlined">visibility</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* MetaText Forgot Password */}
          <div className="flex justify-end px-6">
            <p className="text-primary text-sm font-medium leading-normal pb-3 pt-1 underline cursor-pointer">
              ¿Olvidaste tu contraseña?
            </p>
          </div>

          {/* Action Button */}
          <div className="px-6 py-6">
            <button className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2">
              Ingresar
              <span className="material-symbols-outlined">login</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center px-6 py-4">
            <div className="flex-1 h-px bg-[#3b5443]" />
            <span className="px-4 text-[#9db9a6] text-sm">o continuar con</span>
            <div className="flex-1 h-px bg-[#3b5443]" />
          </div>

          {/* Social Login */}
          <div className="flex gap-4 px-6 py-2">
            <button className="flex-1 flex items-center justify-center py-3 border border-[#3b5443] rounded-xl bg-[#1c271f] hover:bg-[#25352a] transition-colors">
              <img
                alt="Google"
                className="w-6 h-6"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3Ww77iLndrFeLz5jDVXLU5E0uguCULLQ2FZ-X-Gzhi77_NS1Lu7bnnKTQRPIeFtY4fcrWSrbYc7z2wPCbasr_67ZbNRd3w787g-B7VzUgAFgd0AYrfFLU-z-b1rrgn7crw0uObxuUAWGbzasL22MD6bQ7PbmHY61gpyzz7H2vudaR-j240BU-trLfwuFJsSDBcbXUguOFw7-YAnv2sNkTLS7woNM5bQ8NiscvlvprW20dyRE9-CkoIz0auXWGo-_mbvytFq5ZVk8"
              />
            </button>
            <button className="flex-1 flex items-center justify-center py-3 border border-[#3b5443] rounded-xl bg-[#1c271f] hover:bg-[#25352a] transition-colors">
              <span className="material-symbols-outlined text-white text-2xl">
                ios
              </span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-auto pb-10">
            <p className="text-[#9db9a6] text-center text-base">
              ¿No tienes una cuenta?
              <span className="text-primary font-bold cursor-pointer hover:underline ml-1">
                Regístrate
              </span>
            </p>
          </div>

          {/* Bottom Safe Area (iOS) */}
          <div className="h-8" />
        </div>

        <style jsx global>{`
          body {
            font-family: "Lexend", sans-serif;
            min-height: max(884px, 100dvh);
          }

        `}</style>
      </div>
    </>
  );
}
