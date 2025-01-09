import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import db from '../services/firebaseConfig';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]); // Danh sách người dùng sau khi lọc
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // User đang chỉnh sửa
    const [form] = Form.useForm();

    // ** Lấy danh sách user **
    const fetchUsers = async () => {
        try {
            const idUserSnapshot = await getDocs(collection(db, 'IDUser'));
            const idUserData = idUserSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const fullData = await Promise.all(
                idUserData.map(async (idUser) => {
                    const profileRef = query(
                        collection(db, `User/${idUser.iduser}/Profile`)
                    );
                    const profileSnapshot = await getDocs(profileRef);

                    const profileData = profileSnapshot.docs.map((doc) => ({
                        profileId: doc.id,
                        ...doc.data(),
                    }))[0];

                    return { ...idUser, ...profileData };
                })
            );

            setUsers(fullData);
            setFilteredUsers(fullData); // Hiển thị danh sách ban đầu
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Lỗi khi lấy danh sách người dùng!');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ** Tìm kiếm người dùng **
    const handleSearch = (value) => {
        const filtered = users.filter((user) => {
            const name = user.hoten?.toLowerCase() || ''; // Kiểm tra null hoặc undefined
            const email = user.email?.toLowerCase() || '';
            const phone = user.sdt || '';

            return (
                name.includes(value.toLowerCase()) ||
                email.includes(value.toLowerCase()) ||
                phone.includes(value)
            );
        });
        setFilteredUsers(filtered);
    };


    // ** Thêm hoặc chỉnh sửa user **
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const { email, hoten, gioitinh, ngaysinh, diachi, sdt } = values;

            if (editingUser) {
                // Chỉnh sửa
                const idUserRef = doc(db, 'IDUser', editingUser.id);
                const profileRef = doc(
                    db,
                    `User/${editingUser.iduser}/Profile`,
                    editingUser.profileId
                );

                await updateDoc(idUserRef, { email });
                await updateDoc(profileRef, {
                    hoten,
                    gioitinh,
                    ngaysinh,
                    diachi,
                    sdt,
                });

                message.success('Cập nhật thông tin người dùng thành công!');
            } else {
                // Thêm mới
                const newIDUserRef = await addDoc(collection(db, 'IDUser'), {
                    email,
                    iduser: Math.random().toString(36).substring(2, 10), // Tạo iduser ngẫu nhiên
                });
                await addDoc(collection(db, `User/${newIDUserRef.id}/Profile`), {
                    hoten,
                    gioitinh,
                    ngaysinh,
                    diachi,
                    sdt,
                    iduser: newIDUserRef.id,
                });

                message.success('Thêm người dùng mới thành công!');
            }

            fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
            form.resetFields();
        } catch (error) {
            console.error('Error adding/editing user:', error);
            message.error('Lỗi khi thêm hoặc chỉnh sửa người dùng!');
        }
    };

    // ** Xóa user **
    const handleDelete = async (id, iduser) => {
        try {
            const idUserRef = doc(db, 'IDUser', id);
            const profileRef = query(
                collection(db, `User/${iduser}/Profile`)
            );

            await deleteDoc(idUserRef);
            const profileSnapshot = await getDocs(profileRef);
            profileSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            message.success('Xóa người dùng thành công!');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error('Lỗi khi xóa người dùng!');
        }
    };

    // ** Mở modal thêm/sửa user **
    const openModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue(user);
        } else {
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'hoten',
            key: 'hoten',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Giới tính',
            dataIndex: 'gioitinh',
            key: 'gioitinh',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'ngaysinh',
            key: 'ngaysinh',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'diachi',
            key: 'diachi',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'sdt',
            key: 'sdt',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => openModal(record)}>Sửa</Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này không?"
                        onConfirm={() => handleDelete(record.id, record.iduser)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Input.Search
                placeholder="Tìm kiếm người dùng"
                onChange={(e) => handleSearch(e.target.value)}
                style={{ marginBottom: 16, width: 300 }}
            />
            <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>
                Thêm người dùng
            </Button>
            <Table columns={columns} dataSource={filteredUsers} rowKey="id" />
            <Modal
                title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="hoten"
                        label="Họ tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="gioitinh"
                        label="Giới tính"
                        rules={[{ required: true, message: 'Vui lòng nhập giới tính!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="ngaysinh"
                        label="Ngày sinh"
                        rules={[{ required: true, message: 'Vui lòng nhập ngày sinh!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="diachi"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="sdt"
                        label="Số điện thoại"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Users;
