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

};

export default OrderManagement;
