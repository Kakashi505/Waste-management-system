import React from 'react';
import { Card, Table, Tag, Space, Input, Select, DatePicker, Button } from 'antd';
import { AuditOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Audit: React.FC = () => {
  const auditLogs = [
    {
      key: '1',
      entity: 'cases',
      entityId: 'WM20240115001',
      action: 'CREATE',
      actor: '田中太郎',
      timestamp: '2024-01-15 10:00:00',
      ipAddress: '192.168.1.100',
    },
    {
      key: '2',
      entity: 'cases',
      entityId: 'WM20240115001',
      action: 'UPDATE',
      actor: '佐藤花子',
      timestamp: '2024-01-15 11:30:00',
      ipAddress: '192.168.1.101',
    },
    // Add more sample data...
  ];

  const columns = [
    {
      title: 'エンティティ',
      dataIndex: 'entity',
      key: 'entity',
      render: (entity: string) => <Tag color="blue">{entity}</Tag>,
    },
    {
      title: 'エンティティID',
      dataIndex: 'entityId',
      key: 'entityId',
    },
    {
      title: 'アクション',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const color = action === 'CREATE' ? 'green' : 
                     action === 'UPDATE' ? 'blue' : 
                     action === 'DELETE' ? 'red' : 'default';
        return <Tag color={color}>{action}</Tag>;
      },
    },
    {
      title: '実行者',
      dataIndex: 'actor',
      key: 'actor',
    },
    {
      title: '日時',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'IPアドレス',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">詳細</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>監査ログ</h1>
        <Button icon={<DownloadOutlined />}>
          エクスポート
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search placeholder="エンティティIDで検索" style={{ width: 200 }} />
            <Select placeholder="エンティティ" style={{ width: 120 }}>
              <Option value="cases">cases</Option>
              <Option value="carriers">carriers</Option>
              <Option value="photos">photos</Option>
              <Option value="gps_events">gps_events</Option>
            </Select>
            <Select placeholder="アクション" style={{ width: 120 }}>
              <Option value="CREATE">CREATE</Option>
              <Option value="UPDATE">UPDATE</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="LOGIN">LOGIN</Option>
            </Select>
            <RangePicker placeholder={['開始日', '終了日']} />
            <Button icon={<SearchOutlined />}>検索</Button>
          </Space>
        </div>

        <Table
          dataSource={auditLogs}
          columns={columns}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default Audit;
