class Imposition {
    constructor() {
        this.sheets = {
            'SRA3': { width: 450, height: 320, name: 'SRA3 (450x320mm)' },
            'A4': { width: 297, height: 210, name: 'A4' }
        };
        // Print engine margins (e.g. 5mm non-printable area)
        this.margins = { top: 5, bottom: 5, left: 5, right: 5 };
        this.gap = 2; // Gap between items (e.g. for cutting)
    }

    /**
     * Calculates the best fit (N-up) for a given item size on a sheet.
     * @param {number} itemWidth - Width in mm (including bleed? No, usually trim size + bleed gap handled separately)
     * @param {number} itemHeight - Height in mm
     * @param {string} sheetSize - 'SRA3' or 'A4'
     */
    calculateLayout(itemWidth, itemHeight, sheetSize = 'SRA3') {
        const sheet = this.sheets[sheetSize];
        if (!sheet) throw new Error(`Unknown sheet size: ${sheetSize}`);

        // Effective printable area
        const printableW = sheet.width - this.margins.left - this.margins.right;
        const printableH = sheet.height - this.margins.top - this.margins.bottom;

        // Try Normal Orientation
        const layoutNormal = this.getGrid(printableW, printableH, itemWidth, itemHeight);

        // Try Rotated Item Orientation
        const layoutRotated = this.getGrid(printableW, printableH, itemHeight, itemWidth);

        // Select best fit (max yield)
        const best = (layoutRotated.count > layoutNormal.count) ?
            { ...layoutRotated, rotated: true } :
            { ...layoutNormal, rotated: false };

        return {
            sheet: sheet,
            item: { width: itemWidth, height: itemHeight },
            yield: best.count,
            rows: best.rows,
            cols: best.cols,
            rotated: best.rotated,
            margins: this.margins
        };
    }

    getGrid(sheetW, sheetH, itemW, itemH) {
        // Simple grid calculation
        // itemW + gap. Last item doesn't need gap? Usually yes for bleed.
        // Let's assume itemW includes bleed or we add gap.

        // If itemW is the finished size, we need to add bleed + spacing.
        // The user spec says "Spadávka (Bleed): 2 mm". 
        // So full block size = Trim + 2*Bleed. But typical imposition adds gutters.
        // Let's assume input matches the PDF box size (Trim + Bleed).
        // And we add a small gap if needed.

        // Naive division
        const cols = Math.floor(sheetW / (itemW + this.gap));
        const rows = Math.floor(sheetH / (itemH + this.gap));

        return { count: cols * rows, cols, rows };
    }
}

module.exports = Imposition;
