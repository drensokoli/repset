import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');

    if (!weekId) {
      console.log('No weekId parameter provided');
      return NextResponse.json({ error: 'weekId parameter is required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    console.log(`Fetching weekly workout log for user ${session.user.id} and week ${weekId}`);
    
    const weeklyLog = await db.collection('weekly_workout_logs').findOne({
      userId: session.user.id,
      weekId: weekId,
    });

    console.log('Weekly log found:', weeklyLog ? 'yes' : 'no');
    return NextResponse.json(weeklyLog);
  } catch (error) {
    console.error('Error fetching weekly log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly log' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No user session found for POST');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let weeklyLogData;
    try {
      weeklyLogData = await request.json();
      console.log('Received weekly log data:', weeklyLogData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!weeklyLogData.weekId) {
      console.log('No weekId in weekly log data');
      return NextResponse.json({ error: 'weekId is required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      
      const now = new Date().toISOString();
      
      const weeklyLog = {
        ...weeklyLogData,
        userId: session.user.id,
        updatedAt: now,
      };

      // If this is a new log, set createdAt
      if (!weeklyLogData.createdAt) {
        weeklyLog.createdAt = now;
      }

      // Remove _id if it exists
      const { _id, ...logWithoutId } = weeklyLog;

      console.log(`Saving weekly workout log for user ${session.user.id} and week ${weeklyLog.weekId}`);
      
      const result = await db.collection('weekly_workout_logs').updateOne(
        { userId: session.user.id, weekId: weeklyLogData.weekId },
        { $set: logWithoutId },
        { upsert: true }
      );

      // Fetch and return the saved log
      const savedWeeklyLog = await db.collection('weekly_workout_logs').findOne({
        userId: session.user.id,
        weekId: weeklyLogData.weekId
      });

      console.log('Save result:', result);
      return NextResponse.json({ success: true, weeklyLog: savedWeeklyLog });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving weekly log:', error);
    return NextResponse.json(
      { error: 'Failed to save weekly log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 