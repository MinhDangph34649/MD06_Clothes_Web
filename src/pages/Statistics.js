import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import db from '../services/firebaseConfig';
import { Select, message, Switch, Row, Col, DatePicker, List, Avatar, Button } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const { Option } = Select;
const { RangePicker } = DatePicker;

const Statistics = () => {
    const [timeFrame, setTimeFrame] = useState('day');
    const [dateRange, setDateRange] = useState([null, null]);
    const [statusFilter, setStatusFilter] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [labels, setLabels] = useState([]);
    const [showLegend, setShowLegend] = useState(true);
    const [chartType, setChartType] = useState('Bar');
    const [bestSellers, setBestSellers] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchAllData = async () => {
        try {
            const ordersSnapshot = await getDocs(collection(db, 'HoaDon'));
            const orders = ordersSnapshot.docs.map((doc) => ({
                id: doc.id,
                UID: doc.data().UID,
                trangthai: doc.data().trangthai,
                ngaydat: dayjs(doc.data().ngaydat, 'DD/MM/YYYY'),
                tongtien: parseFloat(doc.data().tongtien.replace(/\./g, '')),
            }));

            const salesData = {};
            const UIDs = [...new Set(orders.map((order) => order.UID))];
            for (const id of UIDs) {
                const allSnapshot = await getDocs(collection(db, `ChitietHoaDon/${id}/ALL`));
                allSnapshot.docs.forEach((detailDoc) => {
                    const { id_product, soluong } = detailDoc.data();
                    salesData[id_product] = (salesData[id_product] || 0) + soluong;
                });
            }

            return { orders, salesData };
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Unable to fetch data!');
            return { orders: [], salesData: {} };
        }
    };

    const fetchProductDetails = async (id_product) => {
        try {
            const productSnapshot = await getDocs(collection(db, 'SanPham'));
            const product = productSnapshot.docs.find((doc) => doc.id === id_product);
            return product ? product.data() : {};
        } catch (error) {
            console.error('Error fetching product details:', error);
            return {};
        }
    };

    const fetchInventoryData = async () => {
        try {
            const productSnapshot = await getDocs(collection(db, 'SanPham'));
            const inventory = productSnapshot.docs.map((doc) => {
                const sizes = doc.data().sizes || [];
                const totalQuantity = sizes.reduce((sum, size) => sum + size.soluong, 0);
                return {
                    id: doc.id,
                    tensp: doc.data().tensp,
                    hinhanh: doc.data().hinhanh,
                    totalQuantity,
                };
            });
            setInventoryData(inventory);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            message.error('Unable to fetch inventory data!');
        }
    };

    const calculateStatistics = async () => {
        const { orders, salesData } = await fetchAllData();

        const filteredOrders = orders.filter((order) => {
            const isWithinDateRange = !dateRange[0] || !dateRange[1] || order.ngaydat.isBetween(
                dayjs(dateRange[0]).startOf('day'),
                dayjs(dateRange[1]).endOf('day'),
                null,
                '[]'
            );

            const matchesStatus = statusFilter === null || order.trangthai === statusFilter;

            return isWithinDateRange && matchesStatus;
        });

        const groupedData = {};
        let totalRevenueTemp = 0;
        filteredOrders.forEach((order) => {
            let key = '';
            if (timeFrame === 'day') {
                key = order.ngaydat.format('DD/MM/YYYY');
            } else if (timeFrame === 'month') {
                key = order.ngaydat.format('MM/YYYY');
            } else if (timeFrame === 'year') {
                key = order.ngaydat.format('YYYY');
            }
            groupedData[key] = (groupedData[key] || 0) + order.tongtien;
            totalRevenueTemp += order.tongtien;
        });

        const sortedKeys = Object.keys(groupedData)
            .map((key) => {
                const format = timeFrame === 'day' ? 'DD/MM/YYYY' : timeFrame === 'month' ? 'MM/YYYY' : 'YYYY';
                return { key, date: dayjs(key, format) };
            })
            .sort((a, b) => a.date.valueOf() - b.date.valueOf())
            .map((item) => item.key);

        const sortedData = sortedKeys.map((key) => groupedData[key]);

        const sortedSales = Object.entries(salesData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const bestSellerPromises = sortedSales.map(async ([id_product, totalSold]) => {
            const product = await fetchProductDetails(id_product);
            return { id_product, ...product, totalSold };
        });

        const bestSellersData = await Promise.all(bestSellerPromises);

        setLabels(sortedKeys);
        setChartData(sortedData);
        setBestSellers(bestSellersData);
        setTotalRevenue(totalRevenueTemp);

        if (sortedKeys.length === 0) {
            message.warning('No data available for the selected date range.');
        }
    };

    useEffect(() => {
        calculateStatistics();
        fetchInventoryData();
    }, [timeFrame, dateRange, statusFilter]);

    const data = {
        labels,
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: chartData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: showLegend, position: 'top' },
            title: { display: true, text: `Thống kê doanh thu theo ${timeFrame}` },
        },
    };

    return (
        <div>
            <h2>Thống kê</h2>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col span={6}>
                    <Select
                        value={timeFrame}
                        onChange={(value) => setTimeFrame(value)}
                        style={{ width: '100%' }}
                    >
                        <Option value="day">Ngày</Option>
                        <Option value="month">Tháng</Option>
                        <Option value="year">Năm</Option>
                    </Select>
                </Col>
                <Col span={6}>
                    <RangePicker
                        onChange={(dates) => setDateRange(dates || [null, null])}
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col span={6}>
                    <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        style={{ width: '100%' }}
                        placeholder="Chọn trạng thái"
                    >
                        <Option value={null}>Tất cả</Option>
                        <Option value={1}>Đang xử lý</Option>
                        <Option value={3}>Đã giao</Option>
                    </Select>
                </Col>
                <Col span={6}>
                    <Switch
                        checked={showLegend}
                        onChange={(checked) => setShowLegend(checked)}
                        checkedChildren="Hiển thị chú thích"
                        unCheckedChildren="Ẩn chú thích"
                    />
                </Col>
            </Row>

            <div style={{ marginBottom: '16px' }}>
                <h3>Tổng doanh thu: {totalRevenue.toLocaleString()} VNĐ</h3>
            </div>

            <Button onClick={() => setChartType(chartType === 'Bar' ? 'Line' : 'Bar')}>
                Đổi loại biểu đồ
            </Button>

            {chartType === 'Bar' ? (
                <Bar data={data} options={options} />
            ) : (
                <Line data={data} options={options} />
            )}

            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <h3>Sản phẩm bán chạy nhất</h3>
                    <List
                        itemLayout="horizontal"
                        dataSource={bestSellers}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={item?.hinhanh || ''} />}
                                    title={item?.tensp || 'Unknown'}
                                    description={`Đã bán: ${item.totalSold} - Giá: ${item?.giatien || 'N/A'} VNĐ`}
                                />
                            </List.Item>
                        )}
                    />
                </Col>
                <Col span={12}>
                    <h3>Sản phẩm tồn kho</h3>
                    <List
                        itemLayout="horizontal"
                        dataSource={inventoryData}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={item.hinhanh} />}
                                    title={item.tensp}
                                    description={`Trong kho: ${item.totalQuantity}`}
                                />
                            </List.Item>
                        )}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default Statistics;
