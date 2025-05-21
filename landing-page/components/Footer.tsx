import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-lg font-semibold mb-4">Green Energy Trading</h3>
            <p className="text-gray-300 text-sm">
              The leading marketplace for green energy trading and information.
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="#" className="hover:text-primary-400">
                  EUAs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  EUA2
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  GOO
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  GEO
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  Voluntary Markets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="#about" className="hover:text-primary-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary-400">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Subscribe</h4>
            <p className="text-gray-300 text-sm mb-2">
              Join our newsletter for the latest updates.
            </p>
            <div className="flex mt-3">
              <input
                type="email"
                placeholder="Your email"
                className="bg-gray-700 text-white rounded-l px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
              />
              <button className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-r text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Green Energy Trading. All rights
            reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-primary-400">
              <span className="sr-only">Twitter</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-primary-400">
              <span className="sr-only">LinkedIn</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
