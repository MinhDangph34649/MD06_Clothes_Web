import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import QRCodeGenerator from './pages/QRCodeGenerator';
import Orders from './pages/Orders';
import Statistics from './pages/Statistics';
import LoginPage from './pages/LoginPage';
import { AuthContext, AuthProvider } from './services/AuthContext';

const { Content } = Layout;

const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  const [collapsed, setCollapsed] = useState(false); // Quản lý trạng thái Sidebar

  return (
    <AuthProvider>
      <Router>
        <Layout style={{ minHeight: '100vh', paddingTop: '64px' }}>
          {/* 64px là chiều cao của Header */}
          <Navbar />
          <Layout>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Layout
              style={{
                marginLeft: collapsed ? '80px' : '200px', // Sử dụng trạng thái collapsed
                transition: 'margin-left 0.2s ease',
              }}
            >
              <Content style={{ padding: '16px', background: '#fff' }}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<Navigate to="/statistics" />} />
                  <Route path="/products" element={<ProtectedRoute element={<Products />} />} />
                  <Route path="/categories" element={<ProtectedRoute element={<Categories />} />} />
                  <Route path="/users" element={<ProtectedRoute element={<Users />} />} />
                  <Route path="/qrcode" element={<ProtectedRoute element={<QRCodeGenerator />} />} />
                  <Route path="/orders" element={<ProtectedRoute element={<Orders />} />} />
                  <Route path="/statistics" element={<ProtectedRoute element={<Statistics />} />} />
                  <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;
