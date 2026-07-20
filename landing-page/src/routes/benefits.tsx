import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/benefits")({
  component: Benefits,
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

// Sample benefit data
const BENEFITS_DATA = [
  {
    id: 1,
    title: "TES Scholarship",
    shortDesc: "Financial assistance for tertiary education",
    emoji: "🎓",
    scope: "National",
    agency: "TESDA",
    category: "Education",
    engDesc: "The Technical Education and Skills Development Authority (TESDA) provides scholarships for qualified Filipinos to pursue technical-vocational education and training. This program aims to equip individuals with employable skills and improve their livelihood opportunities.",
    tagDesc: "Ang Technical Education and Skills Development Authority (TESDA) ay nagbibigay ng scholarship para sa mga kwalipikadong Pilipino na nais mag-aral ng technical-vocational education at training. Layunin ng programang ito na bigyan ng kasanayan ang mga indibidwal upang magkaroon ng trabaho at umunlad ang kanilang kabuhayan.",
    requirements: [
      {
        id: "req1",
        title: "Educational Attainment",
        engDesc: "Must have completed at least high school (Grade 10) or equivalent. For college-level programs, must have completed at least 2 years of college.",
        tagDesc: "Dapat nakatapos ng hindi bababa sa high school (Grade 10) o katumbas nito. Para sa college-level programs, dapat nakatapos ng hindi bababa sa 2 taon sa kolehiyo.",
        images: ["/images/education-cert.jpg", "/images/diploma-sample.jpg"]
      },
      {
        id: "req2",
        title: "Age Requirement",
        engDesc: "Applicants must be at least 18 years old and not more than 35 years old at the time of application.",
        tagDesc: "Ang aplikante ay dapat hindi bababa sa 18 taong gulang at hindi hihigit sa 35 taong gulang sa oras ng aplikasyon.",
        images: ["/images/age-requirements.jpg"]
      },
      {
        id: "req3",
        title: "Income Bracket",
        engDesc: "Annual family income must not exceed ₱250,000. Priority is given to families belonging to the poorest sectors.",
        tagDesc: "Ang taunang kita ng pamilya ay hindi dapat lumampas sa ₱250,000. Prayoridad ang mga pamilyang kabilang sa pinakamahirap na sektor.",
        images: ["/images/income-cert.jpg", "/images/poverty-indicator.jpg"]
      }
    ],
    utilizations: [
      {
        id: "util1",
        title: "How to Claim the Scholarship",
        engDesc: "Once approved, you will receive a scholarship certificate via email or through your TESDA regional office. The certificate must be presented to your chosen educational institution to avail of the scholarship benefits.",
        tagDesc: "Kapag naaprubahan, makakatanggap ka ng scholarship certificate sa pamamagitan ng email o sa inyong TESDA regional office. Ang certificate ay dapat ipakita sa inyong napiling educational institution upang magamit ang scholarship benefits.",
        images: ["/images/scholarship-cert.jpg", "/images/tesda-office.jpg"]
      },
      {
        id: "util2",
        title: "Stipend Distribution",
        engDesc: "The monthly stipend is distributed through your TESDA-accredited school's finance office. Make sure to submit your attendance records and grades on time.",
        tagDesc: "Ang monthly stipend ay ibinibigay sa pamamagitan ng finance office ng inyong TESDA-accredited school. Siguraduhing isumite ang inyong attendance records at grades sa tamang oras.",
        images: ["/images/stipend-payment.jpg"]
      }
    ],
    stats: {
      beneficiaries: "50,000+",
      coverage: "All regions",
      budget: "₱500M",
      duration: "Annual"
    },
    steps: [
      "Check eligibility requirements",
      "Prepare required documents",
      "Submit application to TESDA office",
      "Take entrance exam",
      "Wait for results",
      "Claim your scholarship"
    ]
  },
  {
    id: 2,
    title: "PhilHealth Konsulta",
    shortDesc: "Free primary care for all members",
    emoji: "💊",
    scope: "National",
    agency: "PhilHealth",
    category: "Healthcare",
    engDesc: "PhilHealth Konsulta is a primary care benefit package that provides outpatient consultation, diagnostic tests, and medicines for common illnesses to all PhilHealth members and their dependents.",
    tagDesc: "Ang PhilHealth Konsulta ay isang primary care benefit package na nagbibigay ng outpatient consultation, diagnostic tests, at mga gamot para sa karaniwang sakit sa lahat ng PhilHealth members at kanilang mga dependent.",
    requirements: [
      {
        id: "req1",
        title: "PhilHealth Membership",
        engDesc: "Must be an active PhilHealth member with at least 9 months of contributions within the last 12 months.",
        tagDesc: "Dapat ay aktibong PhilHealth member na may hindi bababa sa 9 buwan ng kontribusyon sa nakaraang 12 buwan.",
        images: ["/images/philhealth-id.jpg", "/images/contribution-record.jpg"]
      },
      {
        id: "req2",
        title: "Registration to Konsulta Provider",
        engDesc: "Must be registered to a PhilHealth-accredited Konsulta provider. Choose from government health centers, rural health units, or accredited private clinics.",
        tagDesc: "Dapat rehistrado sa PhilHealth-accredited Konsulta provider. Pumili mula sa government health centers, rural health units, o accredited private clinics.",
        images: ["/images/health-center.jpg"]
      }
    ],
    utilizations: [
      {
        id: "util1",
        title: "Booking an Appointment",
        engDesc: "Schedule your consultation through the Konsulta provider's hotline, website, or by visiting the clinic directly. Bring your PhilHealth ID and any relevant medical records.",
        tagDesc: "Mag-schedule ng konsultasyon sa pamamagitan ng hotline, website, o direktang pagbisita sa klinika ng Konsulta provider. Dalhin ang inyong PhilHealth ID at anumang relevant medical records.",
        images: ["/images/appointment-booking.jpg"]
      },
      {
        id: "util2",
        title: "Claiming Medicines",
        engDesc: "Prescribed medicines can be claimed at the Konsulta provider's pharmacy or any PhilHealth-accredited drugstore. Present your prescription and PhilHealth ID.",
        tagDesc: "Ang mga iniresetang gamot ay maaaring i-claim sa pharmacy ng Konsulta provider o anumang PhilHealth-accredited drugstore. Ipakita ang inyong reseta at PhilHealth ID.",
        images: ["/images/pharmacy.jpg", "/images/medicines.jpg"]
      }
    ],
    stats: {
      beneficiaries: "10M+",
      coverage: "All regions",
      budget: "₱2B",
      duration: "Year-round"
    },
    steps: [
      "Check PhilHealth membership status",
      "Find accredited Konsulta provider near you",
      "Book an appointment",
      "Visit the clinic for consultation",
      "Get prescribed medicines",
      "Follow up as needed"
    ]
  },
  {
    id: 3,
    title: "4Ps Cash Grant",
    shortDesc: "Conditional cash transfer for poor families",
    emoji: "👶",
    scope: "National",
    agency: "DSWD",
    category: "Social Welfare",
    engDesc: "The Pantawid Pamilyang Pilipino Program (4Ps) provides conditional cash grants to extremely poor households to improve their health, nutrition, and education, particularly for children aged 0-18.",
    tagDesc: "Ang Pantawid Pamilyang Pilipino Program (4Ps) ay nagbibigay ng conditional cash grants sa mga lubhang mahihirap na pamilya upang mapabuti ang kanilang kalusugan, nutrisyon, at edukasyon, partikular na sa mga batang may edad 0-18.",
    requirements: [
      {
        id: "req1",
        title: "Household Assessment",
        engDesc: "Household must be assessed and classified as poor based on the DSWD's Listahanan database. The household must have at least one child aged 0-18.",
        tagDesc: "Ang pamilya ay dapat ma-assess at maklasipika bilang mahirap batay sa Listahanan database ng DSWD. Ang pamilya ay dapat may hindi bababa sa isang batang may edad 0-18.",
        images: ["/images/dswd-assessment.jpg", "/images/listahanan.jpg"]
      },
      {
        id: "req2",
        title: "Compliance Requirements",
        engDesc: "Must comply with health check-ups, school attendance (85%), and parent-child development sessions.",
        tagDesc: "Dapat sumunod sa health check-ups, school attendance (85%), at parent-child development sessions.",
        images: ["/images/health-checkup.jpg", "/images/school-attendance.jpg"]
      }
    ],
    utilizations: [
      {
        id: "util1",
        title: "Cash Grant Distribution",
        engDesc: "Cash grants are distributed through Landbank or DSWD-accredited payout centers. Beneficiaries must present their 4Ps ID and a valid government ID.",
        tagDesc: "Ang cash grants ay ipinamamahagi sa pamamagitan ng Landbank o DSWD-accredited payout centers. Ang mga benepisyaryo ay dapat magpakita ng kanilang 4Ps ID at valid government ID.",
        images: ["/images/cash-payout.jpg", "/images/landbank.jpg"]
      },
      {
        id: "util2",
        title: "Monitoring and Compliance",
        engDesc: "Regular monitoring is conducted by DSWD social workers to ensure compliance with program conditions. Non-compliance may result in suspension of grants.",
        tagDesc: "Ang regular na monitoring ay ginagawa ng DSWD social workers upang matiyak ang pagsunod sa mga kondisyon ng programa. Ang hindi pagsunod ay maaaring magresulta sa suspensyon ng grants.",
        images: ["/images/social-worker-visit.jpg"]
      }
    ],
    stats: {
      beneficiaries: "4M+",
      coverage: "All regions",
      budget: "₱100B",
      duration: "Bi-monthly"
    },
    steps: [
      "Check if you're in the Listahanan database",
      "Wait for DSWD assessment",
      "Attend family development sessions",
      "Comply with health and education requirements",
      "Receive cash grants",
      "Continue compliance for continuous benefits"
    ]
  }
];

