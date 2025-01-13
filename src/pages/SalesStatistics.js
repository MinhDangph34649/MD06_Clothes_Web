import React, { useState } from 'react';
import { Table, DatePicker, Button, message } from 'antd';
import { collection, getDocs, query, where } from 'firebase/firestore';
import db from '../services/firebaseConfig';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SalesStatistics = () => {
    const [dateRange, setDateRange] = useState([null, null]); // Phạm vi ngày
    const [salesData, setSalesData] = useState([]); // Dữ liệu thống kê
    const [loading, setLoading] = useState(false); // Trạng thái loading

    const fetchSalesStatistics = async () => {
        if (!dateRange[0] || !dateRange[1]) {
            message.warning('Vui lòng chọn khoảng thời gian hợp lệ!');
            return;
        }

        setLoading(true);

        try {
            const startDate = dayjs(dateRange[0]).startOf('day');
            const endDate = dayjs(dateRange[1]).endOf('day');

            // Lấy danh sách hóa đơn theo khoảng thời gian
            const ordersQuery = query(
                collection(db, 'HoaDon'),
                where('ngaydat', '>=', startDate.format('DD/MM/YYYY')),
                where('ngaydat', '<=', endDate.format('DD/MM/YYYY'))
            );
            const ordersSnapshot = await getDocs(ordersQuery);

            const orders = ordersSnapshot.docs.map((doc) => ({
                id: doc.id,
                UID: doc.data().UID,
            }));

            const productSales = {};

            // Lấy chi tiết sản phẩm từ các hóa đơn
            for (const order of orders) {
                const detailsQuery = query(
                    collection(db, `ChitietHoaDon/${order.UID}/ALL`),
                    where('id_hoadon', '==', order.id)
                );
                const detailsSnapshot = await getDocs(detailsQuery);

                detailsSnapshot.docs.forEach((detailDoc) => {
                    const { id_product, sizes } = detailDoc.data();

                    if (Array.isArray(sizes)) {
                        sizes.forEach((size) => {
                            productSales[id_product] = productSales[id_product] || { totalSold: 0, sizeStats: {} };

                            productSales[id_product].totalSold += size.soluong || 0;
                            productSales[id_product].sizeStats[size.size] =
                                (productSales[id_product].sizeStats[size.size] || 0) + (size.soluong || 0);
                        });
                    }
                });
            }

            // Lấy thông tin sản phẩm từ collection SanPham
            const productsSnapshot = await getDocs(collection(db, 'SanPham'));
            const productsMap = new Map(
                productsSnapshot.docs.map((doc) => [
                    doc.id,
                    {
                        name: doc.data().tensp,
                        image: doc.data().hinhanh,
                        inventory: (doc.data().sizes || []).reduce(
                            (total, size) => total + (size.soluong || 0),
                            0
                        ), // Tính tổng tồn kho từ các size
                    },
                ])
            );

            // Kết hợp dữ liệu bán hàng và tồn kho
            const combinedSalesData = Object.entries(productSales).map(([id_product, { totalSold, sizeStats }]) => {
                const bestSize = Object.entries(sizeStats).reduce(
                    (best, [size, count]) => (count > best.count ? { size, count } : best),
                    { size: 'Không xác định', count: 0 }
                );

                return {
                    id: id_product,
                    name: productsMap.get(id_product)?.name || 'Không tìm thấy',
                    image: productsMap.get(id_product)?.image || '',
                    totalSold,
                    inventory: productsMap.get(id_product)?.inventory || 0, // Lấy thông tin tồn kho
                    bestSize: `${bestSize.size} (${bestSize.count})`,
                };
            });

            setSalesData(combinedSalesData);
        } catch (error) {
            console.error('Error fetching sales statistics:', error);
            message.error('Lỗi khi lấy dữ liệu thống kê!');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image',
            key: 'image',
            align: 'center',
            render: (image) => (
                <img src={image} alt="Sản phẩm" style={{ width: '50px', height: '50px' }} />
            ),
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
        },
        {
            title: 'Số lượng bán',
            dataIndex: 'totalSold',
            key: 'totalSold',
            align: 'center',
        },
        {
            title: 'Size bán chạy',
            dataIndex: 'bestSize',
            key: 'bestSize',
            align: 'center',
        },
        {
            title: 'Tồn kho',
            dataIndex: 'inventory',
            key: 'inventory',
            align: 'center',
        },
    ];

    return (
        <div>
            <h2>Thống kê sản phẩm bán được</h2>
            <RangePicker
                onChange={(dates) => setDateRange(dates || [null, null])}
                format="DD/MM/YYYY"
                style={{ marginBottom: '16px', width: '30%' }}
            />
            <Button
                type="primary"
                onClick={fetchSalesStatistics}
                loading={loading}
                style={{ marginBottom: '16px', marginLeft: '10px' }}
            >
                Tìm kiếm
            </Button>
            <Table
                columns={columns}
                dataSource={salesData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />
        </div>
    );
};

export default SalesStatistics;
