import { NextRequest, NextResponse } from 'next/server';
import SimpleAutomation from '@/lib/automation';

export async function GET(request: NextRequest) {
  try {
    const automation = SimpleAutomation.getInstance();
    const status = automation.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get system status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    const automation = SimpleAutomation.getInstance();

    switch (action) {
      case 'create_match':
        const matchId = automation.createMatch(
          params.player1,
          params.player2,
          params.betAmount || 10
        );
        return NextResponse.json({
          success: true,
          data: { matchId },
          message: 'Match created successfully'
        });

      case 'complete_match':
        automation.completeMatch(params.matchId, params.winnerId);
        return NextResponse.json({
          success: true,
          message: 'Match completed and prizes distributed'
        });

      case 'get_balance':
        const balance = automation.getWalletBalance(params.userId);
        return NextResponse.json({
          success: true,
          data: { balance },
          userId: params.userId
        });

      case 'credit_wallet':
        automation.creditToWallet(params.userId, params.amount);
        return NextResponse.json({
          success: true,
          message: `₹${params.amount} credited to wallet`
        });

      case 'get_transactions':
        const transactions = automation.getTransactionHistory(params.userId);
        return NextResponse.json({
          success: true,
          data: { transactions }
        });

      case 'initialize_developer':
        automation.initializeDeveloperWallet();
        return NextResponse.json({
          success: true,
          message: 'Developer wallet initialized with ₹10,000'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}