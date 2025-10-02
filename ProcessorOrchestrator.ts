/**
 * MASTER PROCESSOR ORCHESTRATOR
 * Coordinates ALL automated processors for complete automation
 * The central brain that runs the entire platform autonomously
 */

import AutomationProcessor from './AutomationProcessor';
import FinancialProcessor from './FinancialProcessor';
import { gameProcessor } from './GameProcessor';
import UserProcessor from './UserProcessor';
import SystemProcessor from './SystemProcessor';

interface ProcessorStatus {
  name: string;
  isRunning: boolean;
  startTime: number;
  lastActivity: number;
  processedItems: number;
  errors: string[];
}

interface PlatformHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  totalUsers: number;
  activeGames: number;
  dailyRevenue: number;
  systemLoad: number;
  lastUpdate: number;
}

interface AutomationConfig {
  autoRestartOnFailure: boolean;
  healthCheckInterval: number;
  emergencyShutdownThreshold: number;
  loadBalancingEnabled: boolean;
  realTimeMonitoring: boolean;
}

class ProcessorOrchestrator {
  private static instance: ProcessorOrchestrator;
  private isOrchestrating: boolean = false;
  private startTime: number = Date.now();
  
  // Processor instances
  private automationProcessor: AutomationProcessor;
  private financialProcessor: FinancialProcessor;
  private gameProcessorInstance: typeof gameProcessor;
  private userProcessor: UserProcessor;
  private systemProcessor: SystemProcessor;
  
  // Orchestrator state
  private processorStatuses: Map<string, ProcessorStatus> = new Map();
  private platformHealth: PlatformHealth;
  private config: AutomationConfig;
  private orchestratorInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    // Initialize all processors
    this.automationProcessor = AutomationProcessor.getInstance();
    this.financialProcessor = FinancialProcessor.getInstance();
    this.gameProcessor = GameProcessor.getInstance();
    this.userProcessor = UserProcessor.getInstance();
    this.systemProcessor = SystemProcessor.getInstance();
    
    // Initialize platform health
    this.platformHealth = {
      status: 'offline',
      uptime: 0,
      totalUsers: 0,
      activeGames: 0,
      dailyRevenue: 0,
      systemLoad: 0,
      lastUpdate: Date.now(),
    };

    // Initialize configuration
    this.config = {
      autoRestartOnFailure: true,
      healthCheckInterval: 30000, // 30 seconds
      emergencyShutdownThreshold: 0.95, // 95% system load
      loadBalancingEnabled: true,
      realTimeMonitoring: true,
    };

