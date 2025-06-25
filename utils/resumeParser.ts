/**
 * Resume parsing utilities for extracting text content from various file formats
 */

export interface ParsedResume {
    text: string;
    filename: string;
    fileSize: number;
    fileType: string;
}

/**
 * Extract text content from PDF files using PDF.js
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        // Dynamic import for PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF. Please try a different format.');
    }
};

/**
 * Extract text content from plain text files
 */
const extractTextFromText = async (file: File): Promise<string> => {
    try {
        return await file.text();
    } catch (error) {
        console.error('Error reading text file:', error);
        throw new Error('Failed to read text file.');
    }
};

/**
 * Extract text content from Word documents (basic implementation)
 * Note: This is a simplified implementation. For production, consider using mammoth.js
 */
const extractTextFromWord = async (file: File): Promise<string> => {
    try {
        // For now, we'll return a message asking users to convert to PDF or text
        throw new Error('Word documents are not yet supported. Please convert your resume to PDF or plain text format.');
    } catch (error) {
        console.error('Error extracting text from Word document:', error);
        throw error;
    }
};

/**
 * Validate file type and size
 */
const validateResumeFile = (file: File): void => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/txt',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, TXT, DOC, and DOCX files are supported');
    }
};

/**
 * Clean and normalize extracted text
 */
const cleanResumeText = (text: string): string => {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters that might interfere with AI processing
        .replace(/[^\w\s\-.,;:()\[\]@]/g, '')
        // Trim and normalize
        .trim();
};

/**
 * Main function to parse resume files
 */
export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
    try {
        // Validate file
        validateResumeFile(file);

        let extractedText = '';

        // Extract text based on file type
        switch (file.type) {
            case 'application/pdf':
                extractedText = await extractTextFromPDF(file);
                break;

            case 'text/plain':
            case 'text/txt':
                extractedText = await extractTextFromText(file);
                break;

            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                extractedText = await extractTextFromWord(file);
                break;

            default:
                throw new Error('Unsupported file type');
        }

        // Clean the extracted text
        const cleanedText = cleanResumeText(extractedText);

        if (cleanedText.length < 50) {
            throw new Error('Resume appears to be empty or too short. Please check your file.');
        }

        if (cleanedText.length > 50000) {
            // Truncate very long resumes
            console.warn('Resume is very long, truncating to 50,000 characters');
            extractedText = cleanedText.substring(0, 50000) + '...';
        } else {
            extractedText = cleanedText;
        }

        return {
            text: extractedText,
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
        };

    } catch (error) {
        console.error('Error parsing resume:', error);
        throw error instanceof Error ? error : new Error('Failed to parse resume file');
    }
};

/**
 * Extract key information from resume text for AI processing
 */
export const extractResumeKeyInfo = (resumeText: string): {
    skills: string[];
    experience: string[];
    education: string[];
    summary: string;
} => {
    const text = resumeText.toLowerCase();

    // Extract skills (basic keyword matching)
    const skillKeywords = [
        'javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'c++', 'c#',
        'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker',
        'kubernetes', 'git', 'agile', 'scrum', 'machine learning', 'ai', 'data science',
        'project management', 'leadership', 'communication', 'problem solving'
    ];

    const foundSkills = skillKeywords.filter(skill =>
        text.includes(skill.toLowerCase())
    );

    // Extract experience sections (basic pattern matching)
    const experiencePatterns = [
        /experience[:\s]+(.*?)(?=education|skills|$)/gi,
        /work history[:\s]+(.*?)(?=education|skills|$)/gi,
        /employment[:\s]+(.*?)(?=education|skills|$)/gi
    ];

    let experienceText = '';
    for (const pattern of experiencePatterns) {
        const match = text.match(pattern);
        if (match) {
            experienceText = match[0];
            break;
        }
    }

    // Extract education sections
    const educationPatterns = [
        /education[:\s]+(.*?)(?=experience|skills|$)/gi,
        /academic[:\s]+(.*?)(?=experience|skills|$)/gi,
        /qualifications[:\s]+(.*?)(?=experience|skills|$)/gi
    ];

    let educationText = '';
    for (const pattern of educationPatterns) {
        const match = text.match(pattern);
        if (match) {
            educationText = match[0];
            break;
        }
    }

    // Create a summary (first 500 characters)
    const summary = resumeText.substring(0, 500).trim();

    return {
        skills: foundSkills,
        experience: experienceText ? [experienceText.substring(0, 1000)] : [],
        education: educationText ? [educationText.substring(0, 500)] : [],
        summary,
    };
};

/**
 * Check if file is a valid resume format
 */
export const isValidResumeFile = (file: File): boolean => {
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/txt',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 3 * 1024 * 1024; // 10MB

    return allowedTypes.includes(file.type) && file.size <= maxSize;
};
