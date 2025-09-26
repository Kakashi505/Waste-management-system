import React from 'react';
import { Card, Button, Upload, Table, Tag, Space, Image } from 'antd';
import { UploadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';

const Photos: React.FC = () => {
  const photos = [
    {
      key: '1',
      fileName: 'waste_site_001.jpg',
      caseNumber: 'WM20240115001',
      tag: '排出現場',
      status: '検証済み',
      uploadDate: '2024-01-15 10:30',
      size: '2.5MB',
    },
    // Add more sample data...
  ];

  const columns = [
    {
      title: 'ファイル名',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: '案件番号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
    },
    {
      title: 'タグ',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: string) => <Tag color="blue">{tag}</Tag>,
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '検証済み' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'アップロード日時',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
    },
    {
      title: 'ファイルサイズ',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>表示</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>ダウンロード</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>写真管理</h1>
        <Upload>
          <Button type="primary" icon={<UploadOutlined />}>
            写真アップロード
          </Button>
        </Upload>
      </div>

      <Card>
        <Table
          dataSource={photos}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Photos;
