// ========== STATE ==========
const APP_KEY = 'fittrack_data';

function loadState() {
    const raw = localStorage.getItem(APP_KEY);
    return raw ? JSON.parse(raw) : {
        profile: null,
        plan: null,
        foodLog: {},     // keyed by date string "YYYY-MM-DD"
        weightLog: []    // [{date, weight}]
    };
}

function saveState(state) {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
}

let state = loadState();

// ========== TAB NAVIGATION ==========
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// ========== CALCULATIONS ==========

// ========== FOOD RECOGNITION (AI-powered) ==========
// Maps AI food-101 class names → our FOOD_DB entries with calorie data
const FOOD_RECOGNITION_MAP = {
    // Direct matches & close approximations
    'chicken_curry': { name: 'Butter Chicken (1 cup)', cal: 340, protein: 28, carbs: 10, fats: 20 },
    'grilled_chicken': { name: 'Grilled Chicken (1 piece)', cal: 280, protein: 43, carbs: 0, fats: 10 },
    'chicken_wings': { name: 'Fried Chicken (1 piece)', cal: 294, protein: 24, carbs: 11, fats: 17 },
    'fried_chicken': { name: 'Fried Chicken (1 piece)', cal: 294, protein: 24, carbs: 11, fats: 17 },
    'chicken_quesadilla': { name: 'Wrap / Burrito', cal: 350, protein: 15, carbs: 40, fats: 14 },
    'steak': { name: 'Beef Steak (100g)', cal: 271, protein: 26, carbs: 0, fats: 18 },
    'filet_mignon': { name: 'Beef Steak (100g)', cal: 271, protein: 26, carbs: 0, fats: 18 },
    'prime_rib': { name: 'Beef Steak (100g)', cal: 271, protein: 26, carbs: 0, fats: 18 },
    'pork_chop': { name: 'Lamb (100g)', cal: 258, protein: 25.6, carbs: 0, fats: 16.5 },
    'hamburger': { name: 'Burger (1 regular)', cal: 354, protein: 20, carbs: 29, fats: 17 },
    'hot_dog': { name: 'Hot Dog (1)', cal: 290, protein: 10, carbs: 24, fats: 17 },
    'pizza': { name: 'Pizza Slice (1)', cal: 285, protein: 12, carbs: 36, fats: 10 },
    'french_fries': { name: 'French Fries (medium)', cal: 365, protein: 4, carbs: 48, fats: 17 },
    'fish_and_chips': { name: 'Fish Fillet (100g)', cal: 250, protein: 16, carbs: 25, fats: 12 },
    'sushi': { name: 'White Rice (1 cup cooked)', cal: 250, protein: 10, carbs: 40, fats: 5 },
    'sashimi': { name: 'Salmon (100g)', cal: 208, protein: 20, carbs: 0, fats: 13 },
    'fried_rice': { name: 'Fried Rice (1 plate)', cal: 370, protein: 8, carbs: 55, fats: 13 },
    'rice': { name: 'White Rice (1 cup cooked)', cal: 206, protein: 4.3, carbs: 45, fats: 0.4 },
    'biryani': { name: 'Biryani (1 plate)', cal: 490, protein: 18, carbs: 65, fats: 16 },
    'fried_egg': { name: 'Egg (1 whole)', cal: 90, protein: 6.3, carbs: 0.4, fats: 7 },
    'omelette': { name: 'Egg (2 eggs omelette)', cal: 154, protein: 11, carbs: 1, fats: 12 },
    'eggs_benedict': { name: 'Egg (2 eggs)', cal: 250, protein: 15, carbs: 18, fats: 14 },
    'deviled_eggs': { name: 'Boiled Egg (1)', cal: 78, protein: 6.3, carbs: 0.6, fats: 5.3 },
    'bread_pudding': { name: 'Cake Slice (1)', cal: 350, protein: 4, carbs: 52, fats: 14 },
    'toast': { name: 'Whole Wheat Bread (1 slice)', cal: 81, protein: 4, carbs: 13.8, fats: 1.1 },
    'french_toast': { name: 'Whole Wheat Bread (2 slices)', cal: 220, protein: 8, carbs: 30, fats: 8 },
    'pancakes': { name: 'Pancakes (2 pieces)', cal: 260, protein: 6, carbs: 40, fats: 8 },
    'waffles': { name: 'Waffles (2 pieces)', cal: 290, protein: 7, carbs: 42, fats: 10 },
    'pasta': { name: 'Pasta (1 cup cooked)', cal: 220, protein: 8, carbs: 43, fats: 1.3 },
    'spaghetti_bolognese': { name: 'Pasta with sauce (1 plate)', cal: 400, protein: 18, carbs: 50, fats: 14 },
    'spaghetti_carbonara': { name: 'Pasta with sauce (1 plate)', cal: 450, protein: 16, carbs: 48, fats: 20 },
    'lasagna': { name: 'Lasagna (1 serving)', cal: 380, protein: 20, carbs: 35, fats: 16 },
    'macaroni_and_cheese': { name: 'Mac & Cheese (1 cup)', cal: 350, protein: 14, carbs: 40, fats: 15 },
    'ramen': { name: 'Noodle Soup (1 bowl)', cal: 380, protein: 12, carbs: 50, fats: 14 },
    'pho': { name: 'Noodle Soup (1 bowl)', cal: 350, protein: 15, carbs: 45, fats: 10 },
    'pad_thai': { name: 'Pad Thai (1 plate)', cal: 400, protein: 14, carbs: 52, fats: 16 },
    'naan': { name: 'Naan (1 piece)', cal: 262, protein: 8.7, carbs: 45, fats: 5.1 },
    'dosa': { name: 'Dosa (1 plain)', cal: 133, protein: 3.9, carbs: 18, fats: 5 },
    'samosa': { name: 'Samosa (1)', cal: 252, protein: 4, carbs: 24, fats: 15 },
    'spring_rolls': { name: 'Spring Roll (2)', cal: 200, protein: 5, carbs: 24, fats: 10 },
    'tacos': { name: 'Tacos (2)', cal: 340, protein: 14, carbs: 30, fats: 18 },
    'burrito': { name: 'Wrap / Burrito', cal: 350, protein: 15, carbs: 40, fats: 14 },
    'nachos': { name: 'Nachos (1 serving)', cal: 350, protein: 10, carbs: 38, fats: 18 },
    'sandwich': { name: 'Sandwich (veg)', cal: 230, protein: 7, carbs: 30, fats: 9 },
    'club_sandwich': { name: 'Sandwich (chicken)', cal: 320, protein: 18, carbs: 32, fats: 14 },
    'grilled_cheese_sandwich': { name: 'Sandwich (cheese)', cal: 290, protein: 12, carbs: 28, fats: 15 },
    'caesar_salad': { name: 'Mixed Salad (1 bowl)', cal: 150, protein: 6, carbs: 10, fats: 10 },
    'greek_salad': { name: 'Mixed Salad (1 bowl)', cal: 120, protein: 5, carbs: 8, fats: 8 },
    'caprese_salad': { name: 'Mixed Salad (1 bowl)', cal: 140, protein: 8, carbs: 6, fats: 9 },
    'soup': { name: 'Vegetable Soup (1 bowl)', cal: 120, protein: 4, carbs: 18, fats: 3 },
    'miso_soup': { name: 'Miso Soup (1 bowl)', cal: 60, protein: 4, carbs: 6, fats: 2 },
    'clam_chowder': { name: 'Cream Soup (1 bowl)', cal: 220, protein: 8, carbs: 20, fats: 12 },
    'ice_cream': { name: 'Ice Cream (1 scoop)', cal: 137, protein: 2.3, carbs: 16, fats: 7.3 },
    'chocolate_cake': { name: 'Cake Slice (1)', cal: 350, protein: 4, carbs: 52, fats: 14 },
    'cheesecake': { name: 'Cheesecake (1 slice)', cal: 320, protein: 6, carbs: 28, fats: 20 },
    'donuts': { name: 'Donut (1)', cal: 289, protein: 5, carbs: 33, fats: 16 },
    'cupcakes': { name: 'Cupcake (1)', cal: 250, protein: 3, carbs: 36, fats: 10 },
    'apple_pie': { name: 'Apple Pie (1 slice)', cal: 296, protein: 2, carbs: 44, fats: 13 },
    'chocolate_mousse': { name: 'Chocolate Mousse (1 cup)', cal: 230, protein: 4, carbs: 28, fats: 12 },
    'banana': { name: 'Banana (1 medium)', cal: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    'apple': { name: 'Apple (1 medium)', cal: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    'orange': { name: 'Orange (1 medium)', cal: 62, protein: 1.2, carbs: 15.4, fats: 0.2 },
    'mango': { name: 'Mango (1 cup sliced)', cal: 99, protein: 1.4, carbs: 25, fats: 0.6 },
    'strawberry': { name: 'Strawberries (1 cup)', cal: 49, protein: 1, carbs: 11.7, fats: 0.5 },
    'watermelon': { name: 'Watermelon (1 cup diced)', cal: 46, protein: 0.9, carbs: 11.5, fats: 0.2 },
    'grapes': { name: 'Grapes (1 cup)', cal: 104, protein: 1.1, carbs: 27, fats: 0.2 },
    'pineapple': { name: 'Pineapple (1 cup)', cal: 82, protein: 0.9, carbs: 22, fats: 0.2 },
    'coffee': { name: 'Coffee with milk (1 cup)', cal: 60, protein: 2, carbs: 7, fats: 2 },
    'cappuccino': { name: 'Coffee with milk (1 cup)', cal: 80, protein: 4, carbs: 8, fats: 3 },
    'espresso': { name: 'Coffee black (1 cup)', cal: 2, protein: 0.3, carbs: 0, fats: 0 },
    'tea': { name: 'Tea with milk (1 cup)', cal: 45, protein: 1, carbs: 6, fats: 1.5 },
    'juice': { name: 'Orange Juice (1 glass)', cal: 112, protein: 1.7, carbs: 26, fats: 0.5 },
    'smoothie': { name: 'Fruit Smoothie (1 glass)', cal: 180, protein: 3, carbs: 40, fats: 1 },
    'beer': { name: 'Beer (1 pint)', cal: 182, protein: 1.6, carbs: 13, fats: 0 },
    'wine': { name: 'Wine (1 glass)', cal: 125, protein: 0.1, carbs: 3.8, fats: 0 },
    'dal': { name: 'Dal (1 cup)', cal: 180, protein: 12, carbs: 28, fats: 2.5 },
    'curry': { name: 'Chole / Chickpea Curry (1 cup)', cal: 240, protein: 12, carbs: 36, fats: 6 },
    'paella': { name: 'Fried Rice (1 plate)', cal: 370, protein: 12, carbs: 50, fats: 14 },
    'risotto': { name: 'Pulao (1 cup)', cal: 280, protein: 7, carbs: 42, fats: 9 },
    'bruschetta': { name: 'Whole Wheat Bread (2 slices)', cal: 180, protein: 5, carbs: 24, fats: 7 },
    'hummus': { name: 'Hummus (2 tbsp)', cal: 70, protein: 2, carbs: 6, fats: 4 },
    'guacamole': { name: 'Avocado (1/2)', cal: 120, protein: 1.5, carbs: 6, fats: 11 },
    'falafel': { name: 'Falafel (4 pieces)', cal: 220, protein: 8, carbs: 24, fats: 10 },
    'popcorn': { name: 'Popcorn (1 cup air-popped)', cal: 31, protein: 1, carbs: 6.2, fats: 0.4 },
    'chips': { name: 'Chips / Crisps (1 bag 30g)', cal: 155, protein: 2, carbs: 15, fats: 10 },
    'cookie': { name: 'Biscuit / Cookie (1)', cal: 68, protein: 0.8, carbs: 9, fats: 3.2 },
    'brownie': { name: 'Brownie (1 piece)', cal: 220, protein: 3, carbs: 30, fats: 10 },
    'candy': { name: 'Chocolate Bar (1 small)', cal: 235, protein: 3.4, carbs: 26, fats: 13 },
    'yogurt': { name: 'Greek Yogurt (1 cup)', cal: 130, protein: 22, carbs: 8, fats: 0.7 },
    'cheese': { name: 'Cheese Slice (1)', cal: 113, protein: 7, carbs: 0.4, fats: 9.3 },
    'butter': { name: 'Butter (1 tbsp)', cal: 102, protein: 0.1, carbs: 0, fats: 11.5 },
};

// ========== FOOD PHOTO SCANNER ==========

document.getElementById('btnScanFood').addEventListener('click', () => {
    document.getElementById('foodCameraInput').click();
});

document.getElementById('btnUploadFood').addEventListener('click', () => {
    document.getElementById('foodGalleryInput').click();
});

document.getElementById('foodCameraInput').addEventListener('change', handleFoodPhoto);
document.getElementById('foodGalleryInput').addEventListener('change', handleFoodPhoto);

async function handleFoodPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const container = document.getElementById('foodPhotoContainer');
    const preview = document.getElementById('foodPhotoPreview');
    const overlay = document.getElementById('analyzingOverlay');
    const resultDiv = document.getElementById('foodScanResult');

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
        preview.src = ev.target.result;
        container.style.display = 'block';
        overlay.style.display = 'flex';
        resultDiv.style.display = 'none';
    };
    reader.readAsDataURL(file);

    try {
        // Send to HuggingFace free food recognition AI
        const results = await recognizeFood(file);
        overlay.style.display = 'none';

        if (results && results.length > 0) {
            showFoodRecognitionResults(results, resultDiv);
        } else {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div class="scan-result-name" style="color:var(--warning);">Could not identify the food</div>
                <p style="color:var(--text-muted);font-size:0.85rem;">Try a clearer photo or search manually below.</p>`;
        }
    } catch (err) {
        overlay.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<div class="scan-result-name" style="color:var(--danger);">Analysis failed</div>
            <p style="color:var(--text-muted);font-size:0.85rem;">${err.message || 'Check your internet connection and try again.'}</p>`;
    }

    // Reset file input so same photo can be re-selected
    e.target.value = '';
}

async function recognizeFood(file) {
    const response = await fetch('https://api-inference.huggingface.co/models/nateraw/food', {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type }
    });

    if (!response.ok) {
        if (response.status === 503) {
            // Model is loading, wait and retry once
            const body = await response.json();
            const wait = (body.estimated_time || 20) * 1000;
            await new Promise(r => setTimeout(r, Math.min(wait, 30000)));
            const retry = await fetch('https://api-inference.huggingface.co/models/nateraw/food', {
                method: 'POST',
                body: file,
                headers: { 'Content-Type': file.type }
            });
            if (!retry.ok) throw new Error('AI model is loading. Please try again in 30 seconds.');
            return await retry.json();
        }
        throw new Error('Could not analyze photo. Try again.');
    }
    return await response.json();
}

