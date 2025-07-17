import { NextResponse } from 'next/server';
import { exerciseDB } from '@/lib/exercisedb';

export async function GET() {
  try {
    const [exercises, bodyParts, equipment, muscles] = await Promise.all([
      exerciseDB.getAllExercises(),
      exerciseDB.getBodyPartsList(),
      exerciseDB.getEquipmentList(),
      exerciseDB.getTargetList(),
    ]);

    // Remove MongoDB-specific fields
    const sanitizedExercises = exercises.map(({ _id, ...rest }) => rest);

    return NextResponse.json({
      exercises: sanitizedExercises,
      bodyParts,
      equipment,
      muscles,
    });
  } catch (error: any) {
    console.error('Error fetching initial data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch initial data' },
      { status: 500 }
    );
  }
} 