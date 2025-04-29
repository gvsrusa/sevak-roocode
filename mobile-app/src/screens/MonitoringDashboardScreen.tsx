import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { i18n } from '../utils/i18n';
import { useConnectionStore } from '../store/connectionStore';
import StatusCard from '../components/StatusCard';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import AlertsList from '../components/AlertsList';

/**
 * Monitoring Dashboard Screen
 * Shows system monitoring data, metrics, and alerts
 */
const MonitoringDashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(3600000); // 1 hour in milliseconds
  const [activeTab, setActiveTab] = useState('overview');
  const { isConnected, tractorConnection } = useConnectionStore();
  
  // Monitoring data states
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [batteryMetrics, setBatteryMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);
  
  // Load monitoring data on component mount
  useEffect(() => {
    if (isConnected) {
      loadMonitoringData();
    }
  }, [isConnected, timeRange]);
  
  // Set up refresh interval
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        loadMonitoringData(false);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);
  
  /**
   * Load monitoring data from the tractor
   */
  const loadMonitoringData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      if (!isConnected || !tractorConnection) {
        return;
      }
      
      // Get monitoring status
      const status = await tractorConnection.sendRequest('monitoring.getStatus');
      setMonitoringStatus(status);
      
      // Get active alerts
      const alertsData = await tractorConnection.sendRequest('monitoring.getAlerts');
      setAlerts(alertsData || []);
      
      // Get maintenance schedule
      const maintenanceData = await tractorConnection.sendRequest('monitoring.getMaintenanceSchedule');
      setMaintenanceSchedule(maintenanceData || []);
      
      // Get metrics based on time range
      const metricsData = await tractorConnection.sendRequest('monitoring.getMetrics', {
        timeRange: timeRange
      });