function showFoodRecognitionResults(results, resultDiv) {
    // Take top 3 predictions
    const top = results.slice(0, 3);
    resultDiv.style.display = 'block';

    let html = '<div class="scan-result-name">Food Detected!</div>';
    html += '<div class="food-matches">';

    top.forEach((pred, i) => {
        const label = pred.label.replace(/_/g, ' ');
        const confidence = Math.round(pred.score * 100);
        const mapped = FOOD_RECOGNITION_MAP[pred.label] || guessNutrition(pred.label);

        html += `
            <div class="food-match ${i === 0 ? 'best-match' : ''}" data-food='${JSON.stringify(mapped).replace(/'/g, "&#39;")}'>
                <div class="food-match-header">
                    <span class="food-match-name">${i === 0 ? '🎯 ' : ''}${capitalize(label)}</span>
                    <span class="food-match-confidence">${confidence}% match</span>
                </div>
                <div class="food-match-macros">
                    ${mapped.cal} kcal · P: ${mapped.protein}g · C: ${mapped.carbs}g · F: ${mapped.fats}g
                </div>
                <button class="btn-add-scanned">Add This</button>
            </div>`;
    });

    html += '</div>';
    resultDiv.innerHTML = html;

    // Attach click handlers
    resultDiv.querySelectorAll('.food-match').forEach(el => {
        el.querySelector('.btn-add-scanned').addEventListener('click', () => {
            const food = JSON.parse(el.dataset.food);
            fillFoodForm(food);
        });
    });
}

