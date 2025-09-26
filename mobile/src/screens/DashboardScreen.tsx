import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useQuery } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface DashboardData {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalCarriers: number;
  monthlyRevenue: number;
  efficiency: number;
}

const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const { data, isLoading, refetch } = useQuery(
    'dashboard',
    async () => {
      const response = await fetch('https://waste-management-system.vercel.app/api/analytics/dashboard');
      return response.json();
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  useEffect(() => {
    if (data) {
      setDashboardData({
        totalCases: data.totalCases || 0,
        activeCases: data.activeCases || 0,
        completedCases: data.completedCases || 0,
        totalCarriers: data.totalCarriers || 0,
        monthlyRevenue: data.totalRevenue || 0,
        efficiency: data.averageProcessingTime || 0,
      });
    }
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1976d2',
    },
  };

  const monthlyData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const wasteTypeData = [
    {
      name: '一般廃棄物',
      population: 65,
      color: '#1976d2',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: '産業廃棄物',
      population: 35,
      color: '#388e3c',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  if (isLoading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>ダッシュボード</Title>
        <Text style={styles.headerSubtitle}>廃棄物管理システム</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Icon name="assignment" size={24} color="#1976d2" />
            <Text style={styles.metricValue}>{dashboardData?.totalCases || 0}</Text>
            <Text style={styles.metricLabel}>総案件数</Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Icon name="play-circle-filled" size={24} color="#388e3c" />
            <Text style={styles.metricValue}>{dashboardData?.activeCases || 0}</Text>
            <Text style={styles.metricLabel}>進行中</Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Icon name="check-circle" size={24} color="#f57c00" />
            <Text style={styles.metricValue}>{dashboardData?.completedCases || 0}</Text>
            <Text style={styles.metricLabel}>完了</Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Icon name="local-shipping" size={24} color="#7b1fa2" />
            <Text style={styles.metricValue}>{dashboardData?.totalCarriers || 0}</Text>
            <Text style={styles.metricLabel}>業者数</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Charts */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>月間トレンド</Title>
          <LineChart
            data={monthlyData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>廃棄物種別分布</Title>
          <PieChart
            data={wasteTypeData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>クイックアクション</Title>
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="camera-alt"
              style={styles.actionButton}
              onPress={() => {/* Navigate to camera */}}
            >
              写真撮影
            </Button>
            <Button
              mode="outlined"
              icon="add"
              style={styles.actionButton}
              onPress={() => {/* Navigate to create case */}}
            >
              案件作成
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Real-time Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Title>システム状況</Title>
          <View style={styles.statusItem}>
            <Icon name="wifi" size={20} color="#388e3c" />
            <Text style={styles.statusText}>オンライン</Text>
          </View>
          <View style={styles.statusItem}>
            <Icon name="gps-fixed" size={20} color="#388e3c" />
            <Text style={styles.statusText}>GPS 接続中</Text>
          </View>
          <View style={styles.statusItem}>
            <Icon name="cloud-done" size={20} color="#388e3c" />
            <Text style={styles.statusText}>クラウド同期済み</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#1976d2',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  metricCard: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  metricContent: {
    alignItems: 'center',
    padding: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    margin: 10,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionsCard: {
    margin: 10,
    elevation: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  statusCard: {
    margin: 10,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default DashboardScreen;