function Benefits() {
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScope, setSelectedScope] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBenefits = BENEFITS_DATA.filter(benefit => {
    const matchesSearch = benefit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          benefit.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = selectedScope === "All" || benefit.scope === selectedScope;
    const matchesCategory = selectedCategory === "All" || benefit.category === selectedCategory;
    return matchesSearch && matchesScope && matchesCategory;
  });

  const scopes = ["All", ...new Set(BENEFITS_DATA.map(b => b.scope))];
  const categories = ["All", ...new Set(BENEFITS_DATA.map(b => b.category))];

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

      {/* Benefits List */}
      {!selectedBenefit ? (
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-5 md:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="clay-yellow inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] md:text-[11px]" style={{ color: "#8a6a00" }}>
                Your Benefits
              </span>
              <h1 className="mt-4 font-display text-3xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                {BENEFITS_DATA.length} benefits <span className="text-[color:var(--color-ph-blue)]">found for you</span>
              </h1>
              <p className="mt-3 text-sm text-slate-600 md:text-base max-w-xl mx-auto">
                Click on any benefit to see full details, requirements, and how to claim it.
              </p>
            </div>

            {/* Filters */}
            <div className="clay p-6 md:p-8 mb-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    🔍 Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search benefits..."
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                  />
                </div>
                <div>
                  <label htmlFor="scope" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    📍 Scope
                  </label>
                  <select
                    id="scope"
                    value={selectedScope}
                    onChange={(e) => setSelectedScope(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                  >
                    {scopes.map(scope => (
                      <option key={scope} value={scope}>{scope}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    📂 Category
                  </label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm transition focus:border-[color:var(--color-ph-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ph-blue)]/20"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBenefits.map((benefit) => (
                <div
                  key={benefit.id}
                  onClick={() => setSelectedBenefit(benefit)}
                  className="clay p-6 cursor-pointer transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="clay-yellow grid h-12 w-12 flex-shrink-0 place-items-center text-2xl">
                      {benefit.emoji}
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      benefit.scope === "National"
                        ? "bg-[color:var(--color-ph-blue)] text-white"
                        : benefit.scope === "Province"
                        ? "bg-[color:var(--color-ph-red)] text-white"
                        : "bg-[color:var(--color-ph-yellow)] text-slate-900"
                    }`}>
                      {benefit.scope}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-slate-900">{benefit.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{benefit.shortDesc}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="clay px-2 py-0.5">{benefit.agency}</span>
                    <span className="clay px-2 py-0.5">{benefit.category}</span>
                  </div>
                  <div className="mt-3 flex items-center text-sm font-semibold text-[color:var(--color-ph-blue)]">
                    Click to view details →
                  </div>
                </div>
              ))}
            </div>

            {filteredBenefits.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No benefits found matching your filters.</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Single Benefit View - Redesigned */
        <BenefitDetail benefit={selectedBenefit} onBack={() => setSelectedBenefit(null)} />
      )}

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

function BenefitDetail({ benefit, onBack }: { benefit: any; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-5 md:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="clay inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 mb-6"
        >
          ← Back to all benefits
        </button>

        {/* Hero Card */}
        <div className="clay p-6 md:p-10 relative overflow-hidden mb-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 opacity-10"><Sun spin /></div>
          
          <div className="relative flex flex-col md:flex-row md:items-start gap-6">
            <div className="clay-yellow grid h-20 w-20 flex-shrink-0 place-items-center text-5xl md:h-24 md:w-24">
              {benefit.emoji}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  benefit.scope === "National"
                    ? "bg-[color:var(--color-ph-blue)] text-white"
                    : benefit.scope === "Province"
                    ? "bg-[color:var(--color-ph-red)] text-white"
                    : "bg-[color:var(--color-ph-yellow)] text-slate-900"
                }`}>
                  {benefit.scope}
                </span>
                <span className="clay px-3 py-1 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ph-blue)]">
                  {benefit.agency}
                </span>
                <span className="clay-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ color: "#8a6a00" }}>
                  {benefit.category}
                </span>
              </div>
              
              <h1 className="font-display text-3xl font-black text-slate-900 md:text-4xl lg:text-5xl">
                {benefit.title}
              </h1>
              
              <p className="mt-3 text-base text-slate-600 md:text-lg max-w-2xl">
                {benefit.shortDesc}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="clay-yellow h-2 w-2 rounded-full" />
                  <span className="text-slate-600">You're eligible ✓</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="clay-blue h-2 w-2 rounded-full" />
                  <span className="text-slate-600">Apply now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(benefit.stats).map(([key, value]) => (
            <div key={key} className="clay p-4 text-center">
              <p className="text-2xl font-black text-[color:var(--color-ph-blue)] md:text-3xl">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{key}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200">
          {[
            { id: "overview", label: "📖 Overview" },
            { id: "requirements", label: "📋 Requirements" },
            { id: "steps", label: "🚀 Application Steps" },
            { id: "how-to-claim", label: "💰 How to Claim" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "text-[color:var(--color-ph-blue)] border-b-2 border-[color:var(--color-ph-blue)]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="clay-blue p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl mb-4">
                  What you need to know
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🇬🇧</span>
                      <h3 className="font-semibold text-[color:var(--color-ph-blue)]">English</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed md:text-base">
                      {benefit.engDesc}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🇵🇭</span>
                      <h3 className="font-semibold text-[color:var(--color-ph-red)]">Tagalog</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed md:text-base">
                      {benefit.tagDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="clay-yellow p-6 md:p-8">
                <h3 className="font-display text-xl font-bold text-slate-900 mb-4">
                  💡 Quick Tips
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-lg">✅</span>
                    <span className="text-sm text-slate-700">Double-check all requirements before applying</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">📅</span>
                    <span className="text-sm text-slate-700">Check application periods and deadlines</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🏛️</span>
                    <span className="text-sm text-slate-700">Visit your nearest agency office for assistance</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === "requirements" && (
            <div className="clay p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl mb-6">
                What you need to prepare
              </h2>
              
              <div className="space-y-6">
                {benefit.requirements.map((req: any, index: number) => (
                  <div key={req.id} className="clay-red p-6">
                    <div className="flex items-start gap-4">
                      <div className="clay-yellow grid h-10 w-10 flex-shrink-0 place-items-center font-display text-xl font-black text-[color:var(--color-ph-blue)]">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-bold text-slate-900 mb-3">
                          {req.title}
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-[color:var(--color-ph-blue)] uppercase tracking-wider mb-1">English</p>
                            <p className="text-sm text-slate-700">{req.engDesc}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[color:var(--color-ph-red)] uppercase tracking-wider mb-1">Tagalog</p>
                            <p className="text-sm text-slate-700">{req.tagDesc}</p>
                          </div>
                          {req.images && (
                            <div className="mt-4">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sample Documents</p>
                              <div className="flex flex-wrap gap-2">
                                {req.images.map((img: string, idx: number) => (
                                  <div key={idx} className="clay px-4 py-2 text-xs text-slate-600">
                                    📄 {img.replace('/images/', '').replace('.jpg', '').replace('-', ' ')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === "steps" && (
            <div className="clay p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl mb-6">
                How to apply
              </h2>
              
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[color:var(--color-ph-blue)]/20" />
                
                <div className="space-y-8">
                  {benefit.steps.map((step: string, index: number) => (
                    <div key={index} className="relative flex items-start gap-6">
                      <div className="clay-blue grid h-12 w-12 flex-shrink-0 place-items-center font-display text-lg font-black text-[color:var(--color-ph-blue)] z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm text-slate-700 md:text-base">{step}</p>
                        {index < benefit.steps.length - 1 && (
                          <div className="mt-2 text-xs text-slate-400">↓ Next step</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* How to Claim Tab */}
          {activeTab === "how-to-claim" && (
            <div className="space-y-6">
              {benefit.utilizations.map((util: any) => (
                <div key={util.id} className="clay-yellow p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="clay grid h-12 w-12 flex-shrink-0 place-items-center text-2xl">
                      💰
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xl font-bold text-slate-900 mb-3">
                        {util.title}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-[color:var(--color-ph-blue)] uppercase tracking-wider mb-1">English</p>
                          <p className="text-sm text-slate-700">{util.engDesc}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color:var(--color-ph-red)] uppercase tracking-wider mb-1">Tagalog</p>
                          <p className="text-sm text-slate-700">{util.tagDesc}</p>
                        </div>
                        {util.images && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Visual Guide</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {util.images.map((img: string, idx: number) => (
                                <div key={idx} className="clay aspect-video bg-white/70 flex items-center justify-center text-sm text-slate-500 p-4">
                                  🖼️ {img.replace('/images/', '').replace('.jpg', '').replace('-', ' ')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Additional Claim Info */}
              <div className="clay-blue p-6 md:p-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h4 className="font-display text-lg font-bold text-slate-900">Need help?</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Contact {benefit.agency} hotline or visit your nearest {benefit.agency} office for assistance with your application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap gap-4">
          <button className="clay-blue group inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1">
            Apply Now
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
          <button className="clay px-8 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-1">
            Save for later
          </button>
          <button className="clay-yellow px-8 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-1" style={{ color: "#8a6a00" }}>
            Share
          </button>
        </div>
      </div>
    </section>
  );
}