import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import db from '../services/firebaseConfig';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]); // Danh sách đã lọc
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingCategory, setEditingCategory] = useState(null);

    // ** Lấy danh sách loại sản phẩm từ Firestore **
    const fetchCategories = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'LoaiProduct'));
            const fetchedCategories = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCategories(fetchedCategories);
            setFilteredCategories(fetchedCategories); // Cập nhật danh sách hiển thị ban đầu
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // ** Thêm mới hoặc chỉnh sửa loại sản phẩm **
    const handleConfirm = async () => {
        try {
            const values = await form.validateFields();
            if (editingCategory) {
                // Chỉnh sửa
                const categoryRef = doc(db, 'LoaiProduct', editingCategory.id);
                await updateDoc(categoryRef, values);
                message.success('Chỉnh sửa loại sản phẩm thành công!');
            } else {
                // Thêm mới
                await addDoc(collection(db, 'LoaiProduct'), values);
                message.success('Thêm loại sản phẩm thành công!');
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error adding/editing category:', error);
            message.error('Đã xảy ra lỗi khi thêm/chỉnh sửa loại sản phẩm!');
        }
    };

    // ** Xóa loại sản phẩm **
    const handleDeleteCategory = async (id) => {
        try {
            const categoryRef = doc(db, 'LoaiProduct', id);
            await deleteDoc(categoryRef);
            message.success('Xóa loại sản phẩm thành công!');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            message.error('Đã xảy ra lỗi khi xóa loại sản phẩm!');
        }
    };

    // ** Hiển thị thông tin chỉnh sửa **
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        form.setFieldsValue(category);
        setIsModalOpen(true);
    };

    // ** Tìm kiếm loại sản phẩm **
    const handleSearch = (value) => {
        const filtered = categories.filter((category) =>
            category.tenloai.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
    };

    // ** Hiển thị bảng dữ liệu **
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Tên loại',
            dataIndex: 'tenloai',
            key: 'tenloai',
        },
        {
            title: 'Hình ảnh loại',
            dataIndex: 'hinhanhloai',
            key: 'hinhanhloai',
            render: (text) => <img src={text} alt="Loại" style={{ width: 50 }} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleEditCategory(record)}>Sửa</Button>
                    <Button danger onClick={() => handleDeleteCategory(record.id)}>Xóa</Button>
                </Space>
            ),
        },
    ];

    // ** Reset và mở modal thêm loại **
    const handleAddCategory = () => {
        form.resetFields();
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    return (
        <div>
            <Input.Search
                placeholder="Tìm kiếm loại sản phẩm"
                onChange={(e) => handleSearch(e.target.value)}
                style={{ marginBottom: 16, width: '300px' }}
            />
            <Button type="primary" onClick={handleAddCategory} style={{ marginBottom: 16 }}>
                Thêm loại sản phẩm
            </Button>
            <Table columns={columns} dataSource={filteredCategories} rowKey="id" />
            <Modal
                title={editingCategory ? 'Chỉnh sửa loại sản phẩm' : 'Thêm loại sản phẩm'}
                open={isModalOpen}
                onOk={handleConfirm}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" name="form_in_modal">
                    <Form.Item
                        name="tenloai"
                        label="Tên loại"
                        rules={[{ required: true, message: 'Vui lòng nhập tên loại' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="hinhanhloai"
                        label="Hình ảnh loại (URL)"
                        rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Categories;
