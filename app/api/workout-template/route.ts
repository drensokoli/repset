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

    const db = await getDatabase();
    
    // Get current week to find the appropriate template
    const currentDate = new Date();
    const currentWeekId = getWeekId(currentDate);
    
    console.log(`Fetching workout template for user ${session.user.id} and week ${currentWeekId}`);
    
    // Find the template range that covers the current week
    const templateRanges = await db.collection('template_ranges').find({
      userId: session.user.id,
      startWeekId: { $lte: currentWeekId },
      $or: [
        { endWeekId: { $gte: currentWeekId } },
        { endWeekId: null },
        { endWeekId: { $exists: false } }
      ]
    }).sort({ startWeekId: -1 }).toArray();

    const templateRange = templateRanges[0]; // Most recent start that covers the week
    
    if (!templateRange) {
      console.log('No template range found for current week');
      return NextResponse.json(null);
    }
    
    // Convert TemplateTimeRange to WorkoutTemplate for backward compatibility
    const template = {
      userId: templateRange.userId,
      monday: templateRange.monday,
      tuesday: templateRange.tuesday,
      wednesday: templateRange.wednesday,
      thursday: templateRange.thursday,
      friday: templateRange.friday,
      saturday: templateRange.saturday,
      sunday: templateRange.sunday,
      createdAt: templateRange.createdAt,
      updatedAt: templateRange.updatedAt,
    };

    console.log('Template found:', template ? 'yes' : 'no');
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function for week calculations (duplicate from template-ranges for independence)
function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No user session found for POST');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let templateData;
    try {
      templateData = await request.json();
      console.log('Received template data:', templateData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!templateData) {
      console.error('No template data provided');
      return NextResponse.json({ error: 'No template data provided' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      
      const now = new Date().toISOString();
      const currentWeekId = getWeekId(new Date());
      
      // Initialize any missing day templates
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (!templateData[day]) {
          templateData[day] = {
            exercises: [],
            updatedAt: now
          };
        }
      }

      // Create a new template range starting from current week
      const templateRange = {
        userId: session.user.id,
        templateId: generateTemplateId(),
        name: `Template from ${currentWeekId}`,
        startWeekId: currentWeekId,
        endWeekId: undefined, // Indefinite
        isActive: true,
        monday: templateData.monday,
        tuesday: templateData.tuesday,
        wednesday: templateData.wednesday,
        thursday: templateData.thursday,
        friday: templateData.friday,
        saturday: templateData.saturday,
        sunday: templateData.sunday,
        createdAt: templateData.createdAt || now,
        updatedAt: now,
      };

      // Handle timeline management - cap existing infinite ranges
      const existingRanges = await db.collection('template_ranges').find({
        userId: session.user.id,
        startWeekId: { $lte: currentWeekId },
        $or: [
          { endWeekId: { $gte: currentWeekId } },
          { endWeekId: null },
          { endWeekId: { $exists: false } }
        ]
      }).toArray();

      for (const existingRange of existingRanges) {
        if (!existingRange.endWeekId && existingRange.startWeekId < currentWeekId) {
          const previousWeek = getPreviousWeek(currentWeekId);
          await db.collection('template_ranges').updateOne(
            { _id: existingRange._id },
            { $set: { endWeekId: previousWeek, updatedAt: now } }
          );
          console.log(`Capped existing range ${existingRange.templateId} to end at ${previousWeek}`);
        }
      }

      console.log(`Saving workout template as template range for user ${session.user.id} starting from week ${currentWeekId}`);
      
      const result = await db.collection('template_ranges').insertOne(templateRange);

      console.log('Save result:', result);
      
      // Convert back to WorkoutTemplate format for response
      const savedTemplate = {
        userId: templateRange.userId,
        monday: templateRange.monday,
        tuesday: templateRange.tuesday,
        wednesday: templateRange.wednesday,
        thursday: templateRange.thursday,
        friday: templateRange.friday,
        saturday: templateRange.saturday,
        sunday: templateRange.sunday,
        createdAt: templateRange.createdAt,
        updatedAt: templateRange.updatedAt,
      };
      return NextResponse.json({ success: true, template: savedTemplate });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Failed to save template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getPreviousWeek(weekId: string): string {
  const [year, week] = weekId.split('-W').map(Number);
  const prevWeek = week - 1;
  if (prevWeek < 1) {
    return `${year - 1}-W52`; // Assuming 52 weeks per year
  }
  return `${year}-W${prevWeek.toString().padStart(2, '0')}`;
} 