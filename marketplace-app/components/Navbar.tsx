"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-green-400 font-bold text-xl">
                Green Energy Trading
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/market"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Market
              </Link>
              <Link
                href="/orders"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Orders
              </Link>
              <Link
                href="/transactions"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Transactions
              </Link>
              <Link
                href="/news"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
              >
                News
              </Link>
            </div>
          </div>

          {/* Secondary navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-400"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                      {user.full_name
                        ? user.full_name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2 text-xs text-gray-400">
                      Signed in as {user.email}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/profile/kyc"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      KYC Verification
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/market"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Market
          </Link>
          <Link
            href="/orders"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Orders
          </Link>
          <Link
            href="/transactions"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Transactions
          </Link>
          <Link
            href="/news"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            News
          </Link>
        </div>
        {!user ? (
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <Link
                href="/login"
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
            </div>
            <div className="mt-3 px-2">
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-2 rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                  {user.full_name
                    ? user.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user.full_name}
                </div>
                <div className="text-sm font-medium text-gray-400">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link
                href="/profile/kyc"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                KYC Verification
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