/**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonitoringData(false);
  };
  
  /**
   * Run diagnostics
   */
  const runDiagnostics = async () => {
    if (!isConnected || !tractorConnection) {
      return;
    }
    
    setLoading(true);
    
    try {
      await tractorConnection.sendRequest('monitoring.runDiagnostics');
      await loadMonitoringData(false);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Change time range
   */
  const changeTimeRange = (range: number) => {
    setTimeRange(range);
  };
  
  /**
   * Get the latest metric value
   */
  const getLatestMetric = (metrics: any[], key: string) => {
    if (!metrics || metrics.length === 0) {
      return 'N/A';
    }
    
    const latest = metrics[metrics.length - 1];
    
    // Handle nested keys (e.g., 'system.cpu')
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = latest;
      
      for (const k of keys) {
        value = value[k];
        if (value === undefined) {
          return 'N/A';
        }
      }
      
      return value;
    }
    
    return latest[key] !== undefined ? latest[key] : 'N/A';
  };
  
  /**
   * Format metric value
   */
  const formatMetricValue = (value: any, type: string) => {
    if (value === 'N/A') {
      return 'N/A';
    }
    
    switch (type) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'temperature':
        return `${Math.round(value)}°C`;
      case 'time':
        return `${Math.round(value / 60)} min`;
      case 'latency':
        return `${Math.round(value)} ms`;
      default:
        return value.toString();
    }
  };
  
  /**
   * Get alert count by level
   */
  const getAlertCountByLevel = (level: string) => {
    return alerts.filter(alert => alert.level === level).length;
  };
  
  /**
   * Get maintenance count by status
   */
  const getMaintenanceCountByStatus = (status: string) => {
    return maintenanceSchedule.filter(item => item.status === status).length;
  };
  
  /**
   * Render time range selector
   */
  const renderTimeRangeSelector = () => {
    const ranges = [
      { label: '1h', value: 3600000 },
      { label: '6h', value: 21600000 },
      { label: '24h', value: 86400000 },
      { label: '7d', value: 604800000 }
    ];
    
    return (
      <View style={styles.timeRangeSelector}>
        <Text style={styles.timeRangeLabel}>{i18n.t('timeRange')}:</Text>
        <View style={styles.timeRangeButtons}>
          {ranges.map(range => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.timeRangeButton,
                timeRange === range.value && styles.timeRangeButtonActive
              ]}
              onPress={() => changeTimeRange(range.value)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  timeRange === range.value && styles.timeRangeButtonTextActive
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
      
      if (metricsData) {
        setPerformanceMetrics(metricsData.performance || []);
        setBatteryMetrics(metricsData.battery || []);
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
/**
   * Render tab selector
   */
  const renderTabSelector = () => {
    const tabs = [
      { id: 'overview', label: i18n.t('overview'), icon: 'grid-outline' },
      { id: 'performance', label: i18n.t('performance'), icon: 'speedometer-outline' },
      { id: 'battery', label: i18n.t('battery.monitoring'), icon: 'battery-charging-outline' },
      { id: 'alerts', label: i18n.t('alerts'), icon: 'warning-outline' },
      { id: 'maintenance', label: i18n.t('maintenance'), icon: 'construct-outline' }
    ];
    
    return (
      <View style={styles.tabSelector}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#4CAF50' : '#666'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.tabButtonTextActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  /**
   * Render overview tab
   */
  const renderOverviewTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* System Status */}
        <StatusCard
          title={i18n.t('systemStatus')}
          icon="pulse-outline"
          iconColor="#4CAF50"
        >
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('cpu')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.cpu'), 'percentage')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('memory')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.memory'), 'percentage')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('uptime')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.uptime'), 'time')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('latency')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'communication.latency'), 'latency')}
              </Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Battery Status */}
        <StatusCard
          title={i18n.t('batteryStatus')}
          icon="battery-charging-outline"
          iconColor="#2196F3"
        >
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('battery.level')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(batteryMetrics, 'level'), 'percentage')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('battery.temperature')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(batteryMetrics, 'temperature'), 'temperature')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('battery.voltage')}</Text>
              <Text style={styles.statusValue}>
                {getLatestMetric(batteryMetrics, 'voltage')} V
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{i18n.t('battery.runtime')}</Text>
              <Text style={styles.statusValue}>
                {formatMetricValue(getLatestMetric(batteryMetrics, 'estimatedRuntime'), 'time')}
              </Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Alerts Summary */}
        <StatusCard
          title={i18n.t('alertsSummary')}
          icon="warning-outline"
          iconColor="#FF9800"
        >
          <View style={styles.alertSummary}>
            <View style={[styles.alertSummaryItem, styles.criticalAlert]}>
              <Text style={styles.alertSummaryCount}>{getAlertCountByLevel('critical')}</Text>
              <Text style={styles.alertSummaryLabel}>{i18n.t('critical')}</Text>
            </View>
            <View style={[styles.alertSummaryItem, styles.warningAlert]}>
              <Text style={styles.alertSummaryCount}>{getAlertCountByLevel('warning')}</Text>
              <Text style={styles.alertSummaryLabel}>{i18n.t('warning')}</Text>
            </View>
            <View style={[styles.alertSummaryItem, styles.infoAlert]}>
              <Text style={styles.alertSummaryCount}>{getAlertCountByLevel('info')}</Text>
              <Text style={styles.alertSummaryLabel}>{i18n.t('info')}</Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Maintenance Summary */}
        <StatusCard
          title={i18n.t('maintenanceSummary')}
          icon="construct-outline"
          iconColor="#9C27B0"
        >
          <View style={styles.maintenanceSummary}>
            <View style={[styles.maintenanceSummaryItem, styles.dueMaintenance]}>
              <Text style={styles.maintenanceSummaryCount}>{getMaintenanceCountByStatus('due')}</Text>
              <Text style={styles.maintenanceSummaryLabel}>{i18n.t('due')}</Text>
            </View>
            <View style={[styles.maintenanceSummaryItem, styles.scheduledMaintenance]}>
              <Text style={styles.maintenanceSummaryCount}>{getMaintenanceCountByStatus('scheduled')}</Text>
              <Text style={styles.maintenanceSummaryLabel}>{i18n.t('scheduled')}</Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Diagnostics Button */}
        <TouchableOpacity
          style={styles.diagnosticsButton}
          onPress={runDiagnostics}
          disabled={loading}
        >
          <Ionicons name="medical-outline" size={20} color="#fff" />
          <Text style={styles.diagnosticsButtonText}>{i18n.t('runDiagnostics')}</Text>
          {loading && <ActivityIndicator size="small" color="#fff" style={styles.loadingIndicator} />}
        </TouchableOpacity>
      </View>
    );
  };
