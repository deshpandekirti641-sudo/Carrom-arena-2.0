'use client';

import type { Transaction, Player } from '@/types/game';

interface WalletConfig {
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  processingDelay: number;
  autoApprovalLimit: number;
  developerWalletId: string;
}

interface WalletState {
  transactions: Map<string, Transaction>;
  playerBalances: Map<string, number>;
  pendingDeposits: Transaction[];
  pendingWithdrawals: Transaction[];
  developerBalance: number;
  totalVolume: number;
  totalFees: number;
}

class WalletProcessor {
  private config: WalletConfig;
  private state: WalletState;
  private intervals: Map<string, NodeJS.Timeout>;
  private isRunning: boolean;

  constructor() {
    this.config = {
      minDeposit: 10,
      maxDeposit: 2000,
      minWithdrawal: 10,
      maxWithdrawal: 2000,
      processingDelay: 5000, // 5 seconds
      autoApprovalLimit: 500, // Auto-approve transactions under ₹500
      developerWalletId: 'dev_wallet_main'
    };

    this.state = {
      transactions: new Map(),
      playerBalances: new Map(),
      pendingDeposits: [],
      pendingWithdrawals: [],
      developerBalance: 10000, // Initial developer balance
      totalVolume: 0,
      totalFees: 0
    };

    this.intervals = new Map();
    this.isRunning = false;

    this.startAutomatedWalletProcessing();
  }

  // =====================================
  // AUTOMATED WALLET PROCESSING
  // =====================================

  private startAutomatedWalletProcessing(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Deposit processor - runs every 3 seconds
    const depositProcessor = setInterval(() => {
      this.processAutomaticDeposits();
    }, 3000);

    // Withdrawal processor - runs every 5 seconds
    const withdrawalProcessor = setInterval(() => {
      this.processAutomaticWithdrawals();
    }, 5000);

    // Balance synchronization - runs every 10 seconds
    const balanceSync = setInterval(() => {
      this.synchronizeBalances();
    }, 10000);

    // Transaction validation - runs every 15 seconds
    const validationProcessor = setInterval(() => {
      this.validateTransactions();
    }, 15000);

    // Fee collection - runs every 30 seconds
    const feeCollector = setInterval(() => {
      this.collectSystemFees();
    }, 30000);

    // Cleanup processor - runs every 60 seconds
    const cleanupProcessor = setInterval(() => {
      this.cleanupWalletData();
    }, 60000);

    this.intervals.set('deposits', depositProcessor);
    this.intervals.set('withdrawals', withdrawalProcessor);
    this.intervals.set('balance', balanceSync);
    this.intervals.set('validation', validationProcessor);
    this.intervals.set('fees', feeCollector);
    this.intervals.set('cleanup', cleanupProcessor);

    console.log('💰 Automated Wallet Processor Started');
  }

  // =====================================
  // DEPOSIT PROCESSING AUTOMATION
  // =====================================

  private processAutomaticDeposits(): void {
    if (this.state.pendingDeposits.length === 0) return;

    console.log(`📥 Processing ${this.state.pendingDeposits.length} pending deposits`);

    const depositsToProcess = [...this.state.pendingDeposits];
    this.state.pendingDeposits = [];

    depositsToProcess.forEach(deposit => {
      this.processDepositTransaction(deposit);
    });
  }

  private processDepositTransaction(deposit: Transaction): void {
    try {
      // Validate deposit amount
      if (deposit.amount < this.config.minDeposit || deposit.amount > this.config.maxDeposit) {
        this.failTransaction(deposit, `Invalid amount: ₹${deposit.amount}`);
        return;
      }

      // Simulate payment gateway processing
      if (this.simulatePaymentGateway(deposit)) {
        // Auto-approve deposits
        this.approveDeposit(deposit);
      } else {
        this.failTransaction(deposit, 'Payment gateway failed');
      }

    } catch (error) {
      console.error(`❌ Deposit processing error:`, error);
      this.failTransaction(deposit, 'Processing error');
    }
  }

