import React from 'react';
import { Card, Button, Table, Tag, Space, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const Cases: React.FC = () => {
  const cases = [
    {
      key: '1',
      caseNumber: 'WM20240115001',
      wasteType: '一般廃棄物',
      status: '新規',
      priority: '高',
      scheduledDate: '2024-01-15 10:00',
      carrier: '株式会社サンプル収集',
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
      title: '廃棄物種別',
      dataIndex: 'wasteType',
      key: 'wasteType',
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: '優先度',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <Tag color="red">{priority}</Tag>,
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
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">詳細</Button>
          <Button type="link" size="small">編集</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>廃棄物依頼管理</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          新規依頼作成
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="案件番号で検索"
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select placeholder="ステータス" style={{ width: 120 }}>
              <Option value="new">新規</Option>
              <Option value="matching">マッチング中</Option>
              <Option value="assigned">業者選定済み</Option>
            </Select>
            <Select placeholder="優先度" style={{ width: 120 }}>
              <Option value="urgent">緊急</Option>
              <Option value="high">高</Option>
              <Option value="normal">通常</Option>
            </Select>
            <DatePicker placeholder="予定日" />
            <Button icon={<FilterOutlined />}>フィルタ</Button>
          </Space>
        </div>

        <Table
          dataSource={cases}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Cases;
