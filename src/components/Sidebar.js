import React from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import {
    AppstoreOutlined,
    TagsOutlined,
    UserOutlined,
    QrcodeOutlined,
    OrderedListOutlined,
    LineChartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ collapsed, setCollapsed }) => {
    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            style={{
                height: '100vh',
                position: 'fixed',
                left: 0,
                overflow: 'auto',
                background: '#001529',
                boxShadow: '2px 0 6px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" style={{ paddingTop: '20px', fontSize: '16px' }}>
                <Menu.Item key="1" icon={<AppstoreOutlined />}>
                    <Link to="/products">Quản lý sản phẩm</Link>
                </Menu.Item>
                <Menu.Item key="2" icon={<TagsOutlined />}>
                    <Link to="/categories">Quản lý danh mục</Link>
                </Menu.Item>
                <Menu.Item key="3" icon={<UserOutlined />}>
                    <Link to="/users">Quản lý user</Link>
                </Menu.Item>
                <Menu.Item key="5" icon={<OrderedListOutlined />}>
                    <Link to="/orders">Duyệt đơn</Link>
                </Menu.Item>
                <Menu.Item key="6" icon={<LineChartOutlined />}>
                    <Link to="/statistics">Thống kê</Link>
                </Menu.Item>
            </Menu>
        </Sider>
    );
};

export default Sidebar;
