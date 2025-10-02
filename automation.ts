'use client';

interface MatchData {
  id: string;
  player1: string;
  player2: string;
  betAmount: number;
  winner: string | null;
  status: 'pending' | 'active' | 'completed';
  startTime: Date;
  endTime?: Date;
}

interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

class SimpleAutomation {
  private static instance: SimpleAutomation;
  private matches: Map<string, MatchData> = new Map();
  private wallets: Map<string, number> = new Map();
  private transactions: WalletTransaction[] = [];

  public static getInstance(): SimpleAutomation {
    if (!SimpleAutomation.instance) {
      SimpleAutomation.instance = new SimpleAutomation();
    }
    return SimpleAutomation.instance;
  }

  // Match Management
  createMatch(player1: string, player2: string, betAmount: number = 10): string {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const match: MatchData = {
      id: matchId,
      player1,
      player2,
      betAmount,
      winner: null,
      status: 'pending',
      startTime: new Date()
    };
    
    this.matches.set(matchId, match);
    
    // Auto-deduct bet amounts
    this.deductFromWallet(player1, betAmount);
    this.deductFromWallet(player2, betAmount);
    
    return matchId;
  }

  completeMatch(matchId: string, winnerId: string): void {
    const match = this.matches.get(matchId);
    if (!match) return;

    match.winner = winnerId;
    match.status = 'completed';
    match.endTime = new Date();
    
    // Calculate payouts: ₹10 bet -> ₹16 winner, ₹4 server fee
    const winnerPayout = 16;
    const serverFee = 4;
    
    // Credit winner
    this.creditToWallet(winnerId, winnerPayout);
    
    // Credit server fee to developer wallet
    this.creditToWallet('developer', serverFee);
    
    // Log transactions
    this.logTransaction({
      id: `win_${matchId}`,
      userId: winnerId,
      type: 'win',
      amount: winnerPayout,
      status: 'completed',
      timestamp: new Date()
    });
    
    this.logTransaction({
      id: `fee_${matchId}`,
      userId: 'developer',
      type: 'fee',
      amount: serverFee,
      status: 'completed',
      timestamp: new Date()
    });
  }

  // Wallet Management
  getWalletBalance(userId: string): number {
    return this.wallets.get(userId) || 0;
  }

  creditToWallet(userId: string, amount: number): void {
    const currentBalance = this.getWalletBalance(userId);
    this.wallets.set(userId, currentBalance + amount);
  }

  deductFromWallet(userId: string, amount: number): boolean {
    const currentBalance = this.getWalletBalance(userId);
    if (currentBalance >= amount) {
      this.wallets.set(userId, currentBalance - amount);
      return true;
    }
    return false;
  }

  // Transaction Management
  private logTransaction(transaction: WalletTransaction): void {
    this.transactions.push(transaction);
  }

  getTransactionHistory(userId: string): WalletTransaction[] {
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // System Status
  getSystemStatus() {
    return {
      totalMatches: this.matches.size,
      activeMatches: Array.from(this.matches.values()).filter(m => m.status === 'active').length,
      totalUsers: this.wallets.size,
      totalTransactions: this.transactions.length,
      systemHealth: 'operational',
      uptime: Date.now(),
      version: '1.0.0'
    };
  }

  // Auto-initialize developer wallet
  initializeDeveloperWallet(): void {
    this.wallets.set('developer', 10000); // ₹10,000 initial balance
  }
}

export default SimpleAutomation;