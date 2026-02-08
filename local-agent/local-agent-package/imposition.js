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
     * @param {number} trimWidth - Final width in mm
     * @param {number} trimHeight - Final height in mm
     * @param {number} bleed - Bleed in mm (on each side)
     * @param {string} sheetSize - 'SRA3' or 'A4'
     */
    calculateLayout(trimWidth, trimHeight, bleed = 2, sheetSize = 'SRA3') {
        const sheet = this.sheets[sheetSize];
        if (!sheet) throw new Error(`Unknown sheet size: ${sheetSize}`);

        const itemW = trimWidth + (bleed * 2);
        const itemH = trimHeight + (bleed * 2);

        // Effective printable area
        const printableW = sheet.width - this.margins.left - this.margins.right;
        const printableH = sheet.height - this.margins.top - this.margins.bottom;

        // Try Normal Orientation
        const layoutNormal = this.getGrid(printableW, printableH, itemW, itemH);

        // Try Rotated Item Orientation
        const layoutRotated = this.getGrid(printableW, printableH, itemH, itemW);

        // Select best fit (max yield)
        const best = (layoutRotated.count > layoutNormal.count) ?
            { ...layoutRotated, rotated: true, w: itemH, h: itemW } :
            { ...layoutNormal, rotated: false, w: itemW, h: itemH };

        // Generate Coordinates for the grid
        const positions = [];
        for (let r = 0; r < best.rows; r++) {
            for (let c = 0; c < best.cols; c++) {
                positions.push({
                    x: this.margins.left + (c * (best.w + this.gap)),
                    y: this.margins.top + (r * (best.h + this.gap)),
                    rotated: best.rotated
                });
            }
        }

        return {
            sheet: sheet,
            trim: { width: trimWidth, height: trimHeight },
            full: { width: itemW, height: itemH },
            bleed: bleed,
            yield: best.count,
            rows: best.rows,
            cols: best.cols,
            rotated: best.rotated,
            margins: this.margins,
            gap: this.gap,
            positions: positions
        };
    }

    getGrid(sheetW, sheetH, itemW, itemH) {
        // Yield based on simple packing
        const cols = Math.floor((sheetW + this.gap) / (itemW + this.gap));
        const rows = Math.floor((sheetH + this.gap) / (itemH + this.gap));
        return { count: cols * rows, cols, rows };
    }
}

module.exports = Imposition;
