require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');
const fs = require('fs');
const path = require('path');

/*
 * This script updates menu item images by parsing a Markdown file.
 * It reads `menu_image_urls.md` and applies the URLs found in code blocks.
 * This effectively allows batch updating images from a text file.
 */
const updateMenuImagesFromFile = async () => {
    try {
        await connectDB();
        console.log('\n🔄 UPDATING MENU IMAGES FROM FILE\n');
        console.log('═'.repeat(70));

        // Path to the markdown file containing URLs
        const filePath = path.join(__dirname, '..', 'menu_image_urls.md');
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Parse URLs from the file
        const imageUrls = {};
        const lines = fileContent.split('\n');
        let currentItem = null;
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect start/end of code blocks
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }

            // Identify food item headers (e.g., "### 1. Idli")
            if (line.startsWith('###') && line.includes('.')) {
                const match = line.match(/###\s*\d+\.\s*(.+?)(\s*\(|$)/);
                if (match) {
                    currentItem = match[1].trim();
                }
            }

            // Extract valid http/https URLs inside code blocks
            if (inCodeBlock && currentItem && line.startsWith('http')) {
                imageUrls[currentItem] = line;
                currentItem = null; // Reset after finding URL
            }
        }

        console.log(`\nFound ${Object.keys(imageUrls).length} URLs in file\n`);

        if (Object.keys(imageUrls).length > 0) {
            console.log('URLs found for:');
            Object.keys(imageUrls).forEach(item => console.log(`  - ${item}`));
            console.log('');
        }

        // Apply updates to the database
        const menuItems = await MenuItem.find().sort({ name: 1 });
        let updated = 0;
        let skipped = 0;

        for (const item of menuItems) {
            const imageUrl = imageUrls[item.name];

            if (imageUrl) {
                item.imageUrl = imageUrl;
                await item.save();
                console.log(`${item.name.padEnd(20)} - Updated`);
                updated++;
            } else {
                console.log(`${item.name.padEnd(20)} - Skipped (no URL in file)`);
                skipped++;
            }
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`\nSUMMARY:`);
        console.log(`   Updated: ${updated}/${menuItems.length} items`);
        console.log(`  Skipped: ${skipped}/${menuItems.length} items`);

        if (updated === menuItems.length) {
            console.log(`\nSUCCESS! All menu items updated!\n`);
        } else if (updated > 0) {
            console.log(`\n  ${skipped} items still need URLs in menu_image_urls.md\n`);
        } else {
            console.log(`\n No items updated. Please add URLs to menu_image_urls.md\n`);
        }

        console.log('═'.repeat(70));
        process.exit(0);
    } catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
};

updateMenuImagesFromFile();
