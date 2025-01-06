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

};

export default OrderManagement;