function capitalize(str) {
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function guessNutrition(label) {
    // Fallback: estimate based on common sense if not in our map
    const name = label.replace(/_/g, ' ');
    // Search our FOOD_DB for a partial match
    const dbMatch = FOOD_DB.find(f => {
        const fLower = f.name.toLowerCase();
        const words = name.toLowerCase().split(' ');
        return words.some(w => w.length > 3 && fLower.includes(w));
    });
    if (dbMatch) {
        return { name: dbMatch.name, cal: dbMatch.cal, protein: dbMatch.protein, carbs: dbMatch.carbs, fats: dbMatch.fats };
    }
    // Generic fallback
    return { name: capitalize(name) + ' (estimated)', cal: 200, protein: 8, carbs: 25, fats: 8 };
}


// ========== FOOD DATABASE (per serving) ==========
const FOOD_DB = [
    // Proteins
    { name: 'Chicken Breast (100g)', cal: 165, protein: 31, carbs: 0, fats: 3.6 },
    { name: 'Chicken Thigh (100g)', cal: 209, protein: 26, carbs: 0, fats: 10.9 },
    { name: 'Grilled Chicken (1 piece)', cal: 280, protein: 43, carbs: 0, fats: 10 },
    { name: 'Egg (1 whole)', cal: 72, protein: 6.3, carbs: 0.4, fats: 4.8 },
    { name: 'Egg White (1)', cal: 17, protein: 3.6, carbs: 0.2, fats: 0.1 },
    { name: 'Boiled Egg (1)', cal: 78, protein: 6.3, carbs: 0.6, fats: 5.3 },
    { name: 'Salmon (100g)', cal: 208, protein: 20, carbs: 0, fats: 13 },
    { name: 'Tuna (100g canned)', cal: 116, protein: 25.5, carbs: 0, fats: 0.8 },
    { name: 'Shrimp (100g)', cal: 99, protein: 24, carbs: 0.2, fats: 0.3 },
    { name: 'Paneer (100g)', cal: 265, protein: 18.3, carbs: 1.2, fats: 20.8 },
    { name: 'Tofu (100g)', cal: 76, protein: 8, carbs: 1.9, fats: 4.8 },
    { name: 'Greek Yogurt (1 cup)', cal: 130, protein: 22, carbs: 8, fats: 0.7 },
    { name: 'Cottage Cheese (100g)', cal: 98, protein: 11, carbs: 3.4, fats: 4.3 },
    { name: 'Whey Protein (1 scoop)', cal: 120, protein: 24, carbs: 3, fats: 1.5 },
    { name: 'Turkey Breast (100g)', cal: 135, protein: 30, carbs: 0, fats: 1 },
    { name: 'Lamb (100g)', cal: 258, protein: 25.6, carbs: 0, fats: 16.5 },
    { name: 'Beef Steak (100g)', cal: 271, protein: 26, carbs: 0, fats: 18 },
    { name: 'Fish Fillet (100g)', cal: 96, protein: 20, carbs: 0, fats: 1.7 },

    // Grains & Carbs
    { name: 'White Rice (1 cup cooked)', cal: 206, protein: 4.3, carbs: 45, fats: 0.4 },
    { name: 'Brown Rice (1 cup cooked)', cal: 216, protein: 5, carbs: 45, fats: 1.8 },
    { name: 'Oats (1 cup cooked)', cal: 154, protein: 5.4, carbs: 27, fats: 2.6 },
    { name: 'Whole Wheat Bread (1 slice)', cal: 81, protein: 4, carbs: 13.8, fats: 1.1 },
    { name: 'White Bread (1 slice)', cal: 79, protein: 2.7, carbs: 15, fats: 1 },
    { name: 'Roti / Chapati (1)', cal: 104, protein: 3.1, carbs: 18.3, fats: 2.6 },
    { name: 'Naan (1 piece)', cal: 262, protein: 8.7, carbs: 45, fats: 5.1 },
    { name: 'Pasta (1 cup cooked)', cal: 220, protein: 8, carbs: 43, fats: 1.3 },
    { name: 'Quinoa (1 cup cooked)', cal: 222, protein: 8.1, carbs: 39.4, fats: 3.6 },
    { name: 'Sweet Potato (1 medium)', cal: 103, protein: 2.3, carbs: 24, fats: 0.1 },
    { name: 'Potato (1 medium baked)', cal: 161, protein: 4.3, carbs: 37, fats: 0.2 },
    { name: 'Corn Tortilla (1)', cal: 52, protein: 1.4, carbs: 10.7, fats: 0.7 },
    { name: 'Poha / Flattened Rice (1 cup)', cal: 250, protein: 5, carbs: 50, fats: 3 },
    { name: 'Upma (1 cup)', cal: 210, protein: 5, carbs: 32, fats: 7 },
    { name: 'Idli (1 piece)', cal: 39, protein: 2, carbs: 8, fats: 0.2 },
    { name: 'Dosa (1 plain)', cal: 133, protein: 3.9, carbs: 18, fats: 5 },

    // Fruits
    { name: 'Banana (1 medium)', cal: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    { name: 'Apple (1 medium)', cal: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    { name: 'Orange (1 medium)', cal: 62, protein: 1.2, carbs: 15.4, fats: 0.2 },
    { name: 'Mango (1 cup sliced)', cal: 99, protein: 1.4, carbs: 25, fats: 0.6 },
    { name: 'Grapes (1 cup)', cal: 104, protein: 1.1, carbs: 27, fats: 0.2 },
    { name: 'Watermelon (1 cup diced)', cal: 46, protein: 0.9, carbs: 11.5, fats: 0.2 },
    { name: 'Papaya (1 cup)', cal: 55, protein: 0.9, carbs: 14, fats: 0.2 },
    { name: 'Strawberries (1 cup)', cal: 49, protein: 1, carbs: 11.7, fats: 0.5 },
    { name: 'Blueberries (1 cup)', cal: 85, protein: 1.1, carbs: 21, fats: 0.5 },
    { name: 'Pineapple (1 cup)', cal: 82, protein: 0.9, carbs: 22, fats: 0.2 },
    { name: 'Pomegranate (1 cup seeds)', cal: 144, protein: 2.9, carbs: 33, fats: 2 },

    // Vegetables
    { name: 'Broccoli (1 cup)', cal: 55, protein: 3.7, carbs: 11, fats: 0.6 },
    { name: 'Spinach (1 cup cooked)', cal: 41, protein: 5.3, carbs: 6.8, fats: 0.5 },
    { name: 'Mixed Salad (1 bowl)', cal: 35, protein: 2, carbs: 7, fats: 0.3 },
    { name: 'Cucumber (1 whole)', cal: 30, protein: 1.3, carbs: 6, fats: 0.2 },
    { name: 'Tomato (1 medium)', cal: 22, protein: 1.1, carbs: 4.8, fats: 0.2 },
    { name: 'Carrot (1 medium)', cal: 25, protein: 0.6, carbs: 5.8, fats: 0.1 },
    { name: 'Bell Pepper (1)', cal: 30, protein: 1, carbs: 6, fats: 0.3 },
    { name: 'Cauliflower (1 cup)', cal: 27, protein: 2.1, carbs: 5.3, fats: 0.3 },
    { name: 'Green Beans (1 cup)', cal: 31, protein: 1.8, carbs: 7, fats: 0.1 },
    { name: 'Mushrooms (1 cup)', cal: 15, protein: 2.2, carbs: 2.3, fats: 0.2 },

    // Dairy & Drinks
    { name: 'Whole Milk (1 cup)', cal: 149, protein: 8, carbs: 12, fats: 8 },
    { name: 'Skim Milk (1 cup)', cal: 83, protein: 8.3, carbs: 12.2, fats: 0.2 },
    { name: 'Curd / Yogurt (1 cup)', cal: 98, protein: 11, carbs: 4, fats: 5 },
    { name: 'Lassi (1 glass)', cal: 170, protein: 6, carbs: 28, fats: 4 },
    { name: 'Buttermilk (1 glass)', cal: 40, protein: 3.3, carbs: 4.8, fats: 0.9 },
    { name: 'Cheese Slice (1)', cal: 113, protein: 7, carbs: 0.4, fats: 9.3 },
    { name: 'Butter (1 tbsp)', cal: 102, protein: 0.1, carbs: 0, fats: 11.5 },
    { name: 'Ghee (1 tbsp)', cal: 112, protein: 0, carbs: 0, fats: 12.7 },
    { name: 'Coffee black (1 cup)', cal: 2, protein: 0.3, carbs: 0, fats: 0 },
    { name: 'Coffee with milk (1 cup)', cal: 60, protein: 2, carbs: 7, fats: 2 },
    { name: 'Tea with milk (1 cup)', cal: 45, protein: 1, carbs: 6, fats: 1.5 },
    { name: 'Green Tea (1 cup)', cal: 2, protein: 0, carbs: 0, fats: 0 },
    { name: 'Orange Juice (1 glass)', cal: 112, protein: 1.7, carbs: 26, fats: 0.5 },
    { name: 'Coconut Water (1 glass)', cal: 46, protein: 1.7, carbs: 9, fats: 0.5 },
    { name: 'Protein Shake (1 glass)', cal: 180, protein: 30, carbs: 8, fats: 3 },

    // Nuts & Seeds
    { name: 'Almonds (10 pieces)', cal: 69, protein: 2.5, carbs: 2.5, fats: 6 },
    { name: 'Walnuts (5 halves)', cal: 65, protein: 1.5, carbs: 1.4, fats: 6.5 },
    { name: 'Peanuts (1/4 cup)', cal: 207, protein: 9.4, carbs: 6, fats: 18 },
    { name: 'Peanut Butter (1 tbsp)', cal: 94, protein: 3.6, carbs: 3.4, fats: 8 },
    { name: 'Cashews (10 pieces)', cal: 87, protein: 2.9, carbs: 4.6, fats: 7 },
    { name: 'Chia Seeds (1 tbsp)', cal: 58, protein: 2, carbs: 5, fats: 3.7 },
    { name: 'Flax Seeds (1 tbsp)', cal: 55, protein: 1.9, carbs: 3, fats: 4.3 },

    // Snacks & Fast Food
    { name: 'Samosa (1)', cal: 252, protein: 4, carbs: 24, fats: 15 },
    { name: 'Vada Pav (1)', cal: 290, protein: 5, carbs: 36, fats: 14 },
    { name: 'Pizza Slice (1)', cal: 285, protein: 12, carbs: 36, fats: 10 },
    { name: 'Burger (1 regular)', cal: 354, protein: 20, carbs: 29, fats: 17 },
    { name: 'French Fries (medium)', cal: 365, protein: 4, carbs: 48, fats: 17 },
    { name: 'Fried Chicken (1 piece)', cal: 294, protein: 24, carbs: 11, fats: 17 },
    { name: 'Hot Dog (1)', cal: 290, protein: 10, carbs: 24, fats: 17 },
    { name: 'Sandwich (veg)', cal: 230, protein: 7, carbs: 30, fats: 9 },
    { name: 'Wrap / Burrito', cal: 350, protein: 15, carbs: 40, fats: 14 },
    { name: 'Chips / Crisps (1 bag 30g)', cal: 155, protein: 2, carbs: 15, fats: 10 },
    { name: 'Biscuit / Cookie (1)', cal: 68, protein: 0.8, carbs: 9, fats: 3.2 },
    { name: 'Chocolate Bar (1 small)', cal: 235, protein: 3.4, carbs: 26, fats: 13 },
    { name: 'Ice Cream (1 scoop)', cal: 137, protein: 2.3, carbs: 16, fats: 7.3 },
    { name: 'Cake Slice (1)', cal: 350, protein: 4, carbs: 52, fats: 14 },
    { name: 'Donut (1)', cal: 289, protein: 5, carbs: 33, fats: 16 },

    // Indian Meals
    { name: 'Dal (1 cup)', cal: 180, protein: 12, carbs: 28, fats: 2.5 },
    { name: 'Rajma (1 cup)', cal: 210, protein: 13, carbs: 35, fats: 2 },
    { name: 'Chole / Chickpea Curry (1 cup)', cal: 240, protein: 12, carbs: 36, fats: 6 },
    { name: 'Aloo Gobi (1 cup)', cal: 160, protein: 4, carbs: 22, fats: 7 },
    { name: 'Palak Paneer (1 cup)', cal: 230, protein: 14, carbs: 8, fats: 16 },
    { name: 'Butter Chicken (1 cup)', cal: 340, protein: 28, carbs: 10, fats: 20 },
    { name: 'Biryani (1 plate)', cal: 490, protein: 18, carbs: 65, fats: 16 },
    { name: 'Fried Rice (1 plate)', cal: 370, protein: 8, carbs: 55, fats: 13 },
    { name: 'Tandoori Roti (1)', cal: 80, protein: 3, carbs: 15, fats: 1 },
    { name: 'Paratha (1 plain)', cal: 180, protein: 4, carbs: 24, fats: 7 },
    { name: 'Aloo Paratha (1)', cal: 230, protein: 5, carbs: 30, fats: 10 },
    { name: 'Puri (1)', cal: 101, protein: 1.5, carbs: 10, fats: 6 },
    { name: 'Khichdi (1 cup)', cal: 200, protein: 7, carbs: 34, fats: 4 },
    { name: 'Pulao (1 cup)', cal: 210, protein: 5, carbs: 38, fats: 5 },
    { name: 'Raita (1 cup)', cal: 70, protein: 4, carbs: 6, fats: 3 },
    { name: 'Pickle (1 tbsp)', cal: 25, protein: 0.2, carbs: 3, fats: 1.5 },

    // Sauces & Misc
    { name: 'Olive Oil (1 tbsp)', cal: 119, protein: 0, carbs: 0, fats: 13.5 },
    { name: 'Honey (1 tbsp)', cal: 64, protein: 0.1, carbs: 17.3, fats: 0 },
    { name: 'Sugar (1 tsp)', cal: 16, protein: 0, carbs: 4.2, fats: 0 },
    { name: 'Ketchup (1 tbsp)', cal: 20, protein: 0.2, carbs: 5, fats: 0 },
    { name: 'Mayonnaise (1 tbsp)', cal: 94, protein: 0.1, carbs: 0.1, fats: 10.3 },
    { name: 'Soy Sauce (1 tbsp)', cal: 9, protein: 0.9, carbs: 0.8, fats: 0 },
    { name: 'Hummus (2 tbsp)', cal: 70, protein: 2, carbs: 6, fats: 4 },
    { name: 'Avocado (1/2)', cal: 120, protein: 1.5, carbs: 6, fats: 11 },
    { name: 'Dark Chocolate (1 square)', cal: 55, protein: 0.7, carbs: 5, fats: 4 },
    { name: 'Popcorn (1 cup air-popped)', cal: 31, protein: 1, carbs: 6.2, fats: 0.4 },
    { name: 'Protein Bar (1)', cal: 210, protein: 20, carbs: 22, fats: 7 },
    { name: 'Energy Drink (1 can)', cal: 110, protein: 0, carbs: 28, fats: 0 },
    { name: 'Soda / Cola (1 can)', cal: 140, protein: 0, carbs: 39, fats: 0 },
    { name: 'Beer (1 pint)', cal: 182, protein: 1.6, carbs: 13, fats: 0 },
    { name: 'Wine (1 glass)', cal: 125, protein: 0.1, carbs: 3.8, fats: 0 },
];

// ========== FOOD SEARCH ==========

const foodSearchInput = document.getElementById('foodSearchInput');
const foodSearchResults = document.getElementById('foodSearchResults');

foodSearchInput.addEventListener('input', () => {
    const query = foodSearchInput.value.trim().toLowerCase();
    if (query.length < 2) {
        foodSearchResults.classList.remove('visible');
        return;
    }
    const matches = FOOD_DB.filter(f => f.name.toLowerCase().includes(query)).slice(0, 10);
    if (matches.length === 0) {
        foodSearchResults.innerHTML = '<div class="search-item"><span class="search-item-name" style="color:var(--text-muted)">No results found</span></div>';
    } else {
        foodSearchResults.innerHTML = matches.map((f, i) => `
            <div class="search-item" data-idx="${FOOD_DB.indexOf(f)}">
                <div>
                    <div class="search-item-name">${f.name}</div>
                    <div class="search-item-serving">P: ${f.protein}g · C: ${f.carbs}g · F: ${f.fats}g</div>
                </div>
                <span class="search-item-cal">${f.cal} kcal</span>
            </div>`).join('');
    }
    foodSearchResults.classList.add('visible');

    foodSearchResults.querySelectorAll('.search-item[data-idx]').forEach(el => {
        el.addEventListener('click', () => {
            const food = FOOD_DB[parseInt(el.dataset.idx)];
            fillFoodForm(food);
            foodSearchResults.classList.remove('visible');
            foodSearchInput.value = '';
        });
    });
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.food-search-box')) {
        foodSearchResults.classList.remove('visible');
    }
});

function fillFoodForm(food) {
    document.getElementById('foodName').value = food.name;
    document.getElementById('foodCalories').value = food.cal;
    document.getElementById('foodProtein').value = food.protein;
    document.getElementById('foodCarbs').value = food.carbs;
    document.getElementById('foodFats').value = food.fats;
    // Scroll to the form
    document.getElementById('foodForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ========== BARCODE SCANNER ==========

let scannerStream = null;
let scanInterval = null;

document.getElementById('btnScanBarcode').addEventListener('click', startScanner);
document.getElementById('btnStopScan').addEventListener('click', stopScanner);

async function startScanner() {
    const container = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    const status = document.getElementById('scannerStatus');

    container.style.display = 'block';
    status.textContent = 'Starting camera...';
    document.getElementById('scanResult').style.display = 'none';

    try {
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        video.srcObject = scannerStream;
        await video.play();
        status.textContent = 'Point camera at a barcode...';

        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
            const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
            scanInterval = setInterval(async () => {
                try {
                    const barcodes = await detector.detect(video);
                    if (barcodes.length > 0) {
                        const code = barcodes[0].rawValue;
                        status.textContent = `Barcode found: ${code}. Looking up...`;
                        clearInterval(scanInterval);
                        await lookupBarcode(code);
                    }
                } catch (e) { /* detection frame error, ignore */ }
            }, 500);
        } else {
            status.textContent = 'Barcode scanning not supported in this browser. Try Chrome or Edge on mobile.';
        }
    } catch (err) {
        status.textContent = 'Camera access denied. Please allow camera permission.';
        console.error('Camera error:', err);
    }
}

function stopScanner() {
    if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
    if (scannerStream) {
        scannerStream.getTracks().forEach(t => t.stop());
        scannerStream = null;
    }
    document.getElementById('scannerContainer').style.display = 'none';
}

async function lookupBarcode(code) {
    const status = document.getElementById('scannerStatus');
    const resultDiv = document.getElementById('scanResult');

    try {
        const resp = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`);
        const data = await resp.json();

        if (data.status === 1 && data.product) {
            const p = data.product;
            const name = p.product_name || 'Unknown Product';
            const nutrients = p.nutriments || {};
            const cal = Math.round(nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0);
            const protein = Math.round((nutrients.proteins_100g || nutrients.proteins || 0) * 10) / 10;
            const carbs = Math.round((nutrients.carbohydrates_100g || nutrients.carbohydrates || 0) * 10) / 10;
            const fats = Math.round((nutrients.fat_100g || nutrients.fat || 0) * 10) / 10;
            const serving = p.serving_size || '100g';

            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="scan-result-name">${escapeHtml(name)}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">Serving: ${escapeHtml(serving)} · Per 100g values shown</div>
                <div class="scan-result-macros">
                    <span>Calories: <strong>${cal} kcal</strong></span>
                    <span>Protein: <strong>${protein}g</strong></span>
                    <span>Carbs: <strong>${carbs}g</strong></span>
                    <span>Fats: <strong>${fats}g</strong></span>
                </div>
                <button class="btn-add-scanned" onclick="fillFoodForm({name:'${escapeHtml(name).replace(/'/g, "\\'")}', cal:${cal}, protein:${protein}, carbs:${carbs}, fats:${fats}})">
                    Add to Food Log
                </button>`;
            stopScanner();
        } else {
            status.textContent = 'Product not found in database. Try another barcode or search manually.';
        }
    } catch (err) {
        status.textContent = 'Network error. Check your connection and try again.';
        console.error('Barcode lookup error:', err);
    }
}


function calculateBMR(weight, height, age, gender) {
    // Mifflin-St Jeor
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    }
    return 10 * weight + 6.25 * height - 5 * age - 161;
}

function activityMultiplier(level) {
    const map = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    return map[level] || 1.2;
}

function calculateTDEE(bmr, actLevel) {
    return Math.round(bmr * activityMultiplier(actLevel));
}

function calculateBMI(weight, heightCm) {
    const m = heightCm / 100;
    return (weight / (m * m)).toFixed(1);
}

function calculateFatLossPlan(profile) {
    const { currentWeight, bodyFat, targetFatLoss, weeksToGoal, age, gender, height, activityLevel } = profile;
    const bmr = calculateBMR(currentWeight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    // Fat mass to lose (kg): body weight * (target fat loss % / 100)
    const fatToLoseKg = currentWeight * (targetFatLoss / 100);
    const targetWeight = currentWeight - fatToLoseKg;

    // Total calorie deficit needed: 1 kg fat ≈ 7700 calories
    const totalDeficit = fatToLoseKg * 7700;
    const dailyDeficit = Math.round(totalDeficit / (weeksToGoal * 7));

    // Cap deficit to safe range (max 1000 cal/day deficit)
    const safeDeficit = Math.min(dailyDeficit, 1000);
    const calorieTarget = Math.max(tdee - safeDeficit, gender === 'male' ? 1500 : 1200);

    const bmi = calculateBMI(currentWeight, height);

    return {
        bmr, tdee, bmi,
        fatToLoseKg: fatToLoseKg.toFixed(1),
        targetWeight: targetWeight.toFixed(1),
        dailyDeficit: safeDeficit,
        calorieTarget,
        weeklyDeficit: safeDeficit * 7
    };
}

// ========== WORKOUT ENGINE ==========

const WORKOUTS = {
    beginner: {
        highBF: [  // >25% BF or BMI > 30
            {
                day: 'Day 1 - Monday',
                type: 'Low Impact Cardio + Core',
                exercises: [
                    { name: 'Brisk Walking', detail: '30 min' },
                    { name: 'Bodyweight Squats', detail: '3 × 12' },
                    { name: 'Wall Push-ups', detail: '3 × 10' },
                    { name: 'Dead Bug', detail: '3 × 10 each side' },
                    { name: 'Plank Hold', detail: '3 × 20 sec' }
                ],
                note: 'Focus on form over speed. Walk at a pace where you can still talk but are slightly breathless.'
            },
            {
                day: 'Day 2 - Wednesday',
                type: 'Full Body Strength (Light)',
                exercises: [
                    { name: 'Goblet Squat (or BW)', detail: '3 × 10' },
                    { name: 'Incline Push-ups', detail: '3 × 8' },
                    { name: 'Dumbbell Rows', detail: '3 × 10 each' },
                    { name: 'Glute Bridges', detail: '3 × 15' },
                    { name: 'Bird Dog', detail: '3 × 8 each side' }
                ],
                note: 'Use light weights or bodyweight. Rest 60-90 sec between sets.'
            },
            {
                day: 'Day 3 - Friday',
                type: 'Cardio + Mobility',
                exercises: [
                    { name: 'Cycling / Swimming', detail: '25 min moderate' },
                    { name: 'Step-ups (low step)', detail: '3 × 10 each leg' },
                    { name: 'Seated Shoulder Press', detail: '3 × 10' },
                    { name: 'Stretching Routine', detail: '10 min' }
                ],
                note: 'Low-impact cardio protects your joints while still burning calories.'
            },
            {
                day: 'Day 4 & 6 - Tue/Thu',
                type: 'Active Recovery',
                exercises: [
                    { name: 'Walking', detail: '20-30 min easy pace' },
                    { name: 'Foam Rolling', detail: '10 min' },
                    { name: 'Light Yoga / Stretching', detail: '15 min' }
                ],
                note: 'Recovery is essential for fat loss. Keep moving but stay relaxed.'
            }
        ],
        lowBF: [  // <25% BF
            {
                day: 'Day 1 - Monday',
                type: 'Upper Body + Cardio',
                exercises: [
                    { name: 'Push-ups', detail: '3 × 12' },
                    { name: 'Dumbbell Rows', detail: '3 × 12' },
                    { name: 'Shoulder Press', detail: '3 × 10' },
                    { name: 'Bicep Curls', detail: '3 × 12' },
                    { name: 'Jump Rope / Jogging', detail: '15 min' }
                ],
                note: 'Focus on controlled movements. Increase weight when reps feel easy.'
            },
            {
                day: 'Day 2 - Wednesday',
                type: 'Lower Body + Core',
                exercises: [
                    { name: 'Squats', detail: '3 × 15' },
                    { name: 'Lunges', detail: '3 × 12 each leg' },
                    { name: 'Romanian Deadlift (light)', detail: '3 × 10' },
                    { name: 'Calf Raises', detail: '3 × 15' },
                    { name: 'Bicycle Crunches', detail: '3 × 15' }
                ],
                note: 'Compound movements burn more calories and build lean muscle.'
            },
            {
                day: 'Day 3 - Friday',
                type: 'Full Body Circuit',
                exercises: [
                    { name: 'Burpees (modified)', detail: '3 × 8' },
                    { name: 'Kettlebell Swings (or BW)', detail: '3 × 12' },
                    { name: 'Mountain Climbers', detail: '3 × 20' },
                    { name: 'Plank', detail: '3 × 30 sec' },
                    { name: 'Brisk Walk / Jog', detail: '15 min' }
                ],
                note: 'Circuit style: rest 30 sec between exercises, 90 sec between rounds.'
            }
        ]
    },
    intermediate: {
        highBF: [
            {
                day: 'Day 1 - Monday',
                type: 'Push + HIIT',
                exercises: [
                    { name: 'Bench Press / Push-ups', detail: '4 × 10' },
                    { name: 'Incline Dumbbell Press', detail: '3 × 12' },
                    { name: 'Overhead Press', detail: '3 × 10' },
                    { name: 'Tricep Dips', detail: '3 × 12' },
                    { name: 'HIIT Sprints', detail: '8 × 30s on / 60s off' }
                ],
                note: 'HIIT after weights maximizes fat burn via EPOC (afterburn effect).'
            },
            {
                day: 'Day 2 - Tuesday',
                type: 'Pull + Core',
                exercises: [
                    { name: 'Barbell/Dumbbell Rows', detail: '4 × 10' },
                    { name: 'Lat Pulldowns / Pull-ups', detail: '3 × 8' },
                    { name: 'Face Pulls', detail: '3 × 15' },
                    { name: 'Bicep Curls', detail: '3 × 12' },
                    { name: 'Hanging Leg Raises', detail: '3 × 10' },
                    { name: 'Russian Twists', detail: '3 × 15 each side' }
                ],
                note: 'Control the negative (lowering) phase for more muscle activation.'
            },
            {
                day: 'Day 3 - Wednesday',
                type: 'Active Recovery / Cardio',
                exercises: [
                    { name: 'Incline Walking', detail: '30 min' },
                    { name: 'Foam Rolling', detail: '15 min' },
                    { name: 'Mobility Work', detail: '10 min' }
                ],
                note: 'Incline treadmill walking at 3.5 mph, 10-15% incline is excellent for fat loss.'
            },
            {
                day: 'Day 4 - Thursday',
                type: 'Legs + Glutes',
                exercises: [
                    { name: 'Squats', detail: '4 × 10' },
                    { name: 'Romanian Deadlifts', detail: '3 × 12' },
                    { name: 'Leg Press', detail: '3 × 12' },
                    { name: 'Walking Lunges', detail: '3 × 12 each' },
                    { name: 'Calf Raises', detail: '4 × 15' }
                ],
                note: 'Legs are your biggest muscle group. Training them boosts metabolism significantly.'
            },
            {
                day: 'Day 5 - Friday',
                type: 'Full Body Metabolic',
                exercises: [
                    { name: 'Thrusters', detail: '4 × 10' },
                    { name: 'Renegade Rows', detail: '3 × 8 each' },
                    { name: 'Box Jumps (or step-ups)', detail: '3 × 10' },
                    { name: 'Battle Ropes / Burpees', detail: '4 × 30 sec' },
                    { name: 'Plank Walkouts', detail: '3 × 8' }
                ],
                note: 'Keep rest periods short (45-60 sec) to maintain elevated heart rate.'
            },
            {
                day: 'Day 6 - Saturday',
                type: 'Steady Cardio',
                exercises: [
                    { name: 'Running / Cycling / Swimming', detail: '40-45 min moderate' }
                ],
                note: 'Zone 2 cardio (can hold a conversation) is ideal for fat oxidation.'
            }
        ],
        lowBF: [
            {
                day: 'Day 1 - Monday',
                type: 'Upper Push + Abs',
                exercises: [
                    { name: 'Bench Press', detail: '4 × 8' },
                    { name: 'Incline DB Press', detail: '3 × 10' },
                    { name: 'Overhead Press', detail: '4 × 8' },
                    { name: 'Cable Flyes', detail: '3 × 12' },
                    { name: 'Cable Crunches', detail: '3 × 15' }
                ],
                note: 'Heavier weights with moderate reps preserve muscle while cutting.'
            },
            {
                day: 'Day 2 - Tuesday',
                type: 'Lower Body',
                exercises: [
                    { name: 'Squats', detail: '4 × 8' },
                    { name: 'Romanian Deadlifts', detail: '4 × 10' },
                    { name: 'Bulgarian Split Squats', detail: '3 × 10 each' },
                    { name: 'Leg Curls', detail: '3 × 12' },
                    { name: 'Calf Raises', detail: '4 × 15' }
                ],
                note: 'Keep protein high on leg days to support recovery.'
            },
            {
                day: 'Day 3 - Wednesday',
                type: 'Cardio + Core',
                exercises: [
                    { name: 'HIIT Intervals', detail: '20 min' },
                    { name: 'Hanging Leg Raises', detail: '3 × 12' },
                    { name: 'Plank Variations', detail: '3 × 45 sec' }
                ],
                note: 'Short but intense. Push hard on the intervals.'
            },
            {
                day: 'Day 4 - Thursday',
                type: 'Upper Pull',
                exercises: [
                    { name: 'Pull-ups / Lat Pulldown', detail: '4 × 8' },
                    { name: 'Barbell Rows', detail: '4 × 10' },
                    { name: 'Face Pulls', detail: '3 × 15' },
                    { name: 'Barbell Curls', detail: '3 × 10' },
                    { name: 'Hammer Curls', detail: '3 × 12' }
                ],
                note: 'Squeeze at the top of every back exercise for maximum contraction.'
            },
            {
                day: 'Day 5 - Friday',
                type: 'Full Body + HIIT',
                exercises: [
                    { name: 'Deadlifts', detail: '4 × 6' },
                    { name: 'Push-ups', detail: '3 × max' },
                    { name: 'DB Lunges', detail: '3 × 10 each' },
                    { name: 'Farmers Walk', detail: '3 × 40 sec' },
                    { name: 'Sprint Intervals', detail: '10 × 20s on / 40s off' }
                ],
                note: 'Deadlifts and farmers walks are full-body fat-burning monsters.'
            }
        ]
    },
    advanced: {
        highBF: [
            {
                day: 'Day 1 - Monday',
                type: 'Push (Heavy) + Finisher',
                exercises: [
                    { name: 'Barbell Bench Press', detail: '5 × 5' },
                    { name: 'Incline DB Press', detail: '4 × 10' },
                    { name: 'Overhead Press', detail: '4 × 8' },
                    { name: 'Weighted Dips', detail: '3 × 10' },
                    { name: 'Sled Push / Assault Bike', detail: '5 × 30 sec all-out' }
                ],
                note: 'Heavy compound lifts preserve strength in a deficit. The finisher drills burn extra calories.'
            },
            {
                day: 'Day 2 - Tuesday',
                type: 'Pull (Heavy) + Core',
                exercises: [
                    { name: 'Deadlifts', detail: '5 × 5' },
                    { name: 'Weighted Pull-ups', detail: '4 × 6' },
                    { name: 'Barbell Rows', detail: '4 × 8' },
                    { name: 'Face Pulls', detail: '3 × 15' },
                    { name: 'Ab Wheel Rollouts', detail: '3 × 10' },
                    { name: 'Dragon Flags (assisted)', detail: '3 × 6' }
                ],
                note: 'Keep deadlift volume moderate to manage recovery in a caloric deficit.'
            },
            {
                day: 'Day 3 - Wednesday',
                type: 'Conditioning',
                exercises: [
                    { name: 'Rowing Machine Intervals', detail: '8 × 250m sprint / 60s rest' },
                    { name: 'Battle Ropes', detail: '5 × 30 sec' },
                    { name: 'Box Jumps', detail: '4 × 8' },
                    { name: 'Mobility/Stretching', detail: '15 min' }
                ],
                note: 'Pure conditioning day. Heart rate should be 80-90% max during intervals.'
            },
            {
                day: 'Day 4 - Thursday',
                type: 'Legs (Heavy)',
                exercises: [
                    { name: 'Back Squats', detail: '5 × 5' },
                    { name: 'Front Squats', detail: '3 × 8' },
                    { name: 'Walking Lunges (weighted)', detail: '3 × 12 each' },
                    { name: 'Leg Press', detail: '3 × 15' },
                    { name: 'Standing Calf Raises', detail: '4 × 15' }
                ],
                note: 'Squat depth matters. Full ROM = more muscle activation = more calories burned.'
            },
            {
                day: 'Day 5 - Friday',
                type: 'Upper Hypertrophy + HIIT',
                exercises: [
                    { name: 'DB Bench Press', detail: '4 × 12' },
                    { name: 'Cable Rows', detail: '4 × 12' },
                    { name: 'Lateral Raises', detail: '4 × 15' },
                    { name: 'Supersets: Curls/Tricep Ext', detail: '3 × 12 each' },
                    { name: 'Tabata Burpees', detail: '4 min (20s on / 10s off)' }
                ],
                note: 'Hypertrophy day with higher reps. Finish with a brutal Tabata.'
            },
            {
                day: 'Day 6 - Saturday',
                type: 'Steady State Cardio + Abs',
                exercises: [
                    { name: 'Incline Walk / Light Jog', detail: '45-60 min' },
                    { name: 'Hanging Leg Raises', detail: '4 × 12' },
                    { name: 'Cable Woodchops', detail: '3 × 12 each side' }
                ],
                note: 'Long steady cardio complements HIIT for maximum weekly fat burn.'
            }
        ],
        lowBF: [
            {
                day: 'Day 1 - Monday',
                type: 'Heavy Compounds',
                exercises: [
                    { name: 'Bench Press', detail: '5 × 5' },
                    { name: 'Squats', detail: '5 × 5' },
                    { name: 'Barbell Rows', detail: '5 × 5' },
                    { name: 'Military Press', detail: '4 × 6' }
                ],
                note: 'Strength-focused to maintain muscle mass during aggressive cuts.'
            },
            {
                day: 'Day 2 - Tuesday',
                type: 'HIIT + Accessories',
                exercises: [
                    { name: 'Sprint Intervals', detail: '12 × 20s / 40s rest' },
                    { name: 'Pull-ups (weighted)', detail: '4 × 6' },
                    { name: 'Dips (weighted)', detail: '4 × 8' },
                    { name: 'Farmers Walk', detail: '4 × 40 sec' }
                ],
                note: 'Sprint training torches fat while preserving fast-twitch muscle fibers.'
            },
            {
                day: 'Day 3 - Wednesday',
                type: 'Active Recovery',
                exercises: [
                    { name: 'Light Swimming or Yoga', detail: '30-45 min' },
                    { name: 'Foam Rolling', detail: '15 min' }
                ],
                note: 'Recovery is even more critical when body fat is already low.'
            },
            {
                day: 'Day 4 - Thursday',
                type: 'Deadlift Day + Volume',
                exercises: [
                    { name: 'Deadlifts', detail: '5 × 3 (heavy)' },
                    { name: 'Front Squats', detail: '4 × 8' },
                    { name: 'RDLs', detail: '3 × 10' },
                    { name: 'Ab Wheel', detail: '3 × 12' }
                ],
                note: 'Low rep deadlifts keep strength up. Volume work drives hypertrophy stimulus.'
            },
            {
                day: 'Day 5 - Friday',
                type: 'Metabolic Conditioning',
                exercises: [
                    { name: 'Clean and Press', detail: '5 × 5' },
                    { name: 'Box Jumps', detail: '4 × 8' },
                    { name: 'Renegade Rows', detail: '4 × 8 each' },
                    { name: 'Assault Bike / Rowing', detail: '5 × 1 min sprint' },
                    { name: 'Plank', detail: '3 × 60 sec' }
                ],
                note: 'Full-body metabolic conditioning is the most effective fat burner at lower body fat.'
            },
            {
                day: 'Day 6 - Saturday',
                type: 'Cardio: Fasted or Fed',
                exercises: [
                    { name: 'Moderate Run / Cycle', detail: '35-45 min' }
                ],
                note: 'At lower body fat, fasted cardio may help; otherwise fed is fine. Stay consistent.'
            }
        ]
    }
};

function getWeightCategory(bmi, bodyFat) {
    if (bodyFat && bodyFat > 25) return 'highBF';
    if (!bodyFat && bmi > 28) return 'highBF';
    return 'lowBF';
}

function generateWorkoutPlan(profile) {
    const level = profile.fitnessLevel;
    const bmi = calculateBMI(profile.currentWeight, profile.height);
    const cat = getWeightCategory(parseFloat(bmi), profile.bodyFat);
    return WORKOUTS[level][cat];
}

// ========== RENDER FUNCTIONS ==========

function renderSummary(plan, profile) {
    document.getElementById('summaryCard').style.display = 'block';
    document.getElementById('sumCurrentWeight').textContent = profile.currentWeight + ' kg';
    document.getElementById('sumTargetWeight').textContent = plan.targetWeight + ' kg';
    document.getElementById('sumFatToLose').textContent = plan.fatToLoseKg + ' kg';
    document.getElementById('sumTDEE').textContent = plan.tdee + ' kcal';
    document.getElementById('sumCalTarget').textContent = plan.calorieTarget + ' kcal';
    document.getElementById('sumWeeklyDeficit').textContent = plan.weeklyDeficit + ' kcal';
    document.getElementById('sumBMI').textContent = plan.bmi;
    document.getElementById('sumTimeline').textContent = profile.weeksToGoal + ' weeks';
}

function renderWorkoutPlan(workouts) {
    const container = document.getElementById('workoutPlanContainer');
    container.style.display = 'block';
    document.getElementById('noPlanMsg').style.display = 'none';

    container.innerHTML = workouts.map(day => `
        <div class="workout-day">
            <h3>${day.day}</h3>
            <div class="day-type">${day.type}</div>
            <ul class="exercise-list">
                ${day.exercises.map(ex => `
                    <li class="exercise-item">
                        <span class="exercise-name">${ex.name}</span>
                        <span class="exercise-detail">${ex.detail}</span>
                    </li>
                `).join('')}
            </ul>
            <div class="workout-note">${day.note}</div>
        </div>
    `).join('');
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getTodayFoods() {
    return state.foodLog[todayKey()] || [];
}

function renderFoodLog() {
    const foods = getTodayFoods();
    const container = document.getElementById('foodLog');

    if (foods.length === 0) {
        container.innerHTML = '<p class="empty-state">No food entries yet today.</p>';
        updateCalorieRing(0);
        updateMacros(0, 0, 0);
        return;
    }

    // Group by meal
    const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
    foods.forEach((f, i) => { f._idx = i; meals[f.meal].push(f); });

    let html = '';
    const mealNames = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
    for (const [key, items] of Object.entries(meals)) {
        if (items.length === 0) continue;
        html += `<div class="meal-header">${mealNames[key]}</div>`;
        items.forEach(f => {
            html += `
                <div class="food-entry">
                    <div class="food-entry-info">
                        <div class="food-entry-name">${escapeHtml(f.name)}</div>
                        <div class="food-entry-meta">P: ${f.protein}g · C: ${f.carbs}g · F: ${f.fats}g</div>
                    </div>
                    <span class="food-entry-cal">${f.calories} kcal</span>
                    <button class="btn-delete" data-idx="${f._idx}">✕</button>
                </div>`;
        });
    }
    container.innerHTML = html;

    // Attach delete handlers
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            state.foodLog[todayKey()].splice(idx, 1);
            saveState(state);
            renderFoodLog();
        });
    });

    const totals = foods.reduce((acc, f) => ({
        cal: acc.cal + f.calories,
        p: acc.p + f.protein,
        c: acc.c + f.carbs,
        f: acc.f + f.fats
    }), { cal: 0, p: 0, c: 0, f: 0 });

    updateCalorieRing(totals.cal);
    updateMacros(totals.p, totals.c, totals.f);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateCalorieRing(consumed) {
    const goal = state.plan ? state.plan.calorieTarget : 2000;
    document.getElementById('calorieGoal').textContent = goal;
    document.getElementById('caloriesConsumed').textContent = consumed;

    const pct = Math.min(consumed / goal, 1.5);
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (pct * circumference);
    const arc = document.getElementById('calorieArc');
    arc.style.strokeDashoffset = Math.max(offset, 0);

    if (consumed > goal) {
        arc.style.stroke = '#ff4757';
        document.getElementById('caloriesConsumed').classList.add('calorie-over');
        document.getElementById('caloriesConsumed').classList.remove('calorie-under');
    } else {
        arc.style.stroke = '#00d4aa';
        document.getElementById('caloriesConsumed').classList.remove('calorie-over');
        document.getElementById('caloriesConsumed').classList.add('calorie-under');
    }
}

