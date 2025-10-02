'use client';

import type { Player, Match, Transaction } from '@/types/game';

interface ProcessorConfig {
  matchDuration: number;
  betAmount: number;
  winnerPayout: number;
  serverFee: number;
  autoCleanupInterval: number;
  maxConcurrentMatches: number;
}

interface GameState {
  matches: Map<string, Match>;
  players: Map<string, Player>;
  transactions: Transaction[];
  matchQueue: string[];
  processing: boolean;
}

class GameProcessor {
  private config: ProcessorConfig;
  private state: GameState;
  private intervals: Map<string, NodeJS.Timeout>;
  private processingQueue: string[];
  private isRunning: boolean;

  constructor() {
    this.config = {
      matchDuration: 60000, // 60 seconds
      betAmount: 10,
      winnerPayout: 16,
      serverFee: 4,
      autoCleanupInterval: 30000, // 30 seconds
      maxConcurrentMatches: 100
    };

    this.state = {
      matches: new Map(),
      players: new Map(),
      transactions: [],
      matchQueue: [],
      processing: false
    };

    this.intervals = new Map();
    this.processingQueue = [];
    this.isRunning = false;

    // Start automated processors
    this.startAutomatedProcessing();
  }

  // =====================================
  // AUTOMATED PROCESSING CORE
  // =====================================

  private startAutomatedProcessing(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Main processing loop - runs every 1 second
    const mainLoop = setInterval(() => {
      this.processMainLoop();
    }, 1000);

    // Cleanup processor - runs every 30 seconds
    const cleanupLoop = setInterval(() => {
      this.processCleanup();
    }, this.config.autoCleanupInterval);

    // Match queue processor - runs every 2 seconds
    const queueLoop = setInterval(() => {
      this.processMatchQueue();
    }, 2000);

    // Transaction processor - runs every 5 seconds
    const transactionLoop = setInterval(() => {
      this.processTransactions();
    }, 5000);

    // Health monitor - runs every 10 seconds
    const healthLoop = setInterval(() => {
      this.processHealthCheck();
    }, 10000);

    // Store intervals for cleanup
    this.intervals.set('main', mainLoop);
    this.intervals.set('cleanup', cleanupLoop);
    this.intervals.set('queue', queueLoop);
    this.intervals.set('transactions', transactionLoop);
    this.intervals.set('health', healthLoop);

    console.log('🤖 Automated Game Processor Started');
  }

  // =====================================
  // MAIN PROCESSING LOOPS
  // =====================================

  private processMainLoop(): void {
    try {
      // Process active matches
      this.state.matches.forEach((match, matchId) => {
        this.processMatchState(matchId, match);
      });

      // Process player states
      this.state.players.forEach((player, playerId) => {
        this.processPlayerState(playerId, player);
      });

      // Update system stats
      this.updateSystemStats();

    } catch (error) {
      console.error('❌ Main loop error:', error);
      this.handleProcessorError('main', error);
    }
  }

  private processMatchState(matchId: string, match: Match): void {
    const now = Date.now();
    
    switch (match.status) {
      case 'waiting':
        this.processWaitingMatch(matchId, match);
        break;
        
      case 'active':
        this.processActiveMatch(matchId, match, now);
        break;
        
      case 'finishing':
        this.processFinishingMatch(matchId, match);
        break;
        
      case 'completed':
        this.processCompletedMatch(matchId, match, now);
        break;
        
      case 'cancelled':
        this.processCancelledMatch(matchId, match, now);
        break;
    }
  }

  private processPlayerState(playerId: string, player: Player): void {
    // Auto-update player statistics
    if (player.lastActivity && Date.now() - player.lastActivity > 300000) { // 5 minutes
      player.status = 'inactive';
    }

    // Process pending transactions
    if (player.pendingTransactions && player.pendingTransactions.length > 0) {
      this.processPendingPlayerTransactions(playerId, player);
    }

    // Auto-save player state
    this.savePlayerState(playerId, player);
  }

  // =====================================
  // AUTOMATED MATCH PROCESSING
  // =====================================

  private processWaitingMatch(matchId: string, match: Match): void {
    // Auto-match players
    if (match.players.length === 1) {
      const opponent = this.findAvailableOpponent(match.players[0].id);
      if (opponent) {
        match.players.push(opponent);
        match.status = 'active';
        match.startTime = Date.now();
        
        // Automatically deduct bet amounts
        this.processAutomaticBetDeduction(match);
        
        // Set match timer
        this.setMatchTimer(matchId);
        
        console.log(`🎯 Auto-matched players for match ${matchId}`);
      }
    }
    
    // Auto-cancel if waiting too long (2 minutes)
    if (match.createdAt && Date.now() - match.createdAt > 120000) {
      this.cancelMatch(matchId, 'timeout');
    }
  }