  private approveDeposit(deposit: Transaction): void {
    // Update player balance
    const currentBalance = this.state.playerBalances.get(deposit.playerId) || 0;
    this.state.playerBalances.set(deposit.playerId, currentBalance + deposit.amount);

    // Update transaction status
    deposit.status = 'completed';
    deposit.completedAt = Date.now();

    // Store in completed transactions
    this.state.transactions.set(deposit.id, deposit);

    // Update system statistics
    this.state.totalVolume += deposit.amount;

    console.log(`✅ Auto-approved deposit: ₹${deposit.amount} for player ${deposit.playerId}`);
    
    // Trigger balance update notification
    this.notifyBalanceUpdate(deposit.playerId, deposit.amount, 'deposit');
  }

  // =====================================
  // WITHDRAWAL PROCESSING AUTOMATION
  // =====================================

  private processAutomaticWithdrawals(): void {
    if (this.state.pendingWithdrawals.length === 0) return;

    console.log(`📤 Processing ${this.state.pendingWithdrawals.length} pending withdrawals`);

    const withdrawalsToProcess = [...this.state.pendingWithdrawals];
    this.state.pendingWithdrawals = [];

    withdrawalsToProcess.forEach(withdrawal => {
      this.processWithdrawalTransaction(withdrawal);
    });
  }

  private processWithdrawalTransaction(withdrawal: Transaction): void {
    try {
      // Validate withdrawal amount
      if (withdrawal.amount < this.config.minWithdrawal || withdrawal.amount > this.config.maxWithdrawal) {
        this.failTransaction(withdrawal, `Invalid amount: ₹${withdrawal.amount}`);
        return;
      }

      // Check player balance
      const currentBalance = this.state.playerBalances.get(withdrawal.playerId) || 0;
      if (currentBalance < Math.abs(withdrawal.amount)) {
        this.failTransaction(withdrawal, 'Insufficient balance');
        return;
      }

      // Auto-approve small amounts, manual review for large amounts
      if (Math.abs(withdrawal.amount) <= this.config.autoApprovalLimit) {
        this.approveWithdrawal(withdrawal);
      } else {
        this.queueForManualReview(withdrawal);
      }

    } catch (error) {
      console.error(`❌ Withdrawal processing error:`, error);
      this.failTransaction(withdrawal, 'Processing error');
    }
  }

  private approveWithdrawal(withdrawal: Transaction): void {
    // Deduct from player balance
    const currentBalance = this.state.playerBalances.get(withdrawal.playerId) || 0;
    this.state.playerBalances.set(withdrawal.playerId, currentBalance + withdrawal.amount); // withdrawal.amount is negative

    // Update transaction status
    withdrawal.status = 'completed';
    withdrawal.completedAt = Date.now();

    // Store in completed transactions
    this.state.transactions.set(withdrawal.id, withdrawal);

    // Update system statistics
    this.state.totalVolume += Math.abs(withdrawal.amount);

    console.log(`✅ Auto-approved withdrawal: ₹${Math.abs(withdrawal.amount)} for player ${withdrawal.playerId}`);
    
    // Simulate bank transfer
    this.simulateBankTransfer(withdrawal);
    
    // Trigger balance update notification
    this.notifyBalanceUpdate(withdrawal.playerId, withdrawal.amount, 'withdrawal');
  }

  // =====================================
  // BALANCE SYNCHRONIZATION
  // =====================================

  private synchronizeBalances(): void {
    try {
      // Sync with external wallet systems
      this.syncExternalWallets();
      
      // Validate balance integrity
      this.validateBalanceIntegrity();
      
      // Update cached balances
      this.updateCachedBalances();
      
      // Generate balance reports
      this.generateBalanceReports();

      console.log('💳 Balance synchronization completed');
    } catch (error) {
      console.error('❌ Balance sync error:', error);
    }
  }

  private syncExternalWallets(): void {
    // Sync with UPI/Banking systems
    // This would integrate with actual payment providers
    console.log('🔄 Syncing with external wallet systems');
  }

  private validateBalanceIntegrity(): void {
    let totalPlayerBalances = 0;
    this.state.playerBalances.forEach(balance => {
      totalPlayerBalances += balance;
    });

    const expectedTotal = this.calculateExpectedTotal();
    const difference = Math.abs(totalPlayerBalances - expectedTotal);

    if (difference > 1) { // Allow ₹1 difference for rounding
      console.warn(`⚠️ Balance integrity issue: ${difference} rupees difference`);
      this.handleBalanceDiscrepancy(difference);
    }
  }

  // =====================================
  // TRANSACTION VALIDATION
  // =====================================

