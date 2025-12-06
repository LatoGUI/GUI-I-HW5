/*
    File: script.js
    GUI Assignment: HW5 - Implementing a Bit of Scrabble with Drag-and-Drop
    Platon Supranovich, UMass Lowell Computer Science, Platon_Supranovich@student.uml.edu
    Copyright (c) 2025 by Platon. All rights reserved. May be freely copied or
    excerpted for educational purposes with credit to the author.
    updated by PS on November 27, 2025 at 8:00 AM
*/

let tileData = {};
let totalScore = 0; 
let highestScore = 0; // Tracks highest game score across resets

$(function () {
    // 1. Initialize event listeners and droppables ONCE
    setupDroppables();

    // Rack Droppable 
    $('#rack').droppable({
        accept: '.tile',
        drop: function (event, ui) {
                const droppedTile = ui.draggable;
                $(this).append(droppedTile);
                droppedTile.css({ 'position': '', 'left': '', 'top': '', 'opacity': '1' });
                updateWordDisplay(); 
        }
    });

    // 2. Load the initial data to start the game
    loadTileData();

    // Next Word logic
    $('#nextWord').click(function() {
        // Calculate score for this word
        const roundScore = calculateScore();
        
        // Add to total score
        totalScore += roundScore;
        $('#score').text(`Total Score: ${totalScore}`);
        
        // Clear the board 
        $('.drop-slot .tile').remove(); 

        // Replenish the rack back to 7 tiles
        replenishRack();
        
        // Reset word display
        $('#wordDisplay').text(`Word: `);
    });

    // Handle the New Game button click
    $('#resetGame').click(resetGame);
});

// Loads fresh data from JSON
function loadTileData() {
    $.getJSON("graphics_data/pieces.json", function (data) {
        tileData = convertToTileMap(data.pieces);
        replenishRack(); // Deal the first hand
    });
}

function resetGame() {
    // 1. Check/Update Highest Score based on the game just finished
    if (totalScore > highestScore) {
        highestScore = totalScore;
        $('#highestScore').text(`Highest Score: ${highestScore}`);
    }

    // 2. Remove tiles from board AND rack
    $('.drop-slot .tile').remove();
    $('#rack').empty();

    // 3. Reset current game score
    totalScore = 0;
    $('#score').text(`Total Score: ${totalScore}`);
    $('#wordDisplay').text(`Word: `);

    // 4. RELOAD DATA 
    loadTileData();
}

function getCurrentWord() {
    let word = "";
    let foundStart = false;
    
    $('.drop-slot').each(function() {
        const tile = $(this).find('.tile');
        if (tile.length > 0) {
            // Found a letter
            word += tile.data('letter');
            foundStart = true;
        } else {
            // Hit an empty slot
            if (foundStart) {
                // If we had already started finding letters, this gap means the word ended.
                return false; // Break the loop
            }
            // If we haven't found letters yet we just ignore this empty slot and keep looking.
        }
    });
    return word;
}

// Logic to top up the rack to 7 tiles
function replenishRack() {
    // Calculate remaining tiles from the tileData
    let remainingTiles = 0;
    for (const letter in tileData) {
        remainingTiles += tileData[letter].amount;
    }
    
    const currentTiles = $('#rack .tile').length;
    const needed = 7 - currentTiles;

    if (needed <= 0) {
        $('#remainingTiles').text(`Remaining Tiles: ${remainingTiles}`);
        setupDraggables();
        return; 
    }

    const letters = Object.keys(tileData);
    let added = 0;
    let attempts = 0; 
    while (added < needed && attempts < 1000) {
        attempts++;
        const randLetter = letters[Math.floor(Math.random() * letters.length)];
        const tileInfo = tileData[randLetter];

        if (tileInfo.amount > 0) {
            tileInfo.amount--;
            $('#rack').append(createTile(randLetter));
            added++;
        }
    }
    
    // Update count after dealing
    remainingTiles = 0;
    for (const letter in tileData) {
        remainingTiles += tileData[letter].amount;
    }
    $('#remainingTiles').text(`Remaining Tiles: ${remainingTiles}`);

    setupDraggables();
}

function createTile(letter) {
    return $('<div></div>')
        .addClass('tile')
        .attr('data-letter', letter)
        .attr('title', `Value: ${tileData[letter].value}`) 
        .css('background-image', `url(graphics_data/Scrabble_Tiles/Scrabble_Tile_${letter}.jpg)`);
}

function setupDraggables() {
    $('.tile').each(function() {
        if ($(this).data('ui-draggable')) {
                $(this).draggable('destroy');
        }
    });
    $('.tile').css('opacity', 1); 

    $('.tile').draggable({
        revert: 'invalid',
        helper: 'clone',
        appendTo: 'body',
        start: function() { $(this).css('opacity', 0); },
        stop: function() { 
            $(this).css('opacity', 1);
            updateWordDisplay();
        }
    });
}

function updateWordDisplay() {
    const currentWord = getCurrentWord();
    $('#wordDisplay').text(`Word: ${currentWord}`);
}

function setupDroppables() {
    $('.drop-slot').droppable({
        accept: function(draggable) {
            const $thisSlot = $(this);
            if ($thisSlot.find('.tile').length > 0) return false;

            const $boardTiles = $('.drop-slot .tile');
            if ($boardTiles.length === 0) return true;

            const index = $thisSlot.index(); 
            const $allSlots = $('.drop-slot');
            const hasLeft = (index > 0) && $($allSlots[index - 1]).find('.tile').length > 0;
            const hasRight = (index < $allSlots.length - 1) && $($allSlots[index + 1]).find('.tile').length > 0;

            return hasLeft || hasRight;
        },
        drop: function (event, ui) {
            const $slot = $(this);
            const $tile = ui.draggable;
            $slot.append($tile);
            $tile.css({ 'position': '', 'left': '', 'top': '' });
        }
    });
}

function convertToTileMap(pieces) {
    let map = {};
    pieces.forEach(piece => {
        map[piece.letter] = { value: piece.value, amount: piece.amount };
    });
    return map;
}

function calculateScore() {
    let wordScore = 0;
    let wordMultiplier = 1;

    $('.drop-slot').each(function () {
        const tile = $(this).find('.tile');
        if (tile.length > 0) {
            const letter = tile.data('letter');
            let letterVal = tileData[letter].value;
            const bonus = $(this).data('bonus');

            if (bonus === 'double-letter') {
                letterVal *= 2;
            } else if (bonus === 'triple-word') {
                wordMultiplier *= 3;
            }
            wordScore += letterVal;
        }
    });

    return wordScore * wordMultiplier;
}
