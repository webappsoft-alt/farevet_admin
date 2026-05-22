/* eslint-disable no-unused-vars */
import { Menu, Transition } from '@headlessui/react';
import { message } from 'antd';
import React, { Fragment } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { MdMenu } from 'react-icons/md';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { arrowdown, logofarevet } from '../icons/icon';

const NavHeader = ({ broken, setToggled, toggled }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const admindata = JSON.parse(window.localStorage.getItem('login_farevet_formData'))

    const getPageName = (pathname) => {
        const path = pathname.split('/')[1];
        if (!path || path === 'dashboard') return 'Dashboard';
        if (path === 'chat') return 'Messages';
        if (path === 'change-password') return 'Settings';
        if (path === 'user') return 'Users';
        if (path === 'vet') return 'Vets';

        return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleLogout = () => {
        window.localStorage.removeItem("isLogin_farevet_admin");
        message.error("Logout Successful!");
        navigate('/login');
    };

    return (
        <>
            <Navbar bg="white" expand="lg" sticky="top" className='p-3 shadow-sm w-[100%]' id="navbar">
                <Container fluid className="w-full max-w-none px-3">
                    <div className='flex items-center gap-3 md:w-1/2'>
                        {broken && (
                            <button className="sb-button text-gray-600 hover:bg-gray-100 p-1.5 -ml-1.5 rounded-lg transition-colors border-none bg-transparent" onClick={() => setToggled(!toggled)}>
                                <MdMenu size={26} />
                            </button>
                        )}
                        <h4 className="text-xl inter_semibold text-gray-800 m-0 ">{getPageName(location.pathname)}</h4>
                    </div>
                    <Nav className="ms-auto flex">
                        <div className='flex justify-center w-full items-center'>
                            <Menu as="div" className="relative">
                                <Menu.Button className="relative flex items-center no-underline gap-2">
                                    <img src={logofarevet} style={{ height: "30px", width: '30px', borderRadius: '50%' }} alt="" />
                                    {/* <span className='hidden md:block text_dark plusJakara_regular'>Admin</span> */}
                                    <img src={arrowdown} style={{ height: '16px', width: 'auto' }} alt="" />
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <div className="absolute z-10 mt-2 right-0 flex flex-col rounded-md bg_white shadow py-2" style={{ minWidth: '10rem', right: 0 }}>
                                        {/* {admindata?.admin_type === 'sub_admin' && (
                                            <button onClick={() => navigate('/change-password')} className='px-4 text-start py-1 text_dark manrope_semibold text_white no-underline'>Profile</button>
                                        )} */}
                                        <Link onClick={handleLogout} className='px-4 py-1 text_dark manrope_semibold text_white no-underline'>Sign out</Link>
                                    </div>
                                </Transition>
                            </Menu>
                        </div>
                    </Nav>
                </Container>
            </Navbar >
        </>

    )
}

export default NavHeader