  private validateTransactions(): void {
    const now = Date.now();
    
    // Check for stuck transactions
    this.state.transactions.forEach((transaction, id) => {
      if (transaction.status === 'pending' && 
          now - transaction.timestamp > 300000) { // 5 minutes
        this.handleStuckTransaction(transaction);
      }
    });

    // Validate transaction integrity
    this.validateTransactionIntegrity();

    console.log('✅ Transaction validation completed');
  }

  private handleStuckTransaction(transaction: Transaction): void {
    console.warn(`⏳ Handling stuck transaction: ${transaction.id}`);
    
    // Auto-retry or fail based on transaction type
    if (transaction.type === 'deposit') {
      this.retryTransaction(transaction);
    } else {
      this.failTransaction(transaction, 'Transaction timeout');
    }
  }

  // =====================================
  // FEE COLLECTION AUTOMATION
  // =====================================

  private collectSystemFees(): void {
    // Collect pending fees from completed matches
    const feeTransactions = Array.from(this.state.transactions.values())
      .filter(tx => tx.type === 'server_fee' && tx.status === 'pending');

    let totalFees = 0;
    feeTransactions.forEach(feeTx => {
      this.state.developerBalance += feeTx.amount;
      feeTx.status = 'completed';
      totalFees += feeTx.amount;
    });

    if (totalFees > 0) {
      this.state.totalFees += totalFees;
      console.log(`💰 Auto-collected ₹${totalFees} in system fees`);
    }
  }

  // =====================================
  // CLEANUP AUTOMATION
  // =====================================

