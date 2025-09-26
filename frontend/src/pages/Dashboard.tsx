import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import {
  FileTextOutlined,
  TruckOutlined,
  CameraOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const recentCases = [
    {
      key: '1',
      caseNumber: 'WM20240115001',
      wasteType: '一般廃棄物',
      status: '新規',
      priority: '高',
      scheduledDate: '2024-01-15 10:00',
      carrier: '株式会社サンプル収集',
    },
    {
      key: '2',
      caseNumber: 'WM20240115002',
      wasteType: '産業廃棄物',
      status: 'マッチング中',
      priority: '通常',
      scheduledDate: '2024-01-16 14:00',
      carrier: '-',
    },
    {
      key: '3',
      caseNumber: 'WM20240115003',
      wasteType: '一般廃棄物',
      status: '収集完了',
      priority: '低',
      scheduledDate: '2024-01-14 09:00',
      carrier: '株式会社エコサービス',
    },
  ];

  const columns = [
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
      render: (status: string) => {
        const color = status === '新規' ? 'blue' : 
                     status === 'マッチング中' ? 'orange' : 
                     status === '収集完了' ? 'green' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '優先度',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === '高' ? 'red' : 
                     priority === '通常' ? 'blue' : 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: '予定日時',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
    },
    {
      title: '担当業者',
      dataIndex: 'carrier',
      key: 'carrier',
    },
  ];

  return (
    <div>
      <h1>ダッシュボード</h1>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="総案件数"
              value={1128}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="登録業者数"
              value={45}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="写真数"
              value={3456}
              prefix={<CameraOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="GPSイベント数"
              value={8921}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="最近の案件" extra={<a href="/cases">すべて表示</a>}>
            <Table
              dataSource={recentCases}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="システム状況">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color="green">データベース接続正常</Tag>
              </div>
              <div>
                <Tag color="green">Redis接続正常</Tag>
              </div>
              <div>
                <Tag color="green">JWNET連携正常</Tag>
              </div>
              <div>
                <Tag color="orange">S3ストレージ 85%使用</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
