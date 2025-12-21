export interface PhysicalSpecs {
    canvasType: 'Stretched' | 'Panel' | 'Unstretched' | 'Paper' | 'Other';
    material: 'Oil' | 'Acrylic' | 'Watercolor' | 'Mixed Media' | 'Other';
    widthIn: number | null;
    heightIn: number | null;
    orientation: 'Landscape' | 'Portrait' | 'Square';
    readyToHang: boolean;
    framingIncluded: boolean;
}

export class PhysicalSpecsParser {
    /**
     * Parses physical attributes from raw listing text
     */
    static parse(title: string, description: string = ''): PhysicalSpecs {
        const fullText = `${title} ${description}`.toLowerCase();

        // 1. Dimensions Extraction (e.g. 16x20)
        const dimMatch = fullText.match(/(\d+)\s*["']?\s*[x×]\s*(\d+)\s*["']?/i);
        let width = dimMatch ? parseFloat(dimMatch[1]) : null;
        let height = dimMatch ? parseFloat(dimMatch[2]) : null;

        // 2. Orientation
        let orientation: 'Landscape' | 'Portrait' | 'Square' = 'Landscape';
        if (width && height) {
            if (width === height) orientation = 'Square';
            else if (height > width) orientation = 'Portrait';
        }

        // 3. Canvas/Surface Type
        let canvasType: PhysicalSpecs['canvasType'] = 'Other';
        if (fullText.includes('stretched')) canvasType = 'Stretched';
        else if (fullText.includes('panel') || fullText.includes('board')) canvasType = 'Panel';
        else if (fullText.includes('unstretched') || fullText.includes('rolled')) canvasType = 'Unstretched';
        else if (fullText.includes('paper') || fullText.includes('card')) canvasType = 'Paper';

        // 4. Material/Medium
        let material: PhysicalSpecs['material'] = 'Other';
        if (fullText.includes('oil')) material = 'Oil';
        else if (fullText.includes('acrylic')) material = 'Acrylic';
        else if (fullText.includes('watercolor') || fullText.includes('watercolour')) material = 'Watercolor';
        else if (fullText.includes('mixed media')) material = 'Mixed Media';

        // 5. Framing / Ready to Hang
        const framingIncluded = fullText.includes('framed') && !fullText.includes('unframed');
        const readyToHang = fullText.includes('ready to hang') || fullText.includes('wired') || framingIncluded;

        return {
            canvasType,
            material,
            widthIn: width,
            heightIn: height,
            orientation,
            readyToHang,
            framingIncluded
        };
    }
}