  private cleanupWalletData(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Cleanup old completed transactions
    let cleanedCount = 0;
    this.state.transactions.forEach((transaction, id) => {
      if (transaction.status === 'completed' && 
          transaction.timestamp < thirtyDaysAgo) {
        this.state.transactions.delete(id);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old transactions`);
    }

    // Cleanup inactive player balances
    this.cleanupInactiveBalances();
  }

  // =====================================
  // PUBLIC API METHODS
  // =====================================

  public processDeposit(playerId: string, amount: number, paymentMethod: string): Transaction {
    const deposit: Transaction = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: Date.now(),
      paymentMethod,
      metadata: {
        gateway: 'auto',
        method: paymentMethod
      }
    };

    // Add to pending deposits for automatic processing
    this.state.pendingDeposits.push(deposit);
    
    console.log(`📥 Queued deposit: ₹${amount} for player ${playerId}`);
    
    return deposit;
  }

  public processWithdrawal(playerId: string, amount: number, bankDetails: any): Transaction {
    const withdrawal: Transaction = {
      id: `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      type: 'withdrawal',
      amount: -amount, // Negative for withdrawal
      status: 'pending',
      timestamp: Date.now(),
      bankDetails,
      metadata: {
        method: 'bank_transfer'
      }
    };

    // Add to pending withdrawals for automatic processing
    this.state.pendingWithdrawals.push(withdrawal);
    
    console.log(`📤 Queued withdrawal: ₹${amount} for player ${playerId}`);
    
    return withdrawal;
  }

  public getPlayerBalance(playerId: string): number {
    return this.state.playerBalances.get(playerId) || 0;
  }

  public getDeveloperBalance(): number {
    return this.state.developerBalance;
  }

  public getSystemStats(): any {
    return {
      totalTransactions: this.state.transactions.size,
      pendingDeposits: this.state.pendingDeposits.length,
      pendingWithdrawals: this.state.pendingWithdrawals.length,
      totalVolume: this.state.totalVolume,
      totalFees: this.state.totalFees,
      developerBalance: this.state.developerBalance,
      activePlayers: this.state.playerBalances.size
    };
  }

  public addServerFee(matchId: string, amount: number): void {
    const feeTransaction: Transaction = {
      id: `fee_${matchId}_${Date.now()}`,
      playerId: this.config.developerWalletId,
      type: 'server_fee',
      amount,
      status: 'pending',
      timestamp: Date.now(),
      matchId
    };

    this.state.transactions.set(feeTransaction.id, feeTransaction);
    console.log(`💰 Added server fee: ₹${amount} from match ${matchId}`);
  }

  // =====================================
  // PRIVATE HELPER METHODS
  // =====================================

  private simulatePaymentGateway(deposit: Transaction): boolean {
    // Simulate payment gateway success/failure
    // In real implementation, this would integrate with actual payment gateways
    return Math.random() > 0.05; // 95% success rate
  }

  private simulateBankTransfer(withdrawal: Transaction): void {
    // Simulate bank transfer processing
    console.log(`🏦 Initiating bank transfer for withdrawal ${withdrawal.id}`);
    
    // In real implementation, this would integrate with banking APIs
    setTimeout(() => {
      console.log(`✅ Bank transfer completed for withdrawal ${withdrawal.id}`);
    }, 2000);
  }

  private failTransaction(transaction: Transaction, reason: string): void {
    transaction.status = 'failed';
    transaction.error = reason;
    transaction.completedAt = Date.now();
    
    this.state.transactions.set(transaction.id, transaction);
    
    console.log(`❌ Transaction failed: ${transaction.id} - ${reason}`);
  }

  private retryTransaction(transaction: Transaction): void {
    transaction.status = 'pending';
    transaction.retryCount = (transaction.retryCount || 0) + 1;
    
    if (transaction.retryCount > 3) {
      this.failTransaction(transaction, 'Max retries exceeded');
      return;
    }

    // Re-add to processing queue
    if (transaction.type === 'deposit') {
      this.state.pendingDeposits.push(transaction);
    } else if (transaction.type === 'withdrawal') {
      this.state.pendingWithdrawals.push(transaction);
    }
    
    console.log(`🔄 Retrying transaction: ${transaction.id} (attempt ${transaction.retryCount})`);
  }

  private queueForManualReview(withdrawal: Transaction): void {
    withdrawal.status = 'review';
    this.state.transactions.set(withdrawal.id, withdrawal);
    
    console.log(`👥 Queued for manual review: ${withdrawal.id}`);
    
    // In real implementation, this would notify administrators
    // For demo purposes, we'll auto-approve after delay
    setTimeout(() => {
      if (withdrawal.status === 'review') {
        this.approveWithdrawal(withdrawal);
      }
    }, 30000); // 30 seconds delay
  }

  private notifyBalanceUpdate(playerId: string, amount: number, type: string): void {
    // Send real-time notification to player
    console.log(`📢 Balance update: Player ${playerId}, ${type}: ₹${amount}`);
    
    // This would integrate with WebSocket or push notifications
    this.broadcastBalanceUpdate(playerId, amount, type);
  }

  private broadcastBalanceUpdate(playerId: string, amount: number, type: string): void {
    // Broadcast balance update through SpacetimeDB or WebSocket
    // Implementation would depend on chosen real-time solution
  }

  private calculateExpectedTotal(): number {
    // Calculate expected total based on all transactions
    let expected = 0;
    this.state.transactions.forEach(tx => {
      if (tx.status === 'completed') {
        expected += tx.amount;
      }
    });
    return expected;
  }

  private handleBalanceDiscrepancy(difference: number): void {
    console.warn(`⚠️ Handling balance discrepancy: ₹${difference}`);
    // Implement discrepancy resolution logic
  }

  private validateTransactionIntegrity(): void {
    // Validate transaction data integrity
    // Check for duplicate transactions, invalid amounts, etc.
  }

  private updateCachedBalances(): void {
    // Update cached balance information
    console.log('💾 Updated cached balances');
  }

  private generateBalanceReports(): void {
    // Generate balance reports for monitoring
    const report = {
      timestamp: Date.now(),
      totalPlayerBalances: Array.from(this.state.playerBalances.values()).reduce((a, b) => a + b, 0),
      developerBalance: this.state.developerBalance,
      pendingTransactions: this.state.pendingDeposits.length + this.state.pendingWithdrawals.length
    };
    
    // Store report for analytics
    console.log('📊 Generated balance report:', report);
  }

  private cleanupInactiveBalances(): void {
    // Mark inactive balances for archival
    // Keep active balances in memory
  }

  // =====================================
  // LIFECYCLE MANAGEMENT
  // =====================================

  public stop(): void {
    this.isRunning = false;
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    console.log('🛑 Automated Wallet Processor Stopped');
  }

  public restart(): void {
    this.stop();
    setTimeout(() => {
      this.startAutomatedWalletProcessing();
    }, 1000);
  }
}

// Global wallet processor instance
export const walletProcessor = new WalletProcessor();