/**
   * Render alerts tab
   */
  const renderAlertsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{i18n.t('activeAlerts')}</Text>
        {alerts.length > 0 ? (
          <AlertsList alerts={alerts} />
        ) : (
          <Text style={styles.emptyMessage}>{i18n.t('noActiveAlerts')}</Text>
        )}
      </View>
    );
  };
  
  /**
   * Render maintenance tab
   */
  const renderMaintenanceTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{i18n.t('maintenanceSchedule')}</Text>
        {maintenanceSchedule.length > 0 ? (
          <View style={styles.maintenanceList}>
            {maintenanceSchedule.map(item => (
              <View key={item.id} style={styles.maintenanceItem}>
                <View style={styles.maintenanceHeader}>
                  <Text style={styles.maintenanceName}>{item.name}</Text>
                  <View style={[
                    styles.maintenanceStatus,
                    item.status === 'due' ? styles.maintenanceStatusDue : styles.maintenanceStatusScheduled
                  ]}>
                    <Text style={styles.maintenanceStatusText}>
                      {item.status === 'due' ? i18n.t('due') : i18n.t('scheduled')}
                    </Text>
                  </View>
                </View>
                <View style={styles.maintenanceDetails}>
                  <Text style={styles.maintenanceDetail}>
                    {i18n.t('interval')}: {item.interval} {i18n.t('hours')}
                  </Text>
                  <Text style={styles.maintenanceDetail}>
                    {i18n.t('currentUsage')}: {Math.round(item.currentUsage)} {i18n.t('hours')}
                  </Text>
                  <Text style={styles.maintenanceDetail}>
                    {i18n.t('lastPerformed')}: {new Date(item.lastPerformed).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyMessage}>{i18n.t('noMaintenanceItems')}</Text>
        )}
      </View>
    );
  };
  
  /**
   * Render performance tab
   */
  const renderPerformanceTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{i18n.t('performanceMetrics')}</Text>
        {renderTimeRangeSelector()}
        
        {/* System Performance */}
        <StatusCard
          title={i18n.t('systemPerformance')}
          icon="speedometer-outline"
          iconColor="#4CAF50"
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('cpu')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.cpu'), 'percentage')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('memory')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.memory'), 'percentage')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('uptime')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'system.uptime'), 'time')}
              </Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Tractor Performance */}
        <StatusCard
          title={i18n.t('tractorPerformance')}
          icon="car-outline"
          iconColor="#2196F3"
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('motorLoad')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'tractor.motorLoad'), 'percentage')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('motorTemperature')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'tractor.motorTemperature'), 'temperature')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('controllerTemperature')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(performanceMetrics, 'tractor.controllerTemperature'), 'temperature')}
              </Text>
            </View>
          </View>
        </StatusCard>
      </View>
    );
  };
  
  /**
   * Render battery tab
   */
  const renderBatteryTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{i18n.t('batteryMetrics')}</Text>
        {renderTimeRangeSelector()}
        
        {/* Battery Status */}
        <StatusCard
          title={i18n.t('batteryStatus')}
          icon="battery-charging-outline"
          iconColor="#4CAF50"
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.level')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(batteryMetrics, 'level'), 'percentage')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.voltage')}</Text>
              <Text style={styles.metricValue}>
                {getLatestMetric(batteryMetrics, 'voltage')} V
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.current')}</Text>
              <Text style={styles.metricValue}>
                {getLatestMetric(batteryMetrics, 'current')} A
              </Text>
            </View>
          </View>
        </StatusCard>
        
        {/* Battery Health */}
        <StatusCard
          title={i18n.t('batteryHealth')}
          icon="medkit-outline"
          iconColor="#2196F3"
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.temperature')}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(getLatestMetric(batteryMetrics, 'temperature'), 'temperature')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.cycleCount')}</Text>
              <Text style={styles.metricValue}>
                {getLatestMetric(batteryMetrics, 'cycleCount')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{i18n.t('battery.dischargeRate')}</Text>
              <Text style={styles.metricValue}>
                {getLatestMetric(batteryMetrics, 'dischargeRate')} A
              </Text>
            </View>
          </View>
        </StatusCard>
      </View>
    );
  };
  
  /**
   * Render active tab content
   */
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'performance':
        return renderPerformanceTab();
      case 'battery':
        return renderBatteryTab();
      case 'alerts':
        return renderAlertsTab();
      case 'maintenance':
        return renderMaintenanceTab();
      default:
        return renderOverviewTab();
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('monitoringDashboard')}</Text>
        <ConnectionStatusBadge
          isConnected={isConnected}
          connectionType={isConnected ? 'websocket' : null}
          connectionQuality={isConnected ? 'good' : 0}
        />
      </View>
      
      {renderTabSelector()}
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>{i18n.t('loadingMonitoringData')}</Text>
          </View>
        ) : !isConnected ? (
          <View style={styles.notConnectedContainer}>
            <Ionicons name="wifi-outline" size={64} color="#999" />
            <Text style={styles.notConnectedText}>{i18n.t('notConnectedToTractor')}</Text>
          </View>
        ) : (
          renderActiveTabContent()
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notConnectedText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tabButtonTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  tabContent: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  timeRangeButtons: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  timeRangeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  timeRangeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusItem: {
    width: '50%',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  alertSummaryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    width: '30%',
  },
  criticalAlert: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  warningAlert: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  infoAlert: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  alertSummaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  alertSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  maintenanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  maintenanceSummaryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  dueMaintenance: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  scheduledMaintenance: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  maintenanceSummaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  maintenanceSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  diagnosticsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  maintenanceList: {
    marginTop: 8,
  },
  maintenanceItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  maintenanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  maintenanceStatusDue: {
    backgroundColor: '#FF9800',
  },
  maintenanceStatusScheduled: {
    backgroundColor: '#4CAF50',
  },
  maintenanceStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  maintenanceDetails: {
    marginTop: 8,
  },
  maintenanceDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metricItem: {
    width: '33.33%',
    marginBottom: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MonitoringDashboardScreen;
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
  };