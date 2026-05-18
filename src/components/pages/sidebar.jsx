/* eslint-disable no-unused-vars */
import React, { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { Menu, MenuItem, Sidebar, SubMenu } from "react-pro-sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineQueueList,
  HiOutlineCog6Tooth,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlinePresentationChartBar,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBookOpen,
  HiOutlineBeaker,
  HiOutlineCalendarDays,
  HiOutlineTag,
  HiOutlineReceiptPercent,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineExclamationTriangle,
  HiOutlineDocumentText,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBar,
  HiOutlineQuestionMarkCircle,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineLockClosed,
  HiOutlineUserCircle,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import { useAuth } from "../authRoutes/useAuth";
import { logofarevet } from "../icons/icon";
import { apiRequest } from "../../api/auth_api";
import "./sidebarNav.scss";

const SIDEBAR_WIDTH = "220px";

/** Group order + labels must match `item.items` for sub_admin filtering. */
const MENU_SECTION_CONFIG = [
  { heading: "Overview", itemLabels: ["Dashboard"] },
  { heading: "Partners", itemLabels: ["Partner Management", "Intelligence Reports"] },
  {
    heading: "Users & roles",
    itemLabels: ["Individual Users", "Vets", "Vet Pro", "Sub Admin"],
  },
  {
    heading: "Business & services",
    itemLabels: [
      "Services List",
      "Services",
      "Business",
      "Claim Business",
      "Reported Cost",
    ],
  },
  {
    heading: "Content & scheduling",
    itemLabels: [
      "Application",
      "Education Articles",
      "Medication",
      // "FareVet Concierge",
      "Appointments",
    ],
  },
  {
    heading: "Offers & coverage",
    itemLabels: ["Deals", "Pet Insurance", "Vet Bills"],
  },
  {
    heading: "Community",
    itemLabels: ["Community", "Community Messages", "Emergency"],
  },
  {
    heading: "Requests & support",
    itemLabels: [
      "Quotes",
      "Fund Campaign",
      "Services Budget",
      "Customer Support",
    ],
  },
  { heading: "Account", itemLabels: ["Chat", "Change Password"] },
];

function pathMatchesBase(itemPath, pathname) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Submenu link active: optional `search` on subItem; `pathMatch: "exact"` avoids `/medication` matching `/medication/categories`. */
function subMenuItemIsActive(subItem, pathname, locSearch) {
  if (subItem.pathMatch === "exact") {
    if (pathname !== subItem.path) return false;
  } else if (!pathMatchesBase(subItem.path, pathname)) {
    return false;
  }
  const loc = new URLSearchParams(
    locSearch && locSearch.startsWith("?")
      ? locSearch.slice(1)
      : locSearch || "",
  );
  if (subItem.search) {
    const raw = subItem.search.startsWith("?")
      ? subItem.search.slice(1)
      : subItem.search;
    const want = new URLSearchParams(raw);
    for (const [k, v] of want) {
      if (loc.get(k) !== v) return false;
    }
    return true;
  }
  return true;
}

function buildGroupedSections(menuItemsFlat) {
  if (!menuItemsFlat?.length) return [];
  const byLabel = {};
  menuItemsFlat.forEach((item) => {
    byLabel[item.items] = item;
  });
  return MENU_SECTION_CONFIG.map(({ heading, itemLabels }) => ({
    heading,
    items: itemLabels.map((label) => byLabel[label]).filter(Boolean),
  })).filter((section) => section.items.length > 0);
}

function SidebarNavIcon({ Icon, active, subtle }) {
  const cls = subtle
    ? `sidebar-farevet-icon ${active ? "text_primary" : "text_secondary"}`
    : `sidebar-farevet-icon ${active ? "text-white" : "text_primary"}`;
  return <Icon className={cls} aria-hidden />;
}

function renderMenuRow(
  item,
  _sectionItemIndex,
  location,
  handleLinkClick,
  isChildPath,
  unseenCounts,
  tableToApiKeyMap,
) {
  const key = item.path || `sub-${item.items}`;
  if (item.subItems) {
    return (
      <Fragment key={key}>
        <SubMenu
          label={
            <span className="inter_semibold sidebar-farevet-item-label">
              {item.items}
            </span>
          }
          icon={<SidebarNavIcon Icon={item.Icon} active={false} />}
          className="inter_semibold mb-0.5 rounded-lg sidebar-farevet-submenu-root"
        >
          {item.subItems.map((subItem, j) => {
            const subActive = subMenuItemIsActive(
              subItem,
              location.pathname,
              location.search,
            );
            const linkTo = subItem.search
              ? {
                  pathname: subItem.path,
                  search: subItem.search.startsWith("?")
                    ? subItem.search
                    : `?${subItem.search}`,
                }
              : subItem.path;
            return (
              <MenuItem
                key={`${key}-${j}`}
                component={<Link to={linkTo} />}
                onClick={() => handleLinkClick(`${key}-${j}`, subItem.path)}
                className={`inter_semibold mb-0.5 rounded-lg ${
                  subActive
                    ? "sidebar-farevet-item-active bg_primary text_white"
                    : "text_secondary"
                }`}
              >
                <span className="inter_semibold sidebar-farevet-item-label">
                  {subItem.label}
                </span>
              </MenuItem>
            );
          })}
        </SubMenu>
      </Fragment>
    );
  }

  return (
    <MenuItem
      key={key}
      component={<Link to={item.path} />}
      onClick={() =>
        handleLinkClick(item.path || item.items, item.path, item.tableName)
      }
      className={`inter_semibold mb-0.5 rounded-lg ${
        isChildPath(item.path, location.pathname)
          ? "sidebar-farevet-item-active bg_primary text_white"
          : "text_secondary"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarNavIcon
            Icon={item.Icon}
            active={isChildPath(item.path, location.pathname)}
          />
          <span className="inter_semibold sidebar-farevet-item-label truncate">
            {item.items}
          </span>
        </div>
        {item.badge &&
          item.items !== "Chat" &&
          (() => {
            let count = 0;
            if (item.tableName) {
              const apiKey = tableToApiKeyMap[item.tableName];
              if (apiKey && unseenCounts[apiKey]) {
                count = parseInt(unseenCounts[apiKey], 10) || 0;
              }
            }
            if (count === 0) return null;

            const displayCount = count > 100 ? "99+" : count;
            const isThreeDigits = count > 99;

            return (
              <div
                className="plusJakara_medium text_white shrink-0 rounded-full"
                style={{
                  zIndex: 99,
                  fontSize: "10px",
                  backgroundColor: "#e74c3c",
                  padding: isThreeDigits
                    ? "2px 5px"
                    : count < 10
                      ? "1px 6px"
                      : "1px 5px",
                  lineHeight: 1.3,
                }}
              >
                {displayCount}
              </div>
            );
          })()}
      </div>
    </MenuItem>
  );
}

const SidebarMenu = ({ children, setToggled, toggled, setBroken }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = useAuth();
  const user_type = window.localStorage.getItem("user_type");
  const adminData = JSON.parse(
    window.localStorage.getItem("login_farevet_formData"),
  );
  const [unseenCounts, setUnseenCounts] = useState({});
  const intervalRef = useRef(null);
  const prevPathRef = useRef(location.pathname);
  const isLoadingRef = useRef(false);

  const routeToTableMap = {
    "/quotes": "quotes",
    "/fund_campaign": "fund_campaign",
    "/pet_services_budget": "services_budget",
    "/support": "support",
  };

  const tableToApiKeyMap = {
    quotes: "quotes_count",
    fund_campaign: "fund_campaign_count",
    services_budget: "service_budget_count",
    support: "support_count",
  };

  const fetchUnseenCounts = async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      const body = new FormData();
      body.append("type", "get_unseen_sidebar");
      const result = await apiRequest({ body });
      if (result) {
        setUnseenCounts(result);
      }
    } catch (error) {
      // minimal handling
    } finally {
      isLoadingRef.current = false;
    }
  };

  const updateUnseen = async (tableName) => {
    try {
      const body = new FormData();
      body.append("type", "update_unseen");
      body.append("table_name", tableName);
      await apiRequest({ body });
      setTimeout(() => {
        fetchUnseenCounts();
      }, 500);
    } catch (error) {
      // minimal handling
    }
  };

  useEffect(() => {
    if (isLogin) {
      fetchUnseenCounts();
      intervalRef.current = setInterval(() => {
        if (!isLoadingRef.current) {
          fetchUnseenCounts();
        }
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLogin]);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    if (currentPath !== prevPath && routeToTableMap[currentPath] && isLogin) {
      const tableName = routeToTableMap[currentPath];
      updateUnseen(tableName);
    }

    prevPathRef.current = currentPath;
  }, [location.pathname, isLogin]);

  const menuItems2 = [
    {
      badge: false,
      Icon: HiOutlineSquares2X2,
      items: "Dashboard",
      path: "/dashboard",
    },
    {
      badge: false,
      Icon: HiOutlineBriefcase,
      items: "Partner Management",
      path: "/partners",
    },
    {
      badge: false,
      Icon: HiOutlineDocumentText,
      items: "Intelligence Reports",
      path: "/reports",
    },
    {
      badge: false,
      Icon: HiOutlineUsers,
      items: "Individual Users",
      path: "/individual-users",
    },
    {
      badge: false,
      Icon: HiOutlineUserGroup,
      items: "Vets",
      path: "/vets",
    },
    {
      badge: false,
      Icon: HiOutlineStar,
      items: "Vet Pro",
      path: "/vet-pro",
    },
    {
      badge: false,
      Icon: HiOutlineQueueList,
      items: "Services List",
      path: "/service-names",
    },
    {
      badge: false,
      Icon: HiOutlineCog6Tooth,
      items: "Services",
      path: "/services",
    },
    {
      badge: false,
      Icon: HiOutlineBuildingOffice2,
      items: "Business",
      path: "/business",
    },
    {
      badge: false,
      Icon: HiOutlineMapPin,
      items: "Claim Business",
      path: "/claim-business",
    },
    {
      badge: false,
      Icon: HiOutlinePresentationChartBar,
      items: "Reported Cost",
      path: "/reported-cost",
    },
    {
      badge: false,
      Icon: HiOutlineShieldCheck,
      items: "Sub Admin",
      path: "/sub-admin",
    },
    {
      badge: false,
      Icon: HiOutlineClipboardDocumentCheck,
      items: "Application",
      path: "/application",
    },
    {
      badge: false,
      Icon: HiOutlineBookOpen,
      items: "Education Articles",
      path: "/education-articles",
    },
    {
      badge: false,
      Icon: HiOutlineBeaker,
      items: "Medication",
      path: null,
      subItems: [
        {
          label: "Medication database",
          path: "/medication",
          pathMatch: "exact",
        },
        { label: "Categories", path: "/medication/categories" },
      ],
    },
    // {
    //   badge: false,
    //   Icon: HiOutlineCalendarDays,
    //   items: "FareVet Concierge",
    //   path: "/concierge-requests",
    // },
    {
      badge: false,
      Icon: HiOutlineCalendarDays,
      items: "Appointments",
      path: "/appointments",
    },
    {
      badge: false,
      Icon: HiOutlineTag,
      items: "Deals",
      path: "/deals",
    },
    {
      badge: false,
      Icon: HiOutlineReceiptPercent,
      items: "Pet Insurance",
      path: "/pet-insurance",
    },
    {
      Icon: HiOutlineCreditCard,
      items: "Vet Bills",
      path: null,
      subItems: [
        { label: "Charity", path: "/vet-bills/charity" },
        { label: "Financing", path: "/vet-bills/financing" },
        { label: "Clinics", path: "/vet-bills/clinics" },
      ],
    },
    {
      badge: false,
      Icon: HiOutlineGlobeAlt,
      items: "Community",
      path: "/community",
    },
    {
      badge: false,
      Icon: HiOutlineChatBubbleLeftRight,
      items: "Community Messages",
      path: "/messge-community",
    },
    {
      badge: false,
      Icon: HiOutlineExclamationTriangle,
      items: "Emergency",
      path: "/emergency",
    },
    {
      badge: true,
      Icon: HiOutlineDocumentText,
      items: "Quotes",
      path: "/quotes",
      tableName: "quotes",
    },
    {
      badge: true,
      Icon: HiOutlineArrowTrendingUp,
      items: "Fund Campaign",
      path: "/fund_campaign",
      tableName: "fund_campaign",
    },
    {
      badge: true,
      Icon: HiOutlineChartBar,
      items: "Services Budget",
      path: "/pet_services_budget",
      tableName: "services_budget",
    },
    {
      badge: true,
      Icon: HiOutlineQuestionMarkCircle,
      items: "Customer Support",
      path: "/support",
      tableName: "support",
    },
    {
      badge: false,
      Icon: HiOutlineChatBubbleOvalLeftEllipsis,
      items: "Chat",
      path: "/chat",
    },
    {
      badge: false,
      Icon: HiOutlineLockClosed,
      items: "Change Password",
      path: "/change-password",
    },
  ];

  let menuItems;
  if (adminData && adminData.admin_type === "sub_admin") {
    const parsedPages = JSON.parse(adminData.pages);
    menuItems = menuItems2.filter((item) => {
      if (!item.subItems) {
        return parsedPages.includes(item.items);
      }
      return item.subItems.some((subItem) =>
        parsedPages.includes(subItem.label),
      );
    });
  } else if (adminData && adminData?.admin_type === "main") {
    menuItems = menuItems2;
  } else if (user_type === "vet") {
    menuItems = [
      {
        badge: false,
        Icon: HiOutlineUserCircle,
        items: "Profile",
        path: "/profile",
      },
      {
        badge: false,
        Icon: HiOutlineChatBubbleOvalLeftEllipsis,
        items: "Chat",
        path: "/chat",
      },
    ];
  }

  if (!menuItems) {
    menuItems = menuItems2;
  }

  const navSections = useMemo(() => {
    if (!menuItems?.length) return [];
    if (user_type === "vet") {
      return [{ heading: "Account", items: menuItems }];
    }
    return buildGroupedSections(menuItems);
  }, [menuItems, user_type]);

  const handleLinkClick = (itemId, path, tableName) => {
    setToggled(false);
    setShow(false);

    if (tableName && routeToTableMap[path]) {
      updateUnseen(tableName);
    }

    navigate(path);
  };

  const isChildPath = (parentPath, childPath) => {
    return childPath.startsWith(parentPath);
  };

  return (
    <>
      {isLogin ? (
        <div className="flex h-screen min-h-screen">
          <div
            className="sidebar-farevet h-screen relative shrink-0 bg_white"
            style={{ zIndex: 999 }}
          >
            <Sidebar
              className="sidebar-farevet"
              width={SIDEBAR_WIDTH}
              style={{ height: "100%", zIndex: 999, border: "none" }}
              collapsed={collapsed}
              toggled={toggled}
              backgroundColor="#ffffff"
              onBackdropClick={() => {
                setToggled(false);
                setShow(false);
              }}
              onBreakPoint={setBroken}
              breakPoint="xl"
            >
              <div
                className="sidebar-farevet-inner scrolbar flex flex-col overflow-y-auto"
                style={{ height: "100%" }}
              >
                <div className="sidebar-farevet-brand">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(user_type === "vet" ? "/profile" : "/dashboard");
                    }}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-0.5 py-0.5 text-left transition-opacity hover:opacity-90"
                  >
                    <img
                      src={logofarevet}
                      alt=""
                      className="sidebar-farevet-brand-logo shrink-0"
                    />
                    <span className="inter_semibold sidebar-farevet-brand-title text_darkprimary truncate">
                      FareVet
                    </span>
                  </button>
                </div>
                <Menu
                  style={{ width: "100%" }}
                  className="mx-auto flex w-full flex-col"
                >
                  {navSections.map((section) => (
                    <Fragment key={section.heading}>
                      <p className="sidebar-farevet-section-label">
                        {section.heading}
                      </p>
                      <div className="sidebar-farevet-section-items">
                        {section.items.map((item, idx) =>
                          renderMenuRow(
                            item,
                            idx,
                            location,
                            handleLinkClick,
                            isChildPath,
                            unseenCounts,
                            tableToApiKeyMap,
                          ),
                        )}
                      </div>
                    </Fragment>
                  ))}
                </Menu>
              </div>
            </Sidebar>
          </div>
          <main
            className="farevet-admin-main min-w-0 flex-1 overflow-auto w-full"
            style={{ backgroundColor: "#FAFBFC" }}
          >
            {children}
          </main>
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default SidebarMenu;
