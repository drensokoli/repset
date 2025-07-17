import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');

    if (!weekStart) {
      console.log('No weekStart parameter provided');
      return NextResponse.json({ error: 'weekStart parameter is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    console.log(`Fetching workout for user ${session.user.id} and week ${weekStart}`);
    
    const workout = await db.collection('workouts').findOne({
      userId: session.user.id,
      weekStartDate: weekStart,
    });

    console.log('Workout found:', workout ? 'yes' : 'no');
    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
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

    const workoutData = await request.json();
    
    if (!workoutData.weekStartDate) {
      console.log('No weekStartDate in workout data');
      return NextResponse.json({ error: 'weekStartDate is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const workout = {
      ...workoutData,
      userId: session.user.id,
      updatedAt: new Date(),
    };

    console.log(`Saving workout for user ${session.user.id} and week ${workout.weekStartDate}`);
    
    const result = await db.collection('workouts').updateOne(
      { userId: session.user.id, weekStartDate: workoutData.weekStartDate },
      { $set: workout },
      { upsert: true }
    );

    console.log('Save result:', result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error saving workout:', error);
    return NextResponse.json(
      { error: 'Failed to save workout', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}