function updateMacros(protein, carbs, fats) {
    const goal = state.plan ? state.plan.calorieTarget : 2000;
    // Targets: 40% protein, 35% carbs, 25% fat (for fat loss)
    const protTarget = Math.round((goal * 0.4) / 4);
    const carbTarget = Math.round((goal * 0.35) / 4);
    const fatTarget = Math.round((goal * 0.25) / 9);

    document.getElementById('proteinVal').textContent = `${protein}g / ${protTarget}g`;
    document.getElementById('carbsVal').textContent = `${carbs}g / ${carbTarget}g`;
    document.getElementById('fatsVal').textContent = `${fats}g / ${fatTarget}g`;

    document.getElementById('proteinBar').style.width = Math.min((protein / protTarget) * 100, 100) + '%';
    document.getElementById('carbsBar').style.width = Math.min((carbs / carbTarget) * 100, 100) + '%';
    document.getElementById('fatsBar').style.width = Math.min((fats / fatTarget) * 100, 100) + '%';
}

function renderWeightProgress() {
    const logs = state.weightLog;
    const container = document.getElementById('weightHistory');

    if (logs.length === 0) {
        container.innerHTML = '<p class="empty-state">No weight entries yet.</p>';
        drawEmptyChart();
        return;
    }

    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.slice(-10).reverse().map(e =>
        `<div class="weight-entry">
            <span>${new Date(e.date).toLocaleDateString()}</span>
            <span>${e.weight} kg</span>
        </div>`
    ).join('');

    drawChart(sorted);
}

