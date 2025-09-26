import React from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Row, Col } from 'antd';
import { GavelOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const Auction: React.FC = () => {
  const auctions = [
    {
      key: '1',
      caseNumber: 'WM20240115001',
      wasteType: '一般廃棄物',
      status: '進行中',
      bidCount: 5,
      lowestBid: 45000,
      highestBid: 55000,
      timeRemaining: '2時間30分',
      endTime: '2024-01-15 17:00',
    },
    // Add more sample data...
  ];

  const bids = [
    {
      key: '1',
      carrierName: '株式会社サンプル収集',
      amount: 45000,
      message: '迅速な対応を心がけます',
      bidTime: '2024-01-15 14:30',
    },
    // Add more sample data...
  ];

  const auctionColumns = [
    {
      title: '案件番号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
    },
    {
      title: '廃棄物種別',
      dataIndex: 'wasteType',
      key: 'wasteType',
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '進行中' ? 'blue' : 'green'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '入札数',
      dataIndex: 'bidCount',
      key: 'bidCount',
    },
    {
      title: '最低入札額',
      dataIndex: 'lowestBid',
      key: 'lowestBid',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '最高入札額',
      dataIndex: 'highestBid',
      key: 'highestBid',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '残り時間',
      dataIndex: 'timeRemaining',
      key: 'timeRemaining',
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          {time}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">詳細</Button>
          <Button type="link" size="small">入札</Button>
        </Space>
      ),
    },
  ];

  const bidColumns = [
    {
      title: '業者名',
      dataIndex: 'carrierName',
      key: 'carrierName',
    },
    {
      title: '入札額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Space>
          <DollarOutlined />
          <strong>¥{amount.toLocaleString()}</strong>
        </Space>
      ),
    },
    {
      title: 'メッセージ',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '入札時刻',
      dataIndex: 'bidTime',
      key: 'bidTime',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>逆オークション</h1>
        <Space>
          <Search placeholder="案件番号で検索" style={{ width: 200 }} />
          <Select placeholder="ステータス" style={{ width: 120 }}>
            <Option value="active">進行中</Option>
            <Option value="completed">完了</Option>
          </Select>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="オークション一覧">
            <Table
              dataSource={auctions}
              columns={auctionColumns}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="入札状況">
            <Table
              dataSource={bids}
              columns={bidColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Auction;
