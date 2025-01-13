import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import db from '../services/firebaseConfig';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'SanPham'));
            const fetchedProducts = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(fetchedProducts);
            setFilteredProducts(fetchedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error('Lỗi khi lấy danh sách sản phẩm!');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = (value) => {
        const filtered = products.filter((product) =>
            product.tensp.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    const handleConfirm = async () => {
        try {
            const values = await form.validateFields();
            const cleanedValues = {
                tensp: values.tensp || '',
                loaisp: values.loaisp || '',
                giatien: values.giatien || 0,
                sizes: values.sizes || [],
                chatlieu: values.chatlieu || '',
                hinhanh: values.hinhanh || '',
                mota: values.mota || '',
                type: values.type || 0,
            };

            if (editingProduct) {
                const productRef = doc(db, 'SanPham', editingProduct.id);
                await updateDoc(productRef, cleanedValues);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                const docRef = await addDoc(collection(db, 'SanPham'), {
                    ...cleanedValues,
                    idsp: '',
                    id: '',
                });
                await updateDoc(docRef, { idsp: docRef.id, id: docRef.id });
                message.success('Thêm sản phẩm thành công!');
            }

            setIsModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            console.error('Error adding/editing product:', error);
            message.error('Lỗi khi thêm/chỉnh sửa sản phẩm!');
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            const productRef = doc(db, 'SanPham', id);
            await deleteDoc(productRef);
            message.success('Xóa sản phẩm thành công!');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            message.error('Lỗi khi xóa sản phẩm!');
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        form.setFieldsValue(product);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'tensp',
            key: 'tensp',
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'hinhanh',
            key: 'hinhanh',
            align: 'center',
            render: (text) =>
                text ? <img src={text} alt="Hình sản phẩm" style={{ width: 50, height: 50 }} /> : 'Không có',
        },
        {
            title: 'Loại sản phẩm',
            dataIndex: 'loaisp',
            key: 'loaisp',
            align: 'center',
        },
        {
            title: 'Giá tiền',
            dataIndex: 'giatien',
            key: 'giatien',
            align: 'center',
            render: (text) => `${text} VNĐ`,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            align: 'center',
            render: (text) => `Loại: ${text}`,
        },
        {
            title: 'Kích thước & Số lượng',
            dataIndex: 'sizes',
            key: 'sizes',
            align: 'center',
            render: (sizes) =>
                sizes?.map(({ size, soluong }) => (
                    <div key={size}>
                        {size}: {soluong}
                    </div>
                )),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleEditProduct(record)}>Sửa</Button>
                    <Button danger onClick={() => handleDeleteProduct(record.id)}>Xóa</Button>
                </Space>
            ),
        },
    ];

    const handleAddProduct = () => {
        form.resetFields();
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    return (
        <div>
            <Input.Search
                placeholder="Tìm kiếm sản phẩm"
                onChange={(e) => handleSearch(e.target.value)}
                style={{ marginBottom: 16, width: '300px' }}
            />
            <Button type="primary" onClick={handleAddProduct} style={{ marginBottom: 16, marginLeft: 1000 }}>
                Thêm sản phẩm
            </Button>
            <Table columns={columns} dataSource={filteredProducts} rowKey="id" />
            <Modal
                title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
                open={isModalOpen}
                onOk={handleConfirm}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="tensp"
                        label="Tên sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="loaisp"
                        label="Loại sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="giatien"
                        label="Giá tiền"
                        rules={[{ required: true, message: 'Vui lòng nhập giá tiền!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Loại sản phẩm (Type)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập loại sản phẩm!' },
                            { type: 'number', message: 'Giá trị phải là số!' },
                        ]}
                    >
                        <InputNumber style={{ width: '100%' }} placeholder="Nhập loại sản phẩm bất kỳ số" />
                    </Form.Item>
                    <Form.Item
                        name="sizes"
                        label="Kích thước & Số lượng"
                        rules={[{ required: true, message: 'Vui lòng thêm kích thước & số lượng!' }]}
                    >
                        <Form.List name="sizes">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, fieldKey, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'size']}
                                                fieldKey={[fieldKey, 'size']}
                                                rules={[{ required: true, message: 'Nhập kích thước!' }]}
                                            >
                                                <Input placeholder="Size (S, M, L, XL)" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'soluong']}
                                                fieldKey={[fieldKey, 'soluong']}
                                                rules={[{ required: true, message: 'Nhập số lượng!' }]}
                                            >
                                                <InputNumber placeholder="Số lượng" />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                        Thêm kích thước
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </Form.Item>
                    <Form.Item
                        name="chatlieu"
                        label="Chất liệu"
                        rules={[{ required: true, message: 'Vui lòng nhập chất liệu!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="hinhanh"
                        label="Hình ảnh (URL)"
                        rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="mota"
                        label="Mô tả sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả sản phẩm!' }]}
                    >
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Products;