  private processActiveMatch(matchId: string, match: Match, now: number): void {
    if (!match.startTime) return;
    
    const elapsed = now - match.startTime;
    const remaining = this.config.matchDuration - elapsed;
    
    // Auto-update match timer
    match.timeRemaining = Math.max(0, remaining);
    
    // Auto-end match when time expires
    if (remaining <= 0) {
      this.endMatch(matchId, 'time_expired');
    }
    
    // Auto-process game events
    this.processGameEvents(matchId, match);
  }

  private processFinishingMatch(matchId: string, match: Match): void {
    // Automatically determine winner
    const winner = this.determineMatchWinner(match);
    
    if (winner) {
      match.winner = winner;
      match.status = 'completed';
      match.endTime = Date.now();
      
      // Auto-process payouts
      this.processAutomaticPayout(match);
      
      console.log(`🏆 Auto-processed match ${matchId} winner: ${winner.name}`);
    }
  }

  private processCompletedMatch(matchId: string, match: Match, now: number): void {
    // Auto-cleanup completed matches after 1 hour
    if (match.endTime && now - match.endTime > 3600000) {
      this.cleanupMatch(matchId);
    }
  }

  private processCancelledMatch(matchId: string, match: Match, now: number): void {
    // Auto-refund cancelled matches
    this.processAutomaticRefund(match);
    
    // Auto-cleanup after 30 minutes
    if (match.endTime && now - match.endTime > 1800000) {
      this.cleanupMatch(matchId);
    }
  }

  // =====================================
  // AUTOMATED FINANCIAL PROCESSING
  // =====================================

  private processAutomaticBetDeduction(match: Match): void {
    match.players.forEach(player => {
      if (player.walletBalance >= this.config.betAmount) {
        player.walletBalance -= this.config.betAmount;
        
        // Create transaction record
        this.createTransaction({
          id: `bet_${match.id}_${player.id}_${Date.now()}`,
          playerId: player.id,
          type: 'bet',
          amount: -this.config.betAmount,
          status: 'completed',
          matchId: match.id,
          timestamp: Date.now()
        });
        
        console.log(`💰 Auto-deducted ₹${this.config.betAmount} from ${player.name}`);
      } else {
        // Auto-cancel match due to insufficient funds
        this.cancelMatch(match.id, 'insufficient_funds');
      }
    });
  }

  private processAutomaticPayout(match: Match): void {
    if (!match.winner) return;
    
    // Credit winner
    match.winner.walletBalance += this.config.winnerPayout;
    
    // Create winner transaction
    this.createTransaction({
      id: `win_${match.id}_${match.winner.id}_${Date.now()}`,
      playerId: match.winner.id,
      type: 'win',
      amount: this.config.winnerPayout,
      status: 'completed',
      matchId: match.id,
      timestamp: Date.now()
    });
    
    // Credit server fee to developer wallet
    this.creditDeveloperFee(this.config.serverFee, match.id);
    
    console.log(`💎 Auto-paid ₹${this.config.winnerPayout} to winner ${match.winner.name}`);
  }

  private processAutomaticRefund(match: Match): void {
    match.players.forEach(player => {
      player.walletBalance += this.config.betAmount;
      
      this.createTransaction({
        id: `refund_${match.id}_${player.id}_${Date.now()}`,
        playerId: player.id,
        type: 'refund',
        amount: this.config.betAmount,
        status: 'completed',
        matchId: match.id,
        timestamp: Date.now()
      });
    });
    
    console.log(`🔄 Auto-refunded match ${match.id}`);
  }

  // =====================================
  // AUTOMATED QUEUE PROCESSING
  // =====================================

  private processMatchQueue(): void {
    if (this.state.matchQueue.length === 0) return;
    
    const availablePlayers = Array.from(this.state.players.values())
      .filter(player => player.status === 'online' && player.walletBalance >= this.config.betAmount);
    
    // Auto-create matches from queue
    while (this.state.matchQueue.length >= 2 && 
           this.state.matches.size < this.config.maxConcurrentMatches) {
      
      const player1Id = this.state.matchQueue.shift()!;
      const player2Id = this.state.matchQueue.shift()!;
      
      const player1 = this.state.players.get(player1Id);
      const player2 = this.state.players.get(player2Id);
      
      if (player1 && player2) {
        this.createAutomaticMatch(player1, player2);
      }
    }
  }

