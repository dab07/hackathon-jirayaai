import { useState } from 'react';

type InterviewFormData = {
    jobTitle: string;
    yearsOfExp: string;
    jobDescription: string;
    skills: string;
}

export const useInterviewForm = () => {
    const [jobTitle, setJobTitle] = useState<string>('');
    const [yearsOfExp, setYearsOfExp] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [skills, setSkills] = useState<string>('');

    const resetForm = () => {
        setJobTitle('');
        setYearsOfExp('');
        setJobDescription('');
        setSkills('');
    };

    const getFormDetails = (): InterviewFormData => ({
        jobTitle,
        yearsOfExp,
        jobDescription,
        skills
    });

    const isFormValid = (): boolean => {
        return jobTitle.trim() !== '' &&
            yearsOfExp.trim() !== '' &&
            jobDescription.trim() !== '' &&
            skills.trim() !== '';
    };

    return {
        jobTitle,
        setJobTitle,
        yearsOfExp,
        setYearsOfExp,
        jobDescription,
        setJobDescription,
        skills,
        setSkills,
        resetForm,
        getFormDetails,
        isFormValid
    };
};
