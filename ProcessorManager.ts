/**
 * ProcessorManager - Central automation controller
 * Orchestrates all automated processors and workflows
 */

import AutoProcessor from './AutoProcessor';
import QueueManager from './QueueManager';
import WorkflowEngine from './WorkflowEngine';
import GameAutomation from './GameAutomation';
import { walletProcessor } from './WalletProcessor';

interface ProcessorConfig {
  autoProcessor: any;
  queueManager: any;
  workflowEngine: any;
  gameAutomation: any;
  walletProcessor: any;
  globalSettings: {
    enableAllAutomation: boolean;
    monitoringEnabled: boolean;
    alertsEnabled: boolean;
    autoRestartOnFailure: boolean;
    maxRestartAttempts: number;
  };
}

interface ProcessorStatus {
  name: string;
  isRunning: boolean;
  startTime?: number;
  lastActivity: number;
  errorCount: number;
  restartCount: number;
  status: 'healthy' | 'warning' | 'error' | 'stopped';
}

interface SystemMetrics {
  totalProcessors: number;
  runningProcessors: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  systemLoad: number;
  uptime: number;
}

class ProcessorManager {
  private processors: Map<string, any> = new Map();
  private processorStatuses: Map<string, ProcessorStatus> = new Map();
  private config: ProcessorConfig;
  private isSystemRunning: boolean = false;
  private startTime: number = 0;
  private monitoringTimer?: NodeJS.Timeout;
  private workflows: any[] = [];

  constructor(config: ProcessorConfig) {
    this.config = config;
    this.initializeProcessors();
    this.setupAutomatedWorkflows();
  }

  // Initialize all processors
  private initializeProcessors(): void {
    console.log('🔧 ProcessorManager: Initializing all automated processors...');

    // Initialize AutoProcessor
    const autoProcessor = new AutoProcessor(this.config.autoProcessor);
    this.processors.set('AutoProcessor', autoProcessor);
    this.initializeProcessorStatus('AutoProcessor');

    // Initialize QueueManager
    const queueManager = new QueueManager(this.config.queueManager);
    this.processors.set('QueueManager', queueManager);
    this.initializeProcessorStatus('QueueManager');

    // Initialize WorkflowEngine
    const workflowEngine = new WorkflowEngine();
    this.processors.set('WorkflowEngine', workflowEngine);
    this.initializeProcessorStatus('WorkflowEngine');

    // Initialize GameAutomation
    const gameAutomation = new GameAutomation(this.config.gameAutomation);
    this.processors.set('GameAutomation', gameAutomation);
    this.initializeProcessorStatus('GameAutomation');

    // Initialize WalletProcessor (using existing instance)
    this.processors.set('WalletProcessor', walletProcessor);
    this.initializeProcessorStatus('WalletProcessor');

    // Setup inter-processor communication
    this.setupProcessorCommunication();

    console.log('✅ ProcessorManager: All processors initialized successfully');
  }

  // Initialize processor status tracking
  private initializeProcessorStatus(processorName: string): void {
    const status: ProcessorStatus = {
      name: processorName,
      isRunning: false,
      lastActivity: Date.now(),
      errorCount: 0,
      restartCount: 0,
      status: 'stopped'
    };
    
    this.processorStatuses.set(processorName, status);
  }

  // Setup inter-processor communication
  private setupProcessorCommunication(): void {
    const autoProcessor = this.processors.get('AutoProcessor');
    const queueManager = this.processors.get('QueueManager');
    const workflowEngine = this.processors.get('WorkflowEngine');
    const gameAutomation = this.processors.get('GameAutomation');
    const walletProcessor = this.processors.get('WalletProcessor');

    // Setup event listeners for automation coordination

    // Game events trigger workflows
    gameAutomation?.addEventListener('MATCH_CREATED', (data: any) => {
      workflowEngine?.emitEvent('MATCH_CREATED', data);
      autoProcessor?.emitEvent({
        type: 'MATCH_CREATED',
        playerId: data.match.player1.id,
        matchId: data.match.id,
        timestamp: Date.now(),
        data
      });
    });

    gameAutomation?.addEventListener('MATCH_ENDED', (data: any) => {
      // Trigger payout workflow
      workflowEngine?.emitEvent('MATCH_ENDED', data);
      
      // Process automatic payouts
      if (data.winner) {
        walletProcessor?.creditPrizeAmount(data.winner, data.match.winnerPayout, data.matchId);
        walletProcessor?.creditServerFee(data.match.serverFee, `match_${data.matchId}`);
      }
    });

    // Wallet events trigger notifications
    walletProcessor?.addEventListener('TRANSACTION_COMPLETED', (data: any) => {
      autoProcessor?.emitEvent({
        type: 'WALLET_TRANSACTION_COMPLETED',
        playerId: data.transaction.userId,
        amount: data.transaction.amount,
        timestamp: Date.now(),
        data
      });
    });

    walletProcessor?.addEventListener('HIGH_RISK_DETECTED', (data: any) => {
      queueManager?.addJob('security', 'INVESTIGATE_HIGH_RISK', data, { priority: 10 });
    });

    console.log('🔗 ProcessorManager: Inter-processor communication established');
  }