function drawEmptyChart() {
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8888aa';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Log your weight to see progress', canvas.width / 2, 150);
}

function drawChart(data) {
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    const padding = { top: 30, right: 30, bottom: 40, left: 55 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const weights = data.map(d => d.weight);
    const minW = Math.floor(Math.min(...weights) - 2);
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const range = maxW - minW || 1;

    // Grid lines
    ctx.strokeStyle = '#2d2d3d';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (h / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();

        const val = (maxW - (range / gridLines) * i).toFixed(1);
        ctx.fillStyle = '#8888aa';
        ctx.font = '11px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText(val, padding.left - 8, y + 4);
    }

    // Target line
    if (state.plan) {
        const targetY = padding.top + h - ((parseFloat(state.plan.targetWeight) - minW) / range) * h;
        ctx.strokeStyle = '#00d4aa44';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, targetY);
        ctx.lineTo(canvas.width - padding.right, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#00d4aa';
        ctx.font = '10px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillText('Target', canvas.width - padding.right + 2, targetY - 4);
    }

    // Data points & line
    if (data.length === 1) {
        const x = padding.left + w / 2;
        const y = padding.top + h - ((data[0].weight - minW) / range) * h;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4aa';
        ctx.fill();
        return;
    }

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * w,
        y: padding.top + h - ((d.weight - minW) / range) * h
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, canvas.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0.0)');
    ctx.beginPath();
    ctx.moveTo(points[0].x, canvas.height - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, canvas.height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4aa';
        ctx.fill();
        ctx.strokeStyle = '#0f0f1a';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // X-axis labels
    ctx.fillStyle = '#8888aa';
    ctx.font = '10px Segoe UI';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((d, i) => {
        if (i % step === 0 || i === data.length - 1) {
            const x = padding.left + (i / (data.length - 1)) * w;
            const label = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            ctx.fillText(label, x, canvas.height - padding.bottom + 18);
        }
    });
}

// ========== EVENT HANDLERS ==========

// Profile form
document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
        name: document.getElementById('name').value.trim(),
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        height: parseInt(document.getElementById('height').value),
        currentWeight: parseFloat(document.getElementById('currentWeight').value),
        bodyFat: parseFloat(document.getElementById('bodyFat').value) || null,
        targetFatLoss: parseFloat(document.getElementById('targetFatLoss').value),
        activityLevel: document.getElementById('activityLevel').value,
        weeksToGoal: parseInt(document.getElementById('weeksToGoal').value),
        fitnessLevel: document.getElementById('fitnessLevel').value
    };

    const planCalc = calculateFatLossPlan(profile);
    const workouts = generateWorkoutPlan(profile);

    state.profile = profile;
    state.plan = planCalc;
    saveState(state);

    renderSummary(planCalc, profile);
    renderWorkoutPlan(workouts);
    renderFoodLog(); // update calorie goal
});

