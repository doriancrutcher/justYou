import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Stack,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { callClaude } from '../claudeApi';
import { db, storage } from '../firebase';
import { generatePDF } from '../components/ResumePDF';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

interface Job {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bulletPoints: string[];
  selected: boolean;
  userId: string;
  createdAt: any;
}

interface Project {
  id: string;
  name: string;
  technologies: string;
  role: string;
  duration: string;
  description: string;
  selected: boolean;
  userId: string;
  createdAt: any;
}

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'tools' | 'languages' | 'other';
  selected: boolean;
  userId: string;
  createdAt: any;
}

interface ResumeFile {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  tags: string[];
  description: string;
  isFavorite: boolean;
  targetRole?: string;
  targetCompany?: string;
  version: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

const ResumeOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  

  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    bulletPoints: ['']
  });
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    name: '',
    technologies: '',
    role: '',
    duration: '',
    description: ''
  });
  
  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'technical' as const
  });
  
  // Resume Bank state
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newResume, setNewResume] = useState({
    name: '',
    description: '',
    tags: '',
    targetRole: '',
    targetCompany: '',
    version: ''
  });

  // Resume Builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedBuilderTemplate, setSelectedBuilderTemplate] = useState('modern');
  const [resumeContent, setResumeContent] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: ''
    },
    summary: '',
    experience: [] as Job[],
    education: [] as any[],
    skills: [] as Skill[],
    projects: [] as Project[],
    certifications: [] as any[]
  });

  // Resume Builder templates - diverse career fields
  const resumeBuilderTemplates = [
    {
      id: 'modern',
      name: 'Modern ATS',
      description: 'Clean, scannable format optimized for ATS systems',
      preview: 'Modern layout with clear sections and bullet points',
      category: 'General'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Traditional format with strong visual hierarchy',
      preview: 'Classic professional layout with detailed sections',
      category: 'General'
    },
    {
      id: 'tech-modern',
      name: 'Tech Modern',
      description: 'Technology-focused with modern styling',
      preview: 'Clean design perfect for software and tech roles',
      category: 'Technology'
    },
    {
      id: 'business-executive',
      name: 'Business Executive',
      description: 'Executive-level business resume format',
      preview: 'Professional layout for senior business roles',
      category: 'Business'
    },
    {
      id: 'creative-portfolio',
      name: 'Creative Portfolio',
      description: 'Creative design with visual appeal',
      preview: 'Eye-catching layout for creative professionals',
      category: 'Creative'
    },
    {
      id: 'healthcare-clinical',
      name: 'Healthcare Clinical',
      description: 'Clinical and healthcare professional format',
      preview: 'Clean layout for medical and healthcare roles',
      category: 'Healthcare'
    },
    {
      id: 'education-academic',
      name: 'Education Academic',
      description: 'Academic and teaching professional format',
      preview: 'Structured layout for education professionals',
      category: 'Education'
    },
    {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      description: 'Ultra-clean format with maximum readability',
      preview: 'Minimalist design focusing on content clarity',
      category: 'General'
    }
  ];



  // Common companies for quick selection
  const commonCompanies = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Twitter', 'LinkedIn',
    'Uber', 'Airbnb', 'Spotify', 'Slack', 'Salesforce', 'Adobe', 'Oracle', 'IBM',
    'Intel', 'NVIDIA', 'AMD', 'Cisco', 'VMware', 'Palantir', 'Stripe', 'Square'
  ];

  // Common roles for quick selection - diverse career fields
  const commonRoles = [
    // Technology
    'Software Engineer', 'Senior Software Engineer', 'Lead Developer', 'Full Stack Developer',
    'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Engineer',
    'Product Manager', 'Technical Lead', 'Data Scientist', 'Machine Learning Engineer',
    // Business
    'Business Analyst', 'Project Manager', 'Operations Manager', 'Strategy Consultant',
    'Financial Analyst', 'Account Manager', 'Sales Manager', 'Marketing Manager',
    // Creative
    'UI/UX Designer', 'Graphic Designer', 'Visual Designer', 'Content Strategist',
    'Digital Marketing Specialist', 'Brand Manager', 'Creative Director',
    // Healthcare
    'Registered Nurse', 'Physician', 'Physical Therapist', 'Healthcare Administrator',
    'Medical Assistant', 'Clinical Research Coordinator', 'Healthcare Consultant',
    // Education
    'Teacher', 'Professor', 'Education Administrator', 'Curriculum Developer',
    'Training Specialist', 'Academic Advisor', 'Education Consultant',
    // General
    'Administrative Assistant', 'Human Resources Manager', 'Customer Success Manager',
    'Operations Specialist', 'Research Analyst', 'Consultant'
  ];



  // Auto-suggest name from file
  const autoSuggestName = (fileName: string) => {
    // Extract base name without extension
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // Try to match with common patterns
    const patterns = [
      /(senior|lead|principal)/i,
      /(frontend|front-end|front_end)/i,
      /(backend|back-end|back_end)/i,
      /(fullstack|full-stack|full_stack)/i,
      /(dev|developer|engineer)/i,
      /(manager|lead|director)/i,
      /(designer|design)/i,
      /(data|analyst|scientist)/i,
      /(marketing|brand|campaign)/i
    ];

    let suggestedRole = 'Developer';
    let suggestedTags = 'tech';

    patterns.forEach(pattern => {
      if (pattern.test(baseName)) {
        if (/(senior|lead|principal)/i.test(baseName)) {
          suggestedRole = 'Senior Developer';
          suggestedTags = 'tech, senior, leadership';
        } else if (/(frontend|front-end|front_end)/i.test(baseName)) {
          suggestedRole = 'Frontend Developer';
          suggestedTags = 'tech, frontend, react, ui';
        } else if (/(backend|back-end|back_end)/i.test(baseName)) {
          suggestedRole = 'Backend Developer';
          suggestedTags = 'tech, backend, api, server';
        } else if (/(fullstack|full-stack|full_stack)/i.test(baseName)) {
          suggestedRole = 'Full Stack Developer';
          suggestedTags = 'tech, fullstack, full-stack';
        } else if (/(manager|lead|director)/i.test(baseName)) {
          suggestedRole = 'Manager';
          suggestedTags = 'leadership, management';
        } else if (/(designer|design)/i.test(baseName)) {
          suggestedRole = 'UI/UX Designer';
          suggestedTags = 'design, ui-ux, creative';
        } else if (/(data|analyst|scientist)/i.test(baseName)) {
          suggestedRole = 'Data Scientist';
          suggestedTags = 'data, analytics, machine-learning';
        } else if (/(marketing|brand|campaign)/i.test(baseName)) {
          suggestedRole = 'Marketing Manager';
          suggestedTags = 'marketing, strategy, campaigns';
        }
      }
    });

    return {
      name: baseName.replace(/[^a-zA-Z0-9]/g, '_'),
      role: suggestedRole,
      tags: suggestedTags
    };
  };
  
  // Results state
  const [optimizedJobs, setOptimizedJobs] = useState<string>('');
  const [optimizedProjects, setOptimizedProjects] = useState<string>('');
  const [optimizedSkills, setOptimizedSkills] = useState<string>('');

  // Load data from Firebase
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingData(true);
    try {
      // Load jobs
      const jobsQuery = query(
        collection(db, 'resumeJobs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setJobs(jobsData);

      // Load projects
      const projectsQuery = query(
        collection(db, 'resumeProjects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);

      // Load skills
      const skillsQuery = query(
        collection(db, 'resumeSkills'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const skillsSnapshot = await getDocs(skillsQuery);
      const skillsData = skillsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Skill[];
      setSkills(skillsData);

      // Load resume files
      const resumesQuery = query(
        collection(db, 'resumeFiles'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      const resumesSnapshot = await getDocs(resumesQuery);
      const resumesData = resumesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ResumeFile[];
      setResumeFiles(resumesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your data. Please refresh the page.');
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Edit/View states
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [viewSkill, setViewSkill] = useState<Skill | null>(null);
  const [editResume, setEditResume] = useState<ResumeFile | null>(null);



  const addJob = async () => {
    if (!newJob.title || !newJob.company || !user) return;
    
    setIsLoading(true);
    try {
      const jobData = {
        ...newJob,
        userId: user.uid,
        selected: true,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'resumeJobs'), jobData);
      const job: Job = {
        id: docRef.id,
        ...jobData,
        createdAt: new Date()
      };
      
      setJobs([job, ...jobs]);
      setNewJob({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        bulletPoints: ['']
      });
      setSuccess('Job added successfully!');
    } catch (err) {
      console.error('Error adding job:', err);
      setError('Failed to add job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = async () => {
    if (!newProject.name || !newProject.description || !user) return;
    
    setIsLoading(true);
    try {
      const projectData = {
        ...newProject,
        userId: user.uid,
        selected: true,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'resumeProjects'), projectData);
      const project: Project = {
        id: docRef.id,
        ...projectData,
        createdAt: new Date()
      };
      
      setProjects([project, ...projects]);
      setNewProject({
        name: '',
        technologies: '',
        role: '',
        duration: '',
        description: ''
      });
      setSuccess('Project added successfully!');
    } catch (err) {
      console.error('Error adding project:', err);
      setError('Failed to add project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.name || !user) return;
    
    setIsLoading(true);
    try {
      const skillData = {
        ...newSkill,
        userId: user.uid,
        selected: true,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'resumeSkills'), skillData);
      const skill: Skill = {
        id: docRef.id,
        ...skillData,
        createdAt: new Date()
      };
      
      setSkills([skill, ...skills]);
      setNewSkill({
        name: '',
        category: 'technical'
      });
      setSuccess('Skill added successfully!');
    } catch (err) {
      console.error('Error adding skill:', err);
      setError('Failed to add skill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateJob = async (job: Job) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'resumeJobs', job.id), {
        title: job.title,
        company: job.company,
        startDate: job.startDate,
        endDate: job.endDate,
        bulletPoints: job.bulletPoints
      });
      
      setJobs(jobs.map(j => j.id === job.id ? job : j));
      setEditJob(null);
      setSuccess('Job updated successfully!');
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (project: Project) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'resumeProjects', project.id), {
        name: project.name,
        technologies: project.technologies,
        role: project.role,
        duration: project.duration,
        description: project.description
      });
      
      setProjects(projects.map(p => p.id === project.id ? project : p));
      setEditProject(null);
      setSuccess('Project updated successfully!');
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSkill = async (skill: Skill) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'resumeSkills', skill.id), {
        name: skill.name,
        category: skill.category
      });
      
      setSkills(skills.map(s => s.id === skill.id ? skill : s));
      setEditSkill(null);
      setSuccess('Skill updated successfully!');
    } catch (err) {
      console.error('Error updating skill:', err);
      setError('Failed to update skill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'resumeJobs', id));
      setJobs(jobs.filter(job => job.id !== id));
      setSuccess('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'resumeProjects', id));
      setProjects(projects.filter(project => project.id !== id));
      setSuccess('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSkill = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'resumeSkills', id));
      setSkills(skills.filter(skill => skill.id !== id));
      setSuccess('Skill deleted successfully!');
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobSelection = async (id: string) => {
    if (!user) return;
    
    const updatedJobs = jobs.map(job => 
      job.id === id ? { ...job, selected: !job.selected } : job
    );
    setJobs(updatedJobs);
    
    const job = updatedJobs.find(j => j.id === id);
    if (job) {
      try {
        await updateDoc(doc(db, 'resumeJobs', id), {
          selected: job.selected
        });
      } catch (err) {
        console.error('Error updating job selection:', err);
      }
    }
  };

  const toggleProjectSelection = async (id: string) => {
    if (!user) return;
    
    const updatedProjects = projects.map(project => 
      project.id === id ? { ...project, selected: !project.selected } : project
    );
    setProjects(updatedProjects);
    
    const project = updatedProjects.find(p => p.id === id);
    if (project) {
      try {
        await updateDoc(doc(db, 'resumeProjects', id), {
          selected: project.selected
        });
      } catch (err) {
        console.error('Error updating project selection:', err);
      }
    }
  };

  const toggleSkillSelection = async (id: string) => {
    if (!user) return;
    
    const updatedSkills = skills.map(skill => 
      skill.id === id ? { ...skill, selected: !skill.selected } : skill
    );
    setSkills(updatedSkills);
    
    const skill = updatedSkills.find(s => s.id === id);
    if (skill) {
      try {
        await updateDoc(doc(db, 'resumeSkills', id), {
          selected: skill.selected
        });
      } catch (err) {
        console.error('Error updating skill selection:', err);
      }
    }
  };

  const optimizeJobs = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description first.');
      return;
    }

    const selectedJobs = jobs.filter(job => job.selected);
    if (selectedJobs.length === 0) {
      setError('Please select at least one job to optimize.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const jobsText = selectedJobs.map(job => 
        `${job.title} at ${job.company} (${job.startDate} - ${job.endDate}):\n${job.bulletPoints.join('\n')}`
      ).join('\n\n');

      const prompt = `I need to optimize job descriptions for a resume to match a specific job posting.

Job Posting:
${jobDescription}

Current Job Descriptions:
${jobsText}

Please optimize each job description to:
1. Use relevant keywords from the job posting
2. Highlight transferable skills and experiences
3. Use strong action verbs and quantifiable achievements
4. Make bullet points more impactful and specific
5. Focus on achievements rather than just responsibilities
6. Use industry-specific terminology from the job posting

Please provide the optimized job descriptions in the same format, with clear separation between jobs.`;

      const response = await callClaude(prompt);
      setOptimizedJobs(response);
      setSuccess('Jobs optimized successfully!');
    } catch (err) {
      setError('Failed to optimize jobs. Please try again.');
      console.error('Error optimizing jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeProjects = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description first.');
      return;
    }

    const selectedProjects = projects.filter(project => project.selected);
    if (selectedProjects.length === 0) {
      setError('Please select at least one project to optimize.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const projectsText = selectedProjects.map(project => 
        `${project.name} (${project.technologies}) - ${project.role} (${project.duration}):\n${project.description}`
      ).join('\n\n');

      const prompt = `I need to optimize project descriptions for a resume to match a specific job posting.

Job Posting:
${jobDescription}

Current Project Descriptions:
${projectsText}

Please optimize each project description to:
1. Use relevant keywords from the job posting
2. Highlight technical skills and technologies that match the role
3. Emphasize problem-solving and leadership aspects
4. Use strong action verbs and quantifiable results
5. Focus on impact and outcomes
6. Align with the job requirements and company needs

Please provide the optimized project descriptions in the same format, with clear separation between projects.`;

      const response = await callClaude(prompt);
      setOptimizedProjects(response);
      setSuccess('Projects optimized successfully!');
    } catch (err) {
      setError('Failed to optimize projects. Please try again.');
      console.error('Error optimizing projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeSkills = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description first.');
      return;
    }

    const selectedSkills = skills.filter(skill => skill.selected);
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill to optimize.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const skillsText = selectedSkills.map(skill => 
        `${skill.name} (${skill.category})`
      ).join(', ');

      const prompt = `I need to optimize skills for a resume to match a specific job posting.

Job Posting:
${jobDescription}

Current Skills:
${skillsText}

Please optimize the skills section to:
1. Use relevant keywords from the job posting
2. Prioritize skills that match the job requirements
3. Add missing skills that would be valuable for this role
4. Use industry-standard terminology
5. Group skills by category (Technical, Soft Skills, Tools, etc.)
6. Focus on skills that demonstrate value to the employer

Please provide the optimized skills list, organized by category.`;

      const response = await callClaude(prompt);
      setOptimizedSkills(response);
      setSuccess('Skills optimized successfully!');
    } catch (err) {
      setError('Failed to optimize skills. Please try again.');
      console.error('Error optimizing skills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${type} copied to clipboard!`);
  };

  const handleClear = () => {
    setJobDescription('');
    setOptimizedJobs('');
    setOptimizedProjects('');
    setOptimizedSkills('');
    setError('');
    setSuccess('');
  };

  // Edit/View handlers
  const handleEditJob = (job: Job) => {
    setEditJob({ ...job });
  };

  const handleEditProject = (project: Project) => {
    setEditProject({ ...project });
  };

  const handleEditSkill = (skill: Skill) => {
    setEditSkill({ ...skill });
  };

  const handleViewJob = (job: Job) => {
    setViewJob(job);
  };

  const handleViewProject = (project: Project) => {
    setViewProject(project);
  };

  const handleViewSkill = (skill: Skill) => {
    setViewSkill(skill);
  };

  // Resume Bank handlers
  const handleViewResume = (resume: ResumeFile) => {
    window.open(resume.fileUrl, '_blank');
  };

  const handleEditResume = (resume: ResumeFile) => {
    setEditResume({ ...resume });
  };

  const handleResumeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-suggest based on filename
      const suggestion = autoSuggestName(file.name);
      
      // Only auto-fill if fields are empty
      if (!newResume.name) {
        setNewResume(prev => ({ 
          ...prev, 
          name: suggestion.name,
          targetRole: suggestion.role,
          tags: suggestion.tags
        }));
      }
    }
  };

  const handleUploadResume = async () => {
    if (!selectedFile || !user) return;
    
    setIsLoading(true);
    try {
      // Upload file to Firebase Storage
      const fileName = `${user.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `resumes/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Save resume metadata to Firestore
      const resumeData = {
        name: newResume.name,
        fileName: selectedFile.name,
        fileUrl: downloadURL,
        fileSize: selectedFile.size,
        tags: newResume.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        description: newResume.description,
        isFavorite: false,
        targetRole: newResume.targetRole,
        targetCompany: newResume.targetCompany,
        version: newResume.version || '1.0',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'resumeFiles'), resumeData);
      const resume: ResumeFile = {
        id: docRef.id,
        ...resumeData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setResumeFiles([resume, ...resumeFiles]);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setNewResume({
        name: '',
        description: '',
        tags: '',
        targetRole: '',
        targetCompany: '',
        version: ''
      });
      setSuccess('Resume uploaded successfully!');
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const resume = resumeFiles.find(r => r.id === id);
      if (resume) {
        // Delete from Storage
        const storageRef = ref(storage, `resumes/${user.uid}/${resume.fileName}`);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'resumeFiles', id));
        setResumeFiles(resumeFiles.filter(r => r.id !== id));
        setSuccess('Resume deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;
    
    const updatedResumes = resumeFiles.map(resume => 
      resume.id === id ? { ...resume, isFavorite: !resume.isFavorite } : resume
    );
    setResumeFiles(updatedResumes);
    
    const resume = updatedResumes.find(r => r.id === id);
    if (resume) {
      try {
        await updateDoc(doc(db, 'resumeFiles', id), {
          isFavorite: resume.isFavorite,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error updating favorite status:', err);
      }
    }
  };

  const handleUpdateResume = async (resume: ResumeFile) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'resumeFiles', resume.id), {
        name: resume.name,
        description: resume.description,
        tags: resume.tags,
        targetRole: resume.targetRole,
        targetCompany: resume.targetCompany,
        version: resume.version,
        updatedAt: serverTimestamp()
      });
      
      setResumeFiles(resumeFiles.map(r => r.id === resume.id ? resume : r));
      setEditResume(null);
      setSuccess('Resume updated successfully!');
    } catch (err) {
      console.error('Error updating resume:', err);
      setError('Failed to update resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter resumes
  const filteredResumes = resumeFiles.filter(resume => {
    const matchesSearch = resume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => resume.tags.includes(tag));
    
    const matchesFavorites = !showFavoritesOnly || resume.isFavorite;
    
    return matchesSearch && matchesTags && matchesFavorites;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(resumeFiles.flatMap(resume => resume.tags))).sort();

  // Resume Builder functions
  const initializeResumeBuilder = () => {
    // Pre-populate with existing data
    setResumeContent({
      personalInfo: {
        name: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        location: '',
        linkedin: '',
        portfolio: ''
      },
      summary: '',
      experience: jobs.filter(job => job.selected),
      education: [],
      skills: skills.filter(skill => skill.selected),
      projects: projects.filter(project => project.selected),
      certifications: []
    });
    setBuilderOpen(true);
  };

  const addEducation = () => {
    setResumeContent(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        graduationDate: '',
        gpa: '',
        relevantCourses: ''
      }]
    }));
  };

  const addCertification = () => {
    setResumeContent(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        id: Date.now().toString(),
        name: '',
        issuer: '',
        date: '',
        url: ''
      }]
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeContent(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setResumeContent(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeContent(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const removeCertification = (id: string) => {
    setResumeContent(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const generateResumePDF = async () => {
    try {
      setIsLoading(true);
      
      // Generate filename
      const filename = `${resumeContent.personalInfo.name.replace(/\s+/g, '_')}_Resume_${selectedBuilderTemplate}`;
      
      // Generate PDF using React-PDF
      await generatePDF(resumeContent, selectedBuilderTemplate, filename);
      
      setSuccess('PDF resume generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Please sign in to use the resume optimizer tool.
        </Typography>
      </Container>
    );
  }

  if (isLoadingData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your resume data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Resume Optimizer
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Optimize your resume sections to match specific job postings and improve ATS compatibility.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Job Description Input */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Job Description
        </Typography>
        <TextField
          fullWidth
          label="Paste the job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          multiline
          rows={6}
          placeholder="Paste the complete job description, including requirements, responsibilities, and qualifications..."
        />
      </Paper>

      {/* Jobs Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon />
            <Typography variant="h6">Jobs</Typography>
            <Chip label={jobs.length} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Job Experience
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
              <TextField
                label="Job Title"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Company"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
              <TextField
                label="Start Date"
                value={newJob.startDate}
                onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                placeholder="MM/YYYY"
                sx={{ flex: 1 }}
              />
              <TextField
                label="End Date"
                value={newJob.endDate}
                onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                placeholder="MM/YYYY or Present"
                sx={{ flex: 1 }}
              />
            </Box>
            <Typography variant="body2" gutterBottom>
              Bullet Points (one per line):
            </Typography>
            {newJob.bulletPoints.map((point, index) => (
              <TextField
                key={index}
                fullWidth
                label={`Bullet Point ${index + 1}`}
                value={point}
                onChange={(e) => {
                  const updated = [...newJob.bulletPoints];
                  updated[index] = e.target.value;
                  setNewJob({ ...newJob, bulletPoints: updated });
                }}
                sx={{ mb: 1 }}
              />
            ))}
            <Button
              variant="outlined"
              onClick={() => setNewJob({ ...newJob, bulletPoints: [...newJob.bulletPoints, ''] })}
              sx={{ mr: 1 }}
            >
              Add Bullet Point
            </Button>
            <Button
              variant="contained"
              onClick={addJob}
              disabled={!newJob.title || !newJob.company}
            >
              Add Job
            </Button>
          </Box>

          {jobs.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Your Jobs
              </Typography>
              <List>
                {jobs.map((job) => (
                  <ListItem key={job.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={job.selected}
                          onChange={() => toggleJobSelection(job.id)}
                        />
                      }
                      label=""
                    />
                    <ListItemText
                      primary={`${job.title} at ${job.company}`}
                      secondary={`${job.startDate} - ${job.endDate}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleViewJob(job)} color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditJob(job)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteJob(job.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={optimizeJobs}
                disabled={isLoading || jobs.filter(j => j.selected).length === 0}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Optimizing...' : 'Optimize Selected Jobs'}
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Projects Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            <Typography variant="h6">Projects</Typography>
            <Chip label={projects.length} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Project
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
              <TextField
                label="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Technologies Used"
                value={newProject.technologies}
                onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
              <TextField
                label="Your Role"
                value={newProject.role}
                onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Duration"
                value={newProject.duration}
                onChange={(e) => setNewProject({ ...newProject, duration: e.target.value })}
                placeholder="e.g., 3 months"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={addProject}
              disabled={!newProject.name || !newProject.description}
            >
              Add Project
            </Button>
          </Box>

          {projects.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Your Projects
              </Typography>
              <List>
                {projects.map((project) => (
                  <ListItem key={project.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={project.selected}
                          onChange={() => toggleProjectSelection(project.id)}
                        />
                      }
                      label=""
                    />
                    <ListItemText
                      primary={project.name}
                      secondary={`${project.technologies} - ${project.role} (${project.duration})`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleViewProject(project)} color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditProject(project)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteProject(project.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={optimizeProjects}
                disabled={isLoading || projects.filter(p => p.selected).length === 0}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Optimizing...' : 'Optimize Selected Projects'}
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Skills Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon />
            <Typography variant="h6">Skills</Typography>
            <Chip label={skills.length} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Skill
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
              <TextField
                label="Skill Name"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                  label="Category"
                >
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="soft">Soft Skills</MenuItem>
                  <MenuItem value="tools">Tools</MenuItem>
                  <MenuItem value="languages">Languages</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              onClick={addSkill}
              disabled={!newSkill.name}
            >
              Add Skill
            </Button>
          </Box>

          {skills.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Your Skills
              </Typography>
              <List>
                {skills.map((skill) => (
                  <ListItem key={skill.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={skill.selected}
                          onChange={() => toggleSkillSelection(skill.id)}
                        />
                      }
                      label=""
                    />
                    <ListItemText
                      primary={skill.name}
                      secondary={skill.category}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleViewSkill(skill)} color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditSkill(skill)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteSkill(skill.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={optimizeSkills}
                disabled={isLoading || skills.filter(s => s.selected).length === 0}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Optimizing...' : 'Optimize Selected Skills'}
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Resume Bank Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LabelIcon />
            <Typography variant="h6">Resume Bank</Typography>
            <Chip label={resumeFiles.length} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Search Resumes"
                variant="outlined"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showFavoritesOnly}
                    onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  />
                }
                label="Show Favorites Only"
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setSelectedTags([])}
              >
                Clear Tags
              </Button>
              {allTags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => {
                    setSelectedTags(prev => {
                      if (prev.includes(tag)) {
                        return prev.filter(t => t !== tag);
                      } else {
                        return [...prev, tag];
                      }
                    });
                  }}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Stack>
                         <Stack direction="row" spacing={2}>
               <Button
                 variant="contained"
                 startIcon={<UploadIcon />}
                 onClick={() => setUploadDialogOpen(true)}
                 disabled={isLoading}
               >
                 Upload New Resume
               </Button>
               <Button
                 variant="outlined"
                 startIcon={<DescriptionIcon />}
                 onClick={initializeResumeBuilder}
                 disabled={isLoading}
               >
                 Build New Resume
               </Button>
             </Stack>
          </Box>

          {filteredResumes.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Your Resumes
              </Typography>
              <List>
                {filteredResumes.map((resume) => (
                  <ListItem
                    key={resume.id}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => handleViewResume(resume)} color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton onClick={() => handleEditResume(resume)} color="primary">
                          <EditIcon />
                        </IconButton>
                                                 <IconButton onClick={() => handleToggleFavorite(resume.id)} color="default">
                           {resume.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                         </IconButton>
                        <IconButton onClick={() => handleDeleteResume(resume.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2">{resume.name}</Typography>
                          <Badge badgeContent={resume.version} color="info">
                            <Typography variant="body2" color="text.secondary">
                              v{resume.version}
                            </Typography>
                          </Badge>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {resume.fileSize / 1024} KB
                          </Typography>
                          <Tooltip title={resume.tags.join(', ')}>
                            <Chip
                              label={resume.tags.length}
                              size="small"
                              icon={<LabelIcon />}
                              sx={{ ml: 1 }}
                            />
                          </Tooltip>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Results Section */}
      {(optimizedJobs || optimizedProjects || optimizedSkills) && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Optimized Results
          </Typography>
          
          {optimizedJobs && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Optimized Jobs</Typography>
                <IconButton onClick={() => copyToClipboard(optimizedJobs, 'Jobs')}>
                  <CopyIcon />
                </IconButton>
              </Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {optimizedJobs}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {optimizedProjects && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Optimized Projects</Typography>
                <IconButton onClick={() => copyToClipboard(optimizedProjects, 'Projects')}>
                  <CopyIcon />
                </IconButton>
              </Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {optimizedProjects}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {optimizedSkills && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Optimized Skills</Typography>
                <IconButton onClick={() => copyToClipboard(optimizedSkills, 'Skills')}>
                  <CopyIcon />
                </IconButton>
              </Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {optimizedSkills}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Paper>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={isLoading}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Clear All
        </Button>
      </Box>

      {/* Edit Job Modal */}
      <Dialog open={!!editJob} onClose={() => setEditJob(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogContent>
          {editJob && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Job Title"
                  value={editJob.title}
                  onChange={(e) => setEditJob({ ...editJob, title: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Company"
                  value={editJob.company}
                  onChange={(e) => setEditJob({ ...editJob, company: e.target.value })}
                  sx={{ flex: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Start Date"
                  value={editJob.startDate}
                  onChange={(e) => setEditJob({ ...editJob, startDate: e.target.value })}
                  placeholder="MM/YYYY"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="End Date"
                  value={editJob.endDate}
                  onChange={(e) => setEditJob({ ...editJob, endDate: e.target.value })}
                  placeholder="MM/YYYY or Present"
                  sx={{ flex: 1 }}
                />
              </Box>
              <Typography variant="body2" gutterBottom>
                Bullet Points (one per line):
              </Typography>
              {editJob.bulletPoints.map((point, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Bullet Point ${index + 1}`}
                  value={point}
                  onChange={(e) => {
                    const updated = [...editJob.bulletPoints];
                    updated[index] = e.target.value;
                    setEditJob({ ...editJob, bulletPoints: updated });
                  }}
                  sx={{ mb: 1 }}
                />
              ))}
              <Button
                variant="outlined"
                onClick={() => setEditJob({ ...editJob, bulletPoints: [...editJob.bulletPoints, ''] })}
                sx={{ mr: 1 }}
              >
                Add Bullet Point
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditJob(null)}>Cancel</Button>
          <Button 
            onClick={() => editJob && updateJob(editJob)} 
            variant="contained"
            disabled={!editJob?.title || !editJob?.company || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={!!editProject} onClose={() => setEditProject(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          {editProject && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Project Name"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Technologies Used"
                  value={editProject.technologies}
                  onChange={(e) => setEditProject({ ...editProject, technologies: e.target.value })}
                  sx={{ flex: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Your Role"
                  value={editProject.role}
                  onChange={(e) => setEditProject({ ...editProject, role: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Duration"
                  value={editProject.duration}
                  onChange={(e) => setEditProject({ ...editProject, duration: e.target.value })}
                  placeholder="e.g., 3 months"
                  sx={{ flex: 1 }}
                />
              </Box>
              <TextField
                fullWidth
                label="Project Description"
                value={editProject.description}
                onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProject(null)}>Cancel</Button>
          <Button 
            onClick={() => editProject && updateProject(editProject)} 
            variant="contained"
            disabled={!editProject?.name || !editProject?.description || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Skill Modal */}
      <Dialog open={!!editSkill} onClose={() => setEditSkill(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Skill</DialogTitle>
        <DialogContent>
          {editSkill && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Skill Name"
                  value={editSkill.name}
                  onChange={(e) => setEditSkill({ ...editSkill, name: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editSkill.category}
                    onChange={(e) => setEditSkill({ ...editSkill, category: e.target.value as any })}
                    label="Category"
                  >
                    <MenuItem value="technical">Technical</MenuItem>
                    <MenuItem value="soft">Soft Skills</MenuItem>
                    <MenuItem value="tools">Tools</MenuItem>
                    <MenuItem value="languages">Languages</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSkill(null)}>Cancel</Button>
          <Button 
            onClick={() => editSkill && updateSkill(editSkill)} 
            variant="contained"
            disabled={!editSkill?.name || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Job Modal */}
      <Dialog open={!!viewJob} onClose={() => setViewJob(null)} maxWidth="md" fullWidth>
        <DialogTitle>Job Details</DialogTitle>
        <DialogContent>
          {viewJob && (
            <Box sx={{ pt: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {viewJob.title} at {viewJob.company}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {viewJob.startDate} - {viewJob.endDate}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Responsibilities & Achievements:
                  </Typography>
                  <List dense>
                    {viewJob.bulletPoints.map((point, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText 
                          primary={`• ${point}`}
                          sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewJob(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Project Modal */}
      <Dialog open={!!viewProject} onClose={() => setViewProject(null)} maxWidth="md" fullWidth>
        <DialogTitle>Project Details</DialogTitle>
        <DialogContent>
          {viewProject && (
            <Box sx={{ pt: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {viewProject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Technologies: {viewProject?.technologies}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Role: {viewProject?.role} | Duration: {viewProject?.duration}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {viewProject?.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewProject(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Skill Modal */}
      <Dialog open={!!viewSkill} onClose={() => setViewSkill(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Skill Details</DialogTitle>
        <DialogContent>
          {viewSkill && (
            <Box sx={{ pt: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {viewSkill.name}
                  </Typography>
                  <Chip 
                    label={viewSkill.category} 
                    color="primary" 
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSkill(null)}>Close</Button>
        </DialogActions>
      </Dialog>

             {/* Upload Resume Dialog */}
       <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
         <DialogTitle>Upload New Resume</DialogTitle>
         <DialogContent>
           <Box sx={{ mt: 2 }}>
             {/* File Upload */}
             <Typography variant="h6" gutterBottom>
               Upload File
             </Typography>
             <Input
               type="file"
               onChange={handleResumeSelect}
               inputProps={{
                 accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
               }}
               sx={{ mb: 3 }}
             />
             
             {/* Quick Naming Help */}
             <Alert severity="info" sx={{ mb: 3 }}>
               <Typography variant="body2">
                 <strong>Naming Tip:</strong> Use underscores instead of spaces for better file organization. 
                 Example: "Senior_Developer_Google_2024_v2.pdf"
               </Typography>
             </Alert>

             {/* Resume Details */}
             <Typography variant="h6" gutterBottom>
               Resume Details
             </Typography>
             
             <Box sx={{ 
               display: 'grid', 
               gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
               gap: 2,
               mb: 2
             }}>
               <TextField
                 label="Resume Name"
                 value={newResume.name}
                 onChange={(e) => setNewResume({ ...newResume, name: e.target.value })}
                 fullWidth
                 helperText="Use underscores instead of spaces"
               />
               <TextField
                 label="Version"
                 value={newResume.version}
                 onChange={(e) => setNewResume({ ...newResume, version: e.target.value })}
                 fullWidth
                 placeholder="1.0"
               />
             </Box>

             <TextField
               label="Description"
               value={newResume.description}
               onChange={(e) => setNewResume({ ...newResume, description: e.target.value })}
               fullWidth
               multiline
               rows={2}
               sx={{ mb: 2 }}
               placeholder="Brief description of this resume version..."
             />

             <TextField
               label="Tags (comma-separated)"
               value={newResume.tags}
               onChange={(e) => setNewResume({ ...newResume, tags: e.target.value })}
               fullWidth
               sx={{ mb: 2 }}
               placeholder="tech, senior, remote, react"
             />

             <Box sx={{ 
               display: 'grid', 
               gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
               gap: 2
             }}>
               <FormControl fullWidth>
                 <InputLabel>Target Role</InputLabel>
                 <Select
                   value={newResume.targetRole}
                   onChange={(e) => setNewResume({ ...newResume, targetRole: e.target.value })}
                   label="Target Role"
                 >
                   {commonRoles.map((role) => (
                     <MenuItem key={role} value={role}>{role}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
               <FormControl fullWidth>
                 <InputLabel>Target Company</InputLabel>
                 <Select
                   value={newResume.targetCompany}
                   onChange={(e) => setNewResume({ ...newResume, targetCompany: e.target.value })}
                   label="Target Company"
                 >
                   <MenuItem value="">None</MenuItem>
                   {commonCompanies.map((company) => (
                     <MenuItem key={company} value={company}>{company}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Box>
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
           <Button 
             onClick={handleUploadResume} 
             variant="contained"
             disabled={!selectedFile || isLoading}
           >
             {isLoading ? <CircularProgress size={20} /> : 'Upload Resume'}
           </Button>
         </DialogActions>
       </Dialog>

      {/* Edit Resume Modal */}
      <Dialog open={!!editResume} onClose={() => setEditResume(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Resume</DialogTitle>
        <DialogContent>
          {editResume && (
            <Box sx={{ pt: 1 }}>
              <TextField
                label="Resume Name"
                value={editResume.name}
                onChange={(e) => setEditResume({ ...editResume, name: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                value={editResume.description}
                onChange={(e) => setEditResume({ ...editResume, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Tags (comma-separated)"
                value={editResume.tags.join(', ')}
                onChange={(e) => setEditResume({ ...editResume, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Target Role"
                value={editResume.targetRole}
                onChange={(e) => setEditResume({ ...editResume, targetRole: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Target Company"
                value={editResume.targetCompany}
                onChange={(e) => setEditResume({ ...editResume, targetCompany: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Version"
                value={editResume.version}
                onChange={(e) => setEditResume({ ...editResume, version: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditResume(null)}>Cancel</Button>
          <Button 
            onClick={() => editResume && handleUpdateResume(editResume)} 
            variant="contained"
            disabled={!editResume?.name || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
                 </DialogActions>
       </Dialog>

       {/* Resume Builder Dialog */}
       <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} maxWidth="lg" fullWidth>
         <DialogTitle>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6">Resume Builder</Typography>
             <Button
               variant="contained"
               onClick={generateResumePDF}
               disabled={!resumeContent.personalInfo.name}
             >
               Generate Resume
             </Button>
           </Box>
         </DialogTitle>
         <DialogContent>
           <Box sx={{ mt: 2 }}>
             {/* Template Selection */}
             <Typography variant="h6" gutterBottom>
               Choose Template
             </Typography>
             <Box sx={{ mb: 3 }}>
               {['General', 'Technology', 'Business', 'Creative', 'Healthcare', 'Education'].map((category) => {
                 const categoryTemplates = resumeBuilderTemplates.filter(t => t.category === category);
                 if (categoryTemplates.length === 0) return null;
                 
                 return (
                   <Box key={category} sx={{ mb: 3 }}>
                     <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                       {category}
                     </Typography>
                     <Box sx={{ 
                       display: 'grid', 
                       gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                       gap: 2 
                     }}>
                       {categoryTemplates.map((template) => (
                         <Card 
                           key={template.id}
                           variant={selectedBuilderTemplate === template.id ? 'elevation' : 'outlined'}
                           sx={{ 
                             cursor: 'pointer',
                             border: selectedBuilderTemplate === template.id ? 2 : 1,
                             borderColor: selectedBuilderTemplate === template.id ? 'primary.main' : 'divider'
                           }}
                           onClick={() => setSelectedBuilderTemplate(template.id)}
                         >
                           <CardContent>
                             <Typography variant="h6" gutterBottom>
                               {template.name}
                             </Typography>
                             <Typography variant="body2" color="text.secondary" gutterBottom>
                               {template.description}
                             </Typography>
                             <Typography variant="caption" color="text.secondary">
                               {template.preview}
                             </Typography>
                           </CardContent>
                         </Card>
                       ))}
                     </Box>
                   </Box>
                 );
               })}
             </Box>

             {/* Personal Information */}
             <Typography variant="h6" gutterBottom>
               Personal Information
             </Typography>
             <Box sx={{ mb: 3 }}>
               <Box sx={{ 
                 display: 'grid', 
                 gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                 gap: 2,
                 mb: 2
               }}>
                 <TextField
                   label="Full Name"
                   value={resumeContent.personalInfo.name}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, name: e.target.value }
                   }))}
                   fullWidth
                 />
                 <TextField
                   label="Email"
                   value={resumeContent.personalInfo.email}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, email: e.target.value }
                   }))}
                   fullWidth
                 />
               </Box>
               <Box sx={{ 
                 display: 'grid', 
                 gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                 gap: 2,
                 mb: 2
               }}>
                 <TextField
                   label="Phone"
                   value={resumeContent.personalInfo.phone}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, phone: e.target.value }
                   }))}
                   fullWidth
                 />
                 <TextField
                   label="Location"
                   value={resumeContent.personalInfo.location}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, location: e.target.value }
                   }))}
                   fullWidth
                 />
               </Box>
               <Box sx={{ 
                 display: 'grid', 
                 gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                 gap: 2
               }}>
                 <TextField
                   label="LinkedIn URL"
                   value={resumeContent.personalInfo.linkedin}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                   }))}
                   fullWidth
                 />
                 <TextField
                   label="Portfolio URL"
                   value={resumeContent.personalInfo.portfolio}
                   onChange={(e) => setResumeContent(prev => ({
                     ...prev,
                     personalInfo: { ...prev.personalInfo, portfolio: e.target.value }
                   }))}
                   fullWidth
                 />
               </Box>
             </Box>

             {/* Professional Summary */}
             <Typography variant="h6" gutterBottom>
               Professional Summary
             </Typography>
             <TextField
               label="Summary"
               value={resumeContent.summary}
               onChange={(e) => setResumeContent(prev => ({ ...prev, summary: e.target.value }))}
               fullWidth
               multiline
               rows={4}
               sx={{ mb: 3 }}
               placeholder="Write a compelling professional summary..."
             />

             {/* Education */}
             <Box sx={{ mb: 3 }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h6">Education</Typography>
                 <Button variant="outlined" onClick={addEducation}>
                   Add Education
                 </Button>
               </Box>
               {resumeContent.education.map((edu, index) => (
                 <Card key={edu.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                     <Typography variant="h6">Education #{index + 1}</Typography>
                     <IconButton onClick={() => removeEducation(edu.id)} color="error">
                       <DeleteIcon />
                     </IconButton>
                   </Box>
                   <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                     gap: 2,
                     mb: 2
                   }}>
                     <TextField
                       label="Degree"
                       value={edu.degree}
                       onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                       fullWidth
                     />
                     <TextField
                       label="Institution"
                       value={edu.institution}
                       onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                       fullWidth
                     />
                   </Box>
                   <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                     gap: 2
                   }}>
                     <TextField
                       label="Graduation Date"
                       value={edu.graduationDate}
                       onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                       fullWidth
                     />
                     <TextField
                       label="GPA (optional)"
                       value={edu.gpa}
                       onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                       fullWidth
                     />
                   </Box>
                   <TextField
                     label="Relevant Courses (optional)"
                     value={edu.relevantCourses}
                     onChange={(e) => updateEducation(edu.id, 'relevantCourses', e.target.value)}
                     fullWidth
                     sx={{ mt: 2 }}
                   />
                 </Card>
               ))}
             </Box>

             {/* Certifications */}
             <Box sx={{ mb: 3 }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h6">Certifications</Typography>
                 <Button variant="outlined" onClick={addCertification}>
                   Add Certification
                 </Button>
               </Box>
               {resumeContent.certifications.map((cert, index) => (
                 <Card key={cert.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                     <Typography variant="h6">Certification #{index + 1}</Typography>
                     <IconButton onClick={() => removeCertification(cert.id)} color="error">
                       <DeleteIcon />
                     </IconButton>
                   </Box>
                   <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                     gap: 2,
                     mb: 2
                   }}>
                     <TextField
                       label="Certification Name"
                       value={cert.name}
                       onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                       fullWidth
                     />
                     <TextField
                       label="Issuing Organization"
                       value={cert.issuer}
                       onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                       fullWidth
                     />
                   </Box>
                   <Box sx={{ 
                     display: 'grid', 
                     gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                     gap: 2
                   }}>
                     <TextField
                       label="Date Earned"
                       value={cert.date}
                       onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                       fullWidth
                     />
                     <TextField
                       label="Certificate URL (optional)"
                       value={cert.url}
                       onChange={(e) => updateCertification(cert.id, 'url', e.target.value)}
                       fullWidth
                     />
                   </Box>
                 </Card>
               ))}
             </Box>

             {/* Data Integration Notice */}
             <Alert severity="info" sx={{ mb: 2 }}>
               <Typography variant="body2">
                 <strong>Data Integration:</strong> Your selected jobs, projects, and skills from the sections above are automatically included in your resume.
               </Typography>
             </Alert>
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
           <Button 
             onClick={generateResumePDF} 
             variant="contained"
             disabled={!resumeContent.personalInfo.name}
           >
             Generate Resume
           </Button>
         </DialogActions>
       </Dialog>
     </Container>
   );
 };

export default ResumeOptimizer; 