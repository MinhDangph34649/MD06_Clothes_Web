import React, { useState, useContext } from 'react';
import { Form, Input, Button, message } from 'antd';
import { AuthContext } from '../services/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import db from '../services/firebaseConfig';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);

        const { email, password } = values;

        try {
            const q = query(
                collection(db, 'Admin'),
                where('username', '==', email),
                where('pass', '==', password)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                login(); // Đặt trạng thái đăng nhập
                message.success('Đăng nhập thành công!');
                navigate('/products'); // Chuyển hướng đến trang quản lý
            } else {
                message.error('Tên đăng nhập hoặc mật khẩu không đúng!');
            }
        } catch (error) {
            console.error('Error during login:', error);
            message.error('Đã xảy ra lỗi khi đăng nhập!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
            <h2>Đăng nhập Admin</h2>
            <Form layout="vertical" onFinish={handleLogin}>
                <Form.Item
                    label="Tên đăng nhập"
                    name="email"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    Đăng nhập
                </Button>
            </Form>
        </div>
    );
};

export default LoginPage;
