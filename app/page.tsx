export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Smart Student Hub
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition text-sm hidden md:block">
              Features
            </a>

            <a href="#impact" className="text-gray-600 hover:text-blue-600 transition text-sm hidden md:block">
              Why It Matters
            </a>

            <a
              href="/login"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm"
            >
              Get Started
            </a>

            <a
              href="/login/superadmin"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
            >
              Register University
            </a>
          </div>

        </div>
      </header>

      {/* HERO FULL WIDTH */}
      <section
        className="w-full bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background-home.png')" }}
      >
        {/* overlay */}
        <div className="bg-white/20 py-32">

          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">



            <h1 className="text-4xl mt-40 md:text-5xl font-bold tracking-tight text-gray-900">
              One Platform For All<br />Student Achievements
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A centralized digital ecosystem where students store, track,
              and showcase verified academic and co-curricular achievements.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <a
                href="/login"
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm"
              >
                Start Your Journey
              </a>

              <a
                href="#features"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Explore Features
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* Features */}
        <section id="features" className="space-y-12">

          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need in One Place
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A comprehensive platform designed for modern education needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Digital Portfolio", "Faculty Verification", "Accreditation Ready"].map((title, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">
                  Powerful tools to streamline student achievement management.
                </p>
              </div>
            ))}
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Smart Student Hub. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