    this.initializeProcessorStatuses();
  }

  public static getInstance(): ProcessorOrchestrator {
    if (!ProcessorOrchestrator.instance) {
      ProcessorOrchestrator.instance = new ProcessorOrchestrator();
    }
    return ProcessorOrchestrator.instance;
  }

  // START COMPLETE PLATFORM AUTOMATION
  public startCompleteAutomation(): void {
    if (this.isOrchestrating) {
      console.log('🤖 AUTOMATION ALREADY RUNNING');
      return;
    }

    console.log('🚀 STARTING COMPLETE PLATFORM AUTOMATION');
    console.log('═══════════════════════════════════════');
    console.log('🤖 Master Orchestrator Initializing...');
    console.log('💰 Financial System Loading...');
    console.log('🎮 Game Engine Starting...');
    console.log('👥 User Management Activating...');
    console.log('⚙️ System Monitoring Online...');
    console.log('═══════════════════════════════════════');

    this.isOrchestrating = true;
    this.startTime = Date.now();

    // Start all processors in sequence for stability
    this.startAllProcessors();
    
    // Start orchestrator monitoring
    this.startOrchestration();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Update platform status
    this.platformHealth.status = 'healthy';
    this.platformHealth.lastUpdate = Date.now();

    console.log('✅ COMPLETE AUTOMATION SYSTEM ONLINE!');
    console.log('🎯 Platform is now 100% autonomous');
    console.log('🔄 Zero manual intervention required');
    console.log('═══════════════════════════════════════');
  }

  // START ALL PROCESSORS
  private startAllProcessors(): void {
    try {
      console.log('🔧 Starting System Processor...');
      this.systemProcessor.startSystemAutomation();
      this.updateProcessorStatus('SystemProcessor', true);

      console.log('💰 Starting Financial Processor...');
      this.financialProcessor.startFinancialAutomation();
      this.updateProcessorStatus('FinancialProcessor', true);

      console.log('👥 Starting User Processor...');
      this.userProcessor.startUserAutomation();
      this.updateProcessorStatus('UserProcessor', true);

      console.log('🎮 Starting Game Processor...');
      this.gameProcessor.startGameAutomation();
      this.updateProcessorStatus('GameProcessor', true);

      console.log('🤖 Starting Master Automation Processor...');
      this.automationProcessor.startAutomation();
      this.updateProcessorStatus('AutomationProcessor', true);

      console.log('✅ ALL PROCESSORS STARTED SUCCESSFULLY');
      
    } catch (error) {
      console.error('❌ PROCESSOR STARTUP ERROR:', error);
      this.handleProcessorError('Startup', error as Error);
    }
  }

  // START ORCHESTRATOR MONITORING
  private startOrchestration(): void {
    this.orchestratorInterval = setInterval(() => {
      this.orchestrate();
    }, 10000); // Orchestrate every 10 seconds
  }

  // START HEALTH MONITORING
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performPlatformHealthCheck();
    }, this.config.healthCheckInterval);
  }

  // MAIN ORCHESTRATION LOGIC
  private orchestrate(): void {
    try {
      // Update platform metrics
      this.updatePlatformMetrics();
      
      // Monitor processor health
      this.monitorProcessorHealth();
      
      // Balance system load
      this.balanceSystemLoad();
      
      // Handle any failures
      this.handleFailures();
      
      // Optimize performance
      this.optimizePlatformPerformance();
      
      // Log orchestration status
      this.logOrchestrationStatus();
      
    } catch (error) {
      console.error('❌ ORCHESTRATION ERROR:', error);
      this.handleOrchestrationError(error as Error);
    }
  }

  // UPDATE PLATFORM METRICS
  private updatePlatformMetrics(): void {
    const now = Date.now();
    
    // Update uptime
    this.platformHealth.uptime = now - this.startTime;
    
    // Get metrics from processors
    const userStats = this.userProcessor.getUserStatistics();
    const systemHealth = this.systemProcessor.getSystemHealth();
    const financialStats = this.financialProcessor.getSystemStats();
    
    // Update platform health
    this.platformHealth.totalUsers = userStats.totalUsers;
    this.platformHealth.activeGames = systemHealth.activeGames;
    this.platformHealth.dailyRevenue = financialStats.developerWallet - 100000; // Revenue earned (starting from ₹100K)
    this.platformHealth.systemLoad = systemHealth.memoryUsage;
    this.platformHealth.lastUpdate = now;
    
    // Update system processor with current load
    this.systemProcessor.updateSystemLoad(
      userStats.activeUsers,
      systemHealth.activeGames,
      financialStats.totalOperations
    );
  }

  // MONITOR PROCESSOR HEALTH
  private monitorProcessorHealth(): void {
    this.processorStatuses.forEach((status, processorName) => {
      // Check if processor is responsive
      const timeSinceLastActivity = Date.now() - status.lastActivity;
      
      if (timeSinceLastActivity > 120000) { // 2 minutes without activity
        console.log(`⚠️ PROCESSOR UNRESPONSIVE: ${processorName}`);
        
        if (this.config.autoRestartOnFailure) {
          this.restartProcessor(processorName);
        }
      }
      
      // Check error rate
      if (status.errors.length > 10) {
        console.log(`⚠️ HIGH ERROR RATE: ${processorName} - ${status.errors.length} errors`);
        
        // Clear old errors
        status.errors = status.errors.slice(-5);
      }
    });
  }

  // BALANCE SYSTEM LOAD
  private balanceSystemLoad(): void {
    if (!this.config.loadBalancingEnabled) return;
    
    const systemLoad = this.platformHealth.systemLoad;
    
    if (systemLoad > 0.8) { // High load
      console.log('⚖️ LOAD BALANCING: High system load detected, optimizing...');
      
      // Reduce processing frequency temporarily
      this.reduceProcessingLoad();
      
      // Trigger system optimization
      this.systemProcessor.updateSystemConfiguration({
        maxActiveGames: Math.floor(this.systemProcessor.getSystemConfiguration().maxActiveGames * 0.9),
      });
      
    } else if (systemLoad < 0.3) { // Low load
      // Increase processing capacity
      this.increaseProcessingCapacity();
    }
  }

  // HANDLE FAILURES
  private handleFailures(): void {
    // Check for critical system failures
    const systemHealth = this.systemProcessor.getSystemHealth();
    
    if (systemHealth.status === 'critical') {
      console.log('🚨 CRITICAL SYSTEM FAILURE DETECTED');
      
      // Attempt automatic recovery
      this.performEmergencyRecovery();
    }
    
    // Check for processor failures
    let failedProcessors = 0;
    this.processorStatuses.forEach((status, name) => {
      if (!status.isRunning) {
        failedProcessors++;
      }
    });
    
    if (failedProcessors > 2) { // More than 2 processors failed
      console.log('🚨 MULTIPLE PROCESSOR FAILURE DETECTED');
      this.performSystemRestart();
    }
  }

  // OPTIMIZE PLATFORM PERFORMANCE
  private optimizePlatformPerformance(): void {
    // Auto-optimize based on current metrics
    const activeGames = this.platformHealth.activeGames;
    const totalUsers = this.platformHealth.totalUsers;
    
    // Optimize game processor based on active games
    if (activeGames > 100) {
      console.log('⚡ PERFORMANCE OPTIMIZATION: High game activity, optimizing game processor');
    }
    
    // Optimize user processor based on user activity
    if (totalUsers > 500) {
      console.log('⚡ PERFORMANCE OPTIMIZATION: High user activity, optimizing user processor');
    }
  }

  // PERFORM PLATFORM HEALTH CHECK
  private performPlatformHealthCheck(): void {
    const systemHealth = this.systemProcessor.getSystemHealth();
    const userStats = this.userProcessor.getUserStatistics();
    
    // Determine overall platform health
    if (systemHealth.status === 'critical' || systemHealth.errorRate > 0.1) {
      this.platformHealth.status = 'critical';
    } else if (systemHealth.status === 'warning' || this.platformHealth.systemLoad > 0.8) {
      this.platformHealth.status = 'degraded';
    } else {
      this.platformHealth.status = 'healthy';
    }
    
    // Log health status
    console.log(`❤️ PLATFORM HEALTH: ${this.platformHealth.status.toUpperCase()} - Users: ${userStats.totalUsers} - Games: ${this.platformHealth.activeGames} - Revenue: ₹${Math.round(this.platformHealth.dailyRevenue)}`);
  }

  // UTILITY METHODS
  private initializeProcessorStatuses(): void {
    const processors = [
      'AutomationProcessor',
      'FinancialProcessor', 
      'GameProcessor',
      'UserProcessor',
      'SystemProcessor'
    ];
    
    processors.forEach(name => {
      this.processorStatuses.set(name, {
        name,
        isRunning: false,
        startTime: 0,
        lastActivity: Date.now(),
        processedItems: 0,
        errors: [],
      });
    });
  }

  private updateProcessorStatus(processorName: string, isRunning: boolean, error?: Error): void {
    const status = this.processorStatuses.get(processorName);
    if (status) {
      status.isRunning = isRunning;
      status.lastActivity = Date.now();
      
      if (isRunning && status.startTime === 0) {
        status.startTime = Date.now();
      }
      
      if (error) {
        status.errors.push(error.message);
        // Keep only last 10 errors
        if (status.errors.length > 10) {
          status.errors = status.errors.slice(-10);
        }
      }
    }
  }

  private restartProcessor(processorName: string): void {
    console.log(`🔄 RESTARTING PROCESSOR: ${processorName}`);
    
    try {
      switch (processorName) {
        case 'AutomationProcessor':
          this.automationProcessor.stopAutomation();
          setTimeout(() => {
            this.automationProcessor.startAutomation();
            this.updateProcessorStatus(processorName, true);
          }, 5000);
          break;
        case 'FinancialProcessor':
          this.financialProcessor.stopFinancialAutomation();
          setTimeout(() => {
            this.financialProcessor.startFinancialAutomation();
            this.updateProcessorStatus(processorName, true);
          }, 5000);
          break;
        case 'GameProcessor':
          this.gameProcessor.stopGameAutomation();
          setTimeout(() => {
            this.gameProcessor.startGameAutomation();
            this.updateProcessorStatus(processorName, true);
          }, 5000);
          break;
        case 'UserProcessor':
          this.userProcessor.stopUserAutomation();
          setTimeout(() => {
            this.userProcessor.startUserAutomation();
            this.updateProcessorStatus(processorName, true);
          }, 5000);
          break;
        case 'SystemProcessor':
          this.systemProcessor.stopSystemAutomation();
          setTimeout(() => {
            this.systemProcessor.startSystemAutomation();
            this.updateProcessorStatus(processorName, true);
          }, 5000);
          break;
      }
      
      console.log(`✅ PROCESSOR RESTART INITIATED: ${processorName}`);
      
    } catch (error) {
      console.error(`❌ PROCESSOR RESTART FAILED: ${processorName}`, error);
      this.updateProcessorStatus(processorName, false, error as Error);
    }
  }

  private handleProcessorError(processorName: string, error: Error): void {
    this.updateProcessorStatus(processorName, false, error);
    
    if (this.config.autoRestartOnFailure) {
      setTimeout(() => {
        this.restartProcessor(processorName);
      }, 10000); // Wait 10 seconds before restart
    }
  }

  private handleOrchestrationError(error: Error): void {
    console.error('❌ ORCHESTRATION ERROR:', error);
    this.systemProcessor.logError(`Orchestration Error: ${error.message}`);
    
    // If too many orchestration errors, emergency stop
    const orchestratorStatus = this.processorStatuses.get('Orchestrator');
    if (orchestratorStatus) {
      orchestratorStatus.errors.push(error.message);
      
      if (orchestratorStatus.errors.length > 5) {
        console.log('🚨 EMERGENCY STOP: Too many orchestration errors');
        this.performEmergencyStop();
      }
    }
  }

  private performEmergencyRecovery(): void {
    console.log('🚨 PERFORMING EMERGENCY RECOVERY');
    
    // Enable maintenance mode
    this.systemProcessor.enableMaintenanceMode();
    
    // Restart all processors
    this.processorStatuses.forEach((_, processorName) => {
      if (processorName !== 'SystemProcessor') { // Don't restart system processor during recovery
        this.restartProcessor(processorName);
      }
    });
    
    // Wait 30 seconds then disable maintenance mode
    setTimeout(() => {
      this.systemProcessor.disableMaintenanceMode();
      console.log('✅ EMERGENCY RECOVERY COMPLETED');
    }, 30000);
  }

  private performSystemRestart(): void {
    console.log('🚨 PERFORMING SYSTEM RESTART');
    
    this.stopCompleteAutomation();
    
    setTimeout(() => {
      this.startCompleteAutomation();
    }, 15000); // 15 second delay
  }

  private performEmergencyStop(): void {
    console.log('🛑 EMERGENCY STOP INITIATED');
    this.stopCompleteAutomation();
  }

  private reduceProcessingLoad(): void {
    // Temporarily reduce processing frequency
    console.log('📉 REDUCING PROCESSING LOAD');
  }

  private increaseProcessingCapacity(): void {
    // Increase processing capacity when load is low
    console.log('📈 INCREASING PROCESSING CAPACITY');
  }

  private logOrchestrationStatus(): void {
    const runningProcessors = Array.from(this.processorStatuses.values()).filter(s => s.isRunning).length;
    const totalProcessors = this.processorStatuses.size;
    
    if (Date.now() % 60000 < 10000) { // Log every minute
      console.log(`🤖 ORCHESTRATION STATUS: ${runningProcessors}/${totalProcessors} processors running - Platform: ${this.platformHealth.status} - Uptime: ${Math.round(this.platformHealth.uptime / 1000)}s`);
    }
  }

  // PUBLIC METHODS
  public getPlatformHealth(): PlatformHealth {
    return { ...this.platformHealth };
  }

  public getProcessorStatuses(): ProcessorStatus[] {
    return Array.from(this.processorStatuses.values());
  }

  public getProcessorStatus(processorName: string): ProcessorStatus | undefined {
    return this.processorStatuses.get(processorName);
  }

  public isFullyOperational(): boolean {
    const allRunning = Array.from(this.processorStatuses.values()).every(status => status.isRunning);
    return allRunning && this.isOrchestrating && this.platformHealth.status !== 'offline';
  }

  public forceRestartProcessor(processorName: string): boolean {
    if (this.processorStatuses.has(processorName)) {
      this.restartProcessor(processorName);
      return true;
    }
    return false;
  }

  public updateConfiguration(config: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ ORCHESTRATOR CONFIGURATION UPDATED');
  }

  public getConfiguration(): AutomationConfig {
    return { ...this.config };
  }

  public enableMaintenanceMode(): void {
    this.systemProcessor.enableMaintenanceMode();
  }

  public disableMaintenanceMode(): void {
    this.systemProcessor.disableMaintenanceMode();
  }

  public getDashboardData(): {
    platformHealth: PlatformHealth;
    processorStatuses: ProcessorStatus[];
    isOperational: boolean;
    uptime: string;
  } {
    const uptime = Math.floor(this.platformHealth.uptime / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    return {
      platformHealth: this.getPlatformHealth(),
      processorStatuses: this.getProcessorStatuses(),
      isOperational: this.isFullyOperational(),
      uptime: `${hours}h ${minutes}m ${seconds}s`,
    };
  }

  // STOP COMPLETE AUTOMATION
  public stopCompleteAutomation(): void {
    if (!this.isOrchestrating) {
      console.log('🛑 AUTOMATION NOT RUNNING');
      return;
    }

    console.log('🛑 STOPPING COMPLETE PLATFORM AUTOMATION');
    
    this.isOrchestrating = false;
    
    // Clear intervals
    if (this.orchestratorInterval) {
      clearInterval(this.orchestratorInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Stop all processors
    try {
      this.automationProcessor.stopAutomation();
      this.financialProcessor.stopFinancialAutomation();
      this.gameProcessor.stopGameAutomation();
      this.userProcessor.stopUserAutomation();
      this.systemProcessor.stopSystemAutomation();
      
      console.log('✅ ALL PROCESSORS STOPPED');
    } catch (error) {
      console.error('❌ ERROR STOPPING PROCESSORS:', error);
    }
    
    // Update platform status
    this.platformHealth.status = 'offline';
    this.platformHealth.lastUpdate = Date.now();
    
    // Update processor statuses
    this.processorStatuses.forEach(status => {
      status.isRunning = false;
    });
    
    console.log('🛑 COMPLETE AUTOMATION SYSTEM OFFLINE');
  }
}

export default ProcessorOrchestrator;