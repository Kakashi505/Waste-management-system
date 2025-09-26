import React from 'react';
import { Card, Button, Table, Tag, Space, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const Carriers: React.FC = () => {
  const carriers = [
    {
      key: '1',
      name: '株式会社サンプル収集',
      companyCode: 'CAR001',
      permits: ['一般廃棄物収集運搬業'],
      serviceAreas: ['東京都', '神奈川県'],
      reliabilityScore: 0.85,
      isActive: true,
    },
    // Add more sample data...
  ];

  const columns = [
    {
      title: '業者名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '会社コード',
      dataIndex: 'companyCode',
      key: 'companyCode',
    },
    {
      title: '許可証',
      dataIndex: 'permits',
      key: 'permits',
      render: (permits: string[]) => (
        <Space wrap>
          {permits.map(permit => (
            <Tag key={permit} color="blue">{permit}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'サービスエリア',
      dataIndex: 'serviceAreas',
      key: 'serviceAreas',
      render: (areas: string[]) => areas.join(', '),
    },
    {
      title: '信頼性スコア',
      dataIndex: 'reliabilityScore',
      key: 'reliabilityScore',
      render: (score: number) => `${(score * 100).toFixed(1)}%`,
    },
    {
      title: 'ステータス',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'アクティブ' : '非アクティブ'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>編集</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>削除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>収集運搬業者管理</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          新規業者登録
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="業者名で検索"
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select placeholder="ステータス" style={{ width: 120 }}>
              <Option value="active">アクティブ</Option>
              <Option value="inactive">非アクティブ</Option>
            </Select>
            <Select placeholder="許可証種別" style={{ width: 150 }}>
              <Option value="general">一般廃棄物</Option>
              <Option value="industrial">産業廃棄物</Option>
            </Select>
          </Space>
        </div>

        <Table
          dataSource={carriers}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Carriers;
