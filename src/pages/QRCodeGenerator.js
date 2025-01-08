import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, Input, Table, Modal, message, Popconfirm } from 'antd';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import db from '../services/firebaseConfig';

const QRCodeGenerator = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [qrList, setQrList] = useState([]);
    const [filteredQrList, setFilteredQrList] = useState([]); // Danh sách mã QR đã lọc
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Lấy danh sách sản phẩm từ Firestore
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

    // Lấy danh sách mã QR từ Firestore
    const fetchQrList = async () => {
        try {
            const qrQuerySnapshot = await getDocs(collection(db, 'QRProduct'));
            const qrData = qrQuerySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const qrWithProductInfo = qrData.map((qr) => {
                const product = products.find((p) => p.id === qr.idproduct);
                return {
                    ...qr,
                    tensp: product ? product.tensp : 'Không xác định', // Ghép tên sản phẩm
                    idproduct: qr.idproduct || '', // Đảm bảo idproduct không null
                };
            });

            setQrList(qrWithProductInfo);
            setFilteredQrList(qrWithProductInfo); // Hiển thị ban đầu
        } catch (error) {
            console.error('Error fetching QR codes:', error);
            message.error('Lỗi khi lấy danh sách mã QR!');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            fetchQrList();
        }
    }, [products]);

    // Lưu `idproduct` vào Firestore nếu chưa tồn tại
    const saveQRCode = async () => {
        try {
            if (!selectedProduct) {
                message.error('Vui lòng chọn sản phẩm!');
                return;
            }

            const existingQr = qrList.find((qr) => qr.idproduct === selectedProduct.id);
            if (existingQr) {
                message.info('Mã QR đã tồn tại!');
                return;
            }

            await addDoc(collection(db, 'QRProduct'), { idproduct: selectedProduct.id });
            message.success('Lưu mã QR thành công!');
            fetchQrList();
        } catch (error) {
            console.error('Error saving QR Code:', error);
            message.error('Lỗi khi lưu mã QR!');
        }
    };

    // Xóa mã QR từ Firestore
    const deleteQRCode = async (id) => {
        try {
            await deleteDoc(doc(db, 'QRProduct', id));
            message.success('Xóa mã QR thành công!');
            fetchQrList();
        } catch (error) {
            console.error('Error deleting QR Code:', error);
            message.error('Lỗi khi xóa mã QR!');
        }
    };

    // Tìm kiếm sản phẩm trong Modal
    const handleSearchProducts = (value) => {
        const filtered = products.filter((product) =>
            product.tensp.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    // Tìm kiếm trong danh sách mã QR
    const handleSearchQr = (value) => {
        const filtered = qrList.filter((qr) =>
            (qr.tensp && qr.tensp.toLowerCase().includes(value.toLowerCase())) ||
            (qr.idproduct && qr.idproduct.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredQrList(filtered);
    };

    // Xử lý chọn sản phẩm từ Modal
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(false);
    };

    // Hàm tải mã QR (200px)
    const downloadQRCode = (idProduct) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        const qr = <QRCodeCanvas value={idProduct} size={200} />;
        qr.props.renderToStaticMarkup(context);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${idProduct}.png`;
        link.click();
    };

    const productColumns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'tensp',
            key: 'tensp',
        },
        {
            title: 'Giá tiền',
            dataIndex: 'giatien',
            key: 'giatien',
            render: (text) => `${text} VNĐ`,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button type="link" onClick={() => handleSelectProduct(record)}>
                    Chọn
                </Button>
            ),
        },
    ];

    const qrColumns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'tensp',
            key: 'tensp',
        },
        {
            title: 'ID Sản phẩm',
            dataIndex: 'idproduct',
            key: 'idproduct',
            render: (text) => text || 'Không có',
        },
        {
            title: 'Mã QR',
            key: 'qrcode',
            render: (_, record) => (
                <QRCodeCanvas id={`qr-${record.idproduct}`} value={record.idproduct} size={50} />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <>
                    <Button type="link" onClick={() => downloadQRCode(record.idproduct)}>
                        Tải mã QR
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa mã QR này không?"
                        onConfirm={() => deleteQRCode(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="link" danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <div>
            <h2>Tạo và Quản lý Mã QR</h2>

            <Button
                type="primary"
                onClick={() => setIsModalOpen(true)}
                style={{ marginBottom: 16 }}
            >
                Chọn sản phẩm
            </Button>

            {selectedProduct && (
                <div>
                    <p>Sản phẩm được chọn: {selectedProduct.tensp}</p>
                    <Button type="primary" onClick={saveQRCode} style={{ marginBottom: 16 }}>
                        Lưu mã QR
                    </Button>
                </div>
            )}

            <h3>Danh sách mã QR đã lưu</h3>
            <Input.Search
                placeholder="Tìm kiếm mã QR"
                onChange={(e) => handleSearchQr(e.target.value)}
                style={{ marginBottom: 16 }}
            />
            <Table columns={qrColumns} dataSource={filteredQrList} rowKey="id" />

            <Modal
                title="Chọn sản phẩm"
                visible={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Input.Search
                    placeholder="Tìm kiếm sản phẩm"
                    onChange={(e) => handleSearchProducts(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                <Table columns={productColumns} dataSource={filteredProducts} rowKey="id" />
            </Modal>
        </div>
    );
};

export default QRCodeGenerator;
