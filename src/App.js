import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './services/AuthContext';
const { Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <Layout style={{ minHeight: '100vh', paddingTop: '64px' }}>
          <Navbar />
          <Layout>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Layout
              style={{
                marginLeft: collapsed ? '80px' : '200px',
                transition: 'margin-left 0.2s ease',
              }}
            >
              <Content style={{ padding: '16px', background: '#fff' }}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
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
