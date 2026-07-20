import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/personal-info")({
  component: PersonalInfo,
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

function PersonalInfo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    phone: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    employmentStatus: "",
    monthlyIncome: "",
    householdSize: "",
    civilStatus: "",
    educationLevel: "",
    hasPWD: false,
    isSenior: false,
    isIndigenous: false,
    hasChildren: false,
  });

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    navigate({ to: "/benefits" });
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden font-sans text-slate-800"
      style={{
        background:
          "radial-gradient(1200px 600px at 85% -10%, #ffe27a55 0%, transparent 60%), radial-gradient(900px 500px at -10% 20%, #ffd0d555 0%, transparent 55%), radial-gradient(1000px 700px at 50% 110%, #dbe6ff88 0%, transparent 60%), #fbf7ee",
      }}
    >
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-5 md:py-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="clay-yellow grid h-9 w-9 place-items-center md:h-11 md:w-11">
            <div className="h-5 w-5 md:h-6 md:w-6"><Sun /></div>
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-black tracking-tight text-[color:var(--color-ph-blue)] md:text-xl">JuanClaimed</p>
            <p className="text-[8px] uppercase tracking-[0.18em] text-slate-500 md:text-[10px]">Para sa bawat Juan</p>
          </div>
        </div>
        <a href={APP_URL} className="clay-blue px-4 py-2 text-sm font-semibold text-[color:var(--color-ph-blue)] transition hover:translate-y-[-1px] md:px-5 md:py-2.5">
          Back to home
        </a>
      </header>

      {/* Form Section */}
      <section className="mx-auto max-w-4xl px-4 py-12 md:px-5 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="clay-blue inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ph-blue)] md:text-[11px]">
              Step {step} of {totalSteps}
            </span>
            <h1 className="mt-4 font-display text-3xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              Tell us about <span className="text-[color:var(--color-ph-red)]">yourself</span>
            </h1>
            <p className="mt-3 text-sm text-slate-600 md:text-base max-w-xl mx-auto">
              We'll use this info to find every benefit you qualify for — from national programs down to your barangay.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      s <= step
                        ? "bg-[color:var(--color-ph-blue)]"
                        : "bg-slate-200"
                    }`}
                  />
                  <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider text-center ${
                    s <= step ? "text-[color:var(--color-ph-blue)]" : "text-slate-400"
                  }`}>
                    {s === 1 && "Personal"}
                    {s === 2 && "Location"}
                    {s === 3 && "Household"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="clay p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="clay-yellow grid h-10 w-10 place-items-center text-lg">👤</span>
                    <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">Basic Information</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        placeholder="Dela Cruz"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="birthDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="civilStatus" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Civil Status
                      </label>
                      <select
                        id="civilStatus"
                        name="civilStatus"
                        value={formData.civilStatus}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        placeholder="juan@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        placeholder="0912 345 6789"
                      />
                    </div>
                  </div>
                </div>

                <div className="clay-yellow p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="clay grid h-10 w-10 place-items-center text-lg">🏷️</span>
                    <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">Special Status</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Select all that apply (these unlock specific benefits)</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/70 hover:bg-white transition cursor-pointer">
                      <input
                        type="checkbox"
                        name="isSenior"
                        checked={formData.isSenior}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded border-2 border-slate-300 text-[color:var(--color-ph-blue)] focus:ring-[color:var(--color-ph-blue)]"
                      />
                      <span className="text-sm font-medium text-slate-700">Senior Citizen (60+)</span>
                      <span className="ml-auto text-xs text-slate-400">🎖️</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/70 hover:bg-white transition cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasPWD"
                        checked={formData.hasPWD}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded border-2 border-slate-300 text-[color:var(--color-ph-blue)] focus:ring-[color:var(--color-ph-blue)]"
                      />
                      <span className="text-sm font-medium text-slate-700">Person with Disability</span>
                      <span className="ml-auto text-xs text-slate-400">♿</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/70 hover:bg-white transition cursor-pointer">
                      <input
                        type="checkbox"
                        name="isIndigenous"
                        checked={formData.isIndigenous}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded border-2 border-slate-300 text-[color:var(--color-ph-blue)] focus:ring-[color:var(--color-ph-blue)]"
                      />
                      <span className="text-sm font-medium text-slate-700">Indigenous Person</span>
                      <span className="ml-auto text-xs text-slate-400">🌿</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/70 hover:bg-white transition cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasChildren"
                        checked={formData.hasChildren}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded border-2 border-slate-300 text-[color:var(--color-ph-blue)] focus:ring-[color:var(--color-ph-blue)]"
                      />
                      <span className="text-sm font-medium text-slate-700">Has Children</span>
                      <span className="ml-auto text-xs text-slate-400">👶</span>
                    </label>
                  </div>
                </div>

                <div className="clay-blue p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="clay grid h-10 w-10 place-items-center text-lg">💼</span>
                    <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">Employment & Education</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="employmentStatus" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Employment Status
                      </label>
                      <select
                        id="employmentStatus"
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="educationLevel" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Education Level
                      </label>
                      <select
                        id="educationLevel"
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select level</option>
                        <option value="elementary">Elementary</option>
                        <option value="highschool">High School</option>
                        <option value="college">College</option>
                        <option value="postgraduate">Post Graduate</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="monthlyIncome" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Monthly Income (PHP)
                      </label>
                      <select
                        id="monthlyIncome"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select income range</option>
                        <option value="below-10k">Below ₱10,000</option>
                        <option value="10k-20k">₱10,000 - ₱20,000</option>
                        <option value="20k-30k">₱20,000 - ₱30,000</option>
                        <option value="30k-50k">₱30,000 - ₱50,000</option>
                        <option value="50k-100k">₱50,000 - ₱100,000</option>
                        <option value="above-100k">Above ₱100,000</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="clay p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="clay-red grid h-10 w-10 place-items-center text-lg">📍</span>
                    <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">Where do you live?</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Your location determines which local benefits you qualify for.</p>

                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="region" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Region
                      </label>
                      <select
                        id="region"
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select region</option>
                        <option value="ncr">NCR - National Capital Region</option>
                        <option value="region1">Region I - Ilocos Region</option>
                        <option value="region2">Region II - Cagayan Valley</option>
                        <option value="region3">Region III - Central Luzon</option>
                        <option value="region4a">Region IV-A - CALABARZON</option>
                        <option value="region4b">Region IV-B - MIMAROPA</option>
                        <option value="region5">Region V - Bicol Region</option>
                        <option value="region6">Region VI - Western Visayas</option>
                        <option value="region7">Region VII - Central Visayas</option>
                        <option value="region8">Region VIII - Eastern Visayas</option>
                        <option value="region9">Region IX - Zamboanga Peninsula</option>
                        <option value="region10">Region X - Northern Mindanao</option>
                        <option value="region11">Region XI - Davao Region</option>
                        <option value="region12">Region XII - SOCCSKSARGEN</option>
                        <option value="region13">Region XIII - Caraga</option>
                        <option value="armm">BARMM - Bangsamoro Autonomous Region</option>
                        <option value="car">CAR - Cordillera Administrative Region</option>
                      </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="province" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          name="province"
                          value={formData.province}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                          placeholder="Province"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          City / Municipality
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                          placeholder="City/Municipality"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="barangay" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Barangay
                        </label>
                        <input
                          type="text"
                          id="barangay"
                          name="barangay"
                          value={formData.barangay}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                          placeholder="Barangay"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Household */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="clay-yellow p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="clay grid h-10 w-10 place-items-center text-lg">🏠</span>
                    <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">Household Details</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">These help determine family-based benefits like 4Ps.</p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="householdSize" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Household Size (including you)
                      </label>
                      <select
                        id="householdSize"
                        name="householdSize"
                        value={formData.householdSize}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select size</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                        <option value="10+">10+</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="monthlyIncome" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Household Monthly Income (PHP)
                      </label>
                      <select
                        id="monthlyIncome"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                        required
                      >
                        <option value="">Select income range</option>
                        <option value="below-10k">Below ₱10,000</option>
                        <option value="10k-20k">₱10,000 - ₱20,000</option>
                        <option value="20k-30k">₱20,000 - ₱30,000</option>
                        <option value="30k-50k">₱30,000 - ₱50,000</option>
                        <option value="50k-100k">₱50,000 - ₱100,000</option>
                        <option value="above-100k">Above ₱100,000</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="clay-blue p-6 md:p-8">
                  <div className="flex items-start gap-3">
                    <span className="clay-yellow grid h-10 w-10 flex-shrink-0 place-items-center text-lg">💡</span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900">Almost there!</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Based on your answers, we'll find all the benefits you qualify for.
                        You can always update your information later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="clay px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1"
                >
                  ← Back
                </button>
              )}
              <div className="flex-1" />
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="clay-blue group inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1"
                >
                  Next step
                  <span className="transition group-hover:translate-x-1">→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="clay-red group inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-[color:var(--color-ph-red)] transition hover:-translate-y-1"
                >
                  Find my benefits
                  <span className="transition group-hover:translate-x-1">✨</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:gap-6 md:px-5 md:py-10">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="clay-yellow grid h-8 w-8 place-items-center md:h-10 md:w-10">
              <div className="h-4 w-4 md:h-5 md:w-5"><Sun /></div>
            </div>
            <div>
              <p className="font-display text-base font-black text-[color:var(--color-ph-blue)] md:text-lg">JuanClaimed</p>
              <p className="text-[10px] text-slate-500 md:text-xs">Para sa bawat Juan.</p>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 md:text-right md:text-xs">
            Entry for <span className="font-semibold text-slate-700">eGovHackathon 2026</span>
            <br />© {new Date().getFullYear()} Team JuanClaimed. Made with 🇵🇭 pride.
          </p>
        </div>
      </footer>
    </div>
  );
}
