"use client";

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
  { name: "Overview", href: "/education", icon: AcademicCapIcon },
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

  const handleLogout = () => {
    logout();
  };

  const allNavigation = [
    ...navigation,
    ...(currentUser?.is_admin ? adminNavigation : []),
    ...(currentUser?.is_super_admin ? superAdminNavigation : []),
  ];

  const isEducationActive = pathname.startsWith("/education");

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">Green Energy Admin</h2>
        {currentUser && (
          <p className="text-xs text-gray-400 mt-1">
            {currentUser.is_super_admin
              ? "SA"
              : currentUser.role?.display_name || "Admin"}
          </p>
        )}
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {allNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}

          {/* Education Section */}
          <li className="mt-6">
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase">
              Education
            </div>
            <ul className="mt-2 space-y-1">
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
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