  // =====================================
  // AUTOMATED TRANSACTION PROCESSING
  // =====================================

  private processTransactions(): void {
    const pendingTransactions = this.state.transactions
      .filter(tx => tx.status === 'pending');
    
    pendingTransactions.forEach(transaction => {
      this.processTransaction(transaction);
    });
  }

  private processTransaction(transaction: Transaction): void {
    try {
      switch (transaction.type) {
        case 'deposit':
          this.processDepositTransaction(transaction);
          break;
        case 'withdrawal':
          this.processWithdrawalTransaction(transaction);
          break;
        case 'bet':
        case 'win':
        case 'refund':
          // Already processed
          transaction.status = 'completed';
          break;
      }
    } catch (error) {
      console.error(`❌ Transaction error for ${transaction.id}:`, error);
      transaction.status = 'failed';
      transaction.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  // =====================================
  // AUTOMATED CLEANUP PROCESSING
  // =====================================

  private processCleanup(): void {
    const now = Date.now();
    
    // Cleanup expired sessions
    this.cleanupExpiredSessions(now);
    
    // Cleanup old transactions
    this.cleanupOldTransactions(now);
    
    // Cleanup inactive players
    this.cleanupInactivePlayers(now);
    
    // System memory optimization
    this.optimizeMemory();
    
    console.log('🧹 Auto-cleanup completed');
  }

  private cleanupExpiredSessions(now: number): void {
    // Remove sessions older than 24 hours
    const expiredThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    this.state.matches.forEach((match, matchId) => {
      if (match.createdAt && now - match.createdAt > expiredThreshold) {
        this.state.matches.delete(matchId);
      }
    });
  }

  // =====================================
  // AUTOMATED HEALTH MONITORING
  // =====================================

  private processHealthCheck(): void {
    const health = {
      activeMatches: this.state.matches.size,
      onlinePlayers: Array.from(this.state.players.values())
        .filter(p => p.status === 'online').length,
      pendingTransactions: this.state.transactions
        .filter(tx => tx.status === 'pending').length,
      queueLength: this.state.matchQueue.length,
      memoryUsage: this.getMemoryUsage(),
      uptime: Date.now() - (this.startTime || Date.now())
    };
    
    // Auto-recovery actions
    if (health.activeMatches > this.config.maxConcurrentMatches * 1.5) {
      this.emergencyMatchCleanup();
    }
    
    if (health.pendingTransactions > 100) {
      this.emergencyTransactionProcessing();
    }
    
    // Store health metrics
    this.updateHealthMetrics(health);
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private findAvailableOpponent(excludePlayerId: string): Player | null {
    const availablePlayers = Array.from(this.state.players.values())
      .filter(player => 
        player.id !== excludePlayerId &&
        player.status === 'online' &&
        player.walletBalance >= this.config.betAmount &&
        !this.isPlayerInMatch(player.id)
      );
    
    return availablePlayers.length > 0 ? availablePlayers[0] : null;
  }

  private determineMatchWinner(match: Match): Player | null {
    // Auto-determine winner based on game state
    // This would integrate with the actual game logic
    if (match.players.length === 2) {
      // Simplified logic - in real implementation, this would check game state
      return match.players[Math.floor(Math.random() * 2)];
    }
    return null;
  }

  private setMatchTimer(matchId: string): void {
    const timer = setTimeout(() => {
      this.endMatch(matchId, 'time_expired');
    }, this.config.matchDuration);
    
    this.intervals.set(`match_${matchId}`, timer);
  }

  // =====================================
  // PUBLIC API METHODS
  // =====================================

  public addPlayerToQueue(playerId: string): void {
    if (!this.state.matchQueue.includes(playerId)) {
      this.state.matchQueue.push(playerId);
      console.log(`👤 Player ${playerId} added to queue`);
    }
  }

  public createPlayer(playerData: Omit<Player, 'id'>): Player {
    const player: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...playerData,
      status: 'online',
      lastActivity: Date.now()
    };
    
    this.state.players.set(player.id, player);
    return player;
  }

  public getSystemStats(): any {
    return {
      totalMatches: this.state.matches.size,
      totalPlayers: this.state.players.size,
      activeMatches: Array.from(this.state.matches.values())
        .filter(m => m.status === 'active').length,
      onlinePlayers: Array.from(this.state.players.values())
        .filter(p => p.status === 'online').length,
      queueLength: this.state.matchQueue.length,
      isProcessing: this.isRunning
    };
  }

  // =====================================
  // PRIVATE HELPER METHODS
  // =====================================

  private startTime: number = Date.now();

  private createTransaction(transaction: Transaction): void {
    this.state.transactions.push(transaction);
  }

  private creditDeveloperFee(amount: number, matchId: string): void {
    // Credit to developer wallet - this would integrate with actual developer wallet
    console.log(`🏦 Auto-credited ₹${amount} server fee from match ${matchId}`);
  }

  private createAutomaticMatch(player1: Player, player2: Player): void {
    const match: Match = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      players: [player1, player2],
      status: 'active',
      createdAt: Date.now(),
      startTime: Date.now(),
      timeRemaining: this.config.matchDuration,
      betAmount: this.config.betAmount
    };
    
    this.state.matches.set(match.id, match);
    this.processAutomaticBetDeduction(match);
    this.setMatchTimer(match.id);
    
    console.log(`🎮 Auto-created match ${match.id}`);
  }

  private cancelMatch(matchId: string, reason: string): void {
    const match = this.state.matches.get(matchId);
    if (match) {
      match.status = 'cancelled';
      match.endTime = Date.now();
      console.log(`❌ Auto-cancelled match ${matchId}: ${reason}`);
    }
  }

  private endMatch(matchId: string, reason: string): void {
    const match = this.state.matches.get(matchId);
    if (match) {
      match.status = 'finishing';
      console.log(`⏰ Auto-ending match ${matchId}: ${reason}`);
    }
  }

  private cleanupMatch(matchId: string): void {
    this.state.matches.delete(matchId);
    const timer = this.intervals.get(`match_${matchId}`);
    if (timer) {
      clearTimeout(timer);
      this.intervals.delete(`match_${matchId}`);
    }
  }

  private processGameEvents(matchId: string, match: Match): void {
    // Process any pending game events automatically
  }

  private processPendingPlayerTransactions(playerId: string, player: Player): void {
    // Process pending player transactions
  }

  private savePlayerState(playerId: string, player: Player): void {
    // Auto-save player state to storage
  }

  private processDepositTransaction(transaction: Transaction): void {
    // Process deposit automatically
    transaction.status = 'completed';
  }

  private processWithdrawalTransaction(transaction: Transaction): void {
    // Process withdrawal automatically
    transaction.status = 'completed';
  }

  private cleanupOldTransactions(now: number): void {
    // Remove transactions older than 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    this.state.transactions = this.state.transactions
      .filter(tx => now - tx.timestamp < thirtyDays);
  }

  private cleanupInactivePlayers(now: number): void {
    // Mark players inactive if no activity for 1 hour
    const oneHour = 60 * 60 * 1000;
    this.state.players.forEach((player, playerId) => {
      if (player.lastActivity && now - player.lastActivity > oneHour) {
        player.status = 'inactive';
      }
    });
  }

  private optimizeMemory(): void {
    // Garbage collection and memory optimization
    if (global.gc) {
      global.gc();
    }
  }

  private emergencyMatchCleanup(): void {
    console.log('🚨 Emergency match cleanup initiated');
    // Emergency cleanup of excessive matches
  }

  private emergencyTransactionProcessing(): void {
    console.log('🚨 Emergency transaction processing initiated');
    // Emergency processing of pending transactions
  }

  private updateHealthMetrics(health: any): void {
    // Store health metrics for monitoring
  }

  private getMemoryUsage(): number {
    return process.memoryUsage ? process.memoryUsage().heapUsed : 0;
  }

  private isPlayerInMatch(playerId: string): boolean {
    return Array.from(this.state.matches.values())
      .some(match => match.players.some(player => player.id === playerId));
  }

  private handleProcessorError(processor: string, error: any): void {
    console.error(`🚨 Processor ${processor} error:`, error);
    // Implement error recovery logic
  }

  private updateSystemStats(): void {
    // Update system statistics automatically
  }

  // =====================================
  // LIFECYCLE MANAGEMENT
  // =====================================

  public stop(): void {
    this.isRunning = false;
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    console.log('🛑 Automated Game Processor Stopped');
  }

  public restart(): void {
    this.stop();
    setTimeout(() => {
      this.startAutomatedProcessing();
    }, 1000);
  }
}

// Global processor instance
export const gameProcessor = new GameProcessor();