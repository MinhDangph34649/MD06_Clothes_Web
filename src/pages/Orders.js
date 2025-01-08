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

};

export default OrderManagement;
