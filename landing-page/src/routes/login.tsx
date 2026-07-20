import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: Login,
});

const APP_URL = "#";

function Sun({ spin = false }: { spin?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${spin ? "animate-[spin_22s_linear_infinite]" : ""}`} aria-hidden>
      <g fill="#fcd116">
        <circle cx="50" cy="50" r="16" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x = 50 + Math.cos(a) * 30;
          const y = 50 + Math.sin(a) * 30;
          return (
            <polygon
              key={i}
              points={`${x - 3.5},${y - 3.5} ${x + 3.5},${y - 3.5} ${x},${y + 9}`}
              transform={`rotate(${(i * 45) - 90} ${x} ${y})`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    navigate({ to: "/personal-info" });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    navigate({ to: "/personal-info" });
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-[#fbf7ee]">
      {/* Split Layout */}
      <div className="flex min-h-screen">
        {/* Left Side - Info Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12 flex-col justify-between"
          style={{
            background: "radial-gradient(800px 600px at 70% 50%, #ffe27a55 0%, transparent 60%), radial-gradient(600px 400px at 30% 80%, #ffd0d555 0%, transparent 55%), #fbf7ee",
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 h-80 w-80 opacity-20">
            <Sun spin />
          </div>
          <div className="absolute -left-20 -bottom-20 h-60 w-60 opacity-20">
            <Sun spin />
          </div>
          <div className="absolute top-1/3 right-10 h-16 w-16 clay-red opacity-30" />
          <div className="absolute bottom-1/3 left-10 h-12 w-12 clay-blue opacity-30" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="clay-yellow grid h-12 w-12 place-items-center">
                <div className="h-7 w-7"><Sun /></div>
              </div>
              <div>
                <p className="font-display text-2xl font-black text-[color:var(--color-ph-blue)]">JuanClaimed</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Para sa bawat Juan</p>
              </div>
            </div>

            <div className="max-w-md">
              <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
                Every benefit
                <br />
                <span className="text-[color:var(--color-ph-blue)]">Juan</span> deserves,
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-[color:var(--color-ph-red)]">claimed.</span>
                  <span className="absolute -bottom-1 left-0 -z-0 h-4 w-full rounded-full bg-[color:var(--color-ph-yellow)]/70" />
                </span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed mb-8">
                Sign in to discover every government benefit you're eligible for — 
                from national programs down to your barangay. All in one place.
              </p>

              {/* Feature List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="clay-yellow grid h-10 w-10 flex-shrink-0 place-items-center text-lg">🎯</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">Personalized matches</p>
                    <p className="text-xs text-slate-500">Benefits tailored to your profile</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="clay-blue grid h-10 w-10 flex-shrink-0 place-items-center text-lg">⚡</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">Quick & easy</p>
                    <p className="text-xs text-slate-500">One login, instant results</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="clay-red grid h-10 w-10 flex-shrink-0 place-items-center text-lg">🇵🇭</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">For every Filipino</p>
                    <p className="text-xs text-slate-500">National to barangay level benefits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer on left */}
          <div className="relative z-10 text-xs text-slate-400">
            <p>eGovHackathon 2026 Entry · Made with 🇵🇭 pride</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 md:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile Header - Hidden on desktop */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="clay-yellow grid h-10 w-10 place-items-center">
                  <div className="h-6 w-6"><Sun /></div>
                </div>
                <p className="font-display text-xl font-black text-[color:var(--color-ph-blue)]">JuanClaimed</p>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {isSignUp 
                  ? "Start your journey to discover benefits you're eligible for" 
                  : "Sign in to access your personalized benefits list"}
              </p>
            </div>

            {/* Login Card */}
            <div className="clay p-6 md:p-8">
              {/* Desktop Header */}
              <div className="hidden lg:block text-center mb-8">
                <div className="clay-yellow grid h-16 w-16 mx-auto place-items-center text-3xl mb-4">
                  {isSignUp ? "📝" : "🔐"}
                </div>
                <h2 className="font-display text-3xl font-black text-slate-900">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {isSignUp 
                    ? "Start your journey to discover benefits you're eligible for" 
                    : "Sign in to access your personalized benefits list"}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="clay-red p-3 mb-4 text-sm text-[color:var(--color-ph-red)]">
                  ⚠️ {error}
                </div>
              )}

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-[color:var(--color-ph-blue)] transition hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold text-slate-700">
                  {isLoading ? "Signing in..." : `Sign ${isSignUp ? "up" : "in"} with Google`}
                </span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-3 text-slate-500">or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                    placeholder="juan@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-12 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                      required
                      disabled={isLoading}
                      minLength={isSignUp ? 8 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      disabled={isLoading}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-2 border-slate-300 text-[color:var(--color-ph-blue)] focus:ring-[color:var(--color-ph-blue)]"
                        disabled={isLoading}
                      />
                      Remember me
                    </label>
                    <a href="#" className="text-sm font-semibold text-[color:var(--color-ph-blue)] hover:underline">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="clay-blue w-full px-6 py-3.5 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
                </button>
              </form>

              {/* Toggle Sign Up/Sign In */}
              <div className="mt-6 text-center text-sm">
                <span className="text-slate-600">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="ml-2 font-semibold text-[color:var(--color-ph-blue)] hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </div>

              {/* eGov Badge */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="clay-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a6a00" }}>
                    Powered by
                  </span>
                  <span className="font-semibold text-slate-700">eGovPH</span>
                </div>
              </div>
            </div>

            {/* Trust Signals - Mobile */}
            <div className="lg:hidden mt-6 grid grid-cols-3 gap-3">
              <div className="clay p-3 text-center">
                <p className="text-lg">🔒</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Secure</p>
              </div>
              <div className="clay p-3 text-center">
                <p className="text-lg">⚡</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Fast</p>
              </div>
              <div className="clay p-3 text-center">
                <p className="text-lg">🇵🇭</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">For Filipinos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}