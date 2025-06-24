"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, getUser } from "../lib/utils/auth";
import {
  HomeIcon,
  UsersIcon,
  CubeIcon,
  CreditCardIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  BookmarkIcon,
  ChartBarIcon,
  RectangleGroupIcon,
  DocumentIcon,
  TagIcon,
  Bars3Icon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Users", href: "/users", icon: UsersIcon },
  { name: "Assets", href: "/assets", icon: CubeIcon },
  { name: "Transactions", href: "/transactions", icon: CreditCardIcon },
  { name: "News", href: "/news", icon: NewspaperIcon },
  { name: "Orders", href: "/orders", icon: ChatBubbleLeftRightIcon },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: ClipboardDocumentListIcon,
  },
];

// Education navigation items (Phase 2 implementation)
const educationNavigation = [
  { name: "Education", href: "/education", icon: AcademicCapIcon },
  {
    name: "Learning Paths",
    href: "/education/learning-paths",
    icon: BookOpenIcon,
  },
  {
    name: "Modules",
    href: "/education/modules",
    icon: RectangleGroupIcon,
  },
  {
    name: "Lessons",
    href: "/education/lessons",
    icon: DocumentIcon,
  },
  {
    name: "Questions",
    href: "/education/questions",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Question Categories",
    href: "/education/question-categories",
    icon: TagIcon,
  },
  {
    name: "Assessments",
    href: "/education/assessments",
    icon: ClipboardDocumentListIcon,
  },
  { name: "Glossary", href: "/education/glossary", icon: BookmarkIcon },
  { name: "Analytics", href: "/education/analytics", icon: ChartBarIcon },
];

// Admin and Super admin navigation items
const adminNavigation = [
  { name: "Permissions", href: "/permissions", icon: ShieldCheckIcon },
  { name: "Prompts", href: "/prompts", icon: DocumentTextIcon },
];

// Super admin only navigation items
const superAdminNavigation = [{ name: "Roles", href: "/roles", icon: CogIcon }];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = getUser();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load drawer state from localStorage on mount (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem("navigation-expanded");
      if (savedState !== null) {
        setIsExpanded(JSON.parse(savedState));
      }
    } else {
      // On mobile, default to collapsed
      setIsExpanded(false);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logout();
  };

  const toggleDrawer = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    // Only save to localStorage on desktop
    if (!isMobile) {
      localStorage.setItem("navigation-expanded", JSON.stringify(newState));
    }
  };

  const handleNavItemClick = () => {
    // Auto-close drawer on mobile when navigating
    if (isMobile && isExpanded) {
      setIsExpanded(false);
    }
  };

  const allNavigation = [
    ...navigation,
    ...(currentUser?.is_admin ? adminNavigation : []),
    ...(currentUser?.is_super_admin ? superAdminNavigation : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleDrawer}
        />
      )}

      {/* Navigation Drawer */}
      <div
        className={`${
          isMobile ? "fixed" : "relative"
        } bg-gray-800 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out z-50 ${
          isExpanded ? "w-64" : "w-16"
        } ${
          isMobile && !isExpanded ? "-translate-x-full md:translate-x-0" : ""
        }`}
      >
        {/* Header with title and toggle button */}
        <div className="p-4 flex items-center justify-between">
          {isExpanded ? (
            <>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold truncate">
                  Green Energy Admin
                </h2>
                {currentUser && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {currentUser.is_super_admin
                      ? "Super Admin"
                      : currentUser.role?.display_name || "Admin"}
                  </p>
                )}
              </div>
              <button
                onClick={toggleDrawer}
                className="ml-2 p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Collapse navigation"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleDrawer}
              className="w-full p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Expand navigation"
            >
              <Bars3Icon className="h-5 w-5 mx-auto" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {allNavigation.map((item) => {
              const isActive = pathname === item.href;

              if (isExpanded) {
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleNavItemClick}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              } else {
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center p-2 rounded-md transition-colors group relative ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" />
                      {/* Tooltip for collapsed state */}
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              }
            })}

            {/* Education Section */}
            <li className="mt-6">
              {isExpanded && (
                <div className="text-xs font-semibold leading-6 text-gray-400 uppercase px-3 mb-2">
                  Education
                </div>
              )}
              <ul
                className={`space-y-1 ${
                  !isExpanded ? "border-t border-gray-700 pt-2" : ""
                }`}
              >
                {educationNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/education/learning-paths" &&
                      pathname.includes("/education/learning-paths")) ||
                    (item.href === "/education/modules" &&
                      pathname.includes("/education/modules")) ||
                    (item.href === "/education/lessons" &&
                      pathname.includes("/education/lessons")) ||
                    (item.href === "/education/questions" &&
                      pathname.includes("/education/questions")) ||
                    (item.href === "/education/question-categories" &&
                      pathname.includes("/education/question-categories")) ||
                    (item.href === "/education/assessments" &&
                      pathname.includes("/education/assessments")) ||
                    (item.href === "/education/glossary" &&
                      pathname.includes("/education/glossary")) ||
                    (item.href === "/education/analytics" &&
                      pathname.includes("/education/analytics"));

                  if (isExpanded) {
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={handleNavItemClick}
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  } else {
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-center p-2 rounded-md transition-colors group relative ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                          title={item.name}
                        >
                          <item.icon className="h-5 w-5" />
                          {/* Tooltip for collapsed state */}
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-gray-700">
          {isExpanded ? (
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors group relative"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              {/* Tooltip for collapsed state */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
