import prisma from '../src/lib/db/prisma';
import { generateEmbedding } from '../src/lib/ai/gemini';
import { nanoid } from 'nanoid';

const DOCUMENTS = [
    {
        title: 'Functional Decomposition',
        source: 'Engineering Design Methods',
        tags: ['functional_decomposition', 'framework'],
        content: `Functional Decomposition is a method to break down a complex system into smaller, manageable functional parts. 
    It focuses on "what" the system must do, not "how" it does it.
    
    Steps:
    1. Identify the overall function (the main goal).
    2. Break it down into sub-functions (inputs -> processes -> outputs).
    3. Verify that sub-functions are MECE (Mutually Exclusive, Collectively Exhaustive).
    4. Use "Verb + Noun" naming convention (e.g., "Heat Water", "Filter Coffee").
    
    Benefits:
    - Simplifies complex problems.
    - identifying necessary components.
    - Facilitates innovation by focusing on function first.`
    },
    {
        title: 'Morphological Chart',
        source: 'Engineering Design Methods',
        tags: ['morphological_chart', 'framework'],
        content: `A Morphological Chart (or Morphological Box) is a visualization tool for exploring solution spaces.
    It maps functions to means (solutions).
    
    Structure:
    - Rows: Sub-functions identifying in decomposition.
    - Columns: Possible solutions (means) for each function.
    
    Process:
    1. List functions on the left.
    2. Brainstorm multiple solution concepts for each function (3-5 options).
    3. Combine one option from each row to form a complete system concept.
    
    Example for "Propel Vehicle":
    - Option A: Internal Combustion Engine
    - Option B: Electric Motor
    - Option C: Sail/Wind
    - Option D: Human Power`
    },
    {
        title: 'Risk and Trade-off Analysis',
        source: 'Product Management Best Practices',
        tags: ['risk_tradeoffs', 'framework', 'checklist'],
        content: `Risk Categories to Consider:
    - Technical Risk: Feasibility, complexity, durability.
    - Safety Risk: Harm to user, fire, electrical shock.
    - Compliance Risk: Regulations (FCC, CE, FDA).
    - Supply Chain Risk: Part availability, cost fluctuations.
    - Market Risk: Adoption, competition.
    
    Trade-off Analysis:
    A trade-off is a decision where improving one aspect degrades another.
    Common Trade-offs:
    - Cost vs. Quality
    - Speed vs. Accuracy
    - Battery Life vs. Performance
    - Portability vs. Durability
    - Complexity vs. Maintainability`
    },
    {
        title: 'Example: Smart Coffee Maker',
        source: 'Case Study',
        tags: ['example', 'functional_decomposition', 'morphological_chart'],
        content: `Project: Smart Coffee Maker
    
    Functional Decomposition:
    - Store Water (Tank)
    - Heat Water (Heater element)
    - Store Gounds (Hopper)
    - Grind Beans (Burr grinder)
    - Infuse Water (Brew basket)
    - Filter Liquid (Mesh/Paper)
    - Keep Warm (Hot plate / Thermal carafe)
    
    Morphological Chart Options:
    - Heat Water: Resistive Coil, Induction, Flow-through Heater
    - Filter: Paper Filter, Metal Mesh, Centrifuge
    - Keep Warm: Hot Plate (energy intensive), Vacuum Flask (passive)`
    }
];

async function ingest() {
    console.log('Starting ingestion...');

    // Clean up existing known docs to avoid duplicates
    // In a real prod environment, we would be smarter, but here we wipe for "seeding"
    // Actually, let's just add if not exists or allow duplicates for now (simpler)
    // Or better, delete all KnowledgeDocuments?? No, maybe risky.
    // Let's delete *these* specific examples by title or just append.
    // For this demo, let's delete all and re-seed to ensure clean state.
    await prisma.knowledgeChunk.deleteMany({});
    await prisma.knowledgeDocument.deleteMany({});
    console.log('Cleared existing knowledge.');

    for (const doc of DOCUMENTS) {
        console.log(`Processing: ${doc.title}`);

        // Create Document
        const dbDoc = await prisma.knowledgeDocument.create({
            data: {
                title: doc.title,
                source: doc.source,
                tags: doc.tags,
                content: doc.content
            }
        });

        // Chunking (Naive)
        const CHUNK_SIZE = 700;
        const OVERLAP = 120;

        const text = doc.content;
        for (let i = 0; i < text.length; i += (CHUNK_SIZE - OVERLAP)) {
            const chunkText = text.slice(i, i + CHUNK_SIZE);
            if (chunkText.length < 50) continue; // Skip tiny chunks

            // Embed
            const embeddingValues = await generateEmbedding(chunkText);
            const vectorString = `[${embeddingValues.join(',')}]`;

            // Insert Chunk
            // Prisma doesn't natively support insertion of vectors via typed client yet fully in create? 
            // We often have to use raw SQL for the vector field if the types aren't perfect.
            // But let's try standard create and let Prisma handle it if we typed it as Unsupported.
            // Wait, Unsupported types CANNOT be written via Prisma Client create/update.
            // We MUST use $executeRaw for the chunk insertion.

            await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" ("id", "documentId", "chunkText", "embedding", "metadata", "createdAt")
        VALUES (
          ${nanoid()}, 
          ${dbDoc.id}, 
          ${chunkText}, 
          ${vectorString}::vector, 
          '{}'::jsonb, 
          NOW()
        );
      `;
        }
    }

    console.log('Ingestion complete.');
}

ingest()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
