import clientPromise from './mongodb';
import { Collection, Db, MongoClient, Document } from 'mongodb';

export interface Exercise extends Document {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  imageUrl?: string;
  target: string;
  instructions: string[];
  secondaryMuscles: string[];
  last_updated?: Date;
}

interface Category extends Document {
  name: string;
  slug: string;
  last_updated: Date;
}

// Helper function to create consistent slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

class ExerciseService {
  private client: Promise<MongoClient>;
  private dbName = 'exercises';
  private isConnected = false;

  constructor() {
    this.client = clientPromise;
  }

  private async ensureConnection() {
    if (this.isConnected) return;

    try {
      const client = await this.client;
      const db = client.db(this.dbName);
      const collections = await db.listCollections().toArray();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Connected to database "${this.dbName}". Collections:`, 
          collections.map(c => c.name)
        );
      }
      
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private async getCollection<T extends Document>(name: string): Promise<Collection<T>> {
    await this.ensureConnection();
    
    try {
      const client = await this.client;
      const db: Db = client.db(this.dbName);
      const collection = db.collection<T>(name);
      
      if (process.env.NODE_ENV === 'development') {
        const count = await collection.countDocuments();
        console.log(`Collection "${name}" has ${count} documents`);
      }
      
      return collection;
    } catch (error) {
      console.error(`Error accessing collection "${name}":`, error);
      throw error;
    }
  }

  async getAllExercises(): Promise<Exercise[]> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      return await collection.find({}).toArray();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw new Error('Failed to fetch exercises');
    }
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      return await collection.findOne({ id });
    } catch (error) {
      console.error('Error fetching exercise:', error);
      throw new Error('Failed to fetch exercise');
    }
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      return await collection.find({
        name: { $regex: query, $options: 'i' }
      }).toArray();
    } catch (error) {
      console.error('Search request failed:', error);
      throw new Error('Failed to search exercises');
    }
  }

  async getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      const slug = createSlug(bodyPart);
      return await collection.find({ 
        bodyPart: { 
          $regex: `^${bodyPart.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 
          $options: 'i' 
        }
      }).toArray();
    } catch (error) {
      console.error('Error fetching exercises by body part:', error);
      throw new Error('Failed to fetch exercises by body part');
    }
  }

  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      const slug = createSlug(equipment);
      return await collection.find({ 
        equipment: { 
          $regex: `^${equipment.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 
          $options: 'i' 
        }
      }).toArray();
    } catch (error) {
      console.error('Error fetching exercises by equipment:', error);
      throw new Error('Failed to fetch exercises by equipment');
    }
  }

  async getExercisesByTarget(target: string): Promise<Exercise[]> {
    try {
      const collection = await this.getCollection<Exercise>('exercises');
      const slug = createSlug(target);
      return await collection.find({ 
        target: { 
          $regex: `^${target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 
          $options: 'i' 
        }
      }).toArray();
    } catch (error) {
      console.error('Error fetching exercises by target:', error);
      throw new Error('Failed to fetch exercises by target');
    }
  }

  async getBodyPartsList(): Promise<{ name: string; slug: string }[]> {
    try {
      const collection = await this.getCollection<Category>('bodyParts');
      const bodyParts = await collection.find({}).toArray();
      return bodyParts.map(bp => ({
        name: bp.name,
        slug: createSlug(bp.name)
      }));
    } catch (error) {
      console.error('Error fetching body parts list:', error);
      throw new Error('Failed to fetch body parts list');
    }
  }

  async getEquipmentList(): Promise<{ name: string; slug: string }[]> {
    try {
      const collection = await this.getCollection<Category>('equipment');
      const equipment = await collection.find({}).toArray();
      return equipment.map(eq => ({
        name: eq.name,
        slug: createSlug(eq.name)
      }));
    } catch (error) {
      console.error('Error fetching equipment list:', error);
      throw new Error('Failed to fetch equipment list');
    }
  }

  async getTargetList(): Promise<{ name: string; slug: string }[]> {
    try {
      const collection = await this.getCollection<Category>('muscles');
      const targets = await collection.find({}).toArray();
      return targets.map(t => ({
        name: t.name,
        slug: createSlug(t.name)
      }));
    } catch (error) {
      console.error('Error fetching target list:', error);
      throw new Error('Failed to fetch target list');
    }
  }
}

export const exerciseDB = new ExerciseService();