  // Setup automated workflows
  private setupAutomatedWorkflows(): void {
    const workflowEngine = this.processors.get('WorkflowEngine');
    
    if (!workflowEngine) return;

    // Match Processing Workflow
    const matchWorkflow = {
      id: 'match_processing',
      name: 'Automated Match Processing',
      version: '1.0.0',
      description: 'Handles complete match lifecycle automatically',
      trigger: {
        type: 'event',
        config: { eventName: 'MATCH_REQUESTED' }
      },
      steps: [
        {
          id: 'validate_players',
          name: 'Validate Players',
          type: 'action',
          config: { action: 'VALIDATE_PLAYERS' },
          nextSteps: ['check_balances']
        },
        {
          id: 'check_balances',
          name: 'Check Wallet Balances',
          type: 'action',
          config: { action: 'CHECK_BALANCES' },
          nextSteps: ['deduct_bets']
        },
        {
          id: 'deduct_bets',
          name: 'Deduct Bet Amounts',
          type: 'action',
          config: { action: 'DEDUCT_BET' },
          nextSteps: ['create_match']
        },
        {
          id: 'create_match',
          name: 'Create Game Match',
          type: 'action',
          config: { action: 'CREATE_MATCH' },
          nextSteps: ['start_timer']
        },
        {
          id: 'start_timer',
          name: 'Start Game Timer',
          type: 'action',
          config: { action: 'START_GAME_TIMER', duration: 60000 },
          nextSteps: []
        }
      ],
      variables: {},
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Payout Processing Workflow
    const payoutWorkflow = {
      id: 'payout_processing',
      name: 'Automated Payout Processing',
      version: '1.0.0',
      description: 'Processes match payouts automatically',
      trigger: {
        type: 'event',
        config: { eventName: 'MATCH_ENDED' }
      },
      steps: [
        {
          id: 'validate_match',
          name: 'Validate Match Result',
          type: 'action',
          config: { action: 'VALIDATE_MATCH' },
          nextSteps: ['calculate_payouts']
        },
        {
          id: 'calculate_payouts',
          name: 'Calculate Payouts',
          type: 'action',
          config: { action: 'CALCULATE_PAYOUTS' },
          nextSteps: ['distribute_prizes']
        },
        {
          id: 'distribute_prizes',
          name: 'Distribute Prizes',
          type: 'action',
          config: { action: 'DISTRIBUTE_PRIZES' },
          nextSteps: ['update_stats']
        },
        {
          id: 'update_stats',
          name: 'Update Player Statistics',
          type: 'action',
          config: { action: 'UPDATE_STATS' },
          nextSteps: ['send_notifications']
        },
        {
          id: 'send_notifications',
          name: 'Send Notifications',
          type: 'action',
          config: { action: 'SEND_NOTIFICATION' },
          nextSteps: []
        }
      ],
      variables: {},
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Wallet Processing Workflow
    const walletWorkflow = {
      id: 'wallet_processing',
      name: 'Automated Wallet Processing',
      version: '1.0.0',
      description: 'Handles deposit and withdrawal processing',
      trigger: {
        type: 'event',
        config: { eventName: 'WALLET_TRANSACTION' }
      },
      steps: [
        {
          id: 'validate_transaction',
          name: 'Validate Transaction',
          type: 'action',
          config: { action: 'VALIDATE_TRANSACTION' },
          nextSteps: ['check_limits']
        },
        {
          id: 'check_limits',
          name: 'Check Transaction Limits',
          type: 'action',
          config: { action: 'CHECK_LIMITS' },
          nextSteps: ['process_transaction']
        },
        {
          id: 'process_transaction',
          name: 'Process Transaction',
          type: 'action',
          config: { action: 'PROCESS_TRANSACTION' },
          nextSteps: ['update_balance']
        },
        {
          id: 'update_balance',
          name: 'Update Wallet Balance',
          type: 'action',
          config: { action: 'UPDATE_BALANCE' },
          nextSteps: ['log_transaction']
        },
        {
          id: 'log_transaction',
          name: 'Log Transaction',
          type: 'action',
          config: { action: 'LOG_EVENT' },
          nextSteps: []
        }
      ],
      variables: {},
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Register all workflows
    workflowEngine.registerWorkflow(matchWorkflow);
    workflowEngine.registerWorkflow(payoutWorkflow);
    workflowEngine.registerWorkflow(walletWorkflow);

    this.workflows = [matchWorkflow, payoutWorkflow, walletWorkflow];

    console.log('🔄 ProcessorManager: Automated workflows registered');
  }

  // Start all automation systems
  public startAll(): void {
    if (this.isSystemRunning) return;
    
    this.isSystemRunning = true;
    this.startTime = Date.now();
    
    console.log('🚀 ProcessorManager: Starting complete automation system...');
    
    // Start all processors
    this.processors.forEach((processor, name) => {
      try {
        if (processor.start) {
          processor.start();
          this.updateProcessorStatus(name, { isRunning: true, startTime: Date.now(), status: 'healthy' });
          console.log(`✅ ProcessorManager: Started ${name}`);
        }
      } catch (error) {
        console.error(`❌ ProcessorManager: Failed to start ${name}:`, error);
        this.updateProcessorStatus(name, { status: 'error', errorCount: 1 });
      }
    });

    // Start system monitoring
    this.startSystemMonitoring();
    
    console.log('🎉 ProcessorManager: Complete automation system is now active!');
    console.log('🔥 All processes are running automatically - no manual intervention required!');
  }

  // Stop all automation systems
  public stopAll(): void {
    if (!this.isSystemRunning) return;
    
    this.isSystemRunning = false;
    
    console.log('🛑 ProcessorManager: Stopping complete automation system...');
    
    // Stop system monitoring
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    // Stop all processors
    this.processors.forEach((processor, name) => {
      try {
        if (processor.stop) {
          processor.stop();
          this.updateProcessorStatus(name, { isRunning: false, status: 'stopped' });
          console.log(`🛑 ProcessorManager: Stopped ${name}`);
        }
      } catch (error) {
        console.error(`❌ ProcessorManager: Error stopping ${name}:`, error);
      }
    });
    
    console.log('✅ ProcessorManager: Complete automation system stopped');
  }

  // Start system monitoring
  private startSystemMonitoring(): void {
    if (!this.config.globalSettings.monitoringEnabled) return;
    
    this.monitoringTimer = setInterval(() => {
      this.performSystemHealthCheck();
    }, 30000); // Check every 30 seconds
    
    console.log('📊 ProcessorManager: System monitoring started');
  }

  // Perform system health check
  private async performSystemHealthCheck(): Promise<void> {
    try {
      for (const [name, processor] of this.processors.entries()) {
        const status = this.processorStatuses.get(name);
        if (!status) continue;
        
        // Update last activity
        status.lastActivity = Date.now();
        
        // Check if processor is responding
        const isHealthy = await this.checkProcessorHealth(processor);
        
        if (!isHealthy && status.isRunning) {
          console.warn(`⚠️ ProcessorManager: ${name} appears unhealthy`);
          status.status = 'warning';
          
          // Attempt restart if configured
          if (this.config.globalSettings.autoRestartOnFailure) {
            await this.restartProcessor(name);
          }
        } else if (isHealthy && status.isRunning) {
          status.status = 'healthy';
        }
      }
      
      // Generate system metrics
      const metrics = await this.generateSystemMetrics();
      
      // Emit metrics for monitoring
      this.emitSystemMetrics(metrics);
      
    } catch (error) {
      console.error('ProcessorManager: Health check error:', error);
    }
  }

  // Check individual processor health
  private async checkProcessorHealth(processor: any): Promise<boolean> {
    try {
      // Check if processor has health check method
      if (processor.healthCheck) {
        return await processor.healthCheck();
      }
      
      // Basic health check - processor exists and has methods
      return processor && typeof processor.start === 'function';
      
    } catch (error) {
      return false;
    }
  }

  // Restart a processor
  private async restartProcessor(processorName: string): Promise<boolean> {
    const processor = this.processors.get(processorName);
    const status = this.processorStatuses.get(processorName);
    
    if (!processor || !status) return false;
    
    if (status.restartCount >= this.config.globalSettings.maxRestartAttempts) {
      console.error(`❌ ProcessorManager: Max restart attempts reached for ${processorName}`);
      status.status = 'error';
      return false;
    }
    
    try {
      console.log(`🔄 ProcessorManager: Restarting ${processorName}...`);
      
      // Stop processor
      if (processor.stop) {
        processor.stop();
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start processor
      if (processor.start) {
        processor.start();
      }
      
      status.restartCount++;
      status.status = 'healthy';
      status.startTime = Date.now();
      
      console.log(`✅ ProcessorManager: Successfully restarted ${processorName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ ProcessorManager: Failed to restart ${processorName}:`, error);
      status.errorCount++;
      status.status = 'error';
      return false;
    }
  }

  // Generate system metrics
  private async generateSystemMetrics(): Promise<SystemMetrics> {
    const runningProcessors = Array.from(this.processorStatuses.values())
      .filter(status => status.isRunning).length;
    
    const queueManager = this.processors.get('QueueManager');
    const queueStats = queueManager?.getAllStats() || new Map();
    
    let totalTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    
    queueStats.forEach((stats: any) => {
      if (stats) {
        totalTasks += stats.total || 0;
        completedTasks += stats.completed || 0;
        failedTasks += stats.failed || 0;
      }
    });
    
    const metrics: SystemMetrics = {
      totalProcessors: this.processors.size,
      runningProcessors,
      totalTasks,
      completedTasks,
      failedTasks,
      averageResponseTime: await this.calculateAverageResponseTime(),
      systemLoad: runningProcessors / this.processors.size,
      uptime: this.isSystemRunning ? Date.now() - this.startTime : 0
    };
    
    return metrics;
  }

  // Calculate average response time
  private async calculateAverageResponseTime(): Promise<number> {
    // Implementation would measure actual response times
    return 150; // Simulate 150ms average response time
  }

  // Emit system metrics
  private emitSystemMetrics(metrics: SystemMetrics): void {
    // In production, this would send to monitoring system
    if (this.config.globalSettings.alertsEnabled) {
      console.log('📊 ProcessorManager: System Metrics:', {
        uptime: `${Math.round(metrics.uptime / 60000)} minutes`,
        processors: `${metrics.runningProcessors}/${metrics.totalProcessors} running`,
        tasks: `${metrics.completedTasks} completed, ${metrics.failedTasks} failed`,
        systemLoad: `${Math.round(metrics.systemLoad * 100)}%`
      });
    }
  }

  // Update processor status
  private updateProcessorStatus(processorName: string, updates: Partial<ProcessorStatus>): void {
    const status = this.processorStatuses.get(processorName);
    if (status) {
      Object.assign(status, updates);
    }
  }

  // Public methods for external interaction

  // Get processor by name
  public getProcessor(processorName: string): any {
    return this.processors.get(processorName);
  }

  // Get processor status
  public getProcessorStatus(processorName: string): ProcessorStatus | null {
    return this.processorStatuses.get(processorName) || null;
  }

  // Get all processor statuses
  public getAllProcessorStatuses(): Map<string, ProcessorStatus> {
    return new Map(this.processorStatuses);
  }

  // Get system status
  public getSystemStatus(): any {
    return {
      isRunning: this.isSystemRunning,
      startTime: this.startTime,
      uptime: this.isSystemRunning ? Date.now() - this.startTime : 0,
      totalProcessors: this.processors.size,
      runningProcessors: Array.from(this.processorStatuses.values()).filter(s => s.isRunning).length,
      workflows: this.workflows.length,
      lastHealthCheck: Date.now()
    };
  }

  // Manual processor control
  public async startProcessor(processorName: string): Promise<boolean> {
    const processor = this.processors.get(processorName);
    if (!processor || !processor.start) return false;
    
    try {
      processor.start();
      this.updateProcessorStatus(processorName, { 
        isRunning: true, 
        startTime: Date.now(), 
        status: 'healthy' 
      });
      return true;
    } catch (error) {
      console.error(`ProcessorManager: Failed to start ${processorName}:`, error);
      return false;
    }
  }

  public async stopProcessor(processorName: string): Promise<boolean> {
    const processor = this.processors.get(processorName);
    if (!processor || !processor.stop) return false;
    
    try {
      processor.stop();
      this.updateProcessorStatus(processorName, { 
        isRunning: false, 
        status: 'stopped' 
      });
      return true;
    } catch (error) {
      console.error(`ProcessorManager: Failed to stop ${processorName}:`, error);
      return false;
    }
  }

  // Execute workflow manually
  public async executeWorkflow(workflowId: string, data: any = {}): Promise<string> {
    const workflowEngine = this.processors.get('WorkflowEngine');
    if (!workflowEngine) {
      throw new Error('WorkflowEngine not available');
    }
    
    return await workflowEngine.executeWorkflow(workflowId, data);
  }
}

export default ProcessorManager;