import React from 'react';
import { Card, Table, Tag, Space, Button, DatePicker, Select } from 'antd';
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const GPS: React.FC = () => {
  const gpsEvents = [
    {
      key: '1',
      caseNumber: 'WM20240115001',
      deviceId: 'DEVICE_001',
      eventType: '現場到着',
      lat: 35.6762,
      lng: 139.6503,
      accuracy: 5.0,
      status: 'OK',
      timestamp: '2024-01-15 10:30:00',
    },
    // Add more sample data...
  ];

  const columns = [
    {
      title: '案件番号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
    },
    {
      title: 'デバイスID',
      dataIndex: 'deviceId',
      key: 'deviceId',
    },
    {
      title: 'イベント種別',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (eventType: string) => <Tag color="blue">{eventType}</Tag>,
    },
    {
      title: '位置情報',
      key: 'location',
      render: (record: any) => (
        <span>
          {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
        </span>
      ),
    },
    {
      title: '精度',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => `${accuracy}m`,
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'OK' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '日時',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>GPS追跡</h1>
        <Space>
          <Button icon={<ReloadOutlined />}>更新</Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select placeholder="案件番号" style={{ width: 200 }}>
              <Option value="WM20240115001">WM20240115001</Option>
              <Option value="WM20240115002">WM20240115002</Option>
            </Select>
            <Select placeholder="デバイスID" style={{ width: 150 }}>
              <Option value="DEVICE_001">DEVICE_001</Option>
              <Option value="DEVICE_002">DEVICE_002</Option>
            </Select>
            <Select placeholder="イベント種別" style={{ width: 150 }}>
              <Option value="site_arrival">現場到着</Option>
              <Option value="loading_start">積込開始</Option>
              <Option value="loading_complete">積込完了</Option>
            </Select>
            <DatePicker placeholder="日付範囲" />
          </Space>
        </div>

        <Table
          dataSource={gpsEvents}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default GPS;
