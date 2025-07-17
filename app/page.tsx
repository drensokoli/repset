import { Suspense } from 'react';
import { HomeClient } from '@/app/home-client';
import { exerciseDB } from '@/lib/exercisedb';
import { Exercise } from '@/lib/exercisedb';

interface Category {
  name: string;
  slug: string;
}

interface PageProps {
  exercises: Exercise[];
  bodyParts: Category[];
  equipment: Category[];
  muscles: Category[];
}

// This function runs at build time and revalidates every hour
async function getExerciseData(): Promise<PageProps> {
  try {
    const [exercises, bodyParts, equipment, muscles] = await Promise.all([
      exerciseDB.getAllExercises(),
      exerciseDB.getBodyPartsList(),
      exerciseDB.getEquipmentList(),
      exerciseDB.getTargetList(),
    ]);

    // Remove MongoDB-specific fields
    const sanitizedExercises = exercises.map(({ _id, ...rest }) => rest);

    return {
      exercises: sanitizedExercises,
      bodyParts,
      equipment,
      muscles,
    };
  } catch (error) {
    console.error('Error fetching exercise data:', error);
    return {
      exercises: [],
      bodyParts: [],
      equipment: [],
      muscles: [],
    };
  }
}

// Force page to be statically generated
export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-static';
export const fetchCache = 'force-cache';

export default async function Home() {
  const data = await getExerciseData();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomeClient initialData={data} />
    </Suspense>
  );
}