import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { callClaude } from '../claudeApi';
import { Analytics } from '../mixpanel';

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'short_answer';
  question: string;
  options?: string[];
  // correctAnswer is still needed for grading, but not shown to user
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
}

interface QuizResult {
  questionId: string;
  points: number;
  feedback: string;
  explanation?: string;
  correctAnswer: string;
  maxPoints: number;
}

const QuizGenerator: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState(3); // Default to 3 (easy)
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const difficultyLabels = [
    '', // 0 (unused)
    'Beginner',
    'Novice',
    'Easy',
    'Intermediate',
    'Competent',
    'Proficient',
    'Advanced',
    'Expert',
    'Genius',
    'Harvard'
  ];

  // Track page load
  useEffect(() => {
    Analytics.trackFeatureUsage('Quiz Generator', {
      hasQuiz: !!quiz,
      hasResults: quizResults.length > 0
    });
  }, [quiz, quizResults.length]);

  // 1. Generate Quiz (questions only, no explanations)
  const generateQuiz = async () => {
    if (!notes.trim()) {
      setError('Please provide your notes to generate a quiz.');
      Analytics.trackQuizEvent('Generate Quiz Attempt', {
        error: 'No notes provided',
        difficulty
      });
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    // Track quiz generation attempt
    Analytics.trackQuizEvent('Generate Quiz Attempt', {
      notesLength: notes.length,
      difficulty,
      difficultyLabel: difficultyLabels[difficulty]
    });

    try {
      const prompt = `Create a quiz based on the following notes. Return ONLY valid JSON, no explanations, markdown, or extra text. Limit the quiz to 5 questions. Each question should be either multiple choice (with 3-4 options) or short answer. For each question, include: id, type, question, options (if multiple choice), and correctAnswer. Do NOT include explanations or grading.

The quiz should be at difficulty level ${difficulty} (1 = Beginner, 10 = Harvard-level).

Example format:
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "...",
      "options": ["A", "B", "C"],
      "correctAnswer": "A"
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "...",
      "correctAnswer": "..."
    }
  ]
}

Notes:
${notes}`;

      const response = await callClaude(prompt);
      let quizData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Claude raw response:', response);
        setError('Failed to generate quiz. Please try again.');
        Analytics.trackError('Quiz Generation Parse Error', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          difficulty
        });
        return;
      }

      const generatedQuiz: Quiz = {
        id: Date.now().toString(),
        title: quizData.title,
        questions: quizData.questions,
        createdAt: new Date()
      };

      setQuiz(generatedQuiz);
      setUserAnswers({});
      setQuizResults([]);
      setSuccess('Quiz generated successfully!');
      
      // Track successful quiz generation
      Analytics.trackQuizEvent('Generate Quiz Success', {
        quizTitle: quizData.title,
        questionCount: quizData.questions.length,
        difficulty,
        difficultyLabel: difficultyLabels[difficulty],
        hasMultipleChoice: quizData.questions.some((q: any) => q.type === 'multiple_choice'),
        hasShortAnswer: quizData.questions.some((q: any) => q.type === 'short_answer')
      });
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
      Analytics.trackError('Quiz Generation Error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        difficulty
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Grade Quiz (send questions, correct answers, and user answers)
  const gradeQuiz = async () => {
    if (!quiz) return;

    const unansweredQuestions = quiz.questions.filter(q => !userAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before submitting.');
      Analytics.trackQuizEvent('Grade Quiz Attempt', {
        error: 'Unanswered questions',
        unansweredCount: unansweredQuestions.length,
        totalQuestions: quiz.questions.length
      });
      return;
    }

    setIsGrading(true);
    setError('');
    setSuccess('');

    // Track quiz grading attempt
    Analytics.trackQuizEvent('Grade Quiz Attempt', {
      quizTitle: quiz.title,
      questionCount: quiz.questions.length,
      answeredQuestions: Object.keys(userAnswers).length
    });

    try {
      // Prepare grading data
      const gradingData = quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswers[q.id],
        options: q.options || undefined
      }));

      const gradingPrompt = `You are a quiz grader. Grade the following answers. For each question, award points (5 for multiple choice, 10 for short answer), give feedback, and provide a brief explanation. Use partial credit for short answers if appropriate. Return ONLY valid JSON in this format:\n[\n  {\n    "questionId": "q1",\n    "points": 5,n    "maxPoints": 5,n    "feedback": "...",\n    "explanation": "...",\n    "correctAnswer": "..."\n  }\n]\n\nQuestions and Answers:\n${JSON.stringify(gradingData, null, 2)}`;

      const response = await callClaude(gradingPrompt);
      let results;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Claude raw response:', response);
        setError('Failed to grade quiz. Please try again.');
        Analytics.trackError('Quiz Grading Parse Error', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        return;
      }

      setQuizResults(results);
      setSuccess('Quiz graded successfully!');
      
      // Track successful quiz grading
      const totalScore = results.reduce((sum: number, result: QuizResult) => sum + result.points, 0);
      const maxScore = results.reduce((sum: number, result: QuizResult) => sum + result.maxPoints, 0);
      const scorePercentage = (totalScore / maxScore) * 100;
      
      Analytics.trackQuizEvent('Grade Quiz Success', {
        quizTitle: quiz.title,
        totalScore,
        maxScore,
        scorePercentage: Math.round(scorePercentage),
        questionCount: results.length,
        perfectScore: scorePercentage === 100
      });
    } catch (err) {
      console.error('Error grading quiz:', err);
      setError('Failed to grade quiz. Please try again.');
      Analytics.trackError('Quiz Grading Error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Track answer changes
    Analytics.trackQuizEvent('Answer Changed', {
      questionId,
      answerLength: answer.length,
      hasAnswer: !!answer.trim()
    });
  };

  const handleDifficultyChange = (event: Event, newValue: number | number[]) => {
    const difficultyValue = newValue as number;
    setDifficulty(difficultyValue);
    
    // Track difficulty change
    Analytics.trackQuizEvent('Difficulty Changed', {
      difficulty: difficultyValue,
      difficultyLabel: difficultyLabels[difficultyValue]
    });
  };

  const calculateTotalScore = () => {
    if (!quizResults.length) return 0;
    return quizResults.reduce((sum, result) => sum + result.points, 0);
  };

  const getMaxScore = () => {
    if (!quizResults.length) return 0;
    return quizResults.reduce((sum, result) => sum + (result.maxPoints || 0), 0);
  };

  const getScorePercentage = () => {
    const max = getMaxScore();
    if (!quizResults.length || !max) return 0;
    return Math.round((calculateTotalScore() / max) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Please sign in to use the quiz generator.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Quiz Generator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Input your notes, select a difficulty, and generate a personalized quiz. Grading and explanations are provided after you submit your answers.
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

      {/* Notes Input */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Notes
        </Typography>
        <TextField
          fullWidth
          label="Paste your notes here"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={8}
          placeholder="Paste your study notes, lecture notes, or any content you want to be quizzed on..."
          sx={{ mb: 2 }}
        />
        <Box sx={{ mb: 3, px: 2, py: 2 }}>
          <Typography gutterBottom>
            Difficulty: <b>{difficulty}</b> ({difficultyLabels[difficulty]})
          </Typography>
          <Slider
            value={difficulty}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Beginner' },
              { value: 2, label: 'Novice' },
              { value: 3, label: 'Easy' },
              { value: 4, label: 'Intermediate' },
              { value: 5, label: 'Competent' },
              { value: 6, label: 'Proficient' },
              { value: 7, label: 'Advanced' },
              { value: 8, label: 'Expert' },
              { value: 9, label: 'Genius' },
              { value: 10, label: 'Harvard' }
            ]}
            onChange={handleDifficultyChange}
            valueLabelDisplay="auto"
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={generateQuiz}
          disabled={isGenerating || !notes.trim()}
          startIcon={isGenerating ? <CircularProgress size={20} /> : null}
        >
          {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
        </Button>
      </Paper>

      {/* Quiz Display */}
      {quiz && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Questions: {quiz.questions.length}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {quiz.questions.map((question, index) => (
              <Card key={question.id} elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                      Question {index + 1}
                    </Typography>
                    <Chip 
                      label={question.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'} 
                      color={question.type === 'multiple_choice' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {question.question}
                  </Typography>

                  {question.type === 'multiple_choice' && question.options && (
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      >
                        {question.options.map((option, optionIndex) => (
                          <FormControlLabel
                            key={optionIndex}
                            value={option}
                            control={<Radio />}
                            label={option}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}

                  {question.type === 'short_answer' && (
                    <TextField
                      fullWidth
                      label="Your Answer"
                      value={userAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Type your answer here..."
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={gradeQuiz}
              disabled={isGrading || Object.keys(userAnswers).length < quiz.questions.length}
              startIcon={isGrading ? <CircularProgress size={20} /> : null}
            >
              {isGrading ? 'Grading...' : 'Submit & Grade Quiz'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quiz Results */}
      {quizResults.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Quiz Results
          </Typography>
          
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Score
            </Typography>
            <Typography variant="h3" color={getScoreColor(getScorePercentage()) as any}>
              {getScorePercentage()}%
            </Typography>
            <Typography variant="body1">
              {calculateTotalScore()} / {getMaxScore()} points
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quizResults.map((result, index) => {
              const question = quiz?.questions.find(q => q.id === result.questionId);
              return (
                <Accordion key={result.questionId}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Question {index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                        clickable={false}
                          label={`${result.points}/${result.maxPoints} points`}
                          color={result.points === result.maxPoints ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body1">
                        <strong>Question:</strong> {question?.question}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Your Answer:</strong> {userAnswers[result.questionId]}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Correct Answer:</strong> {result.correctAnswer}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Explanation:</strong> {result.explanation}
                      </Typography>
                      <Typography variant="body1" color="primary">
                        <strong>Feedback:</strong> {result.feedback}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default QuizGenerator; 