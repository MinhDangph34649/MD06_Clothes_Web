import React, { useState, useEffect, useRef } from 'react';

import {
    Table,
    Tag,
    Button,
    message,
    Modal,
    Descriptions,
    Select,
    Input,
    Card,
    Row,
    Col,
} from 'antd';
import { collection, getDocs, updateDoc, doc, query, where, getDoc, onSnapshot } from 'firebase/firestore';
import db from '../services/firebaseConfig';

const { Search } = Input;
const { Option } = Select;

const OrderManagement = () => {

    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [lastNotifiedOrderIds, setLastNotifiedOrderIds] = useState(new Set());
    const previousOrderIdsRef = useRef(new Set());

    const fetchOrders = () => {
        const ordersCollection = collection(db, 'HoaDon');

        onSnapshot(ordersCollection, (snapshot) => {
            const fetchedOrders = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const sortedOrders = fetchedOrders.sort((a, b) => a.trangthai - b.trangthai);

            const currentOrderIds = new Set(fetchedOrders.map((order) => order.id));
            const newOrders = fetchedOrders.filter(
                (order) => !previousOrderIdsRef.current.has(order.id)
            );

            if (newOrders.length > 0) {
                const newOrderIds = new Set(newOrders.map((order) => order.id));
                const notNotifiedOrders = newOrders.filter(
                    (order) => !lastNotifiedOrderIds.has(order.id)
                );

                if (notNotifiedOrders.length > 0) {
                    message.success(`Có ${notNotifiedOrders.length} đơn hàng mới!`);
                    setLastNotifiedOrderIds(newOrderIds);
                }
            }

            previousOrderIdsRef.current = currentOrderIds;

            setOrders(sortedOrders);
            applyFilters(sortedOrders, statusFilter, ''); // Áp dụng bộ lọc
        });
    };

    const applyFilters = (orders, statusFilter, searchValue) => {
        const filtered = orders.filter((order) => {
            const matchesStatus = statusFilter !== null ? order.trangthai === statusFilter : true;
            const matchesSearch =
                order.hoten?.toLowerCase().includes(searchValue.toLowerCase()) ||
                order.sdt.includes(searchValue) ||
                order.UID.includes(searchValue);

            return matchesStatus && matchesSearch;
        });

        setFilteredOrders(filtered);
    };

    const fetchOrderDetails = async (orderId, uid) => {
        try {
            const detailsQuery = query(
                collection(db, `ChitietHoaDon/${uid}/ALL`),
                where('id_hoadon', '==', orderId)
            );

            const querySnapshot = await getDocs(detailsQuery);

            const fetchedDetails = await Promise.all(
                querySnapshot.docs.map(async (detailDoc) => {
                    const detailData = detailDoc.data();
                    try {
                        const productRef = doc(db, 'SanPham', detailData.id_product);
                        const productSnapshot = await getDoc(productRef);

                        if (productSnapshot.exists()) {
                            const productData = productSnapshot.data();

                            return {
                                id: detailDoc.id,
                                ...detailData,
                                productName: productData.tensp || 'Không tìm thấy',
                                productType: productData.loaisp || 'Không xác định',
                                productDescription: productData.mota || '',
                                productMaterial: productData.chatlieu || 'Không xác định',
                                productSizes: detailData.sizes || [],
                                productPrice: productData.giatien || 0,
                                productImage: productData.hinhanh || '',
                                productCategory: productData.type || 'Không xác định',
                            };
                        } else {
                            return {
                                id: detailDoc.id,
                                ...detailData,
                                productName: 'Không tìm thấy',
                                productType: 'Không xác định',
                                productDescription: '',
                                productMaterial: 'Không xác định',
                                productSizes: detailData.sizes || [],
                                productPrice: 0,
                                productImage: '',
                                productCategory: 'Không xác định',
                            };
                        }
                    } catch (productError) {
                        console.error('Error fetching product data:', productError);
                        return {
                            id: detailDoc.id,
                            ...detailData,
                            productName: 'Không tìm thấy',
                            productType: 'Không xác định',
                            productDescription: '',
                            productMaterial: 'Không xác định',
                            productSizes: detailData.sizes || [],
                            productPrice: 0,
                            productImage: '',
                            productCategory: 'Không xác định',
                        };
                    }
                })
            );

            setOrderDetails(fetchedDetails);
        } catch (error) {
            console.error('Error fetching order details:', error);
            message.error('Lỗi khi lấy chi tiết hóa đơn!');
        }
    };

    const handleCancelOrder = async (order) => {
        try {
            const detailsQuery = query(
                collection(db, `ChitietHoaDon/${order.UID}/ALL`),
                where('id_hoadon', '==', order.id)
            );

            const querySnapshot = await getDocs(detailsQuery);

            const orderDetails = querySnapshot.docs.map((doc) => doc.data());

            for (const detail of orderDetails) {
                const productRef = doc(db, 'SanPham', detail.id_product);
                const productSnapshot = await getDoc(productRef);

                if (productSnapshot.exists()) {
                    const productData = productSnapshot.data();
                    const updatedSizes = productData.sizes.map((size) => {
                        const matchingSize = detail.sizes.find((dSize) => dSize.size === size.size);
                        if (matchingSize) {
                            return {
                                ...size,
                                soluong: size.soluong + matchingSize.soluong,
                            };
                        }
                        return size;
                    });

                    await updateDoc(productRef, { sizes: updatedSizes });
                }
            }

            const orderRef = doc(db, 'HoaDon', order.id);
            await updateDoc(orderRef, { trangthai: 4 });

            message.success('Đơn hàng đã được hủy và tồn kho đã được cập nhật.');
            closeModal();
        } catch (error) {
            console.error('Error cancelling order:', error);
            message.error('Lỗi khi hủy đơn hàng!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 1:
                return 'orange';
            case 2:
                return 'blue';
            case 3:
                return 'green';
            case 4:
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return 'Đang xử lý';
            case 2:
                return 'Đang giao';
            case 3:
                return 'Đã giao';
            case 4:
                return 'Đã huỷ';
            default:
                return 'Không xác định';
        }
    };

    const confirmCancelOrder = (order) => {
        Modal.confirm({
            title: 'Xác nhận hủy đơn hàng',
            content: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: () => handleCancelOrder(order),
        });
    };

    const handleStatusChange = async () => {
        if (!newStatus) {
            message.warning('Vui lòng chọn trạng thái mới!');
            return;
        }

        if (selectedOrder.trangthai === 3 || selectedOrder.trangthai === 4) {
            message.warning('Không thể thay đổi trạng thái của hóa đơn đã giao hoặc đã huỷ!');
            return;
        }

        try {
            const orderRef = doc(db, 'HoaDon', selectedOrder.id);
            await updateDoc(orderRef, { trangthai: newStatus });

            message.success('Cập nhật trạng thái đơn hàng thành công!');
            closeModal();
        } catch (error) {
            console.error('Error updating order status:', error);
            message.error('Lỗi khi cập nhật trạng thái đơn hàng!');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setOrderDetails([]);
        setNewStatus(null);
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        setNewStatus(order.trangthai);
        await fetchOrderDetails(order.id, order.UID);
        setIsModalOpen(true);
    };


    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: '16px' }}>Quản lý đơn hàng</h2>

            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col span={12}>
                    <Search
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại"
                        onSearch={(value) => applyFilters(orders, statusFilter, value)}
                        enterButton
                    />
                </Col>
                <Col span={12}>
                    <Select
                        placeholder="Lọc theo trạng thái"
                        onChange={(value) => setStatusFilter(value)}
                        allowClear
                        style={{ width: '100%' }}
                    >
                        <Option value={1}>Đang xử lý</Option>
                        <Option value={2}>Đang giao</Option>
                        <Option value={3}>Đã giao</Option>
                        <Option value={4}>Đã huỷ</Option>
                    </Select>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {filteredOrders.map((order) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={order.id}>
                        <Card
                            title={`Hóa đơn: ${order.id}`}
                            extra={
                                <Tag color={getStatusColor(order.trangthai)}>
                                    {getStatusText(order.trangthai)}
                                </Tag>
                            }
                        >
                            <p>Họ tên: {order.hoten}</p>
                            <p>Số điện thoại: {order.sdt}</p>
                            <p>Tổng tiền: {order.tongtien} VNĐ</p>
                            <Button
                                type="primary"
                                onClick={() => handleViewDetails(order)}
                                style={{ marginRight: 8 }}
                            >
                                Xem chi tiết
                            </Button>
                            {order.trangthai === 1 && (
                                <Button
                                    type="danger"
                                    style={{ backgroundColor: 'red', color: 'white', marginTop: 8 }}
                                    onClick={() => confirmCancelOrder(order)}
                                >
                                    Hủy đơn hàng
                                </Button>
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title="Chi tiết hóa đơn"
                visible={isModalOpen}
                onCancel={closeModal}
                width={1100}
                footer={[
                    <Button key="cancel" onClick={closeModal}>
                        Đóng
                    </Button>,
                    selectedOrder?.trangthai === 1 && (

                        <Button
                            key="cancelOrder"
                            type="danger"
                            onClick={() => confirmCancelOrder(selectedOrder)}
                            style={{ backgroundColor: 'red', color: 'white' }}
                        >
                            Hủy đơn hàng
                        </Button>

                    ),
                    <Button key="save" type="primary" onClick={handleStatusChange}>
                        Lưu thay đổi
                    </Button>,
                ]}
            >
                {selectedOrder && (
                    <>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="ID">{selectedOrder.id}</Descriptions.Item>
                            <Descriptions.Item label="Họ tên">{selectedOrder.hoten}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{selectedOrder.sdt}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">{selectedOrder.diachi}</Descriptions.Item>
                            <Descriptions.Item label="Ngày đặt">{selectedOrder.ngaydat}</Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                                {selectedOrder.tongtien} VNĐ
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái hiện tại">
                                <Tag color={getStatusColor(selectedOrder.trangthai)}>
                                    {getStatusText(selectedOrder.trangthai)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Cập nhật trạng thái">
                                {(selectedOrder.trangthai === 3 || selectedOrder.trangthai === 4) ? (
                                    <Tag color={getStatusColor(selectedOrder.trangthai)}>
                                        {getStatusText(selectedOrder.trangthai)}
                                    </Tag>
                                ) : (
                                    <Select
                                        value={newStatus}
                                        onChange={(value) => setNewStatus(value)}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value={1}>Đang xử lý</Option>
                                        <Option value={2}>Đang giao</Option>
                                        <Option value={3}>Đã giao</Option>

                                    </Select>
                                )}
                            </Descriptions.Item>
                        </Descriptions>

                        <h3 style={{ marginTop: '16px' }}>Chi tiết sản phẩm</h3>
                        <Table
                            columns={[
                                { title: 'ID sản phẩm', dataIndex: 'id_product', key: 'id_product' },
                                { title: 'Tên sản phẩm', dataIndex: 'productName', key: 'productName' },
                                { title: 'Loại sản phẩm', dataIndex: 'productType', key: 'productType' },
                                { title: 'Mô tả', dataIndex: 'productDescription', key: 'productDescription' },
                                { title: 'Chất liệu', dataIndex: 'productMaterial', key: 'productMaterial' },
                                {
                                    title: 'Size & Số lượng',
                                    dataIndex: 'productSizes',
                                    key: 'productSizes',
                                    render: (sizes) =>
                                        sizes.map((size, index) => (
                                            <Tag key={index}>
                                                {size.size}: {size.soluong}
                                            </Tag>
                                        )),
                                },
                                { title: 'Giá', dataIndex: 'productPrice', key: 'productPrice' },
                                {
                                    title: 'Hình ảnh',
                                    dataIndex: 'productImage',
                                    key: 'productImage',
                                    render: (image) => (
                                        <img src={image} alt="Sản phẩm" style={{ width: '50px', height: '50px' }} />
                                    ),
                                },
                                { title: 'Loại chính', dataIndex: 'productCategory', key: 'productCategory' },
                                {
                                    title: 'Tổng tiền',
                                    key: 'totalPrice',
                                    render: (_, record) => {
                                        return record.productSizes.reduce(
                                            (total, size) => total + size.soluong * record.productPrice,
                                            0
                                        ) + ' VNĐ';
                                    },
                                },
                            ]}
                            dataSource={orderDetails}
                            rowKey="id"
                            pagination={false}
                        />
                    </>
                )}
            </Modal>
        </div>
    );

};

export default OrderManagement;
