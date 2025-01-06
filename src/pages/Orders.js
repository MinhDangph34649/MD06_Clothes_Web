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


};

export default OrderManagement;
