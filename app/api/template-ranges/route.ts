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

    const db = await getDatabase();

    if (weekId) {
      // Find the template range that covers this specific week
      console.log(`Finding template range for user ${session.user.id} and week ${weekId}`);
      
      const templateRanges = await db.collection('template_ranges').find({
        userId: session.user.id,
        startWeekId: { $lte: weekId },
        $or: [
          { endWeekId: { $gte: weekId } },
          { endWeekId: null },
          { endWeekId: { $exists: false } }
        ]
      }).sort({ startWeekId: -1 }).toArray();

      const templateRange = templateRanges[0]; // Most recent start that covers the week
      
      console.log('Template range found:', templateRange ? 'yes' : 'no');
      return NextResponse.json(templateRange);
    } else {
      // Return all template ranges for the user (for timeline view)
      console.log(`Fetching all template ranges for user ${session.user.id}`);
      
      const templateRanges = await db.collection('template_ranges').find({
        userId: session.user.id,
      }).sort({ startWeekId: 1 }).toArray();

      console.log(`Found ${templateRanges.length} template ranges`);
      return NextResponse.json(templateRanges);
    }
  } catch (error) {
    console.error('Error fetching template ranges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template ranges' },
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

    let templateRangeData;
    try {
      templateRangeData = await request.json();
      console.log('Received template range data:', templateRangeData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!templateRangeData.startWeekId || !templateRangeData.templateId) {
      console.log('Missing required fields in template range data');
      return NextResponse.json({ error: 'startWeekId and templateId are required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      
      const now = new Date().toISOString();
      
      // Handle timeline management
      if (templateRangeData.startWeekId) {
        // Find existing template ranges that need to be adjusted
        const existingRanges = await db.collection('template_ranges').find({
          userId: session.user.id,
          startWeekId: { $lte: templateRangeData.startWeekId },
          $or: [
            { endWeekId: { $gte: templateRangeData.startWeekId } },
            { endWeekId: null },
            { endWeekId: { $exists: false } }
          ]
        }).toArray();

        // Cap existing infinite ranges that overlap with the new range
        for (const existingRange of existingRanges) {
          if (!existingRange.endWeekId && existingRange.startWeekId < templateRangeData.startWeekId) {
            // Cap the existing infinite range at the week before the new range starts
            const previousWeek = getPreviousWeek(templateRangeData.startWeekId);
            await db.collection('template_ranges').updateOne(
              { _id: existingRange._id },
              { $set: { endWeekId: previousWeek, updatedAt: now } }
            );
            console.log(`Capped existing range ${existingRange.templateId} to end at ${previousWeek}`);
          }
        }
      }
      
      const templateRange = {
        ...templateRangeData,
        userId: session.user.id,
        updatedAt: now,
      };

      // If this is a new template range, set createdAt
      if (!templateRangeData.createdAt) {
        templateRange.createdAt = now;
      }

      // Remove _id if it exists
      const { _id, ...rangeWithoutId } = templateRange;

      console.log(`Saving template range for user ${session.user.id}, template ${templateRange.templateId}, weeks ${templateRange.startWeekId} - ${templateRange.endWeekId || 'indefinite'}`);
      
      const result = await db.collection('template_ranges').updateOne(
        { userId: session.user.id, templateId: templateRangeData.templateId },
        { $set: rangeWithoutId },
        { upsert: true }
      );

      // Fetch and return the saved template range
      const savedTemplateRange = await db.collection('template_ranges').findOne({
        userId: session.user.id,
        templateId: templateRangeData.templateId
      });

      console.log('Save result:', result);
      return NextResponse.json({ success: true, templateRange: savedTemplateRange });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving template range:', error);
    return NextResponse.json(
      { error: 'Failed to save template range', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function for week calculations
function getPreviousWeek(weekId: string): string {
  const [year, week] = weekId.split('-W').map(Number);
  const prevWeek = week - 1;
  if (prevWeek < 1) {
    return `${year - 1}-W52`; // Assuming 52 weeks per year
  }
  return `${year}-W${prevWeek.toString().padStart(2, '0')}`;
} 