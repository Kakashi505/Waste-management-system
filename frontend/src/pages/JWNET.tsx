import React from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Progress } from 'antd';
import { CloudOutlined, SyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const JWNET: React.FC = () => {
  const jwnetJobs = [
    {
      key: '1',
      caseNumber: 'WM20240115001',
      jobType: '登録',
      status: '完了',
      externalId: 'JWNET_20240115_001',
      attempts: 1,
      createdAt: '2024-01-15 10:00',
      completedAt: '2024-01-15 10:05',
    },
    {
      key: '2',
      caseNumber: 'WM20240115002',
      jobType: '更新',
      status: '処理中',
      externalId: null,
      attempts: 2,
      createdAt: '2024-01-15 11:00',
      completedAt: null,
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
      title: 'ジョブ種別',
      dataIndex: 'jobType',
      key: 'jobType',
      render: (jobType: string) => <Tag color="blue">{jobType}</Tag>,
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === '完了' ? 'green' : 
                     status === '処理中' ? 'blue' : 
                     status === 'エラー' ? 'red' : 'default';
        const icon = status === '完了' ? <CheckCircleOutlined /> : 
                    status === 'エラー' ? <ExclamationCircleOutlined /> : 
                    <SyncOutlined spin />;
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: '外部ID',
      dataIndex: 'externalId',
      key: 'externalId',
      render: (id: string) => id || '-',
    },
    {
      title: '試行回数',
      dataIndex: 'attempts',
      key: 'attempts',
    },
    {
      title: '作成日時',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '完了日時',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button type="link" size="small">詳細</Button>
          {record.status === 'エラー' && (
            <Button type="link" size="small">再実行</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>電子マニフェスト連携</h1>
        <Space>
          <Button icon={<SyncOutlined />}>同期</Button>
          <Button type="primary" icon={<CloudOutlined />}>
            手動送信
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search placeholder="案件番号で検索" style={{ width: 200 }} />
            <Select placeholder="ジョブ種別" style={{ width: 120 }}>
              <Option value="register">登録</Option>
              <Option value="update">更新</Option>
              <Option value="transfer">受渡確認</Option>
              <Option value="completion">完了報告</Option>
            </Select>
            <Select placeholder="ステータス" style={{ width: 120 }}>
              <Option value="pending">待機中</Option>
              <Option value="processing">処理中</Option>
              <Option value="completed">完了</Option>
              <Option value="error">エラー</Option>
            </Select>
          </Space>
        </div>

        <Table
          dataSource={jwnetJobs}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default JWNET;
