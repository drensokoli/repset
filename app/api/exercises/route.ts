import { NextRequest, NextResponse } from 'next/server';
import { exerciseDB } from '@/lib/exercisedb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const muscles = searchParams.get('muscles');
    const bodyParts = searchParams.get('bodyParts');
    const equipments = searchParams.get('equipments');
    const search = searchParams.get('search');

    console.log('Fetching exercises with params:', { muscles, bodyParts, equipments, search });

    // Get all exercises first
    let exercises = await exerciseDB.getAllExercises();
    console.log(`Starting with ${exercises.length} total exercises`);

    // Apply filters one by one
    if (search) {
      exercises = exercises.filter(ex => 
        ex.name.toLowerCase().includes(search.toLowerCase())
      );
      console.log(`After search filter: ${exercises.length} exercises`);
    }

    if (muscles && muscles !== 'all') {
      console.log('Filtering by muscle. Looking for:', muscles);
      const uniqueTargets = Array.from(new Set(exercises.map(ex => ex.target)));
      const uniqueSecondaryMuscles = Array.from(new Set(exercises.flatMap(ex => ex.secondaryMuscles || [])));
      console.log('Available targets in current set:', uniqueTargets);
      console.log('Available secondary muscles in current set:', uniqueSecondaryMuscles);
      
      exercises = exercises.filter(ex => {
        const matchPrimary = ex.target.toLowerCase() === muscles.toLowerCase();
        const matchSecondary = ex.secondaryMuscles?.some(
          muscle => muscle.toLowerCase() === muscles.toLowerCase()
        );
        
        if (!matchPrimary && !matchSecondary) {
          console.log(`No match for exercise: ${ex.name}, target: ${ex.target}, secondary: ${ex.secondaryMuscles?.join(', ')}`);
        }
        
        return matchPrimary || matchSecondary;
      });
      console.log(`After muscle filter: ${exercises.length} exercises`);
    }

    if (bodyParts && bodyParts !== 'all') {
      console.log('Filtering by body part. Looking for:', bodyParts);
      const uniqueBodyParts = Array.from(new Set(exercises.map(ex => ex.bodyPart)));
      console.log('Available body parts in current set:', uniqueBodyParts);
      exercises = exercises.filter(ex => {
        const match = ex.bodyPart.toLowerCase() === bodyParts.toLowerCase();
        if (!match) {
          console.log(`No match for exercise: ${ex.name}, bodyPart: ${ex.bodyPart} vs filter: ${bodyParts}`);
        }
        return match;
      });
      console.log(`After body part filter: ${exercises.length} exercises`);
    }

    if (equipments && equipments !== 'all') {
      console.log('Filtering by equipment. Looking for:', equipments);
      const uniqueEquipment = Array.from(new Set(exercises.map(ex => ex.equipment)));
      console.log('Available equipment in current set:', uniqueEquipment);
      exercises = exercises.filter(ex => {
        const match = ex.equipment.toLowerCase() === equipments.toLowerCase();
        if (!match) {
          console.log(`No match for exercise: ${ex.name}, equipment: ${ex.equipment} vs filter: ${equipments}`);
        }
        return match;
      });
      console.log(`After equipment filter: ${exercises.length} exercises`);
    }

    if (!Array.isArray(exercises)) {
      console.error('Invalid response format:', exercises);
      throw new Error('Invalid response format from database');
    }

    // Log a sample exercise to check the data structure
    if (exercises.length > 0) {
      console.log('Sample exercise:', JSON.stringify(exercises[0], null, 2));
    } else {
      console.log('No exercises found with the current filters');
    }

    // Remove MongoDB-specific fields from the response
    const sanitizedExercises = exercises.map(({ _id, ...exercise }) => exercise);

    return NextResponse.json(sanitizedExercises);
  } catch (error: any) {
    console.error('Error in exercises API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}