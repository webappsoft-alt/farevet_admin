/* eslint-disable no-unused-vars */
import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../authRoutes/useAuth';
import {
    applicationdark, applicationwhite,
    appoointmentdark, appoointmentwhite,
    businessdark, businesswhite,
    dashboarddark, dashboardwhite,
    dealdark, dealwhite,
    logofarevet,
    padlock, padlocklight,
    reportdark, reportwhite
} from '../icons/icon';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../api/auth_api';

const SidebarMenu = ({ children, setToggled, toggled, setBroken }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [selectedLink, setSelectedLink] = useState('0');
    const [show, setShow] = useState(false);
    const chatCount = useSelector((state) => state.videoCall?.chatCount);
    const navigate = useNavigate();
    const location = useLocation();
    const isLogin = useAuth();
    const user_type = window.localStorage.getItem('user_type');
    const adminData = JSON.parse(window.localStorage.getItem('login_farevet_formData'));
    const [unseenCounts, setUnseenCounts] = useState({});
    const intervalRef = useRef(null);
    const prevPathRef = useRef(location.pathname);
    const isLoadingRef = useRef(false);

    // Route to table_name mapping
    const routeToTableMap = {
        '/quotes': 'quotes',
        '/fund_campaign': 'fund_campaign',
        '/pet_services_budget': 'services_budget',
        '/support': 'support'
    };

    // Map table names to API response keys
    const tableToApiKeyMap = {
        'quotes': 'quotes_count',
        'fund_campaign': 'fund_campaign_count',
        'services_budget': 'service_budget_count',
        'support': 'support_count'
    };

    // Fetch unseen counts
    const fetchUnseenCounts = async () => {
        if (isLoadingRef.current) return;
        
        isLoadingRef.current = true;
        try {
            const body = new FormData();
            body.append('type', 'get_unseen_sidebar');
            const result = await apiRequest({ body });
            if (result) {
                setUnseenCounts(result);
            }
        } catch (error) {
            // Error handling - minimal console as requested
        } finally {
            isLoadingRef.current = false;
        }
    };

    // Update unseen when user visits a route
    const updateUnseen = async (tableName) => {
        try {
            const body = new FormData();
            body.append('type', 'update_unseen');
            body.append('table_name', tableName);
            await apiRequest({ body });
            // Refresh counts after update with a small delay
            setTimeout(() => {
                fetchUnseenCounts();
            }, 500);
        } catch (error) {
            // Error handling - minimal console as requested
        }
    };

    // Fetch counts on mount and set up polling
    useEffect(() => {
        if (isLogin) {
            fetchUnseenCounts();
            // Set up polling every 10 seconds for real-time updates (reduced frequency)
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

    // Handle route changes and update unseen
    useEffect(() => {
        const currentPath = location.pathname;
        const prevPath = prevPathRef.current;

        // Check if route changed to one of the tracked routes
        if (currentPath !== prevPath && routeToTableMap[currentPath] && isLogin) {
            const tableName = routeToTableMap[currentPath];
            updateUnseen(tableName);
        }

        prevPathRef.current = currentPath;
    }, [location.pathname, isLogin]);

    const menuItems2 = [
        { badge: false, image: dashboarddark, image2: dashboardwhite, items: "Dashboard", path: '/dashboard' },
        { badge: false, image: appoointmentdark, image2: appoointmentwhite, items: "Individual Users", path: '/individual-users' },
        { badge: false, image: appoointmentdark, image2: appoointmentwhite, items: "Vets", path: '/vets' },
        { badge: false, image: appoointmentdark, image2: appoointmentwhite, items: "Vet Pro", path: '/vet-pro' },
        { badge: false, image: businessdark, image2: businesswhite, items: "Services List", path: '/service-names' },
        { badge: false, image: businessdark, image2: businesswhite, items: "Services", path: '/services' },
        { badge: false, image: businessdark, image2: businesswhite, items: "Business", path: '/business' },
        { badge: false, image: businessdark, image2: businesswhite, items: "Claim Business", path: '/claim-business' },
        { badge: false, image: reportdark, image2: reportwhite, items: "Reported Cost", path: "/reported-cost" },
        { badge: false, image: reportdark, image2: reportwhite, items: "Sub Admin", path: "/sub-admin" },
        { badge: false, image: applicationdark, image2: applicationwhite, items: "Application", path: "/application" },
        { badge: false, image: appoointmentdark, image2: appoointmentwhite, items: "Appointments", path: "/appointments" },
        { badge: false, image: dealdark, image2: dealwhite, items: "Deals", path: "/deals" },
        { badge: false, image: dealdark, image2: dealwhite, items: "Pet Insurance", path: "/pet-insurance" },
        {
            image: reportdark,
            image2: reportwhite,
            items: "Vet Bills",
            path: null,
            subItems: [
                { label: "Charity", path: "/vet-bills/charity" },
                { label: "Financing", path: "/vet-bills/financing" },
                { label: "Clinics", path: "/vet-bills/clinics" }
            ]
        },
        { badge: false, image: dealdark, image2: dealwhite, items: "Community", path: "/community" },
        { badge: false, image: dealdark, image2: dealwhite, items: "Community Messages", path: "/messge-community" },
        { badge: false, image: dealdark, image2: dealwhite, items: "Emergency", path: "/emergency" },
        { badge: true, image: dealdark, image2: dealwhite, items: "Quotes", path: "/quotes", tableName: "quotes" },
        { badge: true, image: dealdark, image2: dealwhite, items: "Fund Campaign", path: "/fund_campaign", tableName: "fund_campaign" },
        { badge: true, image: dealdark, image2: dealwhite, items: "Services Budget", path: "/pet_services_budget", tableName: "services_budget" },
        { badge: true, image: dealdark, image2: dealwhite, items: "Customer Support", path: "/support", tableName: "support" },
        { badge: false, image: applicationdark, image2: applicationwhite, items: "Chat", path: "/chat" },
        { badge: false, image: padlock, image2: padlocklight, items: "Change Password", path: '/change-password' }
    ];

    let menuItems;
    if (adminData && adminData.admin_type === "sub_admin") {
        const parsedPages = JSON.parse(adminData.pages);
        menuItems = menuItems2.filter(item => {
            if (!item.subItems) {
                return parsedPages.includes(item.items);
            }
            return item.subItems.some(subItem => {
                return parsedPages.includes(subItem.label);
            });
        });
    } else if (adminData && adminData?.admin_type === 'main') {
        menuItems = menuItems2;
    } else if (user_type === 'vet') {
        menuItems = [
            { badge: false, image: applicationdark, image2: applicationwhite, items: "Profile", path: "/profile" },
            { badge: false, image: applicationdark, image2: applicationwhite, items: "Chat", path: "/chat" }
        ]
    }

    const handleLinkClick = (itemId, path, tableName) => {
        setSelectedLink(itemId);
        setToggled(false);
        setShow(false);
        
        // Call update_unseen API if tableName exists
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
                <div className='flex h-screen min-h-screen'>
                    <div className='h-screen relative' style={{ zIndex: 999 }}>
                        <Sidebar
                            width='270px'
                            style={{ height: '100%', zIndex: 999 }}
                            collapsed={collapsed}
                            toggled={toggled}
                            backgroundColor='white'
                            onBackdropClick={() => {
                                setToggled(false);
                                setShow(false);
                            }}
                            onBreakPoint={setBroken}
                            breakPoint="xl"
                        >
                            <div className='scrolbar' style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%', paddingTop: '2rem' }}>
                                <div className='mb-5 ms-4'>
                                    <button onClick={() => { navigate(user_type === 'vet' ? '/profile' : '/dashboard') }} className="flex items-center gap-2">
                                        <img src={logofarevet} className='' alt="" />
                                        <span className="inter_semibold text-2xl text_darkprimary">FareVet</span>
                                    </button>
                                </div>
                                <Menu style={{ width: "90%" }} className='mx-auto flex flex-col justify-between h-full'>
                                    <div>
                                        <p className="inter_semibold text-secondary mb-2 px-4">General</p>
                                        {menuItems?.map((item, i) => (
                                            <Fragment key={i}>
                                                {item.subItems ? (
                                                    <SubMenu
                                                        label={<span className='inter_semibold'>{item.items}</span>}
                                                        icon={
                                                            <img
                                                                className=''
                                                                src={item.subItems.some(subItem => isChildPath(subItem.path, location.pathname)) ? item.image : item.image}
                                                                alt={item.items}
                                                            />
                                                        }
                                                        className={`w-full inter_semibold rounded-lg mb-2 ${item.subItems.some(subItem => isChildPath(subItem.path, location.pathname))
                                                            ? 'text_primary inter_medium'
                                                            : 'text_secondary'
                                                            }`}
                                                    >
                                                        {item.subItems.map((subItem, j) => (
                                                            <MenuItem
                                                                key={`${i}-${j}`}
                                                                onClick={() => handleLinkClick(`${i}-${j}`, subItem.path)}
                                                                component={<Link to={subItem.path} />}
                                                                className={`w-full rounded-lg mb-1 ${isChildPath(subItem.path, location.pathname)
                                                                    ? 'bg_primary text_white inter_medium'
                                                                    : 'text_secondary'
                                                                    }`}
                                                            >
                                                                <div className='inter_semibold'>{subItem.label}</div>
                                                            </MenuItem>
                                                        ))}
                                                    </SubMenu>
                                                ) : (
                                                    <MenuItem
                                                        onClick={() => handleLinkClick(i.toString(), item.path, item.tableName)}
                                                        component={<Link to={item.path} />}
                                                        className={`w-full rounded-lg mb-2 ${isChildPath(item.path, location.pathname)
                                                            ? 'bg_primary text_white inter_medium'
                                                            : 'text_secondary'
                                                            }`}
                                                    >
                                                        <div className="d-flex justify-content-between items-center w-full">
                                                            <div className="flex items-center gap-2">
                                                                <img src={isChildPath(item.path, location.pathname) ? item.image2 : item.image} alt="" />
                                                                <div className='inter_semibold'>{item.items}</div>
                                                            </div>
                                                            {item.badge && item.items !== "Chat" && (() => {
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
                                                                        className="rounded-5 plusJakara_medium text_white"
                                                                        style={{
                                                                            zIndex: 99,
                                                                            fontSize: "12px",
                                                                            backgroundColor: "red",
                                                                            padding: isThreeDigits ? "2px 5px" : count < 10 ? "0px 6px" : "0px 5px",
                                                                        }}
                                                                    >
                                                                        {displayCount}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </MenuItem>
                                                )}
                                            </Fragment>
                                        ))}
                                    </div>
                                </Menu>
                            </div>
                        </Sidebar>
                    </div>
                    <main className='w-full overflow-auto' style={{ backgroundColor: '#FAFBFC' }}>
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