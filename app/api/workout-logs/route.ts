import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

// LEGACY ENDPOINT - Use /api/weekly-workout-logs for new features

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      console.log('No date parameter provided');
      return NextResponse.json({ error: 'date parameter is required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    console.log(`Fetching workout log for user ${session.user.id} and date ${date}`);
    
    const log = await db.collection('workout_logs').findOne({
      userId: session.user.id,
      date: date,
    });

    console.log('Log found:', log ? 'yes' : 'no');
    return NextResponse.json(log);
  } catch (error) {
    console.error('Error fetching log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log' },
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

    let logData;
    try {
      logData = await request.json();
      console.log('Received log data:', logData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!logData.date) {
      console.log('No date in log data');
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      
      const now = new Date().toISOString();
      
      const log = {
        ...logData,
        userId: session.user.id,
        updatedAt: now,
      };

      // If this is a new log, set createdAt
      if (!logData.createdAt) {
        log.createdAt = now;
      }

      // Remove _id if it exists
      const { _id, ...logWithoutId } = log;

      console.log(`Saving workout log for user ${session.user.id} and date ${log.date}`);
      
      const result = await db.collection('workout_logs').updateOne(
        { userId: session.user.id, date: logData.date },
        { $set: logWithoutId },
        { upsert: true }
      );

      // Fetch and return the saved log
      const savedLog = await db.collection('workout_logs').findOne({
        userId: session.user.id,
        date: logData.date
      });

      console.log('Save result:', result);
      return NextResponse.json({ success: true, log: savedLog });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { error: 'Failed to save log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 