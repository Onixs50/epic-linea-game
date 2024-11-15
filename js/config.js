// config.js

const AI_CONFIG = {
    // HuggingFace Settings
    HF_API_KEY: "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",
    HF_ENDPOINTS: {
        // Mistral-7B for story generation 
        STORY: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        
        // RunwayML Stable Diffusion v1.5 for images 
        IMAGE: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
    },

    STORY_PROMPT: `[INST] Create an epic fantasy story with this structure:

Title: Create an epic title for a story about {prompt}

Part 1 - The Beginning:
Write a magical introduction about {prompt} in 2-3 sentences. Make it vivid and fantastical.

Part 2 - The Quest:
Describe an epic quest to find magical elements in 2-3 sentences. Include mystical powers.

Use high fantasy style and make it engaging for a magical NFT game. [/INST]`,

    IMAGE_SETTINGS: {
        prompts: {
            SCENE1: "masterpiece, epic fantasy scene, magical crystals, volumetric lighting, 8k, cinematic, detailed digital art, dramatic scene, ",
            SCENE2: "masterpiece, magical ritual, mystical environment, glowing particles, 8k, cinematic, detailed fantasy art, ",
            GAMEWORLD: "masterpiece, vast magical realm, hidden treasures, epic landscape, volumetric god rays, 8k, cinematic wide shot, "
        },
        parameters: {
            negative_prompt: "text, watermark, blurry, low quality, disfigured, pixelated",
            num_inference_steps: 50,
            guidance_scale: 7.5
        }
    }
};

async function generateStory(userPrompt) {
    try {
        console.log('Generating story for prompt:', userPrompt);
        const response = await fetch(AI_CONFIG.HF_ENDPOINTS.STORY, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: AI_CONFIG.STORY_PROMPT.replace(/\{prompt\}/g, userPrompt),
                parameters: {
                    max_new_tokens: 300,
                    temperature: 0.8,
                    top_p: 0.9,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        const data = await response.json();
        const storyText = data[0].generated_text;

        // Parse story parts
        const titleMatch = storyText.match(/Title:(.*?)Part 1/s);
        const part1Match = storyText.match(/Part 1.*?:(.*?)Part 2/s);
        const part2Match = storyText.match(/Part 2.*?:(.*?)$/s);

        return {
            title: titleMatch ? titleMatch[1].trim() : "The Mystical Quest",
            part1: part1Match ? part1Match[1].trim() : "Your magical journey begins...",
            part2: part2Match ? part2Match[1].trim() : "The elements await..."
        };
    } catch (error) {
        console.error('Story generation error:', error);
        return {
            title: "The Enchanted Journey",
            part1: "In a realm of endless magic, your adventure begins...",
            part2: "Ten mystical elements call out to be discovered..."
        };
    }
}

async function generateImage(prompt, type) {
    try {
        console.log('Generating image for:', type, prompt);
        const basePrompt = AI_CONFIG.IMAGE_SETTINGS.prompts[type] || "";
        
        const response = await fetch(AI_CONFIG.HF_ENDPOINTS.IMAGE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: basePrompt + prompt,
                parameters: {
                    ...AI_CONFIG.IMAGE_SETTINGS.parameters
                }
            })
        });

        if (!response.ok) {
            if (response.status === 503) {
                // Model is loading, wait and retry
                await new Promise(resolve => setTimeout(resolve, 20000));
                return generateImage(prompt, type);
            }
            throw new Error(`Image API Error: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image generation error:', error);
        return null;
    }
}

async function generateGameContent(userPrompt) {
    try {
        console.log('Starting content generation for:', userPrompt);
        
        // Generate story first
        const story = await generateStory(userPrompt);
        console.log('Story generated successfully:', story);

        // Generate images with retries
        const generateWithRetry = async (prompt, type, retries = 3) => {
            for (let i = 0; i < retries; i++) {
                const result = await generateImage(prompt, type);
                if (result) return result;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            return null;
        };

        // Generate all images in parallel with retry logic
        const [scene1, scene2, gameWorld] = await Promise.all([
            generateWithRetry(userPrompt, 'SCENE1'),
            generateWithRetry(userPrompt, 'SCENE2'),
            generateWithRetry(userPrompt, 'GAMEWORLD')
        ]);

        console.log('All content generated successfully');

        return {
            story,
            images: {
                scene1,
                scene2,
                gameWorld
            }
        };
    } catch (error) {
        console.error('Error in content generation:', error);
        throw error;
    }
}

export { generateGameContent, AI_CONFIG };
