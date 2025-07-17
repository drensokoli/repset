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
    const date = searchParams.get('date'); // For individual day queries

    if (!weekId && !date) {
      console.log('No weekId or date parameter provided');
      return NextResponse.json({ error: 'weekId or date parameter is required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    if (weekId) {
      // Fetch all days for the week
      console.log(`Fetching day workout logs for user ${session.user.id} and week ${weekId}`);
      
      const dayLogs = await db.collection('day_workout_logs').find({
        userId: session.user.id,
        weekId: weekId,
      }).toArray();

      console.log(`Found ${dayLogs.length} day logs for week ${weekId}`);
      return NextResponse.json(dayLogs);
    } else {
      // Fetch single day
      console.log(`Fetching day workout log for user ${session.user.id} and date ${date}`);
      
      const dayLog = await db.collection('day_workout_logs').findOne({
        userId: session.user.id,
        date: date,
      });

      console.log('Day log found:', dayLog ? 'yes' : 'no');
      return NextResponse.json(dayLog);
    }
  } catch (error) {
    console.error('Error fetching day workout logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day workout logs' },
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

    let dayLogData;
    try {
      dayLogData = await request.json();
      console.log('Received day log data:', dayLogData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!dayLogData.date || !dayLogData.weekId) {
      console.log('Missing required fields in day log data');
      return NextResponse.json({ error: 'date and weekId are required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      
      const now = new Date().toISOString();
      
      const dayLog = {
        ...dayLogData,
        userId: session.user.id,
        updatedAt: now,
      };

      // If this is a new log, set createdAt
      if (!dayLogData.createdAt) {
        dayLog.createdAt = now;
      }

      // Remove _id if it exists
      const { _id, ...logWithoutId } = dayLog;

      console.log(`Saving day workout log for user ${session.user.id}, date ${dayLog.date}, week ${dayLog.weekId}`);
      
      const result = await db.collection('day_workout_logs').updateOne(
        { userId: session.user.id, date: dayLogData.date },
        { $set: logWithoutId },
        { upsert: true }
      );

      // Fetch and return the saved log
      const savedDayLog = await db.collection('day_workout_logs').findOne({
        userId: session.user.id,
        date: dayLogData.date
      });

      console.log('Save result:', result);
      return NextResponse.json({ success: true, dayLog: savedDayLog });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving day workout log:', error);
    return NextResponse.json(
      { error: 'Failed to save day workout log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 