import { NextResponse } from 'next/server';
import { exerciseDB } from '@/lib/exercisedb';

export async function GET() {
  try {
    console.log('Fetching exercise filters...');

    const [bodyParts, equipment, targets] = await Promise.all([
      exerciseDB.getBodyPartsList(),
      exerciseDB.getEquipmentList(),
      exerciseDB.getTargetList(),
    ]);

    console.log('Raw filter data:', {
      bodyParts: bodyParts.length,
      equipment: equipment.length,
      targets: targets.length
    });

    // Log sample data from each category
    if (bodyParts.length > 0) console.log('Sample body part:', bodyParts[0]);
    if (equipment.length > 0) console.log('Sample equipment:', equipment[0]);
    if (targets.length > 0) console.log('Sample target:', targets[0]);

    // Sort the arrays alphabetically by name
    const response = {
      bodyParts: bodyParts.sort((a, b) => a.name.localeCompare(b.name)),
      equipment: equipment.sort((a, b) => a.name.localeCompare(b.name)),
      targets: targets.sort((a, b) => a.name.localeCompare(b.name)),
    };

    console.log('Successfully fetched filters:', {
      bodyPartsCount: response.bodyParts.length,
      equipmentCount: response.equipment.length,
      targetsCount: response.targets.length
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in filters API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}