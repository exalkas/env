import Link from "next/link";
import PricingSection from "../components/PricingSection";

export default function Home() {
  return (
    <>
      <section className="flex min-h-[70vh] flex-col items-center justify-center p-10 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Buy and Sell Green Energy Assets
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            The leading marketplace for EUAs, EUA2, GOO, GEO, voluntary markets,
            and biofuels. Get real-time market data and industry news.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 shadow-md"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-100 border border-gray-300 shadow-md"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need for green energy trading
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Real-time Market Data
              </h3>
              <p className="text-gray-600">
                Access up-to-date prices for EUAs, EUA2, GOO, GEO, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Industry News</h3>
              <p className="text-gray-600">
                Stay informed with the latest green energy news and insights.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Trading</h3>
              <p className="text-gray-600">
                Buy and sell green energy assets with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">About Us</h2>
            <p className="mt-4 text-xl text-gray-600">
              Leading the green energy revolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-600 mb-6">
                At Green Energy Trading, we're committed to creating a more
                sustainable future by facilitating the trade of green energy
                assets. Our platform connects buyers and sellers, providing
                transparent pricing and real-time market data.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                As energy brokers with years of experience, we understand the
                complexities of the green energy market and have developed a
                platform that makes trading accessible and efficient.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're looking to buy EUAs, sell GOOs, or simply stay
                informed about the market, our platform provides the tools and
                information you need.
              </p>
            </div>
            <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">About Image Placeholder</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