// Food form
document.getElementById('foodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
        name: document.getElementById('foodName').value.trim(),
        meal: document.getElementById('mealType').value,
        calories: parseInt(document.getElementById('foodCalories').value) || 0,
        protein: parseFloat(document.getElementById('foodProtein').value) || 0,
        carbs: parseFloat(document.getElementById('foodCarbs').value) || 0,
        fats: parseFloat(document.getElementById('foodFats').value) || 0,
        time: new Date().toISOString()
    };

    const key = todayKey();
    if (!state.foodLog[key]) state.foodLog[key] = [];
    state.foodLog[key].push(entry);
    saveState(state);

    e.target.reset();
    renderFoodLog();
});

// Weight log form
document.getElementById('weightForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const weight = parseFloat(document.getElementById('logWeight').value);
    const today = todayKey();

    // Replace today's entry if exists
    const existing = state.weightLog.findIndex(w => w.date === today);
    if (existing >= 0) {
        state.weightLog[existing].weight = weight;
    } else {
        state.weightLog.push({ date: today, weight });
    }
    saveState(state);
    document.getElementById('logWeight').value = '';
    renderWeightProgress();
});

// ========== INIT ==========

function init() {
    // Restore profile form if profile exists
    if (state.profile) {
        const p = state.profile;
        document.getElementById('name').value = p.name || '';
        document.getElementById('age').value = p.age || '';
        document.getElementById('gender').value = p.gender || '';
        document.getElementById('height').value = p.height || '';
        document.getElementById('currentWeight').value = p.currentWeight || '';
        document.getElementById('bodyFat').value = p.bodyFat || '';
        document.getElementById('targetFatLoss').value = p.targetFatLoss || '';
        document.getElementById('activityLevel').value = p.activityLevel || '';
        document.getElementById('weeksToGoal').value = p.weeksToGoal || '';
        document.getElementById('fitnessLevel').value = p.fitnessLevel || '';

        if (state.plan) {
            renderSummary(state.plan, p);
            const workouts = generateWorkoutPlan(p);
            renderWorkoutPlan(workouts);
        }
    }

    renderFoodLog();
    renderWeightProgress();
}

init();
