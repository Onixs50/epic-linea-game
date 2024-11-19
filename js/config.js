const AI_CONFIG = {
    // Google AI API Settings
    GOOGLE_API_KEY: "AIzaSyByli164qzE-qK3cp-y6lY-lQPVlDdKNco",
    ENDPOINTS: {
        // Text Generation Endpoint (Gemini Flash)
        STORY: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
        
        // Image Generation Endpoint (Gemini Pro Vision)
        IMAGE: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"
    },

    // Story Generation Prompt Template
    STORY_PROMPT: `Create an epic fantasy story about {prompt} with this structure:

Title: A captivating epic title

Part 1 - The Beginning:
Write a magical introduction in 2-3 vivid and fantastical sentences about {prompt}. Capture the essence of the magical world.

Part 2 - The Quest:
Describe an epic magical quest with mystical challenges in 2-3 sentences. Include extraordinary powers and transformative journey.

Style: High fantasy, suitable for an immersive magical NFT game narrative.`,

    // Image Generation Settings
    IMAGE_SETTINGS: {
        prompts: {
            SCENE1: "masterpiece, epic fantasy scene, magical crystals, volumetric lighting, 8k resolution, cinematic, detailed digital art, dramatic scene, ",
            SCENE2: "masterpiece, magical ritual, mystical environment, glowing particles, 8k resolution, cinematic, detailed fantasy art, ",
            GAMEWORLD: "masterpiece, vast magical realm, hidden treasures, epic landscape, volumetric god rays, 8k resolution, cinematic wide shot, "
        },
        parameters: {
            negative_prompt: "text, watermark, blurry, low quality, disfigured, pixelated",
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.9
        }
    }
};

async function generateStory(userPrompt) {
    try {
        console.log('Generating story for prompt:', userPrompt);
        const response = await fetch(AI_CONFIG.ENDPOINTS.STORY + `?key=${AI_CONFIG.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: AI_CONFIG.STORY_PROMPT.replace(/\{prompt\}/g, userPrompt)
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.8,
                    topP: 0.9
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        const data = await response.json();
        const storyText = data.candidates[0].content.parts[0].text;

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
        
        const response = await fetch(AI_CONFIG.ENDPOINTS.IMAGE + `?key=${AI_CONFIG.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: basePrompt + prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.7,
                    topP: 0.9
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

        const data = await response.json();
        const imageData = data.candidates[0].content.parts[0].inlineData?.base64;
        
        return imageData || null;
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
