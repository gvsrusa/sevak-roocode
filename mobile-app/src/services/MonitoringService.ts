import { TractorConnectionService } from './TractorConnectionService';
import { useConnectionStore } from '../store/connectionStore';

/**
 * Monitoring Service
 * 
 * Provides methods for interacting with the tractor's monitoring system
 */
export class MonitoringService {
  private connectionService: TractorConnectionService;
  
  constructor(connectionService: TractorConnectionService) {
    this.connectionService = connectionService;
  }
  
  /**
   * Get monitoring system status
   */
  public async getMonitoringStatus(): Promise<any> {
    try {
      const store = useConnectionStore.getState();
      
      if (!store.isConnected || !store.tractorConnection) {
        throw new Error('Not connected to tractor');
      }
      
      return await store.tractorConnection.sendRequest('monitoring.getStatus');
    } catch (error) {
      console.error('Failed to get monitoring status:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics data
   * @param type Metrics type (performance, usage, battery, etc.)
   * @param timeRange Time range in milliseconds
   */
  public async getMetrics(type?: string, timeRange?: number): Promise<any> {
    try {
      const store = useConnectionStore.getState();
      
      if (!store.isConnected || !store.tractorConnection) {
        throw new Error('Not connected to tractor');
      }
      
      return await store.tractorConnection.sendRequest('monitoring.getMetrics', {
        type,
        timeRange
      });
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get active alerts
   */
  public async getActiveAlerts(): Promise<any> {
    try {
      const store = useConnectionStore.getState();
      
      if (!store.isConnected || !store.tractorConnection) {
        throw new Error('Not connected to tractor');
      }
      
      return await store.tractorConnection.sendRequest('monitoring.getAlerts');
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw error;
    }
  }
  
  /**
   * Get maintenance schedule
   */
  public async getMaintenanceSchedule(): Promise<any> {
    try {
      const store = useConnectionStore.getState();
      
      if (!store.isConnected || !store.tractorConnection) {
        throw new Error('Not connected to tractor');
      }
      
      return await store.tractorConnection.sendRequest('monitoring.getMaintenanceSchedule');
    } catch (error) {
      console.error('Failed to get maintenance schedule:', error);
      throw error;
    }
  }
  
  /**
   * Run diagnostics
   * @param components Optional array of component names to run diagnostics on
   */
  public async runDiagnostics(components?: string[]): Promise<any> {
    try {
      const store = useConnectionStore.getState();
      
      if (!store.isConnected || !store.tractorConnection) {
        throw new Error('Not connected to tractor');
      }
      
      return await store.tractorConnection.sendRequest('monitoring.runDiagnostics', {
        components
      });
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService(new TractorConnectionService());

export default monitoringService;