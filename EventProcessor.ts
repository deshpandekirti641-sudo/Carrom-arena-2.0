'use client';

interface GameEvent {
  id: string;
  type: 'strike' | 'score' | 'foul' | 'turn_change' | 'match_start' | 'match_end' | 'timeout';
  playerId: string;
  matchId: string;
  timestamp: number;
  data: any;
  processed: boolean;
}

interface EventRule {
  eventType: string;
  condition: (event: GameEvent) => boolean;
  action: (event: GameEvent) => void;
  priority: number;
}

interface EventStats {
  totalEvents: number;
  processedEvents: number;
  errorEvents: number;
  averageProcessingTime: number;
  eventsByType: { [key: string]: number };
}

class EventProcessor {
  private events: Map<string, GameEvent>;
  private eventQueue: GameEvent[];
  private rules: EventRule[];
  private stats: EventStats;
  private isProcessing: boolean;
  private processingInterval: NodeJS.Timeout | null;

  constructor() {
    this.events = new Map();
    this.eventQueue = [];
    this.rules = [];
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      errorEvents: 0,
      averageProcessingTime: 0,
      eventsByType: {}
    };
    
    this.isProcessing = false;
    this.processingInterval = null;

    // Initialize default event rules
    this.initializeEventRules();

    // Start automated event processing
    this.startEventProcessing();
  }

  // =====================================
  // EVENT PROCESSING AUTOMATION
  // =====================================

  private startEventProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Process events every 100ms for real-time response
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, 100);

    console.log('⚡ Event Processor Started - Real-time Event Processing Active');
  }

  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    const startTime = Date.now();
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    eventsToProcess.forEach(event => {
      this.processEvent(event);
    });

    // Update processing time statistics
    const processingTime = Date.now() - startTime;
    this.updateProcessingStats(processingTime, eventsToProcess.length);
  }

  private processEvent(event: GameEvent): void {
    try {
      // Mark event as being processed
      event.processed = false;

      // Find and execute matching rules
      const matchingRules = this.rules
        .filter(rule => rule.eventType === event.type || rule.eventType === '*')
        .filter(rule => rule.condition(event))
        .sort((a, b) => b.priority - a.priority); // High priority first

      // Execute rules
      matchingRules.forEach(rule => {
        try {
          rule.action(event);
        } catch (error) {
          console.error(`❌ Rule execution error for event ${event.id}:`, error);
          this.stats.errorEvents++;
        }
      });

      // Mark event as processed
      event.processed = true;
      this.events.set(event.id, event);
      this.stats.processedEvents++;

      // Update event type statistics
      this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;

      console.log(`✅ Processed event: ${event.type} for match ${event.matchId}`);

    } catch (error) {
      console.error(`❌ Event processing error for ${event.id}:`, error);
      this.stats.errorEvents++;
    }
  }

  // =====================================
  // DEFAULT EVENT RULES
  // =====================================

  private initializeEventRules(): void {
    // Rule: Handle match start events
    this.addRule({
      eventType: 'match_start',
      condition: () => true,
      action: (event) => this.handleMatchStart(event),
      priority: 100
    });

    // Rule: Handle player strikes
    this.addRule({
      eventType: 'strike',
      condition: () => true,
      action: (event) => this.handlePlayerStrike(event),
      priority: 80
    });

    // Rule: Handle scoring events
    this.addRule({
      eventType: 'score',
      condition: () => true,
      action: (event) => this.handleScoring(event),
      priority: 90
    });

    // Rule: Handle fouls
    this.addRule({
      eventType: 'foul',
      condition: () => true,
      action: (event) => this.handleFoul(event),
      priority: 85
    });

    // Rule: Handle turn changes
    this.addRule({
      eventType: 'turn_change',
      condition: () => true,
      action: (event) => this.handleTurnChange(event),
      priority: 75
    });

    // Rule: Handle match end
    this.addRule({
      eventType: 'match_end',
      condition: () => true,
      action: (event) => this.handleMatchEnd(event),
      priority: 95
    });

    // Rule: Handle timeouts
    this.addRule({
      eventType: 'timeout',
      condition: () => true,
      action: (event) => this.handleTimeout(event),
      priority: 70
    });

    // Rule: Auto-detect winning conditions
    this.addRule({
      eventType: 'score',
      condition: (event) => this.checkWinningCondition(event),
      action: (event) => this.triggerMatchEnd(event),
      priority: 100
    });

    console.log(`📋 Initialized ${this.rules.length} event processing rules`);
  }

  // =====================================
  // EVENT HANDLERS
  // =====================================

  private handleMatchStart(event: GameEvent): void {
    console.log(`🎯 Match started: ${event.matchId}`);
    
    // Initialize match state
    this.initializeMatchState(event.matchId);
    
    // Set first player's turn
    this.setFirstPlayerTurn(event.matchId, event.data.players);
    
    // Start match timer
    this.startMatchTimer(event.matchId);
    
    // Notify players
    this.notifyPlayers(event.matchId, 'match_started');
  }

  private handlePlayerStrike(event: GameEvent): void {
    console.log(`🎱 Player strike: ${event.playerId} in match ${event.matchId}`);
    
    // Update game physics
    this.updateGamePhysics(event.matchId, event.data);
    
    // Check for valid strike
    if (this.isValidStrike(event)) {
      this.processValidStrike(event);
    } else {
      this.processFoul(event);
    }
    
    // Update game state
    this.updateGameState(event.matchId, event);
  }

  private handleScoring(event: GameEvent): void {
    console.log(`🏆 Score event: ${event.playerId} scored in match ${event.matchId}`);
    
    // Update player score
    this.updatePlayerScore(event.matchId, event.playerId, event.data.points);
    
    // Check for winning condition
    if (this.checkWinningCondition(event)) {
      this.triggerMatchEnd(event);
      return;
    }
    
    // Continue turn or switch
    this.evaluateTurnContinuation(event);
    
    // Broadcast score update
    this.broadcastScoreUpdate(event.matchId);
  }

  private handleFoul(event: GameEvent): void {
    console.log(`⚠️ Foul committed: ${event.playerId} in match ${event.matchId}`);
    
    // Apply foul penalty
    this.applyFoulPenalty(event.matchId, event.playerId, event.data.foulType);
    
    // Switch turn to opponent
    this.switchTurnToOpponent(event.matchId, event.playerId);
    
    // Notify players of foul
    this.notifyFoul(event.matchId, event.playerId, event.data.foulType);
  }

  private handleTurnChange(event: GameEvent): void {
    console.log(`🔄 Turn change: ${event.matchId} to player ${event.data.nextPlayerId}`);
    
    // Update current player
    this.setCurrentPlayer(event.matchId, event.data.nextPlayerId);
    
    // Reset turn timer
    this.resetTurnTimer(event.matchId);
    
    // Notify players
    this.notifyTurnChange(event.matchId, event.data.nextPlayerId);
    
    // Update UI
    this.updateGameUI(event.matchId);
  }

  private handleMatchEnd(event: GameEvent): void {
    console.log(`🏁 Match ended: ${event.matchId}`);
    
    // Stop match timer
    this.stopMatchTimer(event.matchId);
    
    // Calculate final scores
    const result = this.calculateMatchResult(event.matchId);
    
    // Process payouts
    this.processPayout(event.matchId, result);
    
    // Update player statistics
    this.updatePlayerStats(event.matchId, result);
    
    // Clean up match state
    this.cleanupMatchState(event.matchId);
    
    // Notify match completion
    this.notifyMatchCompletion(event.matchId, result);
  }

  private handleTimeout(event: GameEvent): void {
    console.log(`⏰ Timeout in match: ${event.matchId}`);
    
    // End match due to timeout
    this.endMatchByTimeout(event.matchId);
    
    // Determine winner by current score
    const winner = this.determineWinnerByScore(event.matchId);
    
    // Create match end event
    this.createEvent({
      type: 'match_end',
      matchId: event.matchId,
      playerId: winner || '',
      data: { reason: 'timeout', winner }
    });
  }

  // =====================================
  // GAME STATE MANAGEMENT
  // =====================================

  private initializeMatchState(matchId: string): void {
    // Initialize match data structure
    const matchState = {
      matchId,
      players: {},
      currentPlayer: null,
      scores: {},
      gameState: 'active',
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    
    // Store match state (in real implementation, use proper state management)
    console.log(`📊 Initialized match state for ${matchId}`);
  }

  private updateGameState(matchId: string, event: GameEvent): void {
    // Update match last activity
    this.updateLastActivity(matchId);
    
    // Save event to match history
    this.addToMatchHistory(matchId, event);
    
    // Broadcast state update
    this.broadcastGameState(matchId);
  }

  private updateGamePhysics(matchId: string, physicsData: any): void {
    // Update physics simulation based on strike
    console.log(`⚙️ Updating physics for match ${matchId}`);
    
    // This would integrate with the actual game physics engine
    // For now, we'll simulate physics updates
    this.simulatePhysicsUpdate(matchId, physicsData);
  }

  // =====================================
  // WINNING CONDITIONS & SCORING
  // =====================================

  private checkWinningCondition(event: GameEvent): boolean {
    // Get current match scores
    const scores = this.getMatchScores(event.matchId);
    
    // Check if any player has won (simplified logic)
    for (const playerId in scores) {
      if (scores[playerId] >= 25) { // Assuming 25 points to win
        return true;
      }
    }
    
    return false;
  }

  private triggerMatchEnd(event: GameEvent): void {
    const winner = this.determineWinner(event.matchId);
    
    this.createEvent({
      type: 'match_end',
      matchId: event.matchId,
      playerId: winner || '',
      data: { winner, reason: 'game_completed' }
    });
  }

  private updatePlayerScore(matchId: string, playerId: string, points: number): void {
    console.log(`📈 Updated score: Player ${playerId} +${points} points in match ${matchId}`);
    
    // This would update the actual game state
    // For now, we'll simulate score updates
  }

  // =====================================
  // TURN MANAGEMENT
  // =====================================

  private setFirstPlayerTurn(matchId: string, players: any[]): void {
    if (players && players.length > 0) {
      const firstPlayer = players[0];
      this.setCurrentPlayer(matchId, firstPlayer.id);
      console.log(`👤 Set first player: ${firstPlayer.id} for match ${matchId}`);
    }
  }

  private setCurrentPlayer(matchId: string, playerId: string): void {
    // Update current player in match state
    console.log(`🎯 Current player set: ${playerId} for match ${matchId}`);
  }

  private switchTurnToOpponent(matchId: string, currentPlayerId: string): void {
    const opponentId = this.getOpponentId(matchId, currentPlayerId);
    if (opponentId) {
      this.createEvent({
        type: 'turn_change',
        matchId,
        playerId: currentPlayerId,
        data: { nextPlayerId: opponentId }
      });
    }
  }

  private evaluateTurnContinuation(event: GameEvent): void {
    // Determine if player continues or turn switches
    const shouldContinue = this.shouldContinueTurn(event);
    
    if (!shouldContinue) {
      this.switchTurnToOpponent(event.matchId, event.playerId);
    }
  }

  // =====================================
  // NOTIFICATION SYSTEM
  // =====================================

  private notifyPlayers(matchId: string, eventType: string, data?: any): void {
    console.log(`📢 Notifying players in match ${matchId}: ${eventType}`);
    
    // This would integrate with real-time notification system
    this.broadcastToMatch(matchId, { type: eventType, data });
  }

  private notifyTurnChange(matchId: string, nextPlayerId: string): void {
    this.notifyPlayers(matchId, 'turn_changed', { nextPlayerId });
  }

  private notifyFoul(matchId: string, playerId: string, foulType: string): void {
    this.notifyPlayers(matchId, 'foul_committed', { playerId, foulType });
  }

  private notifyMatchCompletion(matchId: string, result: any): void {
    this.notifyPlayers(matchId, 'match_completed', result);
  }

  // =====================================
  // PUBLIC API METHODS
  // =====================================

  public createEvent(eventData: Omit<GameEvent, 'id' | 'timestamp' | 'processed'>): GameEvent {
    const event: GameEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      processed: false,
      ...eventData
    };

    // Add to processing queue
    this.eventQueue.push(event);
    this.stats.totalEvents++;

    console.log(`📝 Created event: ${event.type} for match ${event.matchId}`);
    
    return event;
  }

  public addRule(rule: EventRule): void {
    this.rules.push(rule);
    console.log(`📋 Added event rule for: ${rule.eventType}`);
  }

  public removeRule(eventType: string): void {
    this.rules = this.rules.filter(rule => rule.eventType !== eventType);
    console.log(`🗑️ Removed rules for event type: ${eventType}`);
  }

  public getEventStats(): EventStats {
    return { ...this.stats };
  }

  public getMatchEvents(matchId: string): GameEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.matchId === matchId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // =====================================
  // HELPER METHODS
  // =====================================

  private updateProcessingStats(processingTime: number, eventCount: number): void {
    // Update average processing time
    const currentAvg = this.stats.averageProcessingTime;
    const processed = this.stats.processedEvents;
    
    this.stats.averageProcessingTime = ((currentAvg * processed) + processingTime) / (processed + eventCount);
  }

  private isValidStrike(event: GameEvent): boolean {
    // Validate strike based on game rules
    // This would integrate with actual game rule validation
    return Math.random() > 0.1; // 90% of strikes are valid (demo)
  }

  private processValidStrike(event: GameEvent): void {
    console.log(`✅ Valid strike processed: ${event.id}`);
  }

  private processFoul(event: GameEvent): void {
    this.createEvent({
      type: 'foul',
      matchId: event.matchId,
      playerId: event.playerId,
      data: { foulType: 'invalid_strike', originalEvent: event.id }
    });
  }

  private applyFoulPenalty(matchId: string, playerId: string, foulType: string): void {
    console.log(`⚠️ Applied foul penalty: ${foulType} to player ${playerId}`);
  }

  private startMatchTimer(matchId: string): void {
    console.log(`⏰ Started match timer for ${matchId}`);
    
    // Set match timeout (60 seconds)
    setTimeout(() => {
      this.createEvent({
        type: 'timeout',
        matchId,
        playerId: '',
        data: { reason: 'match_timeout' }
      });
    }, 60000);
  }

  private stopMatchTimer(matchId: string): void {
    console.log(`⏰ Stopped match timer for ${matchId}`);
  }

  private resetTurnTimer(matchId: string): void {
    console.log(`🔄 Reset turn timer for ${matchId}`);
  }

  private calculateMatchResult(matchId: string): any {
    return {
      matchId,
      winner: this.determineWinner(matchId),
      scores: this.getMatchScores(matchId),
      duration: this.getMatchDuration(matchId)
    };
  }

  private processPayout(matchId: string, result: any): void {
    console.log(`💰 Processing payout for match ${matchId}`);
    // This would integrate with the wallet processor
  }

  private updatePlayerStats(matchId: string, result: any): void {
    console.log(`📊 Updating player stats for match ${matchId}`);
  }

  private cleanupMatchState(matchId: string): void {
    // Clean up match-specific data
    console.log(`🧹 Cleaning up match state for ${matchId}`);
  }

  private endMatchByTimeout(matchId: string): void {
    console.log(`⏰ Ending match by timeout: ${matchId}`);
  }

  private determineWinner(matchId: string): string | null {
    // Determine winner based on current game state
    const scores = this.getMatchScores(matchId);
    let winner = null;
    let maxScore = -1;
    
    for (const playerId in scores) {
      if (scores[playerId] > maxScore) {
        maxScore = scores[playerId];
        winner = playerId;
      }
    }
    
    return winner;
  }

  private determineWinnerByScore(matchId: string): string | null {
    return this.determineWinner(matchId);
  }

  private getMatchScores(matchId: string): { [playerId: string]: number } {
    // Get current match scores
    // This would integrate with actual game state
    return {}; // Mock implementation
  }

  private getMatchDuration(matchId: string): number {
    // Calculate match duration
    return Date.now(); // Mock implementation
  }

  private getOpponentId(matchId: string, currentPlayerId: string): string | null {
    // Get opponent player ID
    // This would integrate with actual match data
    return null; // Mock implementation
  }

  private shouldContinueTurn(event: GameEvent): boolean {
    // Game rule: continue turn if player scored
    return event.type === 'score';
  }

  private updateLastActivity(matchId: string): void {
    // Update match last activity timestamp
  }

  private addToMatchHistory(matchId: string, event: GameEvent): void {
    // Add event to match history
  }

  private simulatePhysicsUpdate(matchId: string, physicsData: any): void {
    // Simulate physics update
  }

  private broadcastGameState(matchId: string): void {
    // Broadcast current game state to players
    console.log(`📡 Broadcasting game state for match ${matchId}`);
  }

  private broadcastScoreUpdate(matchId: string): void {
    // Broadcast score update to players
    console.log(`📊 Broadcasting score update for match ${matchId}`);
  }

  private updateGameUI(matchId: string): void {
    // Update game UI elements
    console.log(`🖥️ Updating UI for match ${matchId}`);
  }

  private broadcastToMatch(matchId: string, message: any): void {
    // Broadcast message to all players in match
    console.log(`📡 Broadcasting to match ${matchId}:`, message);
  }

  // =====================================
  // LIFECYCLE MANAGEMENT
  // =====================================

  public stop(): void {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    console.log('🛑 Event Processor Stopped');
  }

  public restart(): void {
    this.stop();
    setTimeout(() => {
      this.startEventProcessing();
    }, 1000);
  }
}

// Global event processor instance
export const eventProcessor = new EventProcessor();