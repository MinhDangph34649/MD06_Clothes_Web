/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext } from 'react';
import { Layout } from 'antd';
import { AuthContext } from '../services/AuthContext';

const { Header } = Layout;

const Navbar = () => {
    const { isAuthenticated, logout } = useContext(AuthContext);

    return (
        <Header
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 16px',
                background: '#001529',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>Admin Dashboard</div>
            {isAuthenticated && (
                <div style={{ color: '#fff' }}>
                    <span>Xin chào, Admin</span> |{' '}
                    <a
                        href="#"
                        style={{ color: '#1890ff' }}
                        onClick={(e) => {
                            e.preventDefault();
                            logout();
                        }}
                    >
                        Đăng xuất
                    </a>
                </div>
            )}
        </Header>
    );
};

export default Navbar;
