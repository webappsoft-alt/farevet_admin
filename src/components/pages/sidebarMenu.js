import React from 'react';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { allItems } from './allItems';

const menuItems = (items) => {
    return items.map((item) => {
        if (item.children) {
            return (
                <SubMenu key={item.id} title={item.title} icon={item.icon}>
                    {menuItems(item.children)}
                </SubMenu>
            );
        } else {
            return (
                <MenuItem key={item.id} icon={item.icon} component={<Link to={item.navLink} />}>
                    {item.title}
                </MenuItem>
            );
        }
    });
};

const SidebarMenu = () => {
    return (
        <div>
            <Sidebar>
                <Menu>{menuItems(allItems)}</Menu>
            </Sidebar>
        </div>
    );
};

export default SidebarMenu;
